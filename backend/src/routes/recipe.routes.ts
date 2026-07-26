import { Router } from 'express';
import { RecipeController } from '../controllers/recipe.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import { Role } from '@prisma/client';

const router = Router();
const recipeController = new RecipeController();

// All recipe routes require authentication
router.use(authMiddleware);

// Get recipe for a menu item (any authenticated user)
router.get('/menu/:menuItemId', authHandler(recipeController.getMenuItemRecipe.bind(recipeController)));

// Add ingredient to recipe (inventory staff and admin)
router.post(
  '/menu/:menuItemId/ingredients',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(recipeController.addIngredientToRecipe.bind(recipeController))
);

// Update recipe ingredient quantity (inventory staff and admin)
router.patch(
  '/items/:recipeItemId',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(recipeController.updateRecipeIngredient.bind(recipeController))
);

// Remove ingredient from recipe (inventory staff and admin)
router.delete(
  '/items/:recipeItemId',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(recipeController.removeIngredientFromRecipe.bind(recipeController))
);

// Bulk update recipe (inventory staff and admin)
router.put(
  '/menu/:menuItemId',
  roleMiddleware([Role.inventory, Role.admin]),
  authHandler(recipeController.setMenuItemRecipe.bind(recipeController))
);

// Calculate max servings for a menu item (any authenticated user)
router.get('/menu/:menuItemId/availability', authHandler(recipeController.calculateMaxServings.bind(recipeController)));

export default router;