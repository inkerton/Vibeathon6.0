import { getRouteParam } from '../utils/route-helpers';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MenuService } from '../services/menu.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const menuService = new MenuService();

// Transformation helpers
function transformRequestToDB(data: any): any {
  const transformed: any = {};
  
  // Handle both camelCase and snake_case inputs
  if (data.name !== undefined) transformed.name = data.name;
  if (data.description !== undefined) transformed.description = data.description;
  if (data.price !== undefined) transformed.price = data.price;
  if (data.category !== undefined) transformed.category = data.category;
  
  // Handle image_url / imageUrl
  if (data.image_url !== undefined) transformed.image_url = data.image_url;
  if (data.imageUrl !== undefined) transformed.image_url = data.imageUrl;
  
  // Handle is_available / isAvailable
  if (data.is_available !== undefined) transformed.is_available = data.is_available;
  if (data.isAvailable !== undefined) transformed.is_available = data.isAvailable;
  
  // Handle preparation_time / preparationTime
  if (data.preparation_time !== undefined) transformed.preparation_time = data.preparation_time;
  if (data.preparationTime !== undefined) transformed.preparation_time = data.preparationTime;
  
  return transformed;
}

function transformResponseToClient(item: any): any {
  if (!item) return item;
  
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    imageUrl: item.image_url,
    isAvailable: item.is_available,
    preparationTime: item.preparation_time || 15,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function transformArrayResponseToClient(items: any[]): any[] {
  return items.map(transformResponseToClient);
}

// Validation schemas - now accept both formats
const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(2, 'Category is required'),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  preparation_time: z.number().int().positive().optional(),
  preparationTime: z.number().int().positive().optional(),
}).transform(transformRequestToDB);

const updateMenuItemSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(2).optional(),
  image_url: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  is_available: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  preparation_time: z.number().int().positive().optional(),
  preparationTime: z.number().int().positive().optional(),
}).transform(transformRequestToDB);

const toggleAvailabilitySchema = z.object({
  is_available: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
}).transform(transformRequestToDB);

export class MenuController {
  async getAllMenuItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const menuItems = await menuService.getAllMenuItems(includeUnavailable);
      
      res.status(200).json({
        status: 'success',
        data: transformArrayResponseToClient(menuItems),
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
        data: transformResponseToClient(menuItem),
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
        data: transformResponseToClient(menuItem),
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
        data: transformResponseToClient(menuItem),
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
      
      // Transform grouped data
      const transformed: Record<string, any[]> = {};
      for (const [category, items] of Object.entries(menuByCategory)) {
        transformed[category] = transformArrayResponseToClient(items as any[]);
      }
      
      res.status(200).json({
        status: 'success',
        data: transformed,
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
        isAvailable: validatedData.is_available,
      });
      
      res.status(200).json({
        status: 'success',
        data: transformResponseToClient(menuItem),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }
}
