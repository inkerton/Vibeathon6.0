# Platinum Tier API Documentation

## Overview

This document provides comprehensive API documentation for the Platinum tier AI/ML features implemented in the backend. These features include personalized recommendations, inventory predictions, demand forecasting, analytics insights, and an AI-powered chatbot.

**Version**: 1.0.0  
**Base URL**: `http://localhost:5000/api/v1`  
**Last Updated**: July 30, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Response Formats](#common-response-formats)
3. [Error Handling](#error-handling)
4. [AI Infrastructure](#ai-infrastructure)
5. [Personalized Recommendations](#personalized-recommendations)
6. [Inventory Predictions](#inventory-predictions)
7. [Demand Forecasting](#demand-forecasting)
8. [Analytics & Insights](#analytics--insights)
9. [AI Chatbot](#ai-chatbot)
10. [Rate Limiting](#rate-limiting)
11. [Best Practices](#best-practices)

---

## Authentication

All Platinum tier endpoints require authentication using JWT tokens.

### Headers Required

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Getting a Token

Use the existing authentication endpoints:

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "CUSTOMER"
  }
}
```

---

## Common Response Formats

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional error details
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing or invalid |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required permissions |
| `AI_SERVICE_ERROR` | AI service temporarily unavailable |
| `INVALID_INPUT` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## AI Infrastructure

### Test AI Connection

Test if the AI service is properly configured and working.

**Endpoint:** `GET /ai/test`  
**Authentication:** Required  
**Roles:** All

**Response:**
```json
{
  "status": "success",
  "message": "AI service is working correctly",
  "response": "Hello, AI is working!",
  "model": "gemini-1.5-pro"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/test
```

---

### Clear AI Cache

Clear the AI response cache.

**Endpoint:** `POST /ai/cache/clear`  
**Authentication:** Required  
**Roles:** Admin

**Response:**
```json
{
  "status": "success",
  "message": "Cache cleared successfully"
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/cache/clear
```

---

### Get Cache Statistics

Get statistics about the AI cache.

**Endpoint:** `GET /ai/cache/stats`  
**Authentication:** Required  
**Roles:** Admin

**Response:**
```json
{
  "status": "success",
  "data": {
    "keys": 15,
    "hits": 234,
    "misses": 45,
    "ksize": 1024,
    "vsize": 51200
  }
}
```

---

## Personalized Recommendations

### Get Recommendations

Get personalized menu item recommendations for the authenticated user.

**Endpoint:** `GET /ai/recommendations`  
**Authentication:** Required  
**Roles:** Customer

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 5 | Number of recommendations to return (1-20) |
| `category` | string | No | - | Filter by menu category |

**Response:**
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
          "description": "Classic Italian pizza",
          "price": 12.99,
          "category": "MAIN_COURSE",
          "imageUrl": "/images/pizza.jpg",
          "isAvailable": true
        },
        "score": 0.95,
        "reason": "Based on your love for Italian cuisine and previous orders",
        "confidence": "HIGH"
      }
    ],
    "basedOn": {
      "orderHistory": 15,
      "preferences": ["Italian", "Vegetarian"],
      "lastUpdated": "2026-07-30T10:30:00Z"
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/recommendations?limit=5&category=MAIN_COURSE"
```

---

### Regenerate Recommendations

Force regeneration of recommendations for the authenticated user.

**Endpoint:** `POST /ai/recommendations/regenerate`  
**Authentication:** Required  
**Roles:** Customer

**Response:**
```json
{
  "status": "success",
  "message": "Recommendations regenerated successfully",
  "data": {
    "count": 5,
    "generatedAt": "2026-07-30T10:35:00Z"
  }
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/recommendations/regenerate
```

---

### Update User Preferences

Update user preferences for better recommendations.

**Endpoint:** `POST /ai/preferences`  
**Authentication:** Required  
**Roles:** Customer

**Request Body:**
```json
{
  "dietaryRestrictions": ["VEGETARIAN", "GLUTEN_FREE"],
  "favoriteCategories": ["ITALIAN", "ASIAN"],
  "dislikedIngredients": ["mushrooms", "olives"],
  "spiceLevel": "MEDIUM",
  "priceRange": {
    "min": 10,
    "max": 30
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Preferences updated successfully",
  "data": {
    "id": "pref-789",
    "userId": "user-123",
    "updatedAt": "2026-07-30T10:40:00Z"
  }
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dietaryRestrictions":["VEGETARIAN"],"spiceLevel":"MEDIUM"}' \
  http://localhost:5000/api/v1/ai/preferences
```

---

### Track Preference from Order

Automatically track user preferences based on an order.

**Endpoint:** `POST /ai/preferences/track`  
**Authentication:** Required  
**Roles:** Customer

**Request Body:**
```json
{
  "orderId": "order-123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Preferences tracked successfully",
  "data": {
    "itemsAnalyzed": 3,
    "preferencesUpdated": true
  }
}
```

---

## Inventory Predictions

### Get All Inventory Predictions

Get usage predictions for all inventory items.

**Endpoint:** `GET /ai/predictions/inventory`  
**Authentication:** Required  
**Roles:** Admin, Inventory Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `daysAhead` | number | No | 7 | Number of days to predict (1-30) |
| `category` | string | No | - | Filter by item category |

**Response:**
```json
{
  "status": "success",
  "data": {
    "predictions": [
      {
        "id": "pred-123",
        "inventoryItem": {
          "id": "item-456",
          "name": "Tomatoes",
          "currentQuantity": 50,
          "unit": "kg",
          "category": "VEGETABLES"
        },
        "predictedUsage": 35.5,
        "confidence": 0.87,
        "restockRecommendation": {
          "shouldRestock": true,
          "recommendedQuantity": 40,
          "recommendedDate": "2026-08-02",
          "urgency": "MEDIUM"
        },
        "historicalData": {
          "avgDailyUsage": 5.2,
          "trend": "STABLE",
          "seasonalFactor": 1.1
        },
        "generatedAt": "2026-07-30T10:00:00Z"
      }
    ],
    "summary": {
      "totalItems": 45,
      "itemsNeedingRestock": 12,
      "highUrgency": 3,
      "mediumUrgency": 6,
      "lowUrgency": 3
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/predictions/inventory?daysAhead=7"
```

---

### Get Item-Specific Prediction

Get detailed prediction for a specific inventory item.

**Endpoint:** `GET /ai/predictions/inventory/:itemId`  
**Authentication:** Required  
**Roles:** Admin, Inventory Manager

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | Inventory item ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `daysAhead` | number | No | 7 | Number of days to predict |

**Response:**
```json
{
  "status": "success",
  "data": {
    "prediction": {
      "id": "pred-123",
      "inventoryItem": {
        "id": "item-456",
        "name": "Tomatoes",
        "currentQuantity": 50,
        "unit": "kg"
      },
      "dailyPredictions": [
        {
          "date": "2026-07-31",
          "predictedUsage": 5.5,
          "confidence": 0.89
        },
        {
          "date": "2026-08-01",
          "predictedUsage": 6.2,
          "confidence": 0.85
        }
      ],
      "totalPredictedUsage": 35.5,
      "restockRecommendation": {
        "shouldRestock": true,
        "recommendedQuantity": 40,
        "recommendedDate": "2026-08-02"
      }
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/predictions/inventory/item-456?daysAhead=7
```

---

### Get Prediction History

Get historical predictions for an inventory item.

**Endpoint:** `GET /ai/predictions/inventory/:itemId/history`  
**Authentication:** Required  
**Roles:** Admin, Inventory Manager

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | Inventory item ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Number of historical records |

**Response:**
```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": "pred-123",
        "predictedUsage": 35.5,
        "actualUsage": 33.2,
        "accuracy": 0.93,
        "generatedAt": "2026-07-23T10:00:00Z",
        "periodStart": "2026-07-23",
        "periodEnd": "2026-07-30"
      }
    ],
    "accuracy": {
      "overall": 0.89,
      "last7Days": 0.92,
      "last30Days": 0.87
    }
  }
}
```

---

### Get Low Stock Alerts

Get alerts for items that are predicted to run low.

**Endpoint:** `GET /ai/predictions/low-stock-alerts`  
**Authentication:** Required  
**Roles:** Admin, Inventory Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `severity` | string | No | - | Filter by severity (HIGH, MEDIUM, LOW) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "alert-123",
        "inventoryItem": {
          "id": "item-456",
          "name": "Tomatoes",
          "currentQuantity": 15,
          "unit": "kg"
        },
        "severity": "HIGH",
        "estimatedStockoutDate": "2026-08-01",
        "daysUntilStockout": 2,
        "recommendedAction": "Order 40kg immediately",
        "predictedDailyUsage": 7.5,
        "generatedAt": "2026-07-30T10:00:00Z"
      }
    ],
    "summary": {
      "totalAlerts": 8,
      "highSeverity": 2,
      "mediumSeverity": 4,
      "lowSeverity": 2
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/predictions/low-stock-alerts?severity=HIGH"
```

---

## Demand Forecasting

### Get Demand Forecast

Get demand forecast for upcoming days.

**Endpoint:** `GET /ai/forecast/demand`  
**Authentication:** Required  
**Roles:** Admin, Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `daysAhead` | number | No | 7 | Number of days to forecast (1-30) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "forecast": {
      "id": "forecast-123",
      "dailyForecasts": [
        {
          "date": "2026-07-31",
          "predictedOrders": 85,
          "confidence": 0.88,
          "peakHours": [
            {
              "hour": 12,
              "expectedOrders": 25,
              "description": "Lunch rush"
            },
            {
              "hour": 19,
              "expectedOrders": 35,
              "description": "Dinner peak"
            }
          ],
          "dayType": "WEEKDAY",
          "specialEvents": []
        }
      ],
      "summary": {
        "totalPredictedOrders": 595,
        "avgDailyOrders": 85,
        "peakDay": {
          "date": "2026-08-02",
          "expectedOrders": 120,
          "reason": "Saturday dinner service"
        },
        "lowDay": {
          "date": "2026-08-04",
          "expectedOrders": 65,
          "reason": "Monday typically slower"
        }
      },
      "generatedAt": "2026-07-30T10:00:00Z"
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/forecast/demand?daysAhead=7"
```

---

### Get Recent Forecasts

Get recently generated forecasts.

**Endpoint:** `GET /ai/forecast/recent`  
**Authentication:** Required  
**Roles:** Admin, Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 5 | Number of forecasts to return |

**Response:**
```json
{
  "status": "success",
  "data": {
    "forecasts": [
      {
        "id": "forecast-123",
        "periodStart": "2026-07-30",
        "periodEnd": "2026-08-06",
        "totalPredictedOrders": 595,
        "accuracy": 0.91,
        "generatedAt": "2026-07-30T10:00:00Z"
      }
    ]
  }
}
```

---

### Get Staffing Recommendations

Get AI-powered staffing recommendations based on demand forecast.

**Endpoint:** `GET /ai/forecast/staffing`  
**Authentication:** Required  
**Roles:** Admin, Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | No | today | Date for staffing (YYYY-MM-DD) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "recommendations": {
      "date": "2026-07-31",
      "predictedOrders": 85,
      "staffingNeeds": {
        "kitchen": {
          "chefs": 3,
          "assistants": 2,
          "reasoning": "Expected 85 orders with lunch and dinner peaks"
        },
        "service": {
          "waiters": 4,
          "hosts": 1,
          "reasoning": "High dinner service volume expected"
        },
        "delivery": {
          "drivers": 2,
          "reasoning": "Moderate delivery demand expected"
        }
      },
      "peakHours": [
        {
          "hour": 12,
          "additionalStaff": 1,
          "role": "kitchen_assistant"
        },
        {
          "hour": 19,
          "additionalStaff": 2,
          "role": "waiter"
        }
      ],
      "totalStaffRecommended": 12,
      "confidence": 0.86
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/forecast/staffing?date=2026-07-31"
```

---

### Get Item Forecast

Get demand forecast for a specific menu item.

**Endpoint:** `GET /ai/forecast/item/:itemId`  
**Authentication:** Required  
**Roles:** Admin, Manager, Kitchen

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | Menu item ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `daysAhead` | number | No | 7 | Number of days to forecast |

**Response:**
```json
{
  "status": "success",
  "data": {
    "forecast": {
      "menuItem": {
        "id": "item-789",
        "name": "Margherita Pizza",
        "category": "MAIN_COURSE"
      },
      "dailyForecasts": [
        {
          "date": "2026-07-31",
          "predictedOrders": 15,
          "confidence": 0.84
        }
      ],
      "totalPredictedOrders": 105,
      "avgDailyOrders": 15,
      "trend": "INCREASING",
      "seasonalFactor": 1.2,
      "recommendations": [
        "Ensure sufficient ingredients for 120 pizzas (15% buffer)",
        "Peak demand expected on Saturday evening"
      ]
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/forecast/item/item-789?daysAhead=7
```

---

## Analytics & Insights

### Generate Insights

Generate AI-powered business insights.

**Endpoint:** `POST /ai/insights/generate`  
**Authentication:** Required  
**Roles:** Admin

**Request Body:**
```json
{
  "types": ["REVENUE", "OPERATIONAL", "CUSTOMER"],
  "period": {
    "start": "2026-07-01",
    "end": "2026-07-30"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Insights generated successfully",
  "data": {
    "insights": [
      {
        "id": "insight-123",
        "type": "REVENUE",
        "title": "Weekend Revenue Opportunity",
        "description": "Weekend revenue is 40% higher than weekdays, but Saturday dinner service is underutilized",
        "priority": "HIGH",
        "impact": "POSITIVE",
        "recommendations": [
          "Introduce Saturday dinner specials",
          "Extend Saturday hours by 1 hour",
          "Increase marketing for weekend dining"
        ],
        "metrics": {
          "potentialRevenue": 5000,
          "confidence": 0.89
        },
        "generatedAt": "2026-07-30T10:00:00Z"
      }
    ],
    "summary": {
      "totalInsights": 8,
      "highPriority": 3,
      "mediumPriority": 4,
      "lowPriority": 1
    }
  }
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"types":["REVENUE","OPERATIONAL"]}' \
  http://localhost:5000/api/v1/ai/insights/generate
```

---

### Get Insights by Type

Get insights filtered by type.

**Endpoint:** `GET /ai/insights/:type`  
**Authentication:** Required  
**Roles:** Admin

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Insight type (REVENUE, OPERATIONAL, CUSTOMER, INVENTORY) |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `priority` | string | No | - | Filter by priority (HIGH, MEDIUM, LOW) |
| `limit` | number | No | 10 | Number of insights to return |

**Response:**
```json
{
  "status": "success",
  "data": {
    "insights": [
      {
        "id": "insight-123",
        "type": "REVENUE",
        "title": "Weekend Revenue Opportunity",
        "description": "Weekend revenue is 40% higher than weekdays",
        "priority": "HIGH",
        "impact": "POSITIVE",
        "recommendations": [
          "Introduce Saturday dinner specials"
        ],
        "generatedAt": "2026-07-30T10:00:00Z"
      }
    ]
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/insights/REVENUE?priority=HIGH"
```

---

### Get Revenue Analytics

Get detailed revenue analytics with AI insights.

**Endpoint:** `GET /ai/analytics/revenue`  
**Authentication:** Required  
**Roles:** Admin

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | No | 30 days ago | Start date (YYYY-MM-DD) |
| `endDate` | string | No | today | End date (YYYY-MM-DD) |
| `groupBy` | string | No | day | Group by (day, week, month) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "period": {
        "start": "2026-07-01",
        "end": "2026-07-30"
      },
      "totalRevenue": 45000,
      "avgDailyRevenue": 1500,
      "trend": "INCREASING",
      "growthRate": 0.15,
      "breakdown": {
        "byCategory": [
          {
            "category": "MAIN_COURSE",
            "revenue": 25000,
            "percentage": 55.6
          }
        ],
        "byDayOfWeek": [
          {
            "day": "Saturday",
            "revenue": 8500,
            "percentage": 18.9
          }
        ],
        "byHour": [
          {
            "hour": 19,
            "revenue": 12000,
            "percentage": 26.7
          }
        ]
      },
      "insights": [
        "Revenue increased by 15% compared to previous period",
        "Saturday generates 40% more revenue than average weekday",
        "Dinner service (6-9 PM) accounts for 45% of daily revenue"
      ]
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/analytics/revenue?startDate=2026-07-01&endDate=2026-07-30"
```

---

### Get Performance Metrics

Get operational performance metrics with AI analysis.

**Endpoint:** `GET /ai/analytics/performance`  
**Authentication:** Required  
**Roles:** Admin, Manager

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | No | 30 days ago | Start date (YYYY-MM-DD) |
| `endDate` | string | No | today | End date (YYYY-MM-DD) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "metrics": {
      "period": {
        "start": "2026-07-01",
        "end": "2026-07-30"
      },
      "orderMetrics": {
        "totalOrders": 850,
        "avgOrderValue": 52.94,
        "completionRate": 0.96,
        "avgPreparationTime": 18.5,
        "onTimeDeliveryRate": 0.92
      },
      "customerMetrics": {
        "totalCustomers": 450,
        "newCustomers": 120,
        "returningCustomers": 330,
        "retentionRate": 0.73,
        "avgOrdersPerCustomer": 1.89
      },
      "efficiencyMetrics": {
        "tableUtilization": 0.78,
        "staffProductivity": 0.85,
        "inventoryTurnover": 12.5,
        "wastePercentage": 0.03
      },
      "insights": [
        "Order completion rate improved by 3% this month",
        "Average preparation time decreased by 2 minutes",
        "Customer retention rate is above industry average"
      ],
      "recommendations": [
        "Focus on reducing preparation time during peak hours",
        "Implement loyalty program to improve retention",
        "Optimize table turnover during lunch service"
      ]
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/v1/ai/analytics/performance?startDate=2026-07-01"
```

---

## AI Chatbot

### Chat with AI

Send a message to the AI chatbot and get a response.

**Endpoint:** `POST /ai/chat`  
**Authentication:** Required  
**Roles:** All

**Request Body:**
```json
{
  "message": "What do you recommend for dinner tonight?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I'm vegetarian"
    },
    {
      "role": "assistant",
      "content": "Great! We have many vegetarian options."
    }
  ],
  "context": {
    "currentPage": "menu",
    "userPreferences": {
      "dietary": ["VEGETARIAN"]
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": "Based on your vegetarian preference, I'd recommend our Vegetable Lasagna or Mushroom Risotto for dinner. Both are customer favorites and perfect for tonight!",
    "intent": "MENU_INQUIRY",
    "confidence": 0.92,
    "suggestedActions": [
      {
        "type": "VIEW_ITEM",
        "label": "View Vegetable Lasagna",
        "data": {
          "itemId": "item-123"
        }
      },
      {
        "type": "VIEW_ITEM",
        "label": "View Mushroom Risotto",
        "data": {
          "itemId": "item-456"
        }
      }
    ],
    "relatedItems": [
      {
        "id": "item-123",
        "name": "Vegetable Lasagna",
        "price": 14.99
      }
    ]
  }
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"What do you recommend?"}' \
  http://localhost:5000/api/v1/ai/chat
```

---

### Detect Intent

Detect the intent of a user message.

**Endpoint:** `POST /ai/chat/intent`  
**Authentication:** Required  
**Roles:** All

**Request Body:**
```json
{
  "message": "Where is my order?"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "intent": "ORDER_TRACKING",
    "confidence": 0.95,
    "entities": {
      "orderReference": null
    },
    "suggestedResponse": "I can help you track your order. Could you provide your order number?"
  }
}
```

---

### Get Menu Help

Get AI assistance for menu-related questions.

**Endpoint:** `POST /ai/chat/menu-help`  
**Authentication:** Required  
**Roles:** Customer

**Request Body:**
```json
{
  "question": "What's good for someone who likes spicy food?",
  "preferences": {
    "dietary": ["NONE"],
    "spiceLevel": "HIGH"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": "For spicy food lovers, I recommend our Spicy Thai Curry or Jalapeño Burger. Both pack a flavorful punch!",
    "recommendations": [
      {
        "id": "item-789",
        "name": "Spicy Thai Curry",
        "spiceLevel": "HIGH",
        "price": 16.99,
        "reason": "Authentic Thai spices with customizable heat level"
      }
    ]
  }
}
```

---

### Get Order Help

Get AI assistance for order-related questions.

**Endpoint:** `POST /ai/chat/order-help`  
**Authentication:** Required  
**Roles:** Customer

**Request Body:**
```json
{
  "question": "How long will my order take?",
  "orderId": "order-123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": "Your order is currently being prepared in the kitchen. Estimated completion time is 15 minutes.",
    "orderStatus": {
      "id": "order-123",
      "status": "PREPARING",
      "estimatedTime": 15,
      "currentStep": "In Kitchen"
    }
  }
}
```

---

### Get Reservation Help

Get AI assistance for reservation-related questions.

**Endpoint:** `POST /ai/chat/reservation-help`  
**Authentication:** Required  
**Roles:** Customer

**Request Body:**
```json
{
  "question": "Can I book a table for 6 people on Saturday?",
  "preferences": {
    "partySize": 6,
    "date": "2026-08-03",
    "time": "19:00"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": "Yes! We have availability for 6 people on Saturday at 7 PM. Would you like me to help you make a reservation?",
    "availability": {
      "hasAvailability": true,
      "suggestedTimes": ["18:30", "19:00", "19:30"],
      "alternativeDates": []
    },
    "suggestedAction": {
      "type": "CREATE_RESERVATION",
      "label": "Book Now"
    }
  }
}
```

---

### Get Suggested Questions

Get role-specific suggested questions for the chatbot.

**Endpoint:** `GET /ai/chat/suggestions`  
**Authentication:** Required  
**Roles:** All

**Response:**
```json
{
  "status": "success",
  "data": {
    "suggestions": [
      {
        "category": "Menu",
        "questions": [
          "What are today's specials?",
          "Do you have vegetarian options?",
          "What's your most popular dish?"
        ]
      },
      {
        "category": "Orders",
        "questions": [
          "Where is my order?",
          "Can I modify my order?",
          "What's the estimated delivery time?"
        ]
      },
      {
        "category": "Reservations",
        "questions": [
          "Can I book a table?",
          "What are your operating hours?",
          "Do you have outdoor seating?"
        ]
      }
    ],
    "roleSpecific": {
      "role": "CUSTOMER",
      "topQuestions": [
        "What do you recommend?",
        "Where is my order?",
        "Can I book a table?"
      ]
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/ai/chat/suggestions
```

---

## Rate Limiting

To prevent abuse and ensure fair usage, rate limiting is applied to AI endpoints:

| Endpoint Category | Rate Limit | Window |
|------------------|------------|--------|
| Chat endpoints | 30 requests | 1 minute |
| Recommendations | 10 requests | 1 minute |
| Predictions | 20 requests | 1 minute |
| Forecasts | 20 requests | 1 minute |
| Analytics | 10 requests | 1 minute |
| Cache operations | 5 requests | 1 minute |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1722340800
```

**Rate Limit Exceeded Response:**

```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 30,
    "window": "1 minute",
    "retryAfter": 45
  }
}
```

---

## Best Practices

### 1. Caching

- AI responses are cached for 1 hour
- Use cache-friendly query parameters
- Avoid unnecessary regeneration requests

### 2. Error Handling

Always implement proper error handling:

```javascript
try {
  const response = await fetch('/api/v1/ai/recommendations', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Handle specific error codes
    if (error.code === 'AI_SERVICE_ERROR') {
      // Show fallback UI or retry
    }
  }
  
  const data = await response.json();
  // Process data
} catch (error) {
  // Handle network errors
}
```

### 3. Conversation History

For chatbot, maintain conversation history on the client side:

```javascript
const conversationHistory = [];

async function sendMessage(message) {
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      conversationHistory: conversationHistory.slice(-10) // Last 10 messages
    })
  });
  
  const data = await response.json();
  conversationHistory.push({
    role: 'assistant',
    content: data.data.response
  });
  
  return data;
}
```

### 4. Polling vs WebSockets

For real-time updates:

- **Predictions/Forecasts**: Poll every 5-10 minutes
- **Order Status**: Use WebSocket connection
- **Chat**: Real-time via WebSocket (if available) or polling

### 5. Optimistic UI Updates

For better UX, update UI optimistically:

```javascript
// Update UI immediately
updateUIWithRecommendations(optimisticData);

// Then fetch actual data
const actualData = await fetchRecommendations();
updateUIWithRecommendations(actualData);
```

### 6. Fallback Strategies

Always provide fallback UI when AI features fail:

```javascript
async function getRecommendations() {
  try {
    return await fetchAIRecommendations();
  } catch (error) {
    // Fallback to popular items
    return await fetchPopularItems();
  }
}
```

### 7. Progressive Enhancement

Load AI features progressively:

1. Show basic UI immediately
2. Load AI features in background
3. Enhance UI when AI data is ready
4. Provide manual alternatives

---

## Integration Examples

### React/Next.js Example

```typescript
// hooks/useRecommendations.ts
import { useState, useEffect } from 'react';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/v1/ai/recommendations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setRecommendations(data.data.recommendations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  return { recommendations, loading, error };
}

// components/RecommendationsWidget.tsx
export function RecommendationsWidget() {
  const { recommendations, loading, error } = useRecommendations();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="recommendations">
      <h2>Recommended for You</h2>
      {recommendations.map(rec => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}
```

### Chatbot Integration

```typescript
// components/AIChatbot.tsx
import { useState } from 'react';

export function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.slice(-10)
        })
      });

      const data = await response.json();
      const aiMessage = {
        role: 'assistant',
        content: data.data.response
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <LoadingIndicator />}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        placeholder="Ask me anything..."
      />
    </div>
  );
}
```

---

## Testing

### Test Checklist

- [ ] Test AI connectivity (`/ai/test`)
- [ ] Test recommendations for existing users
- [ ] Test recommendations for new users
- [ ] Test inventory predictions
- [ ] Test low stock alerts
- [ ] Test demand forecasting
- [ ] Test staffing recommendations
- [ ] Test analytics insights
- [ ] Test chatbot conversations
- [ ] Test intent detection
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Test with invalid tokens
- [ ] Test with missing permissions

### Sample Test Requests

See the [Testing Guide](./TESTING_GUIDE.md) for comprehensive test scenarios and expected responses.

---

## Support & Resources

- **Backend Repository**: `/backend`
- **Implementation Details**: `PLATINUM_BACKEND_IMPLEMENTATION.md`
- **Database Schema**: `prisma/schema.prisma`
- **Environment Setup**: `.env.example`

For issues or questions:
1. Check error response codes and messages
2. Verify authentication token is valid
3. Ensure Gemini API key is configured
4. Check rate limiting headers
5. Review server logs for detailed errors

---

## Changelog

### Version 1.0.0 (July 30, 2026)
- Initial release
- All Platinum tier features documented
- Complete API reference
- Integration examples
- Best practices guide

---

**Last Updated**: July 30, 2026  
**API Version**: 1.0.0  
**Status**: Production Ready
