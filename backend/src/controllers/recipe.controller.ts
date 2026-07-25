import { getRouteParam } from '../utils/route-helpers';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { RecipeService } from '../services/recipe.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const recipeService = new RecipeService();

// Validation schemas
const addIngredientSchema = z.object({
  ingredient_id: z.string().cuid('Invalid inventory item ID'),
  quantity: z.number().positive('Quantity must be positive'),
});

const updateIngredientSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
});

const setRecipeSchema = z.object({
  ingredients: z.array(
    z.object({
      ingredient_id: z.string().cuid('Invalid inventory item ID'),
      quantity: z.number().positive('Quantity must be positive'),
    })
  ).min(1, 'Recipe must have at least one ingredient'),
});

const bulkUpdateRecipesSchema = z.object({
  recipes: z.array(
    z.object({
      menu_item_id: z.string().cuid('Invalid menu item ID'),
      ingredients: z.array(
        z.object({
          ingredient_id: z.string().cuid('Invalid inventory item ID'),
          quantity: z.number().positive('Quantity must be positive'),
        })
      ),
    })
  ),
});

export class RecipeController {
  async getMenuItemRecipe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItemId = getRouteParam(req, 'menuItemId');
      const recipe = await recipeService.getMenuItemRecipe(menuItemId);

      res.status(200).json({
        status: 'success',
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async addIngredientToRecipe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItemId = getRouteParam(req, 'menuItemId');
      const validatedData = addIngredientSchema.parse(req.body);

      const recipeItem = await recipeService.addIngredientToRecipe({
        menu_item_id: menuItemId,
        ingredient_id: validatedData.ingredient_id,
        quantity: validatedData.quantity,
      });

      res.status(201).json({
        status: 'success',
        data: recipeItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async updateRecipeIngredient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recipeItemId = getRouteParam(req, 'recipeItemId');
      const validatedData = updateIngredientSchema.parse(req.body);

      const recipeItem = await recipeService.updateRecipeIngredient(
        recipeItemId,
        validatedData.quantity
      );

      res.status(200).json({
        status: 'success',
        data: recipeItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async removeIngredientFromRecipe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recipeItemId = getRouteParam(req, 'recipeItemId');
      const result = await recipeService.removeIngredientFromRecipe(recipeItemId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async setMenuItemRecipe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItemId = getRouteParam(req, 'menuItemId');
      const validatedData = setRecipeSchema.parse(req.body);

      const recipe = await recipeService.setMenuItemRecipe(
        menuItemId,
        validatedData.ingredients
      );

      res.status(200).json({
        status: 'success',
        data: recipe,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async getAllMenuItemsWithRecipes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItems = await recipeService.getAllMenuItemsWithRecipes();

      res.status(200).json({
        status: 'success',
        data: menuItems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryItemsInRecipes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await recipeService.getInventoryItemsInRecipes();

      res.status(200).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async calculateMaxServings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const menuItemId = getRouteParam(req, 'menuItemId');
      const result = await recipeService.calculateMaxServings(menuItemId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateRecipes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = bulkUpdateRecipesSchema.parse(req.body);
      const results = await recipeService.bulkUpdateRecipes(validatedData.recipes);

      res.status(200).json({
        status: 'success',
        data: results,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }
}
