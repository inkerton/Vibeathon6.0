import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  // Clean all tables
  await cleanupTestDatabase();
  
  // Seed test data
  await seedTestData();
}

export async function cleanupTestDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.demandForecast.deleteMany();
  await prisma.inventoryPrediction.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
}

async function seedTestData() {
  // Create test users
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password_hash: hashedPassword,
      name: 'Test Admin',
      role: Role.admin,
      is_active: true,
      auth_provider: 'local',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password_hash: hashedPassword,
      name: 'Test Customer',
      role: Role.customer,
      is_active: true,
      auth_provider: 'local',
      phone: '+1234567890',
    },
  });

  const kitchen = await prisma.user.create({
    data: {
      email: 'kitchen@test.com',
      password_hash: hashedPassword,
      name: 'Test Kitchen',
      role: Role.kitchen,
      is_active: true,
      auth_provider: 'local',
    },
  });

  const reception = await prisma.user.create({
    data: {
      email: 'reception@test.com',
      password_hash: hashedPassword,
      name: 'Test Reception',
      role: Role.reception,
      is_active: true,
      auth_provider: 'local',
    },
  });

  const inventory = await prisma.user.create({
    data: {
      email: 'inventory@test.com',
      password_hash: hashedPassword,
      name: 'Test Inventory',
      role: Role.inventory,
      is_active: true,
      auth_provider: 'local',
    },
  });

  // Create test menu items
  const burger = await prisma.menuItem.create({
    data: {
      name: 'Test Burger',
      description: 'Delicious test burger',
      price: 15.99,
      category: 'main_course',
      is_available: true,
      preparation_time: 15,
      image_url: 'https://example.com/burger.jpg',
    },
  });

  const pizza = await prisma.menuItem.create({
    data: {
      name: 'Test Pizza',
      description: 'Tasty test pizza',
      price: 18.99,
      category: 'main_course',
      is_available: true,
      preparation_time: 20,
      image_url: 'https://example.com/pizza.jpg',
    },
  });

  const salad = await prisma.menuItem.create({
    data: {
      name: 'Test Salad',
      description: 'Fresh test salad',
      price: 9.99,
      category: 'appetizers',
      is_available: true,
      preparation_time: 10,
    },
  });

  const dessert = await prisma.menuItem.create({
    data: {
      name: 'Test Dessert',
      description: 'Sweet test dessert',
      price: 7.99,
      category: 'desserts',
      is_available: true,
      preparation_time: 8,
    },
  });

  const drink = await prisma.menuItem.create({
    data: {
      name: 'Test Drink',
      description: 'Refreshing test drink',
      price: 4.99,
      category: 'beverages',
      is_available: true,
      preparation_time: 5,
    },
  });

  // Create test inventory items
  const tomatoes = await prisma.inventoryItem.create({
    data: {
      name: 'Tomatoes',
      unit: 'kg',
      total_stock: 50,
      reserved_stock: 5,
      reorder_threshold: 20,
    },
  });

  const cheese = await prisma.inventoryItem.create({
    data: {
      name: 'Cheese',
      unit: 'kg',
      total_stock: 8,
      reserved_stock: 2,
      reorder_threshold: 10,
    },
  });

  const chicken = await prisma.inventoryItem.create({
    data: {
      name: 'Chicken',
      unit: 'kg',
      total_stock: 35,
      reserved_stock: 5,
      reorder_threshold: 15,
    },
  });

  const pasta = await prisma.inventoryItem.create({
    data: {
      name: 'Pasta',
      unit: 'kg',
      total_stock: 60,
      reserved_stock: 10,
      reorder_threshold: 30,
    },
  });

  // Create recipe items (link menu items to ingredients)
  await prisma.recipeItem.createMany({
    data: [
      {
        menu_item_id: burger.id,
        ingredient_id: cheese.id,
        quantity: 0.1,
        unit: 'kg',
      },
      {
        menu_item_id: burger.id,
        ingredient_id: tomatoes.id,
        quantity: 0.05,
        unit: 'kg',
      },
      {
        menu_item_id: pizza.id,
        ingredient_id: cheese.id,
        quantity: 0.2,
        unit: 'kg',
      },
      {
        menu_item_id: pizza.id,
        ingredient_id: tomatoes.id,
        quantity: 0.1,
        unit: 'kg',
      },
    ],
  });

  // Create test tables
  await prisma.table.createMany({
    data: [
      { table_number: 1, capacity: 2, restaurant_id: 'test-restaurant' },
      { table_number: 2, capacity: 4, restaurant_id: 'test-restaurant' },
      { table_number: 3, capacity: 6, restaurant_id: 'test-restaurant' },
    ],
  });

  // Create historical inventory transactions for AI
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    await prisma.inventoryTransaction.create({
      data: {
        item_id: tomatoes.id,
        type: 'deduct',
        quantity: Math.random() * 3 + 1,
        performed_by_id: inventory.id,
        note: 'Daily usage',
        created_at: date,
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        item_id: cheese.id,
        type: 'deduct',
        quantity: Math.random() * 2 + 0.5,
        performed_by_id: inventory.id,
        note: 'Daily usage',
        created_at: date,
      },
    });
  }

  // Create user preferences for AI
  await prisma.userPreference.create({
    data: {
      user_id: customer.id,
      preferred_categories: ['main_course', 'desserts'],
      dietary_restrictions: [],
      favorite_items: [burger.id, pizza.id],
      price_range: {
        min: 10,
        max: 25,
        avg: 17.5,
      },
    },
  });

  console.log('✅ Test database seeded successfully');
}

export { prisma };
