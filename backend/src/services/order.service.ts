import { PrismaClient, OrderStatus, OrderItemStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';
import { InventoryService } from './inventory.service';

const inventoryService = new InventoryService();

export class OrderService {
  async createOrder(data: {
    customer_id: string;
    table_number: number;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      special_instructions?: string;
    }>;
    payment_method: PaymentMethod;
  }) {
    // Validate table exists by table_number
    const table = await prisma.table.findUnique({
      where: { table_number: data.table_number },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    // Validate all menu items exist and are available
    const menuItemIds = data.items.map(item => item.menu_item_id);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
      },
      include: {
        recipe: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new AppError('One or more menu items not found', 404);
    }

    const unavailableItems = menuItems.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      throw new AppError(
        `The following items are not available: ${unavailableItems.map(i => i.name).join(', ')}`,
        400
      );
    }

    // Calculate total amount
    let total_amount = 0;
    const itemsWithPrices = data.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id)!;
      const itemTotal = Number(menuItem.price) * item.quantity;
      total_amount += itemTotal;
      return {
        ...item,
        price: menuItem.price,
        name: menuItem.name,
      };
    });

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customer_id: data.customer_id,
          table_id: table.id,
          total_amount,
          created_by_role: 'customer',
          order_status: OrderStatus.placed,
          payment_status: data.payment_method === PaymentMethod.in_app 
            ? PaymentStatus.unpaid 
            : PaymentStatus.pending_at_table,
          payment_method: data.payment_method,
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        itemsWithPrices.map(item =>
          tx.orderItem.create({
            data: {
              order_id: newOrder.id,
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              price_at_order: item.price,
              custom_instructions: item.special_instructions,
              status: OrderItemStatus.received,
            },
          })
        )
      );

      // Update table status to occupied if not already
      if (table.status === 'free') {
        await tx.table.update({
          where: { id: table.id },
          data: { 
            status: 'occupied',
            current_order_id: newOrder.id,
          },
        });
      }

      return { ...newOrder, items: orderItems };
    });

    // Reserve inventory for each menu item in the order
    for (const item of data.items) {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id)!;
      
      // If menu item has a recipe, reserve ingredients
      if (menuItem.recipe && menuItem.recipe.length > 0) {
        for (const recipeItem of menuItem.recipe) {
          const quantityNeeded = recipeItem.quantity * item.quantity;
          try {
            await inventoryService.reserveStock(
              recipeItem.ingredient.id,
              quantityNeeded,
              order.id,
              data.customer_id
            );
          } catch (error) {
            // If reservation fails, we should ideally rollback the order
            // For now, log the error
            console.error(`Failed to reserve stock for ${recipeItem.ingredient.name}:`, error);
          }
        }
      }
    }

    // Fetch complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    return completeOrder;
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async getCustomerOrders(customerId: string) {
    const orders = await prisma.order.findMany({
      where: { customer_id: customerId },
      include: {
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  async getAllOrders(filters?: {
    status?: OrderStatus;
    table_id?: string;
    date?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.order_status = filters.status;
    }

    if (filters?.table_id) {
      where.table_id = filters.table_id;
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.created_at = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  async getActiveOrders() {
    const orders = await prisma.order.findMany({
      where: {
        order_status: {
          in: [OrderStatus.placed, OrderStatus.preparing, OrderStatus.ready],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return orders;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        table: true,
        items: {
          include: {
            menu_item: {
              include: {
                recipe: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // If marking as completed, deduct inventory
    if (status === OrderStatus.completed) {
      for (const orderItem of order.items) {
        const menuItem = orderItem.menu_item;
        
        // If menu item has a recipe, deduct ingredients from inventory
        if (menuItem.recipe && menuItem.recipe.length > 0) {
          for (const recipeItem of menuItem.recipe) {
            const quantityToDeduct = recipeItem.quantity * orderItem.quantity;
            try {
              await inventoryService.deductStock(
                recipeItem.ingredient.id,
                quantityToDeduct,
                order.id,
                order.customer_id
              );
            } catch (error) {
              console.error(`Failed to deduct stock for ${recipeItem.ingredient.name}:`, error);
            }
          }
        }
      }
    }

    // If marking as completed, update table status
    const updateData: any = { order_status: status };

    if (status === OrderStatus.completed || status === OrderStatus.cancelled) {
      // Free up the table if this was the current order
      if (order.table.current_order_id === order.id) {
        await prisma.table.update({
          where: { id: order.table_id },
          data: {
            status: 'free',
            current_order_id: null,
          },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async updateOrderItemStatus(orderId: string, itemId: string, status: OrderItemStatus) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order_id: orderId,
      },
    });

    if (!orderItem) {
      throw new AppError('Order item not found', 404);
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
      include: {
        menu_item: true,
      },
    });

    // Check if all items are ready, update order status
    const allItems = await prisma.orderItem.findMany({
      where: { order_id: orderId },
    });

    const allReady = allItems.every(item => item.status === OrderItemStatus.ready);
    const anyPreparing = allItems.some(item => item.status === OrderItemStatus.preparing);

    if (allReady) {
      await prisma.order.update({
        where: { id: orderId },
        data: { order_status: OrderStatus.ready },
      });
    } else if (anyPreparing) {
      await prisma.order.update({
        where: { id: orderId },
        data: { order_status: OrderStatus.preparing },
      });
    }

    return updatedItem;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { payment_status: paymentStatus },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async cancelOrder(id: string, customerId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        table: true,
        items: {
          include: {
            menu_item: {
              include: {
                recipe: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.customer_id !== customerId) {
      throw new AppError('You can only cancel your own orders', 403);
    }

    if (order.order_status === OrderStatus.completed) {
      throw new AppError('Cannot cancel completed order', 400);
    }

    if (order.order_status === OrderStatus.cancelled) {
      throw new AppError('Order is already cancelled', 400);
    }

    // Release reserved inventory for each menu item in the order
    for (const orderItem of order.items) {
      const menuItem = orderItem.menu_item;
      
      // If menu item has a recipe, release reserved ingredients
      if (menuItem.recipe && menuItem.recipe.length > 0) {
        for (const recipeItem of menuItem.recipe) {
          const quantityToRelease = recipeItem.quantity * orderItem.quantity;
          try {
            await inventoryService.releaseStock(
              recipeItem.ingredient.id,
              quantityToRelease,
              order.id,
              customerId
            );
          } catch (error) {
            console.error(`Failed to release stock for ${recipeItem.ingredient.name}:`, error);
          }
        }
      }
    }

    // Free up table if this was the current order
    if (order.table.current_order_id === order.id) {
      await prisma.table.update({
        where: { id: order.table_id },
        data: {
          status: 'free',
          current_order_id: null,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { order_status: OrderStatus.cancelled },
      include: {
        table: true,
        items: {
          include: {
            menu_item: true,
          },
        },
      },
    });

    return updatedOrder;
  }
}
