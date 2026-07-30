import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class AnalyticsService {
  async generateInsights() {
    // Gather data from multiple sources
    const [
      revenueData,
      orderData,
      inventoryData,
      staffData
    ] = await Promise.all([
      this.getRevenueData(),
      this.getOrderData(),
      this.getInventoryData(),
      this.getStaffData()
    ]);

    const prompt = `
You are a restaurant analytics system. Analyze the following data and provide actionable insights.

Revenue Data: ${JSON.stringify(revenueData)}
Order Data: ${JSON.stringify(orderData)}
Inventory Data: ${JSON.stringify(inventoryData)}
Staff Data: ${JSON.stringify(staffData)}

Generate insights in JSON format:
{
  "insights": [
    {
      "type": "revenue",
      "title": "Revenue Trend",
      "description": "Detailed insight",
      "priority": "high",
      "actionable": true,
      "recommendations": ["Action 1", "Action 2"]
    }
  ]
}

Focus on:
1. Revenue trends and opportunities
2. Operational efficiency
3. Inventory optimization
4. Staff performance
5. Customer satisfaction indicators
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
      
      const analysis = JSON.parse(jsonStr);

      // Save insights with normalized types
      await Promise.all(
        analysis.insights.map(async (insight: any) => {
          // Normalize type to match frontend expectations
          let normalizedType = insight.type.toUpperCase();
          if (normalizedType === 'STAFF' || normalizedType === 'OPERATIONS') {
            normalizedType = 'OPERATIONAL';
          } else if (normalizedType === 'TREND' || normalizedType === 'PERFORMANCE') {
            normalizedType = 'OPERATIONAL';
          } else if (normalizedType === 'EFFICIENCY') {
            normalizedType = 'OPERATIONAL';
          }
          
          return prisma.aIInsight.create({
            data: {
              type: normalizedType,
              title: insight.title,
              description: insight.description,
              data: insight,
              priority: insight.priority,
              actionable: insight.actionable,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        })
      );

      return analysis;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Fallback to rule-based insights
      return this.getRuleBasedInsights(revenueData, orderData, inventoryData, staffData);
    }
  }

  private async getRevenueData() {
    const orders = await prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Get previous period for comparison
    const previousOrders = await prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalRevenue,
      orderCount: orders.length,
      avgOrderValue,
      period: '30 days',
      revenueGrowth,
      previousRevenue
    };
  }

  private async getOrderData() {
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: { items: true }
    });

    const avgItemsPerOrder = orders.length > 0 
      ? orders.reduce((sum, o) => sum + o.items.length, 0) / orders.length 
      : 0;

    return {
      totalOrders: orders.length,
      avgItemsPerOrder,
      statusDistribution: this.getStatusDistribution(orders)
    };
  }

  private async getInventoryData() {
    const items = await prisma.inventoryItem.findMany();
    const lowStock = items.filter(i => i.total_stock <= i.reorder_threshold);

    return {
      totalItems: items.length,
      lowStockCount: lowStock.length,
      totalValue: items.reduce((sum, i) => sum + (i.total_stock * 10), 0), // Simplified cost calculation
      lowStockItems: lowStock.map(i => ({ name: i.name, stock: i.total_stock, threshold: i.reorder_threshold }))
    };
  }

  private async getStaffData() {
    const staff = await prisma.user.findMany({
      where: { role: { not: 'customer' } }
    });

    return {
      totalStaff: staff.length,
      roleDistribution: this.getRoleDistribution(staff),
      activeStaff: staff.filter(s => s.is_active).length
    };
  }

  private getStatusDistribution(orders: any[]) {
    const dist: Record<string, number> = {};
    orders.forEach(order => {
      dist[order.order_status] = (dist[order.order_status] || 0) + 1;
    });
    return dist;
  }

  private getRoleDistribution(staff: any[]) {
    const dist: Record<string, number> = {};
    staff.forEach(s => {
      dist[s.role] = (dist[s.role] || 0) + 1;
    });
    return dist;
  }

  private getRuleBasedInsights(revenueData: any, orderData: any, inventoryData: any, staffData: any) {
    const insights = [];

    // Revenue insight
    if (revenueData.revenueGrowth > 10) {
      insights.push({
        type: 'revenue',
        title: 'Strong Revenue Growth',
        description: `Revenue has grown by ${revenueData.revenueGrowth.toFixed(1)}% compared to the previous period.`,
        priority: 'high',
        actionable: true,
        recommendations: [
          'Continue current marketing strategies',
          'Consider expanding popular menu items',
          'Analyze what drove the growth'
        ]
      });
    } else if (revenueData.revenueGrowth < -5) {
      insights.push({
        type: 'revenue',
        title: 'Revenue Decline Alert',
        description: `Revenue has decreased by ${Math.abs(revenueData.revenueGrowth).toFixed(1)}% compared to the previous period.`,
        priority: 'high',
        actionable: true,
        recommendations: [
          'Review menu pricing and offerings',
          'Increase marketing efforts',
          'Gather customer feedback'
        ]
      });
    }

    // Inventory insight
    if (inventoryData.lowStockCount > 0) {
      insights.push({
        type: 'efficiency',
        title: 'Low Stock Alert',
        description: `${inventoryData.lowStockCount} items are below reorder threshold.`,
        priority: 'high',
        actionable: true,
        recommendations: [
          'Reorder low stock items immediately',
          'Review inventory management processes',
          'Consider automated reordering'
        ]
      });
    }

    // Order efficiency insight
    if (orderData.avgItemsPerOrder < 2) {
      insights.push({
        type: 'performance',
        title: 'Low Average Order Value',
        description: `Average items per order is ${orderData.avgItemsPerOrder.toFixed(1)}, indicating potential for upselling.`,
        priority: 'medium',
        actionable: true,
        recommendations: [
          'Train staff on upselling techniques',
          'Create combo meal offers',
          'Suggest complementary items'
        ]
      });
    }

    // Staff insight
    if (staffData.totalStaff < 5) {
      insights.push({
        type: 'trend',
        title: 'Staffing Consideration',
        description: `Current staff count is ${staffData.totalStaff}. Consider staffing levels for peak hours.`,
        priority: 'medium',
        actionable: true,
        recommendations: [
          'Review peak hour coverage',
          'Consider hiring additional staff',
          'Optimize staff scheduling'
        ]
      });
    }

    return { insights };
  }

  async getInsights(type: string) {
    const insights = await prisma.aIInsight.findMany({
      where: {
        type: {
          contains: type,
          mode: 'insensitive'
        },
        expires_at: {
          gte: new Date()
        }
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' }
      ]
    });

    return insights;
  }

  async getInsightsByType(type: string) {
    return this.getInsights(type);
  }

  async getAllInsights() {
    const insights = await prisma.aIInsight.findMany({
      where: {
        expires_at: {
          gte: new Date()
        }
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' }
      ]
    });

    if (insights.length === 0) {
      // Generate new insights
      const generated = await this.generateInsights();
      return generated.insights;
    }

    return insights;
  }

  async getRevenueAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    
    const orders = await prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: start, lte: end }
      },
      include: {
        items: {
          include: {
            menu_item: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    if (orders.length === 0) {
      return {
        period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
        totalRevenue: 0,
        avgDailyRevenue: 0,
        trend: 'STABLE',
        growthRate: 0,
        breakdown: {
          byCategory: [],
          byDayOfWeek: [],
          byHour: []
        },
        insights: ['No revenue data available for this period']
      };
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const avgDailyRevenue = totalRevenue / days;

    // Calculate growth rate (compare first half vs second half)
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    const firstHalf = orders.filter(o => o.created_at < midpoint);
    const secondHalf = orders.filter(o => o.created_at >= midpoint);
    const firstHalfRevenue = firstHalf.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const growthRate = firstHalfRevenue > 0 ? (secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue : 0;
    const trend = growthRate > 0.05 ? 'INCREASING' : growthRate < -0.05 ? 'DECREASING' : 'STABLE';

    // By Category
    const categoryRevenue = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menu_item.category;
        categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + Number(item.price_at_order) * item.quantity);
      });
    });
    const byCategory = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: (revenue / totalRevenue) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // By Day of Week
    const dayRevenue = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    orders.forEach(order => {
      const day = dayNames[order.created_at.getDay()];
      dayRevenue.set(day, (dayRevenue.get(day) || 0) + Number(order.total_amount));
    });
    const byDayOfWeek = dayNames
      .map(day => ({
        day,
        revenue: dayRevenue.get(day) || 0,
        percentage: ((dayRevenue.get(day) || 0) / totalRevenue) * 100
      }))
      .filter(d => d.revenue > 0);

    // By Hour
    const hourRevenue = new Map<number, number>();
    orders.forEach(order => {
      const hour = order.created_at.getHours();
      hourRevenue.set(hour, (hourRevenue.get(hour) || 0) + Number(order.total_amount));
    });
    const byHour = Array.from(hourRevenue.entries())
      .map(([hour, revenue]) => ({
        hour,
        revenue,
        percentage: (revenue / totalRevenue) * 100
      }))
      .sort((a, b) => a.hour - b.hour);

    // Generate insights
    const insights: string[] = [];
    if (growthRate > 0.1) {
      insights.push(`Revenue grew by ${(growthRate * 100).toFixed(1)}% during this period`);
    } else if (growthRate < -0.1) {
      insights.push(`Revenue declined by ${Math.abs(growthRate * 100).toFixed(1)}% during this period`);
    }
    
    const topCategory = byCategory[0];
    if (topCategory) {
      insights.push(`${topCategory.category} is the top revenue category at ₹${topCategory.revenue.toFixed(2)} (${topCategory.percentage.toFixed(1)}%)`);
    }
    
    const topDay = byDayOfWeek.reduce((max, d) => d.revenue > max.revenue ? d : max, byDayOfWeek[0]);
    if (topDay) {
      insights.push(`${topDay.day} generates the most revenue at ₹${topDay.revenue.toFixed(2)}`);
    }
    
    const peakHour = byHour.reduce((max, h) => h.revenue > max.revenue ? h : max, byHour[0]);
    if (peakHour) {
      insights.push(`Peak revenue hour is ${peakHour.hour}:00 with ₹${peakHour.revenue.toFixed(2)}`);
    }

    return {
      period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
      totalRevenue,
      avgDailyRevenue,
      trend,
      growthRate,
      breakdown: {
        byCategory,
        byDayOfWeek,
        byHour
      },
      insights
    };
  }

  async getPerformanceMetrics() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      ordersLast7Days,
      ordersLast30Days,
      avgPreparationTime
    ] = await Promise.all([
      prisma.order.count({ where: { created_at: { gte: last7Days } } }),
      prisma.order.count({ where: { created_at: { gte: last30Days } } }),
      this.getAvgPreparationTime()
    ]);

    return {
      ordersLast7Days,
      ordersLast30Days,
      avgOrdersPerDay: ordersLast30Days / 30,
      avgPreparationTime,
      period: '30 days'
    };
  }

  private async getAvgPreparationTime() {
    const completedOrders = await prisma.order.findMany({
      where: {
        order_status: 'completed',
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        created_at: true,
        updated_at: true
      }
    });

    if (completedOrders.length === 0) return 0;

    const totalTime = completedOrders.reduce((sum, order) => {
      return sum + (order.updated_at.getTime() - order.created_at.getTime());
    }, 0);

    return Math.round(totalTime / completedOrders.length / 60000); // Convert to minutes
  }
}

export default new AnalyticsService();
