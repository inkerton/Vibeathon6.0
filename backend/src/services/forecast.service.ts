import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class ForecastService {
  async forecastDemand(daysAhead: number = 7) {
    // Get historical order data
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // Last 60 days
        }
      },
      include: {
        items: {
          include: { menu_item: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (orders.length === 0) {
      return this.getDefaultForecast(daysAhead);
    }

    // Aggregate data
    const dailyOrders = this.aggregateDailyOrders(orders);
    const hourlyPatterns = this.analyzeHourlyPatterns(orders);
    const itemPopularity = this.analyzeItemPopularity(orders);

    const prompt = `
You are a demand forecasting system for a restaurant. Analyze the following data and predict future demand.

Historical Data (last 60 days):
Daily Orders: ${JSON.stringify(dailyOrders)}
Hourly Patterns: ${JSON.stringify(hourlyPatterns)}
Popular Items: ${JSON.stringify(itemPopularity)}

Predict for the next ${daysAhead} days:
1. Expected number of orders per day
2. Peak hours
3. Popular items demand
4. Confidence level

Consider:
- Day of week patterns
- Time of day patterns
- Trends
- Seasonal factors

Provide response in JSON format:
{
  "forecasts": [
    {
      "date": "2026-07-31",
      "predictedOrders": 150,
      "peakHours": [12, 13, 19, 20],
      "confidence": 0.85
    }
  ],
  "itemForecasts": [
    {
      "itemId": "item_id",
      "itemName": "Item Name",
      "predictedOrders": 45,
      "confidence": 0.80
    }
  ],
  "insights": [
    "Weekend orders are 30% higher than weekdays",
    "Lunch peak: 12-2pm, Dinner peak: 7-9pm"
  ]
}
`;

    try {
      const aiResponse = await aiService.generateText(prompt, false);
      
      // Extract JSON from response
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      
      const forecast = JSON.parse(jsonStr);

      // Save forecasts
      await Promise.all(
        forecast.forecasts.map(async (f: any) => {
          return prisma.demandForecast.create({
            data: {
              forecast_date: new Date(f.date),
              predicted_orders: f.predictedOrders,
              confidence: f.confidence,
              peak_hours: f.peakHours
            }
          });
        })
      );

      return forecast;
    } catch (error) {
      console.error('Error generating AI forecast:', error);
      // Fallback to rule-based forecast
      return this.getRuleBasedForecast(dailyOrders, hourlyPatterns, itemPopularity, daysAhead);
    }
  }

  private aggregateDailyOrders(orders: any[]) {
    const dailyMap = new Map<string, number>();

    orders.forEach(order => {
      const date = order.created_at.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    return Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      orders: count
    }));
  }

  private analyzeHourlyPatterns(orders: any[]) {
    const hourlyMap = new Map<number, number>();

    orders.forEach(order => {
      const hour = order.created_at.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    return Array.from(hourlyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, orders: count }));
  }

  private analyzeItemPopularity(orders: any[]) {
    const itemMap = new Map<string, { name: string; count: number }>();

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const current = itemMap.get(item.menu_item_id) || { 
          name: item.menu_item.name, 
          count: 0 
        };
        itemMap.set(item.menu_item_id, {
          name: current.name,
          count: current.count + item.quantity
        });
      });
    });

    return Array.from(itemMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ itemId: id, ...data }));
  }

  private getDefaultForecast(daysAhead: number) {
    const forecasts = [];
    const baseOrders = 50;
    
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        predictedOrders: isWeekend ? baseOrders * 1.3 : baseOrders,
        peakHours: [12, 13, 19, 20],
        confidence: 0.5
      });
    }

    return {
      forecasts,
      itemForecasts: [],
      insights: ['Limited historical data - using default patterns']
    };
  }

  private getRuleBasedForecast(
    dailyOrders: any[],
    hourlyPatterns: any[],
    itemPopularity: any[],
    daysAhead: number
  ) {
    // Calculate average daily orders
    const totalOrders = dailyOrders.reduce((sum, day) => sum + day.orders, 0);
    const avgDailyOrders = totalOrders / dailyOrders.length;

    // Identify peak hours
    const peakHours = hourlyPatterns.slice(0, 4).map(p => p.hour);

    // Generate forecasts
    const forecasts = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        predictedOrders: Math.round(avgDailyOrders * (isWeekend ? 1.2 : 1)),
        peakHours,
        confidence: 0.75
      });
    }

    // Item forecasts
    const itemForecasts = itemPopularity.slice(0, 5).map(item => ({
      itemId: item.itemId,
      itemName: item.name,
      predictedOrders: Math.round(item.count / dailyOrders.length * daysAhead),
      confidence: 0.7
    }));

    return {
      forecasts,
      itemForecasts,
      insights: [
        `Average daily orders: ${avgDailyOrders.toFixed(0)}`,
        `Peak hours: ${peakHours.join(', ')}`,
        `Weekend orders typically 20% higher`
      ]
    };
  }

  async getStaffingRecommendations(date: Date) {
    const forecast = await prisma.demandForecast.findFirst({
      where: {
        forecast_date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });

    if (!forecast) {
      // Generate forecast for this date
      await this.forecastDemand(7);
      return this.getStaffingRecommendations(date);
    }

    // Calculate staffing needs based on predicted orders
    const baseStaff = 3;
    const ordersPerStaff = 20;
    const recommendedStaff = Math.ceil(forecast.predicted_orders / ordersPerStaff) + baseStaff;

    // Break down by role
    const staffBreakdown = {
      kitchen: Math.ceil(recommendedStaff * 0.4),
      reception: Math.ceil(recommendedStaff * 0.3),
      inventory: Math.ceil(recommendedStaff * 0.3)
    };

    return {
      date: forecast.forecast_date,
      predictedOrders: forecast.predicted_orders,
      recommendedStaff,
      staffBreakdown,
      peakHours: forecast.peak_hours,
      confidence: forecast.confidence,
      reasoning: `Based on ${forecast.predicted_orders} predicted orders. Peak hours: ${(forecast.peak_hours as any[]).join(', ')}`
    };
  }

  async getRecentForecasts(days: number = 7) {
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        forecast_date: {
          gte: new Date(),
          lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { forecast_date: 'asc' }
    });

    return forecasts;
  }

  async getItemForecast(menuItemId: string, daysAhead: number = 7) {
    // Get historical data for this item
    const orderItems = await prisma.orderItem.findMany({
      where: {
        menu_item_id: menuItemId,
        order: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      include: {
        order: true,
        menu_item: true
      }
    });

    if (orderItems.length === 0) {
      return {
        itemId: menuItemId,
        predictions: [],
        message: 'No historical data available for this item'
      };
    }

    // Calculate daily average
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const avgDaily = totalQuantity / 30;

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedQuantity: Math.round(avgDaily),
        confidence: 0.7
      });
    }

    return {
      itemId: menuItemId,
      itemName: orderItems[0].menu_item.name,
      predictions,
      avgDailyOrders: avgDaily,
      totalHistoricalOrders: totalQuantity
    };
  }
}

export default new ForecastService();
