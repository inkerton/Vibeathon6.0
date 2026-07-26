import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import { Role } from '@prisma/client';

const router = Router();
const menuController = new MenuController();

// Public routes (customer can view menu)
router.get('/', authHandler(menuController.getAllMenuItems.bind(menuController)));
router.get('/by-category', authHandler(menuController.getMenuByCategory.bind(menuController)));
router.get('/:id', authHandler(menuController.getMenuItemById.bind(menuController)));

// Admin only routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware([Role.admin]),
  authHandler(menuController.createMenuItem.bind(menuController))
);

router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([Role.admin]),
  authHandler(menuController.updateMenuItem.bind(menuController))
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware([Role.admin]),
  authHandler(menuController.deleteMenuItem.bind(menuController))
);

// Kitchen can toggle availability
router.patch(
  '/:id/availability',
  authMiddleware,
  roleMiddleware([Role.admin, Role.kitchen]),
  authHandler(menuController.toggleAvailability.bind(menuController))
);

export default router;