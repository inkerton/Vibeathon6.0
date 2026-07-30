import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import forecastService from '../services/forecast.service';

export class ForecastController {
  async getDemandForecast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { daysAhead } = req.query;
      const forecast = await forecastService.getDemandForecast(
        daysAhead ? parseInt(daysAhead as string) : 7
      );
      res.json({ data: forecast });
    } catch (error) {
      next(error);
    }
  }

  async getStaffingRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      
      const { date } = req.query;
      console.log({date});
      const recommendations = await forecastService.getStaffingRecommendations(
        date ? new Date(date as string) : new Date()
      );
      res.json({ data: { recommendations } });
    } catch (error) {
      next(error);
    }
  }

  async getRecentForecasts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const forecasts = await forecastService.getRecentForecasts(
        limit ? parseInt(limit as string) : 10
      );
      res.json({ data: { forecasts } });
    } catch (error) {
      next(error);
    }
  }

  async getItemForecast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const { daysAhead } = req.query;
      
      const forecast = await forecastService.getItemForecast(
        itemId,
        daysAhead ? parseInt(daysAhead as string) : 7
      );
      
      res.json({ data: forecast });
    } catch (error) {
      next(error);
    }
  }
}