import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { TableStatus } from '@prisma/client';

const router = Router();

// Temporary seed endpoint for development (remove in production!)
router.post('/seed-menu', async (req: Request, res: Response) => {
  try {
    const menuItems = [
      // Appetizers
      {
        name: 'Bruschetta',
        description: 'Grilled bread topped with fresh tomatoes, garlic, basil, and olive oil',
        price: 8.99,
        category: 'appetizers',
        image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
        is_available: true,
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Crispy fried mozzarella served with marinara sauce',
        price: 7.99,
        category: 'appetizers',
        image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400',
        is_available: true,
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan, croutons, and Caesar dressing',
        price: 9.99,
        category: 'appetizers',
        image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        is_available: true,
      },
      // Main Course
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, fresh mozzarella, and basil',
        price: 14.99,
        category: 'main_course',
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        is_available: true,
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables',
        price: 22.99,
        category: 'main_course',
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
        is_available: true,
      },
      {
        name: 'Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, cheese, and special sauce',
        price: 15.99,
        category: 'main_course',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        is_available: true,
      },
      {
        name: 'Chicken Alfredo Pasta',
        description: 'Creamy fettuccine pasta with grilled chicken and parmesan',
        price: 16.99,
        category: 'main_course',
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
        is_available: true,
      },
      {
        name: 'Vegetable Stir Fry',
        description: 'Fresh seasonal vegetables in a savory Asian-style sauce',
        price: 13.99,
        category: 'main_course',
        image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
        is_available: true,
      },
      // Desserts
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
        price: 7.99,
        category: 'desserts',
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        is_available: true,
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
        price: 8.99,
        category: 'desserts',
        image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
        is_available: true,
      },
      {
        name: 'Cheesecake',
        description: 'New York style cheesecake with berry compote',
        price: 7.99,
        category: 'desserts',
        image_url: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400',
        is_available: true,
      },
      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 4.99,
        category: 'beverages',
        image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
        is_available: true,
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        price: 4.50,
        category: 'beverages',
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        is_available: true,
      },
      {
        name: 'Iced Tea',
        description: 'Refreshing iced tea with lemon',
        price: 3.99,
        category: 'beverages',
        image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        is_available: true,
      },
    ];

    const created = [];
    for (const item of menuItems) {
      const menuItem = await prisma.menuItem.upsert({
        where: { name: item.name },
        update: {},
        create: item,
      });
      created.push(menuItem);
    }

    res.status(200).json({
      status: 'success',
      message: `Created ${created.length} menu items`,
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

router.post('/seed-tables', async (req: Request, res: Response) => {
  try {
    const restaurantId = process.env.RESTAURANT_ID || 'default-restaurant-id';
    const tables = [
      { table_number: 1, capacity: 2, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 2, capacity: 2, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 3, capacity: 4, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 4, capacity: 4, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 5, capacity: 4, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 6, capacity: 6, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 7, capacity: 6, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 8, capacity: 8, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 9, capacity: 2, status: TableStatus.free, restaurant_id: restaurantId },
      { table_number: 10, capacity: 4, status: TableStatus.free, restaurant_id: restaurantId },
    ];

    const created = [];
    for (const table of tables) {
      const tableRecord = await prisma.table.upsert({
        where: { table_number: table.table_number },
        update: {},
        create: table,
      });
      created.push(tableRecord);
    }

    res.status(200).json({
      status: 'success',
      message: `Created ${created.length} tables`,
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

module.exports = router;