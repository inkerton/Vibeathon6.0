import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import recommendationService from '../services/recommendation.service';

export class RecommendationController {
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const recommendations = await recommendationService.generateRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { preferences } = req.body;
      
      const updated = await recommendationService.updateUserPreferences(userId, preferences);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async trackPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const tracked = await recommendationService.trackUserPreferences(userId);
      res.json(tracked);
    } catch (error) {
      next(error);
    }
  }

  async regenerateRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const recommendations = await recommendationService.generateRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
}