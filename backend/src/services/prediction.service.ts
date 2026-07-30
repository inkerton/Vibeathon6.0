import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class PredictionService {
  async predictInventoryUsage(itemId: string, daysAhead: number = 7) {
    // Get historical transaction data
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        item_id: itemId,
        type: { in: ['deduct', 'reserve'] },
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Get current stock
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) throw new Error('Item not found');

    // Prepare data for AI
    const dailyUsage = this.aggregateDailyUsage(transactions);
    
    if (dailyUsage.length === 0) {
      // No historical data - use simple estimation
      return this.getSimplePrediction(item, daysAhead);
    }

    const prompt = `
You are an inventory prediction system for a restaurant. Analyze the following data and predict future usage.

Item: ${item.name}
Current Stock: ${item.total_stock} ${item.unit}
Minimum Stock Level: ${item.reorder_threshold}

Historical Daily Usage (last 30 days):
${JSON.stringify(dailyUsage)}

Predict:
1. Expected daily usage for the next ${daysAhead} days
2. Recommended restock quantity
3. Confidence level (0-1)
4. Optimal restock date

Consider:
- Weekly patterns (weekends vs weekdays)
- Trends (increasing/decreasing usage)
- Current stock level
- Minimum stock threshold

Provide response in JSON format:
{
  "predictions": [
    {
      "date": "2026-07-31",
      "predictedUsage": 15.5,
      "confidence": 0.85
    }
  ],
  "recommendedRestock": 100,
  "restockDate": "2026-08-02",
  "overallConfidence": 0.82,
  "reasoning": "Explanation of the prediction"
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
      
      const prediction = JSON.parse(jsonStr);

      // Save prediction
      await prisma.inventoryPrediction.create({
        data: {
          item_id: itemId,
          predicted_usage: prediction.predictions[0].predictedUsage,
          recommended_restock: prediction.recommendedRestock,
          confidence: prediction.overallConfidence,
          prediction_date: new Date(prediction.predictions[0].date)
        }
      });

      return {
        ...prediction,
        itemName: item.name,
        currentStock: item.total_stock,
        unit: item.unit
      };
    } catch (error) {
      console.error('Error generating AI prediction:', error);
      // Fallback to rule-based prediction
      return this.getRuleBasedPrediction(item, dailyUsage, daysAhead);
    }
  }

  private aggregateDailyUsage(transactions: any[]) {
    const dailyMap = new Map<string, number>();

    transactions.forEach(tx => {
      const date = tx.created_at.toISOString().split('T')[0];
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + tx.quantity);
    });

    return Array.from(dailyMap.entries()).map(([date, usage]) => ({
      date,
      usage
    }));
  }

  private getSimplePrediction(item: any, daysAhead: number) {
    // Simple estimation based on current stock and threshold
    const avgDailyUsage = (item.total_stock - item.reorder_threshold) / 7;
    const predictions = [];
    
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedUsage: avgDailyUsage,
        confidence: 0.5
      });
    }

    return {
      predictions,
      recommendedRestock: item.reorder_threshold * 2,
      restockDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      overallConfidence: 0.5,
      reasoning: 'Based on simple estimation due to limited historical data',
      itemName: item.name,
      currentStock: item.total_stock,
      unit: item.unit
    };
  }

  private getRuleBasedPrediction(item: any, dailyUsage: any[], daysAhead: number) {
    // Calculate average daily usage
    const totalUsage = dailyUsage.reduce((sum, day) => sum + day.usage, 0);
    const avgDailyUsage = totalUsage / dailyUsage.length;

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedUsage: avgDailyUsage,
        confidence: 0.7
      });
    }

    // Calculate when to restock
    const daysUntilEmpty = item.total_stock / avgDailyUsage;
    const restockDate = new Date();
    restockDate.setDate(restockDate.getDate() + Math.max(1, Math.floor(daysUntilEmpty - 2)));

    return {
      predictions,
      recommendedRestock: Math.ceil(avgDailyUsage * 14), // 2 weeks supply
      restockDate: restockDate.toISOString().split('T')[0],
      overallConfidence: 0.7,
      reasoning: `Based on ${dailyUsage.length} days of historical data. Average daily usage: ${avgDailyUsage.toFixed(2)} ${item.unit}`,
      itemName: item.name,
      currentStock: item.total_stock,
      unit: item.unit
    };
  }

  async getInventoryPredictions(daysAhead: number = 7) {
    const items = await prisma.inventoryItem.findMany();
    
    const predictions = await Promise.all(
      items.map(async (item) => {
        try {
          return await this.predictInventoryUsage(item.id, daysAhead);
        } catch (error) {
          console.error(`Error predicting for item ${item.name}:`, error);
          return null;
        }
      })
    );

    return {
      data: {
        predictions: predictions.filter(p => p !== null),
        generatedAt: new Date().toISOString()
      }
    };
  }

  async getAllPredictions() {
    const items = await prisma.inventoryItem.findMany();
    
    const predictions = await Promise.all(
      items.map(async (item) => {
        try {
          return await this.predictInventoryUsage(item.id);
        } catch (error) {
          console.error(`Error predicting for item ${item.name}:`, error);
          return null;
        }
      })
    );

    return predictions.filter(p => p !== null);
  }

  async getLowStockAlerts(threshold?: number) {
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        prediction_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: { item: true },
      orderBy: { prediction_date: 'asc' }
    });

    const alerts = predictions.filter(pred => {
      const daysUntilEmpty = pred.item.total_stock / pred.predicted_usage;
      return daysUntilEmpty < (threshold || 3) || pred.item.total_stock <= pred.item.reorder_threshold;
    });

    return {
      data: {
        alerts: alerts.map(alert => ({
          id: alert.id,
          item: {
            id: alert.item.id,
            name: alert.item.name,
            unit: alert.item.unit,
            total_stock: alert.item.total_stock,
            reorder_threshold: alert.item.reorder_threshold
          },
          predicted_usage: alert.predicted_usage,
          recommended_restock: alert.recommended_restock,
          confidence: alert.confidence,
          prediction_date: alert.prediction_date,
          daysUntilEmpty: alert.item.total_stock / alert.predicted_usage,
          severity: alert.item.total_stock <= alert.item.reorder_threshold ? 'critical' : 'warning'
        })),
        generatedAt: new Date().toISOString()
      }
    };
  }

  async getItemPrediction(itemId: string, daysAhead: number = 7) {
    return await this.predictInventoryUsage(itemId, daysAhead);
  }

  async getItemPredictionHistory(itemId: string, days: number = 30) {
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        item_id: itemId,
        created_at: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      include: { item: true },
      orderBy: { created_at: 'desc' }
    });

    return {
      data: {
        predictions,
        itemId,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

export default new PredictionService();
