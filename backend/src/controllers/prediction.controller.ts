import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import predictionService from '../services/prediction.service';

export class PredictionController {
  async getInventoryPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const predictions = await predictionService.getInventoryPredictions(
        days ? parseInt(days as string) : 7
      );
      res.json(predictions);
    } catch (error) {
      next(error);
    }
  }

  async getItemPrediction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const { days } = req.query;
      
      const prediction = await predictionService.getItemPrediction(
        itemId,
        days ? parseInt(days as string) : 7
      );
      
      res.json(prediction);
    } catch (error) {
      next(error);
    }
  }

  async getLowStockAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { threshold } = req.query;
      const alerts = await predictionService.getLowStockAlerts(
        threshold ? parseInt(threshold as string) : 10
      );
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async getItemPredictionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const { days } = req.query;
      
      const history = await predictionService.getItemPredictionHistory(
        itemId,
        days ? parseInt(days as string) : 30
      );
      
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}