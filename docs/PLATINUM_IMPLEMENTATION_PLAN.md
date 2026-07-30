# Platinum Tier Implementation Plan

## Executive Summary

This document provides a comprehensive, step-by-step plan to implement Platinum-level intelligent features for the Smart Restaurant Management System, focusing on AI/ML capabilities using Google's Gemini API.

**Goal**: Achieve Platinum Level (User Story 5) by implementing intelligent operations  
**Estimated Total Effort**: 25-35 hours  
**Priority**: High (Required for Platinum achievement)  
**Current Platinum Coverage**: 30% → Target: 90%+

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: AI Infrastructure Setup](#phase-1-ai-infrastructure-setup)
3. [Phase 2: Personalized Recommendations](#phase-2-personalized-recommendations)
4. [Phase 3: Inventory Prediction](#phase-3-inventory-prediction)
5. [Phase 4: Demand Forecasting](#phase-4-demand-forecasting)
6. [Phase 5: Enhanced Smart Notifications](#phase-5-enhanced-smart-notifications)
7. [Phase 6: Operational Insights Dashboard](#phase-6-operational-insights-dashboard)
8. [Phase 7: AI-Powered Chatbot](#phase-7-ai-powered-chatbot)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## Prerequisites

### Required Setup

1. **Gemini API Access**
   - Sign up at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate API key
   - Review pricing and rate limits
   - Understand token usage

2. **Environment Configuration**
   ```bash
   # Backend .env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-pro
   ```

3. **Dependencies to Install**
   ```bash
   # Backend
   cd backend
   npm install @google/generative-ai
   npm install node-cache  # For caching AI responses
   npm install bull        # For background job processing
   npm install redis       # For job queue
   
   # Frontend
   cd frontend
   npm install recharts    # For analytics charts
   npm install date-fns    # For date manipulation
   ```

4. **Database Migrations**
   - Add tables for AI features
   - Add indexes for analytics queries
   - Add caching tables

---

## Phase 1: AI Infrastructure Setup

**Estimated Time**: 3-4 hours  
**Priority**: Critical (Foundation for all AI features)

### Step 1.1: Create AI Service Layer

**File**: `backend/src/services/ai.service.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: NodeCache;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' 
    });
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  async generateText(prompt: string, useCache = true): Promise<string> {
    if (useCache) {
      const cached = this.cache.get<string>(prompt);
      if (cached) return cached;
    }

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();
    
    if (useCache) {
      this.cache.set(prompt, response);
    }
    
    return response;
  }

  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = this.buildAnalysisPrompt(data, analysisType);
    const response = await this.generateText(prompt);
    return JSON.parse(response);
  }

  private buildAnalysisPrompt(data: any, type: string): string {
    // Build structured prompts based on analysis type
    return `Analyze the following ${type} data and provide insights in JSON format:\n${JSON.stringify(data)}`;
  }
}

export default new AIService();
```

### Step 1.2: Create AI Controller

**File**: `backend/src/controllers/ai.controller.ts`

```typescript
import { Request, Response } from 'express';
import aiService from '../services/ai.service';

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const recommendations = await aiService.getPersonalizedRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const { type } = req.params; // 'inventory' or 'demand'
    const predictions = await aiService.getPredictions(type);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    const response = await aiService.chat(message, context);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};
```

### Step 1.3: Create AI Routes

**File**: `backend/src/routes/ai.routes.ts`

```typescript
import express from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Recommendations
router.get('/recommendations', authenticate, aiController.getRecommendations);

// Predictions
router.get('/predictions/:type', authenticate, aiController.getPredictions);

// Chatbot
router.post('/chat', authenticate, aiController.chatWithAI);

// Analytics insights
router.get('/insights/:type', authenticate, aiController.getInsights);

export default router;
```

### Step 1.4: Update Main Router

**File**: `backend/src/index.ts`

```typescript
import aiRoutes from './routes/ai.routes';

// Add to existing routes
app.use('/api/v1/ai', aiRoutes);
```

### Step 1.5: Database Schema Updates

**File**: `backend/prisma/schema.prisma`

```prisma
// Add new models for AI features

model UserPreference {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  preferredCategories String[]
  dietaryRestrictions String[]
  favoriteItems   String[]
  priceRange      Json?
  lastUpdated     DateTime @default(now()) @updatedAt
  
  @@index([userId])
}

model AIRecommendation {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  menuItemId      String
  menuItem        MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  score           Float
  reason          String
  createdAt       DateTime @default(now())
  
  @@index([userId, score])
  @@index([createdAt])
}

model InventoryPrediction {
  id              String   @id @default(uuid())
  itemId          String
  item            InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  predictedUsage  Float
  recommendedRestock Float
  confidence      Float
  predictionDate  DateTime
  createdAt       DateTime @default(now())
  
  @@index([itemId, predictionDate])
}

model DemandForecast {
  id              String   @id @default(uuid())
  menuItemId      String?
  menuItem        MenuItem? @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  forecastDate    DateTime
  predictedOrders Int
  confidence      Float
  peakHours       Json?
  createdAt       DateTime @default(now())
  
  @@index([forecastDate])
  @@index([menuItemId])
}

model AIInsight {
  id              String   @id @default(uuid())
  type            String   // 'revenue', 'performance', 'efficiency', 'trend'
  title           String
  description     String
  data            Json
  priority        String   // 'high', 'medium', 'low'
  actionable      Boolean  @default(false)
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  @@index([type, createdAt])
  @@index([priority])
}
```

### Step 1.6: Run Migrations

```bash
cd backend
npx prisma migrate dev --name add_ai_features
npx prisma generate
```

### Step 1.7: Testing AI Service

**File**: `backend/src/tests/ai.service.test.ts`

```typescript
import aiService from '../services/ai.service';

describe('AI Service', () => {
  test('should generate text response', async () => {
    const response = await aiService.generateText('Hello, how are you?');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  test('should cache responses', async () => {
    const prompt = 'Test prompt';
    const first = await aiService.generateText(prompt);
    const second = await aiService.generateText(prompt);
    expect(first).toBe(second);
  });
});
```

---

## Phase 2: Personalized Recommendations

**Estimated Time**: 6-8 hours  
**Priority**: High (20% of Platinum score)

### Step 2.1: Implement Preference Tracking

**File**: `backend/src/services/recommendation.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class RecommendationService {
  async trackUserPreferences(userId: string) {
    // Analyze user's order history
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Extract patterns
    const categoryFrequency = new Map<string, number>();
    const itemFrequency = new Map<string, number>();
    const pricePoints: number[] = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItem.category;
        const itemId = item.menuItem.id;
        const price = item.priceAtOrder;

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
      where: { userId },
      create: {
        userId,
        preferredCategories,
        favoriteItems,
        priceRange,
        dietaryRestrictions: []
      },
      update: {
        preferredCategories,
        favoriteItems,
        priceRange
      }
    });

    return { preferredCategories, favoriteItems, priceRange };
  }

  async generateRecommendations(userId: string) {
    // Get user preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      await this.trackUserPreferences(userId);
      return this.generateRecommendations(userId);
    }

    // Get available menu items
    const menuItems = await prisma.menuItem.findMany({
      where: { is_available: true }
    });

    // Get user's order history
    const orderHistory = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Build AI prompt
    const prompt = `
You are a restaurant recommendation system. Based on the following data, recommend 5 menu items for the user.

User Preferences:
- Preferred Categories: ${preferences.preferredCategories.join(', ')}
- Favorite Items: ${preferences.favoriteItems.join(', ')}
- Price Range: ${JSON.stringify(preferences.priceRange)}
- Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ')}

Available Menu Items:
${JSON.stringify(menuItems.map(item => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: item.price,
  description: item.description
})))}

Recent Order History:
${JSON.stringify(orderHistory.map(order => ({
  items: order.items.map(i => i.menuItemId),
  date: order.createdAt
})))}

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
5. Seasonal or popular items
`;

    const aiResponse = await aiService.generateText(prompt, false);
    const parsed = JSON.parse(aiResponse);

    // Save recommendations
    const recommendations = await Promise.all(
      parsed.recommendations.map(async (rec: any) => {
        return prisma.aIRecommendation.create({
          data: {
            userId,
            menuItemId: rec.menuItemId,
            score: rec.score,
            reason: rec.reason
          }
        });
      })
    );

    return recommendations;
  }

  async getRecommendationsForUser(userId: string) {
    // Check for recent recommendations (within last hour)
    const recentRecs = await prisma.aIRecommendation.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      include: { menuItem: true },
      orderBy: { score: 'desc' },
      take: 5
    });

    if (recentRecs.length > 0) {
      return recentRecs;
    }

    // Generate new recommendations
    return this.generateRecommendations(userId);
  }
}

export default new RecommendationService();
```

### Step 2.2: Create Recommendation Endpoints

**File**: `backend/src/controllers/recommendation.controller.ts`

```typescript
import { Request, Response } from 'express';
import recommendationService from '../services/recommendation.service';

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const recommendations = await recommendationService.getRecommendationsForUser(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dietaryRestrictions, priceRange } = req.body;
    
    await prisma.userPreference.update({
      where: { userId },
      data: { dietaryRestrictions, priceRange }
    });
    
    res.json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};
```

### Step 2.3: Frontend Recommendation Component

**File**: `frontend/components/RecommendationsSection.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface Recommendation {
  id: string;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
  };
  score: number;
  reason: string;
}

export function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await apiClient.get('/ai/recommendations');
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recommended For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="p-4">
            {rec.menuItem.image_url && (
              <img 
                src={rec.menuItem.image_url} 
                alt={rec.menuItem.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-semibold">{rec.menuItem.name}</h3>
            <p className="text-gray-600 text-sm mt-2">{rec.menuItem.description}</p>
            <p className="text-lg font-bold mt-2">${rec.menuItem.price}</p>
            <div className="mt-3 p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Why we recommend:</strong> {rec.reason}
              </p>
            </div>
            <Button className="w-full mt-4">Add to Cart</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Step 2.4: Add to Customer Menu Page

**File**: `frontend/app/customer/menu/page.tsx`

```typescript
import { RecommendationsSection } from '@/components/RecommendationsSection';

export default function MenuPage() {
  return (
    <div>
      <RecommendationsSection />
      {/* Existing menu content */}
    </div>
  );
}
```

---

## Phase 3: Inventory Prediction

**Estimated Time**: 5-7 hours  
**Priority**: High (20% of Platinum score)

### Step 3.1: Create Prediction Service

**File**: `backend/src/services/prediction.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class PredictionService {
  async predictInventoryUsage(itemId: string, daysAhead: number = 7) {
    // Get historical transaction data
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        itemId,
        type: { in: ['deduct', 'reserve'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get current stock
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) throw new Error('Item not found');

    // Prepare data for AI
    const dailyUsage = this.aggregateDailyUsage(transactions);
    
    const prompt = `
You are an inventory prediction system for a restaurant. Analyze the following data and predict future usage.

Item: ${item.name}
Current Stock: ${item.quantity} ${item.unit}
Minimum Stock Level: ${item.min_quantity}

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
- Seasonal factors
- Current stock level

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

    const aiResponse = await aiService.generateText(prompt, false);
    const prediction = JSON.parse(aiResponse);

    // Save prediction
    await prisma.inventoryPrediction.create({
      data: {
        itemId,
        predictedUsage: prediction.predictions[0].predictedUsage,
        recommendedRestock: prediction.recommendedRestock,
        confidence: prediction.overallConfidence,
        predictionDate: new Date(prediction.predictions[0].date)
      }
    });

    return prediction;
  }

  private aggregateDailyUsage(transactions: any[]) {
    const dailyMap = new Map<string, number>();

    transactions.forEach(tx => {
      const date = tx.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + tx.quantity);
    });

    return Array.from(dailyMap.entries()).map(([date, usage]) => ({
      date,
      usage
    }));
  }

  async getAllPredictions() {
    const items = await prisma.inventoryItem.findMany();
    
    const predictions = await Promise.all(
      items.map(item => this.predictInventoryUsage(item.id))
    );

    return predictions;
  }

  async getLowStockAlerts() {
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        predictionDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: { item: true }
    });

    return predictions.filter(pred => {
      const daysUntilEmpty = pred.item.quantity / pred.predictedUsage;
      return daysUntilEmpty < 3;
    });
  }
}

export default new PredictionService();
```

### Step 3.2: Create Prediction Endpoints

**File**: `backend/src/controllers/prediction.controller.ts`

```typescript
import { Request, Response } from 'express';
import predictionService from '../services/prediction.service';

export const getInventoryPredictions = async (req: Request, res: Response) => {
  try {
    const predictions = await predictionService.getAllPredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
};

export const getItemPrediction = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { daysAhead } = req.query;
    
    const prediction = await predictionService.predictInventoryUsage(
      itemId,
      daysAhead ? parseInt(daysAhead as string) : 7
    );
    
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
};

export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await predictionService.getLowStockAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get alerts' });
  }
};
```

### Step 3.3: Frontend Prediction Dashboard

**File**: `frontend/components/InventoryPredictions.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function InventoryPredictions() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [predData, alertData] = await Promise.all([
      apiClient.get('/ai/predictions/inventory'),
      apiClient.get('/ai/predictions/low-stock-alerts')
    ]);
    
    setPredictions(predData);
    setAlerts(alertData);
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-xl font-bold text-red-800 mb-4">
            ⚠️ Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="p-3 bg-white rounded">
                <p className="font-semibold">{alert.item.name}</p>
                <p className="text-sm text-gray-600">
                  Current: {alert.item.quantity} {alert.item.unit} | 
                  Daily Usage: {alert.predictedUsage.toFixed(2)} | 
                  Restock: {alert.recommendedRestock}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Predictions Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Usage Predictions</h3>
        {predictions.map(pred => (
          <div key={pred.itemId} className="mb-6">
            <h4 className="font-semibold mb-2">{pred.itemName}</h4>
            <LineChart width={600} height={300} data={pred.predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predictedUsage" stroke="#8884d8" />
            </LineChart>
            <p className="text-sm text-gray-600 mt-2">
              Confidence: {(pred.overallConfidence * 100).toFixed(0)}% | 
              Recommended Restock: {pred.recommendedRestock} on {pred.restockDate}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}
```

---

## Phase 4: Demand Forecasting

**Estimated Time**: 5-7 hours  
**Priority**: High (20% of Platinum score)

### Step 4.1: Create Forecasting Service

**File**: `backend/src/services/forecast.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

class ForecastService {
  async forecastDemand(daysAhead: number = 7) {
    // Get historical order data
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // Last 60 days
        }
      },
      include: {
        items: {
          include: { menuItem: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

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

    const aiResponse = await aiService.generateText(prompt, false);
    const forecast = JSON.parse(aiResponse);

    // Save forecasts
    await Promise.all(
      forecast.forecasts.map(async (f: any) => {
        return prisma.demandForecast.create({
          data: {
            forecastDate: new Date(f.date),
            predictedOrders: f.predictedOrders,
            confidence: f.confidence,
            peakHours: f.peakHours
          }
        });
      })
    );

    return forecast;
  }

  private aggregateDailyOrders(orders: any[]) {
    const dailyMap = new Map<string, number>();

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
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
      const hour = order.createdAt.getHours();
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
        const current = itemMap.get(item.menuItemId) || { 
          name: item.menuItem.name, 
          count: 0 
        };
        itemMap.set(item.menuItemId, {
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

  async getStaffingRecommendations(date: Date) {
    const forecast = await prisma.demandForecast.findFirst({
      where: {
        forecastDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });

    if (!forecast) {
      return { message: 'No forecast available for this date' };
    }

    // Calculate staffing needs based on predicted orders
    const baseStaff = 3;
    const ordersPerStaff = 20;
    const recommendedStaff = Math.ceil(forecast.predictedOrders / ordersPerStaff) + baseStaff;

    return {
      date: forecast.forecastDate,
      predictedOrders: forecast.predictedOrders,
      recommendedStaff,
      peakHours: forecast.peakHours,
      confidence: forecast.confidence
    };
  }
}

export default new ForecastService();
```

### Step 4.2: Frontend Forecast Dashboard

**File**: `frontend/components/DemandForecast.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function DemandForecast() {
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    const data = await apiClient.get('/ai/predictions/demand');
    setForecast(data);
  };

  if (!forecast) return <div>Loading forecast...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">7-Day Demand Forecast</h3>
        <BarChart width={700} height={300} data={forecast.forecasts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="predictedOrders" fill="#8884d8" />
        </BarChart>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Key Insights</h3>
        <ul className="space-y-2">
          {forecast.insights.map((insight: string, i: number) => (
            <li key={i} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Popular Items Forecast</h3>
        <div className="grid grid-cols-2 gap-4">
          {forecast.itemForecasts.slice(0, 6).map((item: any) => (
            <div key={item.itemId} className="p-3 bg-gray-50 rounded">
              <p className="font-semibold">{item.itemName}</p>
              <p className="text-sm text-gray-600">
                Predicted: {item.predictedOrders} orders
              </p>
              <p className="text-xs text-gray-500">
                Confidence: {(item.confidence * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

## Phase 5: Enhanced Smart Notifications

**Estimated Time**: 3-4 hours  
**Priority**: Medium (15% of Platinum score)

### Step 5.1: Enhance Notification Service

**File**: `backend/src/services/notification.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';
import { io } from '../index'; // Socket.io instance

const prisma = new PrismaClient();

class NotificationService {
  async sendPredictiveNotification(userId: string, type: string, data: any) {
    // Use AI to determine optimal timing and content
    const prompt = `
Generate a personalized notification for a restaurant customer.

User Context: ${JSON.stringify(data.userContext)}
Notification Type: ${type}
Data: ${JSON.stringify(data)}

Create a notification with:
1. Optimal timing (immediate, 5min, 15min, 1hour)
2. Personalized message
3. Priority level (high, medium, low)

Response in JSON:
{
  "timing": "immediate",
  "message": "Your table will be ready in 5 minutes!",
  "priority": "high",
  "actionable": true,
  "action": "View Table Status"
}
`;

    const aiResponse = await aiService.generateText(prompt);
    const notification = JSON.parse(aiResponse);

    // Schedule or send immediately
    if (notification.timing === 'immediate') {
      await this.sendNotification(userId, notification);
    } else {
      await this.scheduleNotification(userId, notification);
    }
  }

  async sendNotification(userId: string, notification: any) {
    const created = await prisma.notification.create({
      data: {
        userId,
        type: 'custom',
        message: notification.message,
        is_read: false
      }
    });

    // Send via WebSocket
    io.to(userId).emit('notification', created);

    return created;
  }

  async scheduleNotification(userId: string, notification: any) {
    // Implement with job queue (Bull)
    // For now, simple setTimeout
    const delay = this.parseDelay(notification.timing);
    setTimeout(() => {
      this.sendNotification(userId, notification);
    }, delay);
  }

  private parseDelay(timing: string): number {
    const map: Record<string, number> = {
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '1hour': 60 * 60 * 1000
    };
    return map[timing] || 0;
  }

  async sendReservationReminder(reservationId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { user: true }
    });

    if (!reservation) return;

    const timeUntil = reservation.reservation_time.getTime() - Date.now();
    const hoursUntil = timeUntil / (1000 * 60 * 60);

    if (hoursUntil <= 2 && hoursUntil > 0) {
      await this.sendNotification(reservation.userId, {
        message: `Reminder: Your reservation is in ${Math.round(hoursUntil)} hours at ${reservation.reservation_time.toLocaleTimeString()}`,
        priority: 'high'
      });
    }
  }
}

export default new NotificationService();
```

---

## Phase 6: Operational Insights Dashboard

**Estimated Time**: 4-6 hours  
**Priority**: Medium (15% of Platinum score)

### Step 6.1: Create Analytics Service

**File**: `backend/src/services/analytics.service.ts`

```typescript
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

    const aiResponse = await aiService.generateText(prompt, false);
    const analysis = JSON.parse(aiResponse);

    // Save insights
    await Promise.all(
      analysis.insights.map(async (insight: any) => {
        return prisma.aIInsight.create({
          data: {
            type: insight.type,
            title: insight.title,
            description: insight.description,
            data: insight,
            priority: insight.priority,
            actionable: insight.actionable,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      })
    );

    return analysis;
  }

  private async getRevenueData() {
    const orders = await prisma.order.findMany({
      where: {
        payment_status: 'paid',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalRevenue / orders.length;

    return {
      totalRevenue,
      orderCount: orders.length,
      avgOrderValue,
      period: '30 days'
    };
  }

  private async getOrderData() {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: { items: true }
    });

    return {
      totalOrders: orders.length,
      avgItemsPerOrder: orders.reduce((sum, o) => sum + o.items.length, 0) / orders.length,
      statusDistribution: this.getStatusDistribution(orders)
    };
  }

  private async getInventoryData() {
    const items = await prisma.inventoryItem.findMany();
    const lowStock = items.filter(i => i.quantity <= i.min_quantity);

    return {
      totalItems: items.length,
      lowStockCount: lowStock.length,
      totalValue: items.reduce((sum, i) => sum + (i.quantity * (i.cost_per_unit || 0)), 0)
    };
  }

  private async getStaffData() {
    const staff = await prisma.user.findMany({
      where: { role: { not: 'customer' } }
    });

    return {
      totalStaff: staff.length,
      roleDistribution: this.getRoleDistribution(staff)
    };
  }

  private getStatusDistribution(orders: any[]) {
    const dist: Record<string, number> = {};
    orders.forEach(order => {
      dist[order.status] = (dist[order.status] || 0) + 1;
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
}

export default new AnalyticsService();
```

### Step 6.2: Frontend Analytics Dashboard

**File**: `frontend/components/AnalyticsDashboard.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export function AnalyticsDashboard() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const data = await apiClient.get('/ai/insights/all');
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 border-red-300 text-red-800',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      low: 'bg-green-100 border-green-300 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) return <div>Loading insights...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <Card key={insight.id} className={`p-6 border-2 ${getPriorityColor(insight.priority)}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold">{insight.title}</h3>
              <span className="text-xs font-semibold px-2 py-1 rounded">
                {insight.priority.toUpperCase()}
              </span>
            </div>
            
            <p className="text-sm mb-4">{insight.description}</p>
            
            {insight.actionable && insight.data.recommendations && (
              <div className="mt-4 p-3 bg-white rounded">
                <p className="font-semibold text-sm mb-2">Recommended Actions:</p>
                <ul className="space-y-1">
                  {insight.data.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start">
                      <span className="mr-2">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 7: AI-Powered Chatbot

**Estimated Time**: 5-7 hours  
**Priority**: Medium (10% of Platinum score)

### Step 7.1: Create Chatbot Service

**File**: `backend/src/services/chatbot.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import aiService from './ai.service';

const prisma = new PrismaClient();

interface ChatContext {
  userId: string;
  role: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

class ChatbotService {
  async chat(message: string, context: ChatContext) {
    // Build context-aware prompt
    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    // Get AI response
    const response = await aiService.generateText(fullPrompt, false);

    // Update conversation history
    context.conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    return {
      response,
      context: context.conversationHistory
    };
  }

  private buildSystemPrompt(context: ChatContext): string {
    const basePrompt = `You are a helpful restaurant assistant. You can help with:
- Menu information and recommendations
- Order status and tracking
- Reservation management
- General restaurant information

User Role: ${context.role}
`;

    // Add conversation history
    const history = context.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `${basePrompt}\n\nConversation History:\n${history}`;
  }

  async getMenuHelp(query: string) {
    const menuItems = await prisma.menuItem.findMany({
      where: { is_available: true }
    });

    const prompt = `
You are a restaurant menu assistant. Help the customer with their query.

Query: ${query}

Available Menu Items:
${JSON.stringify(menuItems.map(item => ({
  name: item.name,
  category: item.category,
  price: item.price,
  description: item.description
})))}

Provide a helpful, conversational response. If recommending items, explain why.
`;

    return aiService.generateText(prompt, false);
  }

  async getOrderHelp(userId: string, query: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const prompt = `
You are a restaurant order assistant. Help the customer with their query about orders.

Query: ${query}

Customer's Recent Orders:
${JSON.stringify(orders.map(order => ({
  id: order.id,
  status: order.status,
  total: order.total,
  items: order.items.map(i => i.menuItem.name),
  createdAt: order.createdAt
})))}

Provide a helpful response about their order status or history.
`;

    return aiService.generateText(prompt, false);
  }
}

export default new ChatbotService();
```

### Step 7.2: Create Chatbot Endpoints

**File**: `backend/src/controllers/chatbot.controller.ts`

```typescript
import { Request, Response } from 'express';
import chatbotService from '../services/chatbot.service';

export const chat = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user!.id;
    const role = req.user!.role;

    const context = {
      userId,
      role,
      conversationHistory
    };

    const response = await chatbotService.chat(message, context);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

export const getMenuHelp = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const response = await chatbotService.getMenuHelp(query);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get menu help' });
  }
};

export const getOrderHelp = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.user!.id;
    const response = await chatbotService.getOrderHelp(userId, query);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get order help' });
  }
};
```

### Step 7.3: Frontend Chatbot Component

**File**: `frontend/components/AIChatbot.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', {
        message: input,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-xs">Ask me anything about our restaurant!</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p>👋 Hi! How can I help you today?</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setInput("What's on the menu today?")}
                    className="block w-full text-left p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  >
                    What's on the menu today?
                  </button>
                  <button
                    onClick={() => setInput("Where is my order?")}
                    className="block w-full text-left p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  >
                    Where is my order?
                  </button>
                  <button
                    onClick={() => setInput("What do you recommend?")}
                    className="block w-full text-left p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                  >
                    What do you recommend?
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
```

### Step 7.4: Add Chatbot to Layout

**File**: `frontend/app/customer/layout.tsx`

```typescript
import { AIChatbot } from '@/components/AIChatbot';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <AIChatbot />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

**Backend Tests** (`backend/src/tests/`)

```typescript
// ai.service.test.ts
describe('AI Service', () => {
  test('should generate recommendations', async () => {
    const recs = await recommendationService.generateRecommendations('user_id');
    expect(recs).toBeDefined();
    expect(recs.length).toBeGreaterThan(0);
  });

  test('should predict inventory usage', async () => {
    const pred = await predictionService.predictInventoryUsage('item_id');
    expect(pred.predictedUsage).toBeGreaterThan(0);
    expect(pred.confidence).toBeGreaterThan(0);
  });

  test('should forecast demand', async () => {
    const forecast = await forecastService.forecastDemand(7);
    expect(forecast.forecasts).toBeDefined();
    expect(forecast.forecasts.length).toBe(7);
  });
});
```

### Integration Tests

```typescript
// ai.integration.test.ts
describe('AI Integration', () => {
  test('should generate and save recommendations', async () => {
    const response = await request(app)
      .get('/api/v1/ai/recommendations')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('should handle chatbot conversation', async () => {
    const response = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What do you recommend?' });
    
    expect(response.status).toBe(200);
    expect(response.body.response).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] Test Gemini API connection
- [ ] Verify recommendation generation
- [ ] Test inventory predictions accuracy
- [ ] Validate demand forecasting
- [ ] Test chatbot responses
- [ ] Verify notification timing
- [ ] Test analytics insights generation
- [ ] Check caching behavior
- [ ] Test error handling
- [ ] Verify rate limiting

---

## Deployment Considerations

### Environment Variables

```bash
# Production .env
GEMINI_API_KEY=your_production_key
GEMINI_MODEL=gemini-1.5-pro
REDIS_URL=your_redis_url
NODE_ENV=production
```

### Rate Limiting

```typescript
// Implement rate limiting for AI endpoints
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: 'Too many AI requests, please try again later'
});

app.use('/api/v1/ai', aiLimiter);
```

### Caching Strategy

```typescript
// Implement Redis caching for expensive AI operations
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedOrGenerate(key: string, generator: () => Promise<any>) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await generator();
  await redis.setex(key, 3600, JSON.stringify(result)); // 1 hour cache
  return result;
}
```

### Background Jobs

```typescript
// Use Bull for background AI processing
import Queue from 'bull';

const aiQueue = new Queue('ai-processing', process.env.REDIS_URL);

// Process recommendations in background
aiQueue.process('generate-recommendations', async (job) => {
  const { userId } = job.data;
  await recommendationService.generateRecommendations(userId);
});

// Schedule daily forecasting
aiQueue.add('daily-forecast', {}, {
  repeat: { cron: '0 0 * * *' } // Daily at midnight
});
```

### Monitoring

```typescript
// Add monitoring for AI operations
import { logger } from './utils/logger';

class AIMonitor {
  logRequest(endpoint: string, duration: number, success: boolean) {
    logger.info('AI Request', {
      endpoint,
      duration,
      success,
      timestamp: new Date()
    });
  }

  trackTokenUsage(tokens: number) {
    // Track Gemini API token usage
    logger.info('Token Usage', { tokens });
  }
}
```

---

## Implementation Timeline

### Week 1: Foundation (Days 1-2)

**Day 1** (8 hours)
- [ ] Set up Gemini API (1 hour)
- [ ] Create AI service layer (2 hours)
- [ ] Database migrations (1 hour)
- [ ] Basic testing setup (2 hours)
- [ ] Documentation (2 hours)

**Day 2** (8 hours)
- [ ] Implement recommendation service (4 hours)
- [ ] Create recommendation endpoints (2 hours)
- [ ] Build frontend recommendation component (2 hours)

### Week 2: Predictions & Forecasting (Days 3-4)

**Day 3** (8 hours)
- [ ] Implement inventory prediction (4 hours)
- [ ] Create prediction endpoints (2 hours)
- [ ] Build prediction dashboard (2 hours)

**Day 4** (8 hours)
- [ ] Implement demand forecasting (4 hours)
- [ ] Create forecast endpoints (2 hours)
- [ ] Build forecast dashboard (2 hours)

### Week 3: Advanced Features (Days 5-7)

**Day 5** (6 hours)
- [ ] Enhanced notifications (3 hours)
- [ ] Analytics service (3 hours)

**Day 6** (6 hours)
- [ ] Analytics dashboard (3 hours)
- [ ] Chatbot service (3 hours)

**Day 7** (5 hours)
- [ ] Chatbot frontend (3 hours)
- [ ] Integration testing (2 hours)

### Total Estimated Time: 35 hours

---

## Success Metrics

### Platinum Level Achievement Criteria

| Feature | Weight | Target | Measurement |
|---------|--------|--------|-------------|
| Personalized Recommendations | 20% | 90%+ | User engagement with recommendations |
| Inventory Prediction | 20% | 85%+ | Prediction accuracy |
| Demand Forecasting | 20% | 80%+ | Forecast accuracy |
| Smart Notifications | 15% | 95%+ | Notification relevance |
| Operational Insights | 15% | 90%+ | Insight actionability |
| AI Chatbot | 10% | 85%+ | User satisfaction |

### Key Performance Indicators (KPIs)

1. **Recommendation Accuracy**: 85%+ click-through rate
2. **Prediction Accuracy**: 80%+ within 10% margin
3. **Forecast Accuracy**: 75%+ within 15% margin
4. **Response Time**: <2 seconds for AI operations
5. **User Satisfaction**: 4.5/5 stars for AI features
6. **Cost Efficiency**: <$0.10 per AI interaction

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API rate limits | High | Implement caching, rate limiting |
| High API costs | Medium | Cache responses, optimize prompts |
| Slow response times | Medium | Background processing, caching |
| Inaccurate predictions | Medium | Continuous model refinement |
| API downtime | High | Fallback to rule-based logic |

### Implementation Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Time constraints | High | Prioritize core features first |
| Integration complexity | Medium | Incremental implementation |
| Testing coverage | Medium | Automated testing suite |
| Data quality issues | Medium | Data validation, cleaning |

---

## Post-Implementation

### Continuous Improvement

1. **Monitor AI Performance**
   - Track accuracy metrics
   - Collect user feedback
   - Analyze usage patterns

2. **Refine Prompts**
   - A/B test different prompts
   - Optimize for accuracy and speed
   - Reduce token usage

3. **Expand Features**
   - Add more AI capabilities
   - Integrate additional data sources
   - Enhance personalization

4. **Cost Optimization**
   - Monitor API usage
   - Optimize caching strategy
   - Reduce unnecessary calls

---

## Conclusion

This comprehensive plan provides a structured approach to implementing Platinum-level AI features for the Smart Restaurant Management System. By following this plan:

✅ **Achieve Platinum Level**: Implement all required intelligent features  
✅ **Maintain Quality**: Follow best practices and testing strategies  
✅ **Manage Costs**: Implement caching and optimization  
✅ **Scale Effectively**: Use background processing and monitoring  

### Next Steps

1. **Immediate**: Set up Gemini API and test connection
2. **Week 1**: Implement recommendations and predictions
3. **Week 2**: Add forecasting and analytics
4. **Week 3**: Complete chatbot and testing
5. **Final**: Deploy and monitor

### Expected Outcome

**Platinum Level Achievement**: 90%+ coverage of User Story 5  
**Overall Score**: 95/100 (up from 84.5/100)  
**Competitive Position**: Top-tier submission with advanced AI capabilities

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-30  
**Estimated Completion**: 3-5 weeks (35 hours total)  
**Priority**: High - Required for Platinum achievement