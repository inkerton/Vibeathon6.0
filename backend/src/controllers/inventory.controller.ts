import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { InventoryTransactionType } from '@prisma/client';
import { getRouteParam } from '../utils/route-helpers';

const inventoryService = new InventoryService();

// Validation schemas
const createInventoryItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  unit: z.string().min(1, 'Unit is required'),
  total_stock: z.number().min(0, 'Quantity must be non-negative'),
  reorder_threshold: z.number().min(0, 'Reorder level must be non-negative'),
});

const updateInventoryItemSchema = z.object({
  name: z.string().min(2).optional(),
  unit: z.string().min(1).optional(),
  reorder_threshold: z.number().min(0).optional(),
});

const restockSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

const adjustStockSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  is_increase: z.boolean(),
});

const reserveStockSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  order_id: z.string().cuid('Invalid order ID'),
});

const deductStockSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  order_id: z.string().cuid('Invalid order ID'),
});

const releaseStockSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
  order_id: z.string().cuid('Invalid order ID'),
});

export class InventoryController {
  async getAllInventoryItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeRecipes = req.query.includeRecipes === 'true';
      const items = await inventoryService.getAllInventoryItems(includeRecipes);

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryItemById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const item = await inventoryService.getInventoryItemById(id);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await inventoryService.getLowStockItems();

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async createInventoryItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createInventoryItemSchema.parse(req.body);
      const item = await inventoryService.createInventoryItem(validatedData);

      res.status(201).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async updateInventoryItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = updateInventoryItemSchema.parse(req.body);
      const item = await inventoryService.updateInventoryItem(id, validatedData);

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async deleteInventoryItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const result = await inventoryService.deleteInventoryItem(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async restockItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const validatedData = restockSchema.parse(req.body);

      const item = await inventoryService.restockItem(
        id,
        validatedData.quantity,
        req.user.id,
        validatedData.notes
      );

      // Broadcast inventory update via Socket.io
      const io = req.app.get('io');
      io.to('role:inventory').emit('inventory:updated', {
        itemId: id,
        action: 'restock',
        quantity: validatedData.quantity,
      });

      // Update menu items availability
      await inventoryService.updateAllMenuItemsAvailability();

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const validatedData = adjustStockSchema.parse(req.body);

      const item = await inventoryService.adjustStock(
        id,
        validatedData.quantity,
        req.user.id,
        validatedData.reason,
        validatedData.is_increase
      );

      // Broadcast inventory update via Socket.io
      const io = req.app.get('io');
      io.to('role:inventory').emit('inventory:updated', {
        itemId: id,
        action: 'adjustment',
        quantity: validatedData.is_increase ? validatedData.quantity : -validatedData.quantity,
      });

      // Update menu items availability
      await inventoryService.updateAllMenuItemsAvailability();

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async reserveStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const validatedData = reserveStockSchema.parse(req.body);

      const item = await inventoryService.reserveStock(
        id,
        validatedData.quantity,
        validatedData.order_id,
        req.user.id
      );

      // Broadcast inventory update via Socket.io
      const io = req.app.get('io');
      io.to('role:inventory').emit('inventory:updated', {
        itemId: id,
        action: 'reserve',
        quantity: validatedData.quantity,
      });

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async deductStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const validatedData = deductStockSchema.parse(req.body);

      const item = await inventoryService.deductStock(
        id,
        validatedData.quantity,
        validatedData.order_id,
        req.user.id
      );

      // Broadcast inventory update via Socket.io
      const io = req.app.get('io');
      io.to('role:inventory').emit('inventory:updated', {
        itemId: id,
        action: 'deduct',
        quantity: validatedData.quantity,
      });

      // Check if low stock and broadcast alert
      const available = item.total_stock - item.reserved_stock;
      if (available <= item.reorder_threshold) {
        io.to('role:inventory').emit('inventory:low_stock_alert', {
          itemId: id,
          itemName: item.name,
          available,
          reorderLevel: item.reorder_threshold,
        });

        io.to('role:admin').emit('inventory:low_stock_alert', {
          itemId: id,
          itemName: item.name,
          available,
          reorderLevel: item.reorder_threshold,
        });
      }

      // Update menu items availability
      await inventoryService.updateAllMenuItemsAvailability();

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async releaseStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const validatedData = releaseStockSchema.parse(req.body);

      const item = await inventoryService.releaseStock(
        id,
        validatedData.quantity,
        validatedData.order_id,
        req.user.id
      );

      // Broadcast inventory update via Socket.io
      const io = req.app.get('io');
      io.to('role:inventory').emit('inventory:updated', {
        itemId: id,
        action: 'release',
        quantity: validatedData.quantity,
      });

      // Update menu items availability
      await inventoryService.updateAllMenuItemsAvailability();

      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async getInventoryTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId, transactionType, startDate, endDate } = req.query;

      const filters: any = {};

      if (itemId) {
        filters.itemId = itemId as string;
      }

      if (transactionType) {
        filters.transactionType = transactionType as InventoryTransactionType;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const transactions = await inventoryService.getInventoryTransactions(filters);

      res.status(200).json({
        status: 'success',
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDailySummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : undefined;

      const summary = await inventoryService.getDailySummary(targetDate);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItemAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItemId = getRouteParam(req, 'menuItemId');
      const availability = await inventoryService.updateMenuItemAvailability(menuItemId);

      // Broadcast menu availability change via Socket.io
      const io = req.app.get('io');
      io.to('restaurant:main').emit('menu:availability_changed', {
        menuItemId,
        available: availability.available,
        maxServings: availability.max_servings,
      });

      res.status(200).json({
        status: 'success',
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAllMenuItemsAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updates = await inventoryService.updateAllMenuItemsAvailability();

      // Broadcast menu availability changes via Socket.io
      const io = req.app.get('io');
      io.to('restaurant:main').emit('menu:availability_bulk_update', {
        updates,
      });

      res.status(200).json({
        status: 'success',
        data: updates,
      });
    } catch (error) {
      next(error);
    }
  }
}
