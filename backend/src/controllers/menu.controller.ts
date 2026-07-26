import { getRouteParam } from '../utils/route-helpers';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MenuService } from '../services/menu.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const menuService = new MenuService();

// Validation schemas
const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(2, 'Category is required'),
  image_url: z.string().url('Invalid image URL').optional(),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(2).optional(),
  image_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
});

const toggleAvailabilitySchema = z.object({
  is_available: z.boolean(),
});

export class MenuController {
  async getAllMenuItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const menuItems = await menuService.getAllMenuItems(includeUnavailable);
      
      res.status(200).json({
        status: 'success',
        data: menuItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const menuItem = await menuService.getMenuItemById(id);
      
      res.status(200).json({
        status: 'success',
        data: menuItem,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMenuItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createMenuItemSchema.parse(req.body);
      const menuItem = await menuService.createMenuItem(validatedData);
      
      res.status(201).json({
        status: 'success',
        data: menuItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async updateMenuItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = updateMenuItemSchema.parse(req.body);
      const menuItem = await menuService.updateMenuItem(id, validatedData);
      
      res.status(200).json({
        status: 'success',
        data: menuItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async deleteMenuItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const result = await menuService.deleteMenuItem(id);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMenuByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuByCategory = await menuService.getMenuByCategory();
      
      res.status(200).json({
        status: 'success',
        data: menuByCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = toggleAvailabilitySchema.parse(req.body);
      const menuItem = await menuService.toggleAvailability(id, validatedData.is_available);
      
      // Broadcast availability change via Socket.io
      const io = req.app.get('io');
      io.to('restaurant:main').emit('menu:availability_changed', {
        menuItemId: id,
        is_available: validatedData.is_available,
      });
      
      res.status(200).json({
        status: 'success',
        data: menuItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }
}
