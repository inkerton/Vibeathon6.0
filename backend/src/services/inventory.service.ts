import { PrismaClient, InventoryTransactionType } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';

export class InventoryService {
  /**
   * Reserve stock for an order (when order is placed)
   * This moves stock from available to reserved
   */
  async reserveStock(itemId: string, quantity: number, orderId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const available = item.total_stock - item.reserved_stock;
      
      if (available < quantity) {
        throw new AppError(
          `Insufficient stock for ${item.name}. Available: ${available}, Requested: ${quantity}`,
          400
        );
      }

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          reserved_stock: item.reserved_stock + quantity,
        },
      });

      // Log transaction
      await tx.inventoryTransaction.create({
        data: {
          item_id: itemId,
          type: InventoryTransactionType.reserve,
          quantity,
          order_id: orderId,
          performed_by_id: userId,
          note: `Reserved ${quantity} ${item.unit} for order ${orderId}`,
        },
      });

      return updatedItem;
    });
  }

  /**
   * Deduct stock (when order is completed/served)
   * This removes stock from both total and reserved
   */
  async deductStock(itemId: string, quantity: number, orderId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      if (item.reserved_stock < quantity) {
        throw new AppError(
          `Cannot deduct more than reserved quantity. Reserved: ${item.reserved_stock}, Requested: ${quantity}`,
          400
        );
      }

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          total_stock: item.total_stock - quantity,
          reserved_stock: item.reserved_stock - quantity,
        },
      });

      // Log transaction
      await tx.inventoryTransaction.create({
        data: {
          item_id: itemId,
          type: InventoryTransactionType.deduct,
          quantity,
          order_id: orderId,
          performed_by_id: userId,
          note: `Deducted ${quantity} ${item.unit} for completed order ${orderId}`,
        },
      });

      // Check if stock is low and needs alert
      const available = updatedItem.total_stock - updatedItem.reserved_stock;
      if (available <= updatedItem.reorder_threshold) {
        // TODO: Trigger low stock alert via Socket.io
        console.log(`LOW STOCK ALERT: ${item.name} - Available: ${available}, Reorder Level: ${updatedItem.reorder_threshold}`);
      }

      return updatedItem;
    });
  }

  /**
   * Release reserved stock (when order is cancelled)
   * This moves stock from reserved back to available
   */
  async releaseStock(itemId: string, quantity: number, orderId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      if (item.reserved_stock < quantity) {
        throw new AppError(
          `Cannot release more than reserved quantity. Reserved: ${item.reserved_stock}, Requested: ${quantity}`,
          400
        );
      }

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          reserved_stock: item.reserved_stock - quantity,
        },
      });

      // Log transaction
      await tx.inventoryTransaction.create({
        data: {
          item_id: itemId,
          type: InventoryTransactionType.release,
          quantity,
          order_id: orderId,
          performed_by_id: userId,
          note: `Released ${quantity} ${item.unit} from cancelled order ${orderId}`,
        },
      });

      return updatedItem;
    });
  }

  /**
   * Restock inventory item
   */
  async restockItem(itemId: string, quantity: number, userId: string, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          total_stock: item.total_stock + quantity,
        },
      });

      // Log transaction
      await tx.inventoryTransaction.create({
        data: {
          item_id: itemId,
          type: InventoryTransactionType.restock,
          quantity,
          performed_by_id: userId,
          note: notes || `Restocked ${quantity} ${item.unit}`,
        },
      });

      return updatedItem;
    });
  }

  /**
   * Manual stock adjustment (for corrections, waste, etc.)
   */
  async adjustStock(
    itemId: string,
    quantity: number,
    userId: string,
    reason: string,
    isIncrease: boolean
  ) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }

      const newQuantity = isIncrease
        ? item.total_stock + quantity
        : item.total_stock - quantity;

      if (newQuantity < 0) {
        throw new AppError('Adjustment would result in negative stock', 400);
      }

      if (newQuantity < item.reserved_stock) {
        throw new AppError(
          `Adjustment would result in total quantity (${newQuantity}) less than reserved quantity (${item.reserved_stock})`,
          400
        );
      }

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          total_stock: newQuantity,
        },
      });

      // Log transaction
      await tx.inventoryTransaction.create({
        data: {
          item_id: itemId,
          type: InventoryTransactionType.adjustment,
          quantity: isIncrease ? quantity : -quantity,
          performed_by_id: userId,
          note: reason,
        },
      });

      return updatedItem;
    });
  }

  /**
   * Get all inventory items with stock levels
   */
  async getAllInventoryItems(includeRecipes: boolean = false) {
    const items = await prisma.inventoryItem.findMany({
      include: {
        recipe_items: includeRecipes
          ? {
              include: {
                menu_item: true,
              },
            }
          : false,
      },
      orderBy: { name: 'asc' },
    });

    // Calculate available quantity for each item
    return items.map((item) => ({
      ...item,
      available_quantity: item.total_stock - item.reserved_stock,
      is_low_stock: item.total_stock - item.reserved_stock <= item.reorder_threshold,
    }));
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(id: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        recipe_items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    return {
      ...item,
      available_quantity: item.total_stock - item.reserved_stock,
      is_low_stock: item.total_stock - item.reserved_stock <= item.reorder_threshold,
    };
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    return items
      .filter((item) => item.total_stock - item.reserved_stock <= item.reorder_threshold)
      .map((item) => ({
        ...item,
        available_quantity: item.total_stock - item.reserved_stock,
        is_low_stock: true,
      }));
  }

  /**
   * Get inventory transactions with filters
   */
  async getInventoryTransactions(filters?: {
    itemId?: string;
    transactionType?: InventoryTransactionType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.itemId) {
      where.item_id = filters.itemId;
    }

    if (filters?.transactionType) {
      where.type = filters.transactionType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return transactions;
  }

  /**
   * Create new inventory item
   */
  async createInventoryItem(data: {
    name: string;
    unit: string;
    total_stock: number;
    reorder_threshold: number;
  }) {
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        unit: data.unit,
        total_stock: data.total_stock,
        reserved_stock: 0,
        reorder_threshold: data.reorder_threshold,
      },
    });

    return {
      ...item,
      available_quantity: item.total_stock,
      is_low_stock: item.total_stock <= item.reorder_threshold,
    };
  }

  /**
   * Update inventory item details (not quantities)
   */
  async updateInventoryItem(
    id: string,
    data: {
      name?: string;
      unit?: string;
      reorder_threshold?: number;
    }
  ) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return {
      ...updatedItem,
      available_quantity: updatedItem.total_stock - updatedItem.reserved_stock,
      is_low_stock:
        updatedItem.total_stock - updatedItem.reserved_stock <= updatedItem.reorder_threshold,
    };
  }

  /**
   * Delete inventory item (only if not used in any recipes)
   */
  async deleteInventoryItem(id: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        recipe_items: true,
      },
    });

    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    if (item.recipe_items.length > 0) {
      throw new AppError(
        'Cannot delete inventory item that is used in recipes. Remove from recipes first.',
        400
      );
    }

    if (item.reserved_stock > 0) {
      throw new AppError('Cannot delete inventory item with reserved stock', 400);
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return { message: 'Inventory item deleted successfully' };
  }

  /**
   * Get daily inventory summary
   */
  async getDailySummary(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        item: true,
      },
    });

    const summary = {
      date: targetDate.toISOString().split('T')[0],
      total_transactions: transactions.length,
      restocked_items: transactions.filter((t) => t.type === InventoryTransactionType.restock)
        .length,
      deducted_items: transactions.filter((t) => t.type === InventoryTransactionType.deduct)
        .length,
      adjusted_items: transactions.filter((t) => t.type === InventoryTransactionType.adjustment)
        .length,
      transactions_by_type: {
        reserve: transactions.filter((t) => t.type === InventoryTransactionType.reserve).length,
        deduct: transactions.filter((t) => t.type === InventoryTransactionType.deduct).length,
        release: transactions.filter((t) => t.type === InventoryTransactionType.release).length,
        restock: transactions.filter((t) => t.type === InventoryTransactionType.restock).length,
        adjustment: transactions.filter((t) => t.type === InventoryTransactionType.adjustment)
          .length,
      },
    };

    return summary;
  }

  /**
   * Calculate available quantity for a menu item based on recipe
   */
  async calculateMenuItemAvailability(menuItemId: string) {
    const recipe = await prisma.recipeItem.findMany({
      where: { menu_item_id: menuItemId },
      include: {
        ingredient: true,
      },
    });

    if (recipe.length === 0) {
      // No recipe defined, assume always available
      return { available: true, max_servings: Infinity };
    }

    let minServings = Infinity;

    for (const item of recipe) {
      const available = item.ingredient.total_stock - item.ingredient.reserved_stock;
      const servings = Math.floor(available / item.quantity);
      minServings = Math.min(minServings, servings);
    }

    return {
      available: minServings > 0,
      max_servings: minServings,
    };
  }

  /**
   * Update menu item availability based on inventory
   */
  async updateMenuItemAvailability(menuItemId: string) {
    const availability = await this.calculateMenuItemAvailability(menuItemId);

    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        is_available: availability.available,
      },
    });

    return availability;
  }

  /**
   * Update all menu items availability based on inventory
   */
  async updateAllMenuItemsAvailability() {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        recipe: true,
      },
    });

    const updates = await Promise.all(
      menuItems.map(async (item) => {
        if (item.recipe.length === 0) {
          // No recipe, keep current availability
          return { id: item.id, available: item.is_available };
        }

        const availability = await this.calculateMenuItemAvailability(item.id);
        
        if (item.is_available !== availability.available) {
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { is_available: availability.available },
          });
        }

        return { id: item.id, available: availability.available };
      })
    );

    return updates;
  }
}
