import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';

export class RecipeService {
  /**
   * Add ingredient to menu item recipe
   */
  async addIngredientToRecipe(data: {
    menu_item_id: string;
    ingredient_id: string;
    quantity: number;
  }) {
    // Validate menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: data.menu_item_id },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Validate inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: data.ingredient_id },
    });

    if (!inventoryItem) {
      throw new AppError('Inventory item not found', 404);
    }

    // Check if ingredient already exists in recipe
    const existing = await prisma.recipeItem.findFirst({
      where: {
        menu_item_id: data.menu_item_id,
        ingredient_id: data.ingredient_id,
      },
    });

    if (existing) {
      throw new AppError('This ingredient is already in the recipe', 400);
    }

    // Add ingredient to recipe
    const recipeItem = await prisma.recipeItem.create({
      data: {
        menu_item_id: data.menu_item_id,
        ingredient_id: data.ingredient_id,
        quantity: data.quantity,
        unit: inventoryItem.unit,
      },
      include: {
        ingredient: true,
        menu_item: true,
      },
    });

    return recipeItem;
  }

  /**
   * Update ingredient quantity in recipe
   */
  async updateRecipeIngredient(
    recipeItemId: string,
    quantity: number
  ) {
    const recipeItem = await prisma.recipeItem.findUnique({
      where: { id: recipeItemId },
    });

    if (!recipeItem) {
      throw new AppError('Recipe item not found', 404);
    }

    const updated = await prisma.recipeItem.update({
      where: { id: recipeItemId },
      data: { quantity },
      include: {
        ingredient: true,
        menu_item: true,
      },
    });

    return updated;
  }

  /**
   * Remove ingredient from recipe
   */
  async removeIngredientFromRecipe(recipeItemId: string) {
    const recipeItem = await prisma.recipeItem.findUnique({
      where: { id: recipeItemId },
    });

    if (!recipeItem) {
      throw new AppError('Recipe item not found', 404);
    }

    await prisma.recipeItem.delete({
      where: { id: recipeItemId },
    });

    return { message: 'Ingredient removed from recipe successfully' };
  }

  /**
   * Get recipe for a menu item
   */
  async getMenuItemRecipe(menuItemId: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    return menuItem;
  }

  /**
   * Set complete recipe for a menu item (replaces existing)
   */
  async setMenuItemRecipe(
    menuItemId: string,
    ingredients: Array<{
      ingredient_id: string;
      quantity: number;
    }>
  ) {
    // Validate menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Validate all inventory items exist
    const inventoryItemIds = ingredients.map((i) => i.ingredient_id);
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: inventoryItemIds },
      },
    });

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new AppError('One or more inventory items not found', 404);
    }

    // Replace recipe in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing recipe items
      await tx.recipeItem.deleteMany({
        where: { menu_item_id: menuItemId },
      });

      // Create new recipe items
      const recipeItems = await Promise.all(
        ingredients.map(async (ingredient) => {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: ingredient.ingredient_id },
          });
          return tx.recipeItem.create({
            data: {
              menu_item_id: menuItemId,
              ingredient_id: ingredient.ingredient_id,
              quantity: ingredient.quantity,
              unit: inventoryItem?.unit || 'unit',
            },
            include: {
              ingredient: true,
            },
          });
        })
      );

      return recipeItems;
    });

    return result;
  }

  /**
   * Get all menu items with their recipes
   */
  async getAllMenuItemsWithRecipes() {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return menuItems;
  }

  /**
   * Get all inventory items used in recipes
   */
  async getInventoryItemsInRecipes() {
    const items = await prisma.inventoryItem.findMany({
      where: {
        recipe_items: {
          some: {},
        },
      },
      include: {
        recipe_items: {
          include: {
            menu_item: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items;
  }

  /**
   * Calculate how many servings can be made for a menu item
   */
  async calculateMaxServings(menuItemId: string) {
    const recipe = await prisma.recipeItem.findMany({
      where: { menu_item_id: menuItemId },
      include: {
        ingredient: true,
      },
    });

    if (recipe.length === 0) {
      // No recipe defined, assume unlimited
      return { max_servings: Infinity, limiting_ingredient: null };
    }

    let minServings = Infinity;
    let limitingIngredient = null;

    for (const item of recipe) {
      const available = item.ingredient.total_stock - item.ingredient.reserved_stock;
      const servings = Math.floor(available / item.quantity);
      
      if (servings < minServings) {
        minServings = servings;
        limitingIngredient = {
          id: item.ingredient.id,
          name: item.ingredient.name,
          available,
          required: item.quantity,
        };
      }
    }

    return {
      max_servings: minServings,
      limiting_ingredient: limitingIngredient,
    };
  }

  /**
   * Bulk update recipes from a JSON structure
   */
  async bulkUpdateRecipes(
    recipes: Array<{
      menu_item_id: string;
      ingredients: Array<{
        ingredient_id: string;
        quantity: number;
      }>;
    }>
  ) {
    const results = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const updated = await this.setMenuItemRecipe(
            recipe.menu_item_id,
            recipe.ingredients
          );
          return {
            menu_item_id: recipe.menu_item_id,
            status: 'success',
            recipe: updated,
          };
        } catch (error: any) {
          return {
            menu_item_id: recipe.menu_item_id,
            status: 'error',
            error: error.message,
          };
        }
      })
    );

    return results;
  }
}
