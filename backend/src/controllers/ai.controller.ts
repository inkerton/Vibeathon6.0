import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import aiService from '../services/ai.service';

export class AIController {
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // This will be handled by recommendation.service.ts
      return res.status(501).json({ 
        error: 'Recommendations feature not yet implemented',
        message: 'This endpoint will be available after recommendation service is implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  async getPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = req.params.type as string; // 'inventory' or 'demand'
      
      if (!['inventory', 'demand'].includes(type)) {
        return res.status(400).json({ error: 'Invalid prediction type. Use "inventory" or "demand"' });
      }
      
      // This will be handled by prediction.service.ts and forecast.service.ts
      return res.status(501).json({ 
        error: 'Predictions feature not yet implemented',
        message: 'This endpoint will be available after prediction/forecast services are implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  async chatWithAI(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // This will be handled by chatbot.service.ts
      return res.status(501).json({ 
        error: 'Chatbot feature not yet implemented',
        message: 'This endpoint will be available after chatbot service is implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params; // 'revenue', 'performance', 'efficiency', 'trend', 'all'
      
      // This will be handled by analytics.service.ts
      return res.status(501).json({ 
        error: 'Insights feature not yet implemented',
        message: 'This endpoint will be available after analytics service is implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  async testAIConnection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          error: 'AI service not configured',
          message: 'GEMINI_API_KEY environment variable is not set'
        });
      }

      const testPrompt = 'Say "Hello, AI is working!" in a friendly way.';
      const response = await aiService.generateText(testPrompt, false);
      
      res.json({ 
        status: 'success',
        message: 'AI service is working correctly',
        response 
      });
    } catch (error) {
      next(error);
    }
  }

  async clearAICache(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      aiService.clearCache();
      res.json({ message: 'AI cache cleared successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getAICacheStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = aiService.getCacheStats();
      res.json({ stats });
    } catch (error) {
      next(error);
    }
  }
}