import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const menuController = new MenuController();

// Public routes (customer can view menu)
router.get('/', menuController.getAllMenuItems.bind(menuController));
router.get('/by-category', menuController.getMenuByCategory.bind(menuController));
router.get('/:id', menuController.getMenuItemById.bind(menuController));

// Admin only routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware([Role.admin]),
  menuController.createMenuItem.bind(menuController)
);

router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([Role.admin]),
  menuController.updateMenuItem.bind(menuController)
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware([Role.admin]),
  menuController.deleteMenuItem.bind(menuController)
);

// Kitchen can toggle availability
router.patch(
  '/:id/availability',
  authMiddleware,
  roleMiddleware([Role.admin, Role.kitchen]),
  menuController.toggleAvailability.bind(menuController)
);

module.exports = router;
