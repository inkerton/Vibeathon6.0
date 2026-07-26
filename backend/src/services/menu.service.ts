import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';

export class MenuService {
  async getAllMenuItems(includeUnavailable: boolean = false) {
    const where = includeUnavailable ? {} : { is_available: true };
    
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        category: 'asc',
      },
    });

    return menuItems;
  }

  async getMenuItemById(id: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
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

  async createMenuItem(data: {
    name: string;
    description: string;
    price: number;
    category: string;
    image_url?: string;
    preparation_time?: number;
  }) {
    // Check if item with same name exists
    const existing = await prisma.menuItem.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('Menu item with this name already exists', 409);
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image_url: data.image_url,
        preparation_time: data.preparation_time || 15,
        is_available: true,
      },
    });

    return menuItem;
  }

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image_url?: string;
      is_available?: boolean;
      preparation_time?: number;
    }
  ) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== menuItem.name) {
      const existing = await prisma.menuItem.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new AppError('Menu item with this name already exists', 409);
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
    });

    return updated;
  }

  async deleteMenuItem(id: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            order_items: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Prevent deletion if item has been ordered
    if (menuItem._count.order_items > 0) {
      throw new AppError(
        'Cannot delete menu item that has been ordered. Please disable it instead to preserve order history.',
        400
      );
    }

    // Delete related recipe items first to avoid foreign key constraint violation
    await prisma.recipeItem.deleteMany({
      where: { menu_item_id: id },
    });

    // Now delete the menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    return { message: 'Menu item deleted successfully' };
  }

  async getMenuByCategory() {
    const menuItems = await prisma.menuItem.findMany({
      where: { is_available: true },
      orderBy: {
        category: 'asc',
      },
    });

    // Group by category
    const grouped = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);

    return grouped;
  }

  async toggleAvailability(id: string, is_available: boolean) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { is_available },
    });

    return updated;
  }
}
