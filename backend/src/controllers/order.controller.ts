import { getRouteParam } from '../utils/route-helpers';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { OrderStatus, OrderItemStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

const orderService = new OrderService();

// Validation schemas
const createOrderSchema = z.object({
  table_id: z.string().cuid('Invalid table ID'),
  items: z.array(
    z.object({
      menu_item_id: z.string().cuid('Invalid menu item ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity cannot exceed 50'),
      special_instructions: z.string().max(500).optional(),
    })
  ).min(1, 'Order must contain at least one item'),
  payment_method: z.nativeEnum(PaymentMethod),
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

const updateOrderItemStatusSchema = z.object({
  status: z.nativeEnum(OrderItemStatus),
});

const updatePaymentStatusSchema = z.object({
  payment_status: z.nativeEnum(PaymentStatus),
});

export class OrderController {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const validatedData = createOrderSchema.parse(req.body);

      const order = await orderService.createOrder({
        customer_id: req.user.id,
        table_id: validatedData.table_id,
        items: validatedData.items,
        payment_method: validatedData.payment_method,
      });

      if (!order) {
        throw new AppError('Failed to create order', 500);
      }

      // Broadcast new order via Socket.io
      const io = req.app.get('io');
      
      // Notify kitchen
      io.to('role:kitchen').emit('order:created', {
        orderId: order.id,
        tableNumber: order.table.table_number,
        customerName: order.customer.name,
        itemCount: order.items.length,
        totalAmount: order.total_amount,
      });

      // Notify reception
      io.to('role:reception').emit('order:created', {
        orderId: order.id,
        tableNumber: order.table.table_number,
        status: order.order_status,
      });

      // Notify all connected clients about active orders update
      io.to('orders:active').emit('orders:updated');

      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const order = await orderService.getOrderById(id);

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const orders = await orderService.getCustomerOrders(req.user.id);

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, table_id, date } = req.query;

      const filters: any = {};
      if (status) {
        filters.status = status as OrderStatus;
      }
      if (table_id) {
        filters.table_id = table_id as string;
      }
      if (date) {
        filters.date = new Date(date as string);
      }

      const orders = await orderService.getAllOrders(filters);

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getActiveOrders();

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = updateOrderStatusSchema.parse(req.body);

      const order = await orderService.updateOrderStatus(id, validatedData.status);

      // Broadcast status update via Socket.io
      const io = req.app.get('io');

      // Notify customer
      io.to(`user:${order.customer_id}`).emit('order:status_updated', {
        orderId: order.id,
        status: order.order_status,
      });

      // Notify kitchen
      io.to('role:kitchen').emit('order:status_updated', {
        orderId: order.id,
        status: order.order_status,
        tableNumber: order.table.table_number,
      });

      // Notify reception
      io.to('role:reception').emit('order:status_updated', {
        orderId: order.id,
        status: order.order_status,
        tableNumber: order.table.table_number,
      });

      // Notify active orders room
      io.to('orders:active').emit('orders:updated');

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async updateOrderItemStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const itemId = getRouteParam(req, 'itemId');
      const validatedData = updateOrderItemStatusSchema.parse(req.body);

      const orderItem = await orderService.updateOrderItemStatus(
        id,
        itemId,
        validatedData.status
      );

      // Broadcast item status update via Socket.io
      const io = req.app.get('io');
      
      io.to(`order:${id}`).emit('order:item_updated', {
        orderId: id,
        itemId: orderItem.id,
        status: orderItem.status,
      });

      io.to('role:kitchen').emit('order:item_updated', {
        orderId: id,
        itemId: orderItem.id,
        status: orderItem.status,
      });

      res.status(200).json({
        status: 'success',
        data: orderItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async updatePaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = updatePaymentStatusSchema.parse(req.body);

      const order = await orderService.updatePaymentStatus(id, validatedData.payment_status);

      // Broadcast payment status update via Socket.io
      const io = req.app.get('io');
      
      io.to(`user:${order.customer_id}`).emit('order:payment_updated', {
        orderId: order.id,
        paymentStatus: order.payment_status,
      });

      io.to('role:reception').emit('order:payment_updated', {
        orderId: order.id,
        paymentStatus: order.payment_status,
        tableNumber: order.table.table_number,
      });

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const order = await orderService.cancelOrder(id, req.user.id);

      // Broadcast cancellation via Socket.io
      const io = req.app.get('io');
      
      io.to('role:kitchen').emit('order:cancelled', {
        orderId: order.id,
        tableNumber: order.table.table_number,
      });

      io.to('role:reception').emit('order:cancelled', {
        orderId: order.id,
        tableNumber: order.table.table_number,
      });

      io.to('orders:active').emit('orders:updated');

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
