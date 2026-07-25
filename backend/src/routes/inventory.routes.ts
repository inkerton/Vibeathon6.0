import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import { Role } from '@prisma/client';

const router = Router();
const inventoryController = new InventoryController();

// All inventory routes require authentication
router.use(authMiddleware);

// Get all inventory items (inventory staff and admin)
router.get(
  '/',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.getAllInventoryItems.bind(inventoryController))
);

// Get low stock items (inventory staff and admin)
router.get(
  '/low-stock',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.getLowStockItems.bind(inventoryController))
);

// Get inventory transactions (inventory staff and admin)
router.get(
  '/transactions',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.getInventoryTransactions.bind(inventoryController))
);

// Get daily inventory summary (inventory staff and admin)
router.get(
  '/summary/daily',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.getDailySummary.bind(inventoryController))
);

// Get inventory item by ID (inventory staff and admin)
router.get(
  '/:id',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.getInventoryItemById.bind(inventoryController))
);

// Create new inventory item (admin only)
router.post(
  '/',
  roleMiddleware([Role.admin]),
  authHandler(inventoryController.createInventoryItem.bind(inventoryController))
);

// Update inventory item details (admin only)
router.patch(
  '/:id',
  roleMiddleware([Role.admin]),
  authHandler(inventoryController.updateInventoryItem.bind(inventoryController))
);

// Delete inventory item (admin only)
router.delete(
  '/:id',
  roleMiddleware([Role.admin]),
  authHandler(inventoryController.deleteInventoryItem.bind(inventoryController))
);

// Restock inventory item (inventory staff and admin)
router.post(
  '/:id/restock',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.restockItem.bind(inventoryController))
);

// Adjust stock (inventory staff and admin)
router.post(
  '/:id/adjust',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.adjustStock.bind(inventoryController))
);

// Reserve stock (system use - kitchen/order processing)
router.post(
  '/:id/reserve',
  roleMiddleware([Role.kitchen, Role.admin]),
  authHandler(inventoryController.reserveStock.bind(inventoryController))
);

// Deduct stock (system use - when order completed)
router.post(
  '/:id/deduct',
  roleMiddleware([Role.kitchen, Role.admin]),
  authHandler(inventoryController.deductStock.bind(inventoryController))
);

// Release stock (system use - when order cancelled)
router.post(
  '/:id/release',
  roleMiddleware([Role.kitchen, Role.admin]),
  authHandler(inventoryController.releaseStock.bind(inventoryController))
);

// Update menu item availability based on inventory
router.post(
  '/menu/:menuItemId/availability',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.updateMenuItemAvailability.bind(inventoryController))
);

// Update all menu items availability
router.post(
  '/menu/availability/update-all',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(inventoryController.updateAllMenuItemsAvailability.bind(inventoryController))
);

export default router;