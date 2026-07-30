import express from 'express';
import { AIController } from '../controllers/ai.controller';
import { RecommendationController } from '../controllers/recommendation.controller';
import { PredictionController } from '../controllers/prediction.controller';
import { ForecastController } from '../controllers/forecast.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';

const router = express.Router();
const aiController = new AIController();
const recommendationController = new RecommendationController();
const predictionController = new PredictionController();
const forecastController = new ForecastController();
const analyticsController = new AnalyticsController();
const chatbotController = new ChatbotController();

// Test endpoint (no auth required for testing)
router.get('/test', authHandler(aiController.testAIConnection.bind(aiController)));

// Cache management (admin only - will add role check later)
router.post('/cache/clear', authMiddleware, authHandler(aiController.clearAICache.bind(aiController)));
router.get('/cache/stats', authMiddleware, authHandler(aiController.getAICacheStats.bind(aiController)));

// Recommendations (customer)
router.get('/recommendations', authMiddleware, authHandler(recommendationController.getRecommendations.bind(recommendationController)));
router.post('/recommendations/regenerate', authMiddleware, authHandler(recommendationController.regenerateRecommendations.bind(recommendationController)));
router.post('/preferences', authMiddleware, authHandler(recommendationController.updatePreferences.bind(recommendationController)));
router.post('/preferences/track', authMiddleware, authHandler(recommendationController.trackPreferences.bind(recommendationController)));

// Predictions (admin/inventory staff)
router.get('/predictions/inventory', authMiddleware, authHandler(predictionController.getInventoryPredictions.bind(predictionController)));
router.get('/predictions/inventory/:itemId', authMiddleware, authHandler(predictionController.getItemPrediction.bind(predictionController)));
router.get('/predictions/inventory/:itemId/history', authMiddleware, authHandler(predictionController.getItemPredictionHistory.bind(predictionController)));
router.get('/predictions/low-stock-alerts', authMiddleware, authHandler(predictionController.getLowStockAlerts.bind(predictionController)));

// Demand Forecasting (admin)
router.get('/forecast/demand', authMiddleware, authHandler(forecastController.getDemandForecast.bind(forecastController)));
router.get('/forecast/recent', authMiddleware, authHandler(forecastController.getRecentForecasts.bind(forecastController)));
router.get('/forecast/staffing', authMiddleware, authHandler(forecastController.getStaffingRecommendations.bind(forecastController)));
router.get('/forecast/item/:itemId', authMiddleware, authHandler(forecastController.getItemForecast.bind(forecastController)));

// Chatbot (all authenticated users)
router.post('/chat', authMiddleware, authHandler(chatbotController.chat.bind(chatbotController)));
router.post('/chat/intent', authMiddleware, authHandler(chatbotController.handleIntent.bind(chatbotController)));
router.post('/chat/menu-help', authMiddleware, authHandler(chatbotController.getMenuHelp.bind(chatbotController)));
router.post('/chat/order-help', authMiddleware, authHandler(chatbotController.getOrderHelp.bind(chatbotController)));
router.post('/chat/reservation-help', authMiddleware, authHandler(chatbotController.getReservationHelp.bind(chatbotController)));
router.get('/chat/suggestions', authMiddleware, authHandler(chatbotController.getSuggestedQuestions.bind(chatbotController)));

// Analytics insights (admin)
router.get('/insights/:type', authMiddleware, authHandler(analyticsController.getInsights.bind(analyticsController)));
router.post('/insights/generate', authMiddleware, authHandler(analyticsController.generateInsights.bind(analyticsController)));
router.get('/analytics/revenue', authMiddleware, authHandler(analyticsController.getRevenueAnalytics.bind(analyticsController)));
router.get('/analytics/performance', authMiddleware, authHandler(analyticsController.getPerformanceMetrics.bind(analyticsController)));

export default router;