import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import analyticsService from '../services/analytics.service';

export class AnalyticsController {
  async generateInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.body;
      const insights = await analyticsService.generateInsights(type);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }

  async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const insights = await analyticsService.getInsights(type);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await analyticsService.getRevenueAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await analyticsService.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
}