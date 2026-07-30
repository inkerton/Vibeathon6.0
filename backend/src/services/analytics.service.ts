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

  async getRevenueAnalytics(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const orders = await prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: startDate }
      },
      orderBy: { created_at: 'asc' }
    });

    // Group by day
    const dailyRevenue = new Map<string, number>();
    orders.forEach(order => {
      const date = order.created_at.toISOString().split('T')[0];
      const current = dailyRevenue.get(date) || 0;
      dailyRevenue.set(date, current + Number(order.total_amount));
    });

    return {
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      totalOrders: orders.length,
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + Number(o.total_amount), 0) / orders.length : 0,
      dailyBreakdown: Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
        date,
        revenue
      }))
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
