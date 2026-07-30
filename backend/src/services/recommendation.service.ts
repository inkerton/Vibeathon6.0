import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class RecommendationService {
  async trackUserPreferences(userId: string) {
    // Analyze user's order history
    const orders = await prisma.order.findMany({
      where: { customer_id: userId },
      include: { items: { include: { menu_item: true } } },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    if (orders.length === 0) {
      console.log(`No order history found for user ${userId}`);
      return null;
    }

    // Extract patterns
    const categoryFrequency = new Map<string, number>();
    const itemFrequency = new Map<string, number>();
    const pricePoints: number[] = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menu_item.category;
        const itemId = item.menu_item.id;
        const price = Number(item.price_at_order);

        categoryFrequency.set(category, (categoryFrequency.get(category) || 0) + 1);
        itemFrequency.set(itemId, (itemFrequency.get(itemId) || 0) + 1);
        pricePoints.push(price);
      });
    });

    // Calculate preferences
    const preferredCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const favoriteItems = Array.from(itemFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([itemId]) => itemId);

    const avgPrice = pricePoints.reduce((a, b) => a + b, 0) / pricePoints.length;
    const priceRange = {
      min: Math.min(...pricePoints),
      max: Math.max(...pricePoints),
      avg: avgPrice
    };

    // Update or create preferences
    await prisma.userPreference.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        preferred_categories: preferredCategories,
        favorite_items: favoriteItems,
        price_range: priceRange,
        dietary_restrictions: []
      },
      update: {
        preferred_categories: preferredCategories,
        favorite_items: favoriteItems,
        price_range: priceRange
      }
    });

    return { preferredCategories, favoriteItems, priceRange };
  }

  async generateRecommendations(userId: string) {
    // Get user preferences
    let preferences = await prisma.userPreference.findUnique({
      where: { user_id: userId }
    });

    if (!preferences) {
      const tracked = await this.trackUserPreferences(userId);
      if (!tracked) {
        // New user with no history - return popular items
        return this.getPopularItems();
      }
      preferences = await prisma.userPreference.findUnique({
        where: { user_id: userId }
      });
    }

    if (!preferences) {
      return this.getPopularItems();
    }

    // Get available menu items
    const menuItems = await prisma.menuItem.findMany({
      where: { is_available: true }
    });

    // Get user's order history
    const orderHistory = await prisma.order.findMany({
      where: { customer_id: userId },
      include: { items: true },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    // Get recently ordered item IDs
    const recentlyOrderedIds = new Set(
      orderHistory.flatMap(order => order.items.map(item => item.menu_item_id))
    );

    // Build AI prompt
    const prompt = `
You are a restaurant recommendation system. Based on the following data, recommend 5 menu items for the user.

User Preferences:
- Preferred Categories: ${preferences.preferred_categories.join(', ')}
- Favorite Items: ${preferences.favorite_items.join(', ')}
- Price Range: ${JSON.stringify(preferences.price_range)}
- Dietary Restrictions: ${preferences.dietary_restrictions.join(', ') || 'None'}

Available Menu Items:
${JSON.stringify(menuItems.map(item => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: Number(item.price),
  description: item.description
})))}

Recently Ordered Items (avoid recommending these): ${Array.from(recentlyOrderedIds).join(', ')}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "menuItemId": "item_id",
      "score": 0.95,
      "reason": "Why this item is recommended"
    }
  ]
}

Consider:
1. User's preferred categories
2. Items they haven't tried recently
3. Price range preferences
4. Complementary items to their favorites
5. Variety in recommendations
`;

    try {
      const aiResponse = await aiService.generateText(prompt, false);
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonStr);

      // Save recommendations
      const recommendations = await Promise.all(
        parsed.recommendations.slice(0, 5).map(async (rec: any) => {
          return prisma.aIRecommendation.create({
            data: {
              user_id: userId,
              menu_item_id: rec.menuItemId,
              score: rec.score,
              reason: rec.reason
            },
            include: {
              menu_item: true
            }
          });
        })
      );

      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Fallback to rule-based recommendations
      return this.getRuleBasedRecommendations(userId, preferences, menuItems, recentlyOrderedIds);
    }
  }

  private async getRuleBasedRecommendations(
    userId: string,
    preferences: any,
    menuItems: any[],
    recentlyOrderedIds: Set<string>
  ) {
    // Filter items based on preferences
    const filtered = menuItems.filter(item => {
      const inPriceRange = Number(item.price) >= preferences.price_range.min * 0.8 &&
                           Number(item.price) <= preferences.price_range.max * 1.2;
      const notRecentlyOrdered = !recentlyOrderedIds.has(item.id);
      const inPreferredCategory = preferences.preferred_categories.includes(item.category);
      
      return inPriceRange && notRecentlyOrdered && (inPreferredCategory || Math.random() > 0.5);
    });

    // Sort by category preference and take top 5
    const sorted = filtered.sort((a, b) => {
      const aScore = preferences.preferred_categories.indexOf(a.category);
      const bScore = preferences.preferred_categories.indexOf(b.category);
      return (aScore === -1 ? 999 : aScore) - (bScore === -1 ? 999 : bScore);
    }).slice(0, 5);

    // Save as recommendations
    const recommendations = await Promise.all(
      sorted.map(async (item) => {
        return prisma.aIRecommendation.create({
          data: {
            user_id: userId,
            menu_item_id: item.id,
            score: 0.7,
            reason: `Based on your preference for ${item.category} items`
          },
          include: {
            menu_item: true
          }
        });
      })
    );

    return recommendations;
  }

  private async getPopularItems() {
    // Get most ordered items for new users
    const popularItems = await prisma.orderItem.groupBy({
      by: ['menu_item_id'],
      _count: {
        menu_item_id: true
      },
      orderBy: {
        _count: {
          menu_item_id: 'desc'
        }
      },
      take: 5
    });

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: popularItems.map(item => item.menu_item_id) },
        is_available: true
      }
    });

    return menuItems.map(item => ({
      menu_item: item,
      score: 0.8,
      reason: 'Popular item among our customers'
    }));
  }

  async getRecommendationsForUser(userId: string) {
    // Check for recent recommendations (within last hour)
    const recentRecs = await prisma.aIRecommendation.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      include: { menu_item: true },
      orderBy: { score: 'desc' },
      take: 5
    });

    if (recentRecs.length > 0) {
      return recentRecs;
    }

    // Generate new recommendations
    return this.generateRecommendations(userId);
  }

  async updateUserPreferences(userId: string, updates: {
    dietaryRestrictions?: string[];
    priceRange?: any;
  }) {
    const existing = await prisma.userPreference.findUnique({
      where: { user_id: userId }
    });

    if (!existing) {
      // Track preferences first
      await this.trackUserPreferences(userId);
    }

    return prisma.userPreference.update({
      where: { user_id: userId },
      data: updates
    });
  }
}

export default new RecommendationService();
