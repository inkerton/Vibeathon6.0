import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import { Role } from '@prisma/client';

const router = Router();
const orderController = new OrderController();

// All order routes require authentication
router.use(authMiddleware);

// Create new order (customer)
router.post('/', authHandler(orderController.createOrder.bind(orderController)));

// Get customer's own orders
router.get('/my-orders', authHandler(orderController.getCustomerOrders.bind(orderController)));

// Get all orders (kitchen, reception, admin)
router.get(
  '/',
  roleMiddleware([Role.kitchen, Role.reception, Role.admin]),
  authHandler(orderController.getAllOrders.bind(orderController))
);

// Get active orders (kitchen, reception, admin)
router.get(
  '/active',
  roleMiddleware([Role.kitchen, Role.reception, Role.admin]),
  authHandler(orderController.getActiveOrders.bind(orderController))
);

// Get order by ID
router.get('/:id', authHandler(orderController.getOrderById.bind(orderController)));

// Update order status (kitchen, reception, admin)
router.patch(
  '/:id/status',
  roleMiddleware([Role.kitchen, Role.reception, Role.admin]),
  authHandler(orderController.updateOrderStatus.bind(orderController))
);

// Update order item status (kitchen)
router.patch(
  '/:id/items/:itemId/status',
  roleMiddleware([Role.kitchen, Role.admin]),
  authHandler(orderController.updateOrderItemStatus.bind(orderController))
);

// Update payment status (reception, admin)
router.patch(
  '/:id/payment',
  roleMiddleware([Role.reception, Role.admin]),
  authHandler(orderController.updatePaymentStatus.bind(orderController))
);

// Cancel order (customer can cancel their own, admin can cancel any)
router.delete('/:id', authHandler(orderController.cancelOrder.bind(orderController)));

export default router;