# Frontend Integration Guide - Platinum Tier AI Features

## 🎯 Quick Start Overview

This guide provides step-by-step instructions to integrate the fully implemented Platinum tier AI/ML backend features into your existing frontend. All backend endpoints are ready and tested.

**Estimated Integration Time**: 8-12 hours  
**Backend Status**: ✅ 100% Complete  
**Frontend Status**: Ready for Integration

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [API Client Setup](#api-client-setup)
3. [Feature Integration Roadmap](#feature-integration-roadmap)
4. [Quick Integration Steps](#quick-integration-steps)
5. [Feature-by-Feature Guide](#feature-by-feature-guide)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### ✅ Backend Requirements (Already Complete)

- ✅ Gemini API key configured in backend `.env`
- ✅ Database migrations applied
- ✅ Backend server running on `http://localhost:5000`
- ✅ All AI services implemented and tested

### 📦 Frontend Dependencies to Install

```bash
cd frontend
npm install recharts date-fns
```

**Why these packages?**
- `recharts`: For analytics charts and visualizations
- `date-fns`: For date formatting in forecasts and predictions

---

## API Client Setup

### Step 1: Verify API Client Configuration

Your existing API client at `frontend/lib/api-client.ts` should already handle authentication. Verify it includes:

```typescript
// Ensure your api-client.ts has these methods
export const apiClient = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
};
```

### Step 2: Test Backend Connection

Create a simple test to verify backend is accessible:

```bash
# Test from terminal
curl http://localhost:5000/api/v1/ai/test
```

Expected response:
```json
{
  "status": "success",
  "message": "AI service is working correctly"
}
```

---

## Feature Integration Roadmap

### Priority Order (Fastest to Implement → Highest Impact)

| Priority | Feature | Time | Impact | Complexity |
|----------|---------|------|--------|------------|
| 🔴 **1** | AI Chatbot | 2-3h | High | Low |
| 🟠 **2** | Personalized Recommendations | 2-3h | High | Medium |
| 🟡 **3** | Low Stock Alerts | 1-2h | Medium | Low |
| 🟢 **4** | Demand Forecast Dashboard | 2-3h | Medium | Medium |
| 🔵 **5** | Inventory Predictions | 2-3h | Medium | Medium |
| 🟣 **6** | Analytics Insights | 2-3h | High | Medium |

**Recommended Integration Order**: 1 → 2 → 3 → 6 → 4 → 5

---

## Quick Integration Steps

### 🚀 30-Minute Quick Start (Chatbot Only)

**Goal**: Get the AI chatbot working in 30 minutes

#### Step 1: Create Chatbot Component (15 min)

Create `frontend/components/AIChatbot.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', {
        message: input,
        conversationHistory: messages.slice(-10)
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg z-50"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-lg z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-bold">AI Assistant</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500">Thinking...</div>}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 p-2 border rounded"
              />
              <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

#### Step 2: Add to Customer Layout (5 min)

Edit `frontend/app/customer/layout.tsx`:

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

#### Step 3: Test (10 min)

1. Start frontend: `npm run dev`
2. Login as customer
3. Click chatbot button
4. Ask: "What do you recommend?"
5. Verify response

**✅ Done! You now have a working AI chatbot.**

---

## Feature-by-Feature Guide

### 1️⃣ AI Chatbot (Priority 1)

**Status**: ✅ Backend Ready  
**Endpoints**: 
- `POST /api/v1/ai/chat`
- `POST /api/v1/ai/chat/menu-help`
- `POST /api/v1/ai/chat/order-help`
- `GET /api/v1/ai/chat/suggestions`

**Integration Steps**: See [30-Minute Quick Start](#-30-minute-quick-start-chatbot-only) above

**Enhancement Ideas**:
- Add suggested questions on first load
- Show typing indicator
- Add conversation history persistence
- Add voice input (optional)

---

### 2️⃣ Personalized Recommendations (Priority 2)

**Status**: ✅ Backend Ready  
**Endpoints**:
- `GET /api/v1/ai/recommendations` - Get recommendations
- `POST /api/v1/ai/recommendations/regenerate` - Force regenerate
- `POST /api/v1/ai/preferences` - Update preferences

#### Quick Integration (2-3 hours)

**Step 1: Create Hook** (`frontend/hooks/useRecommendations.ts`)

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get('/ai/recommendations?limit=5');
        setRecommendations(data.data.recommendations);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { recommendations, loading };
}
```

**Step 2: Create Component** (`frontend/components/RecommendationsWidget.tsx`)

```typescript
'use client';

import { useRecommendations } from '@/hooks/useRecommendations';
import { Card } from '@/components/Card';

export function RecommendationsWidget() {
  const { recommendations, loading } = useRecommendations();

  if (loading) return <div>Loading recommendations...</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">🎯 Recommended For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec: any) => (
          <Card key={rec.id} className="p-4">
            <img 
              src={rec.menuItem.imageUrl || '/placeholder.jpg'} 
              alt={rec.menuItem.name}
              className="w-full h-40 object-cover rounded mb-3"
            />
            <h3 className="font-bold text-lg">{rec.menuItem.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{rec.menuItem.description}</p>
            <p className="text-xl font-bold mt-2">${rec.menuItem.price}</p>
            
            {/* AI Reasoning */}
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
              <strong>Why?</strong> {rec.reason}
            </div>
            
            <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Add to Cart
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Add to Menu Page** (`frontend/app/customer/menu/page.tsx`)

```typescript
import { RecommendationsWidget } from '@/components/RecommendationsWidget';

export default function MenuPage() {
  return (
    <div>
      <RecommendationsWidget />
      {/* Your existing menu content */}
    </div>
  );
}
```

**API Response Format**:
```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "id": "rec-123",
        "menuItem": {
          "id": "item-456",
          "name": "Margherita Pizza",
          "price": 12.99,
          "imageUrl": "/images/pizza.jpg"
        },
        "score": 0.95,
        "reason": "Based on your love for Italian cuisine",
        "confidence": "HIGH"
      }
    ]
  }
}
```

---

### 3️⃣ Low Stock Alerts (Priority 3)

**Status**: ✅ Backend Ready  
**Endpoint**: `GET /api/v1/ai/predictions/low-stock-alerts`

#### Quick Integration (1-2 hours)

**Create Alert Component** (`frontend/components/LowStockAlerts.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await apiClient.get('/ai/predictions/low-stock-alerts');
      setAlerts(data.data.alerts);
    }
    load();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <h3 className="text-xl font-bold text-red-800 mb-3">
        ⚠️ Low Stock Alerts ({alerts.length})
      </h3>
      <div className="space-y-2">
        {alerts.map((alert: any) => (
          <div key={alert.id} className="bg-white p-3 rounded flex justify-between items-center">
            <div>
              <p className="font-semibold">{alert.inventoryItem.name}</p>
              <p className="text-sm text-gray-600">
                Current: {alert.inventoryItem.currentQuantity} {alert.inventoryItem.unit} | 
                Stockout in {alert.daysUntilStockout} days
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
              alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Add to Inventory Dashboard** (`frontend/app/inventory/page.tsx`)

```typescript
import { LowStockAlerts } from '@/components/LowStockAlerts';

export default function InventoryPage() {
  return (
    <div>
      <LowStockAlerts />
      {/* Your existing inventory content */}
    </div>
  );
}
```

---

### 4️⃣ Analytics Insights Dashboard (Priority 6)

**Status**: ✅ Backend Ready  
**Endpoints**:
- `POST /api/v1/ai/insights/generate`
- `GET /api/v1/ai/insights/:type`
- `GET /api/v1/ai/analytics/revenue`
- `GET /api/v1/ai/analytics/performance`

#### Quick Integration (2-3 hours)

**Create Insights Component** (`frontend/components/AIInsights.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';

export function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      // Generate fresh insights
      await apiClient.post('/ai/insights/generate', {
        types: ['REVENUE', 'OPERATIONAL', 'CUSTOMER']
      });
      
      // Fetch all insights
      const data = await apiClient.get('/ai/insights/REVENUE');
      setInsights(data.data.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'border-red-300 bg-red-50',
      MEDIUM: 'border-yellow-300 bg-yellow-50',
      LOW: 'border-green-300 bg-green-50'
    };
    return colors[priority] || colors.MEDIUM;
  };

  if (loading) return <div>Loading insights...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🧠 AI-Powered Insights</h2>
        <button 
          onClick={loadInsights}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight: any) => (
          <Card key={insight.id} className={`p-6 border-2 ${getPriorityColor(insight.priority)}`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold">{insight.title}</h3>
              <span className="text-xs font-semibold px-2 py-1 bg-white rounded">
                {insight.priority}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">{insight.description}</p>
            
            {insight.data.recommendations && (
              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-sm mb-2">📋 Recommended Actions:</p>
                <ul className="space-y-1">
                  {insight.data.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
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

**Add to Admin Dashboard** (`frontend/app/admin/page.tsx`)

```typescript
import { AIInsights } from '@/components/AIInsights';

export default function AdminDashboard() {
  return (
    <div>
      <AIInsights />
      {/* Your existing admin content */}
    </div>
  );
}
```

---

### 5️⃣ Demand Forecast (Priority 4)

**Status**: ✅ Backend Ready  
**Endpoints**:
- `GET /api/v1/ai/forecast/demand?daysAhead=7`
- `GET /api/v1/ai/forecast/staffing?date=2026-07-31`

#### Quick Integration (2-3 hours)

**Install Chart Library** (if not already installed):
```bash
npm install recharts
```

**Create Forecast Component** (`frontend/components/DemandForecast.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/Card';

export function DemandForecast() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get('/ai/forecast/demand?daysAhead=7');
        setForecast(data.data.forecast);
      } catch (error) {
        console.error('Failed to load forecast:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading forecast...</div>;
  if (!forecast) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">📊 7-Day Demand Forecast</h3>
        <BarChart width={700} height={300} data={forecast.dailyForecasts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="predictedOrders" fill="#3b82f6" name="Predicted Orders" />
        </BarChart>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Peak Day</p>
            <p className="text-lg font-bold">{forecast.summary.peakDay.date}</p>
            <p className="text-sm">{forecast.summary.peakDay.expectedOrders} orders</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Average Daily</p>
            <p className="text-lg font-bold">{forecast.summary.avgDailyOrders} orders</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

**Add to Admin Dashboard**:
```typescript
import { DemandForecast } from '@/components/DemandForecast';

export default function AdminDashboard() {
  return (
    <div>
      <DemandForecast />
      {/* Other content */}
    </div>
  );
}
```

---

### 6️⃣ Inventory Predictions (Priority 5)

**Status**: ✅ Backend Ready  
**Endpoints**:
- `GET /api/v1/ai/predictions/inventory?daysAhead=7`
- `GET /api/v1/ai/predictions/inventory/:itemId`

#### Quick Integration (2-3 hours)

**Create Predictions Component** (`frontend/components/InventoryPredictions.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/Card';

export function InventoryPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get('/ai/predictions/inventory?daysAhead=7');
        setPredictions(data.data.predictions);
      } catch (error) {
        console.error('Failed to load predictions:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading predictions...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📈 Inventory Usage Predictions</h2>
      
      {predictions.map((pred: any) => (
        <Card key={pred.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{pred.inventoryItem.name}</h3>
              <p className="text-sm text-gray-600">
                Current: {pred.inventoryItem.currentQuantity} {pred.inventoryItem.unit}
              </p>
            </div>
            <span className="text-sm font-semibold px-3 py-1 bg-blue-100 rounded">
              {(pred.confidence * 100).toFixed(0)}% Confidence
            </span>
          </div>

          {pred.restockRecommendation.shouldRestock && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">
                🔔 Restock Recommended
              </p>
              <p className="text-sm text-yellow-700">
                Order {pred.restockRecommendation.recommendedQuantity} {pred.inventoryItem.unit} by {pred.restockRecommendation.recommendedDate}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Predicted Usage</p>
              <p className="font-bold">{pred.predictedUsage.toFixed(1)} {pred.inventoryItem.unit}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Daily Usage</p>
              <p className="font-bold">{pred.historicalData.avgDailyUsage.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-600">Trend</p>
              <p className="font-bold">{pred.historicalData.trend}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

**Add to Inventory Page**:
```typescript
import { InventoryPredictions } from '@/components/InventoryPredictions';

export default function InventoryPage() {
  return (
    <div>
      <InventoryPredictions />
      {/* Other content */}
    </div>
  );
}
```

---

## Testing Checklist

### ✅ Pre-Integration Tests

- [ ] Backend server is running (`http://localhost:5000`)
- [ ] Gemini API key is configured
- [ ] Test endpoint works: `curl http://localhost:5000/api/v1/ai/test`
- [ ] User authentication is working
- [ ] Database has sample data (orders, menu items, inventory)

### ✅ Feature Tests

**Chatbot**:
- [ ] Chatbot button appears
- [ ] Can send messages
- [ ] Receives AI responses
- [ ] Conversation history maintained
- [ ] Error handling works

**Recommendations**:
- [ ] Recommendations load on menu page
- [ ] Shows 3-5 items
- [ ] Displays reasoning
- [ ] Images load correctly
- [ ] Add to cart works

**Low Stock Alerts**:
- [ ] Alerts appear when stock is low
- [ ] Severity levels display correctly
- [ ] Shows days until stockout
- [ ] Recommendations are actionable

**Analytics Insights**:
- [ ] Insights generate successfully
- [ ] Priority levels display correctly
- [ ] Recommendations are actionable
- [ ] Refresh button works

**Demand Forecast**:
- [ ] Chart displays correctly
- [ ] Shows 7-day forecast
- [ ] Peak day highlighted
- [ ] Data is accurate

**Inventory Predictions**:
- [ ] Predictions load for all items
- [ ] Restock recommendations show
- [ ] Confidence levels display
- [ ] Trends are accurate

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" Error

**Problem**: API requests failing  
**Solution**:
```typescript
// Check API base URL in api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
```

#### 2. "Unauthorized" Error

**Problem**: Authentication token missing  
**Solution**:
```typescript
// Verify token is stored after login
localStorage.setItem('token', response.token);

// Check token in API client
const token = localStorage.getItem('token');
if (!token) {
  // Redirect to login
  window.location.href = '/auth/login';
}
```

#### 3. Empty Recommendations

**Problem**: No recommendations returned  
**Cause**: User has no order history  
**Solution**: 
- Create test orders for the user
- Or show popular items as fallback

#### 4. Charts Not Displaying

**Problem**: Recharts not rendering  
**Solution**:
```bash
# Reinstall recharts
npm uninstall recharts
npm install recharts
```

#### 5. Slow AI Responses

**Problem**: Chatbot takes too long  
**Cause**: First request to Gemini API  
**Solution**: 
- Add loading indicator
- Implement response caching
- Use shorter prompts

---

## Performance Optimization

### 1. Implement Caching

```typescript
// Cache recommendations for 1 hour
const CACHE_KEY = 'ai_recommendations';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getCachedRecommendations() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return data;
}

function setCachedRecommendations(data: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
```

### 2. Lazy Load Components

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const DemandForecast = dynamic(() => import('@/components/DemandForecast'), {
  loading: () => <div>Loading forecast...</div>,
  ssr: false
});
```

### 3. Debounce Chatbot Input

```typescript
import { debounce } from 'lodash';

const debouncedSend = debounce(sendMessage, 500);
```

---

## Next Steps

### Phase 1: Core Features (Week 1)
1. ✅ Integrate AI Chatbot
2. ✅ Add Personalized Recommendations
3. ✅ Implement Low Stock Alerts

### Phase 2: Analytics (Week 2)
4. ✅ Add Analytics Insights Dashboard
5. ✅ Implement Demand Forecast
6. ✅ Add Inventory Predictions

### Phase 3: Polish (Week 3)
7. Add loading states and error handling
8. Implement caching strategies
9. Add user feedback mechanisms
10. Performance optimization

### Phase 4: Advanced Features (Optional)
11. Add voice input to chatbot
12. Implement real-time notifications
13. Add export functionality for reports
14. Create mobile-responsive views

---

## API Endpoints Quick Reference

### Chatbot
```
POST   /api/v1/ai/chat
POST   /api/v1/ai/chat/menu-help
POST   /api/v1/ai/chat/order-help
GET    /api/v1/ai/chat/suggestions
```

### Recommendations
```
GET    /api/v1/ai/recommendations
POST   /api/v1/ai/recommendations/regenerate
POST   /api/v1/ai/preferences
```

### Predictions
```
GET    /api/v1/ai/predictions/inventory
GET    /api/v1/ai/predictions/inventory/:itemId
GET    /api/v1/ai/predictions/low-stock-alerts
```

### Forecasting
```
GET    /api/v1/ai/forecast/demand
GET    /api/v1/ai/forecast/staffing
GET    /api/v1/ai/forecast/item/:itemId
```

### Analytics
```
POST   /api/v1/ai/insights/generate
GET    /api/v1/ai/insights/:type
GET    /api/v1/ai/analytics/revenue
GET    /api/v1/ai/analytics/performance
```

---

## Support & Resources

- **Backend Documentation**: `/backend/PLATINUM_BACKEND_IMPLEMENTATION.md`
- **API Documentation**: `/docs/PLATINUM_API_DOCUMENTATION.md`
- **Implementation Plan**: `/docs/PLATINUM_IMPLEMENTATION_PLAN.md`

---

## Summary

This guide provides everything needed to integrate the Platinum tier AI features into your frontend:

✅ **All backend endpoints are ready and tested**  
✅ **Step-by-step integration instructions provided**  
✅ **Code examples for each feature**  
✅ **Testing checklist included**  
✅ **Troubleshooting guide available**

**Estimated Total Integration Time**: 8-12 hours  
**Recommended Approach**: Start with chatbot (30 min), then add features incrementally

**Questions?** Refer to the API documentation or test endpoints directly using curl/Postman.

---

**Last Updated**: July 30, 2026  
**Status**: Ready for Integration  
**Backend Completion**: 100%
