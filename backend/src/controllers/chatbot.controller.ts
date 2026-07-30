import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import chatbotService from '../services/chatbot.service';

export class ChatbotController {
  async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, context } = req.body;
      const userId = req.user!.id;
      const role = req.user!.role;
      
      const response = await chatbotService.chat(message, userId, role, context);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async handleIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { intent, data } = req.body;
      const userId = req.user!.id;
      
      const response = await chatbotService.handleIntent(intent, data, userId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMenuHelp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const help = await chatbotService.getMenuHelp(query);
      res.json(help);
    } catch (error) {
      next(error);
    }
  }

  async getOrderHelp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      const userId = req.user!.id;
      
      const help = await chatbotService.getOrderHelp(orderId, userId);
      res.json(help);
    } catch (error) {
      next(error);
    }
  }

  async getReservationHelp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const help = await chatbotService.getReservationHelp(query);
      res.json(help);
    } catch (error) {
      next(error);
    }
  }

  async getSuggestedQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = req.user!.role;
      const suggestions = await chatbotService.getSuggestedQuestions(role);
      res.json({ suggestions });
    } catch (error) {
      next(error);
    }
  }
}