/// <reference types="node" />
import { PrismaClient, Role, AuthProvider, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample menu items
  const menuItems = [
    // Appetizers
    {
      name: 'Bruschetta',
      description: 'Grilled bread topped with fresh tomatoes, garlic, basil, and olive oil',
      price: 8.99,
      category: 'appetizers',
      image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
      is_available: true,
      preparation_time: 10,
    },
    {
      name: 'Mozzarella Sticks',
      description: 'Crispy fried mozzarella served with marinara sauce',
      price: 7.99,
      category: 'appetizers',
      image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400',
      is_available: true,
      preparation_time: 12,
    },
    {
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan, croutons, and Caesar dressing',
      price: 9.99,
      category: 'appetizers',
      image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
      is_available: true,
      preparation_time: 8,
    },
    // Main Course
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, fresh mozzarella, and basil',
      price: 14.99,
      category: 'main_course',
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      is_available: true,
      preparation_time: 20,
    },
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables',
      price: 22.99,
      category: 'main_course',
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      is_available: true,
      preparation_time: 25,
    },
    {
      name: 'Beef Burger',
      description: 'Juicy beef patty with lettuce, tomato, cheese, and special sauce',
      price: 15.99,
      category: 'main_course',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      is_available: true,
      preparation_time: 18,
    },
    {
      name: 'Chicken Alfredo Pasta',
      description: 'Creamy fettuccine pasta with grilled chicken and parmesan',
      price: 16.99,
      category: 'main_course',
      image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
      is_available: true,
      preparation_time: 22,
    },
    {
      name: 'Vegetable Stir Fry',
      description: 'Fresh seasonal vegetables in a savory Asian-style sauce',
      price: 13.99,
      category: 'main_course',
      image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
      is_available: true,
      preparation_time: 15,
    },
    // Desserts
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
      price: 7.99,
      category: 'desserts',
      image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      is_available: true,
      preparation_time: 10,
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
      price: 8.99,
      category: 'desserts',
      image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
      is_available: true,
      preparation_time: 15,
    },
    {
      name: 'Cheesecake',
      description: 'New York style cheesecake with berry compote',
      price: 7.99,
      category: 'desserts',
      image_url: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400',
      is_available: true,
      preparation_time: 8,
    },
    // Beverages
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 4.99,
      category: 'beverages',
      image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
      is_available: true,
      preparation_time: 5,
    },
    {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      price: 4.50,
      category: 'beverages',
      image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
      is_available: true,
      preparation_time: 7,
    },
    {
      name: 'Iced Tea',
      description: 'Refreshing iced tea with lemon',
      price: 3.99,
      category: 'beverages',
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
      is_available: true,
      preparation_time: 5,
    },
  ];

  console.log('📝 Creating menu items...');
  const createdMenuItems = [];
  for (const item of menuItems) {
    const menuItem = await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
    createdMenuItems.push(menuItem);
  }
  console.log(`✅ Created/updated ${menuItems.length} menu items`);

  // --- Seed Admin User ---
  const adminEmail = 'admin@restaurant.com';
  const adminPassword = 'Admin123!';

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log(`👤 Admin user not found. Creating user: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: hashedPassword,
        name: 'Default Admin',
        role: Role.admin,
        is_active: true,
        auth_provider: AuthProvider.local,
      },
    });
    console.log('✅ Admin user created successfully.');
  } else {
    console.log('👤 Admin user already exists.');
  }

  // --- Seed Customer Users ---
  console.log('👥 Creating customer users...');
  const customerUsers = [];
  const customerData = [
    { email: 'customer1@example.com', name: 'John Doe', phone: '+1234567890' },
    { email: 'customer2@example.com', name: 'Jane Smith', phone: '+1234567891' },
    { email: 'customer3@example.com', name: 'Bob Johnson', phone: '+1234567892' },
  ];

  for (const customer of customerData) {
    const hashedPassword = await bcrypt.hash('Customer123!', 10);
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        email: customer.email,
        password_hash: hashedPassword,
        name: customer.name,
        phone: customer.phone,
        role: Role.customer,
        is_active: true,
        auth_provider: AuthProvider.local,
      },
    });
    customerUsers.push(user);
  }
  console.log(`✅ Created/updated ${customerUsers.length} customer users`);

  // --- Seed Staff Users ---
  console.log('👨‍🍳 Creating staff users...');
  const staffData = [
    { email: 'kitchen@restaurant.com', name: 'Chef Mike', role: Role.kitchen, phone: '+1234567893' },
    { email: 'kitchen2@restaurant.com', name: 'Chef Sarah', role: Role.kitchen, phone: '+1234567896' },
    { email: 'reception@restaurant.com', name: 'Sarah Reception', role: Role.reception, phone: '+1234567894' },
    { email: 'reception2@restaurant.com', name: 'Tom Reception', role: Role.reception, phone: '+1234567897' },
    { email: 'inventory@restaurant.com', name: 'Tom Inventory', role: Role.inventory, phone: '+1234567895' },
    { email: 'inventory2@restaurant.com', name: 'Lisa Inventory', role: Role.inventory, phone: '+1234567898' },
  ];

  const createdStaff = [];
  for (const staff of staffData) {
    const hashedPassword = await bcrypt.hash('Staff123!', 10);
    const staffUser = await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        email: staff.email,
        password_hash: hashedPassword,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        is_active: true,
        auth_provider: AuthProvider.local,
      },
    });
    createdStaff.push(staffUser);
  }
  console.log(`✅ Created/updated ${staffData.length} staff users`);

  // --- Seed Inventory Items ---
  console.log('📦 Creating inventory items...');
  const inventoryItemsData = [
    // Vegetables
    { name: 'Tomatoes', unit: 'kg', total_stock: 50, reserved_stock: 10, reorder_threshold: 20 },
    { name: 'Lettuce', unit: 'kg', total_stock: 30, reserved_stock: 5, reorder_threshold: 15 },
    { name: 'Onions', unit: 'kg', total_stock: 40, reserved_stock: 8, reorder_threshold: 20 },
    { name: 'Bell Peppers', unit: 'kg', total_stock: 25, reserved_stock: 3, reorder_threshold: 10 },
    // Dairy - Low stock
    { name: 'Mozzarella Cheese', unit: 'kg', total_stock: 8, reserved_stock: 3, reorder_threshold: 10 },
    { name: 'Parmesan Cheese', unit: 'kg', total_stock: 6, reserved_stock: 2, reorder_threshold: 8 },
    { name: 'Fresh Cream', unit: 'liters', total_stock: 15, reserved_stock: 4, reorder_threshold: 10 },
    { name: 'Butter', unit: 'kg', total_stock: 10, reserved_stock: 2, reorder_threshold: 5 },
    // Meat
    { name: 'Chicken Breast', unit: 'kg', total_stock: 35, reserved_stock: 8, reorder_threshold: 15 },
    { name: 'Beef Patty', unit: 'kg', total_stock: 20, reserved_stock: 5, reorder_threshold: 10 },
    { name: 'Salmon Fillet', unit: 'kg', total_stock: 12, reserved_stock: 3, reorder_threshold: 8 },
    { name: 'Bacon', unit: 'kg', total_stock: 12, reserved_stock: 2, reorder_threshold: 8 },
    // Pantry
    { name: 'Pasta', unit: 'kg', total_stock: 60, reserved_stock: 12, reorder_threshold: 30 },
    { name: 'Pizza Dough', unit: 'kg', total_stock: 45, reserved_stock: 10, reorder_threshold: 25 },
    { name: 'Olive Oil', unit: 'liters', total_stock: 20, reserved_stock: 3, reorder_threshold: 10 },
    { name: 'Tomato Sauce', unit: 'liters', total_stock: 25, reserved_stock: 5, reorder_threshold: 12 },
    // Herbs - Low stock
    { name: 'Fresh Basil', unit: 'kg', total_stock: 3, reserved_stock: 1, reorder_threshold: 5 },
    { name: 'Garlic', unit: 'kg', total_stock: 15, reserved_stock: 3, reorder_threshold: 8 },
    // Beverages
    { name: 'Orange Juice', unit: 'liters', total_stock: 2, reserved_stock: 2, reorder_threshold: 15 },
    { name: 'Milk', unit: 'liters', total_stock: 30, reserved_stock: 5, reorder_threshold: 15 },
    { name: 'Coffee Beans', unit: 'kg', total_stock: 10, reserved_stock: 2, reorder_threshold: 5 },
    { name: 'Tea Leaves', unit: 'kg', total_stock: 8, reserved_stock: 1, reorder_threshold: 4 },
    // Dessert ingredients
    { name: 'Chocolate', unit: 'kg', total_stock: 8, reserved_stock: 2, reorder_threshold: 5 },
    { name: 'Vanilla Ice Cream', unit: 'liters', total_stock: 20, reserved_stock: 4, reorder_threshold: 10 },
    { name: 'Mascarpone', unit: 'kg', total_stock: 5, reserved_stock: 1, reorder_threshold: 3 },
    { name: 'Ladyfingers', unit: 'packs', total_stock: 10, reserved_stock: 2, reorder_threshold: 5 },
    { name: 'Cream Cheese', unit: 'kg', total_stock: 8, reserved_stock: 2, reorder_threshold: 4 },
    // Condiments
    { name: 'Burger Buns', unit: 'pieces', total_stock: 50, reserved_stock: 10, reorder_threshold: 25 },
    { name: 'Cheese Slices', unit: 'pieces', total_stock: 40, reserved_stock: 8, reorder_threshold: 20 },
  ];

  const createdInventoryItems: any = {};
  for (const item of inventoryItemsData) {
    const inventoryItem = await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
    createdInventoryItems[item.name] = inventoryItem;
  }
  console.log(`✅ Created/updated ${inventoryItemsData.length} inventory items`);

  // --- Seed Recipes (RecipeItems) ---
  console.log('📖 Creating recipes (linking menu items to ingredients)...');
  
  const recipes = [
    // Bruschetta
    {
      menuItemName: 'Bruschetta',
      ingredients: [
        { name: 'Tomatoes', quantity: 0.2, unit: 'kg' },
        { name: 'Garlic', quantity: 0.02, unit: 'kg' },
        { name: 'Fresh Basil', quantity: 0.01, unit: 'kg' },
        { name: 'Olive Oil', quantity: 0.05, unit: 'liters' },
      ],
    },
    // Mozzarella Sticks
    {
      menuItemName: 'Mozzarella Sticks',
      ingredients: [
        { name: 'Mozzarella Cheese', quantity: 0.15, unit: 'kg' },
        { name: 'Tomato Sauce', quantity: 0.05, unit: 'liters' },
      ],
    },
    // Caesar Salad
    {
      menuItemName: 'Caesar Salad',
      ingredients: [
        { name: 'Lettuce', quantity: 0.2, unit: 'kg' },
        { name: 'Parmesan Cheese', quantity: 0.05, unit: 'kg' },
        { name: 'Olive Oil', quantity: 0.03, unit: 'liters' },
      ],
    },
    // Margherita Pizza
    {
      menuItemName: 'Margherita Pizza',
      ingredients: [
        { name: 'Pizza Dough', quantity: 0.3, unit: 'kg' },
        { name: 'Tomato Sauce', quantity: 0.1, unit: 'liters' },
        { name: 'Mozzarella Cheese', quantity: 0.2, unit: 'kg' },
        { name: 'Fresh Basil', quantity: 0.01, unit: 'kg' },
        { name: 'Olive Oil', quantity: 0.02, unit: 'liters' },
      ],
    },
    // Grilled Salmon
    {
      menuItemName: 'Grilled Salmon',
      ingredients: [
        { name: 'Salmon Fillet', quantity: 0.25, unit: 'kg' },
        { name: 'Butter', quantity: 0.03, unit: 'kg' },
        { name: 'Bell Peppers', quantity: 0.1, unit: 'kg' },
        { name: 'Onions', quantity: 0.05, unit: 'kg' },
      ],
    },
    // Beef Burger
    {
      menuItemName: 'Beef Burger',
      ingredients: [
        { name: 'Beef Patty', quantity: 0.2, unit: 'kg' },
        { name: 'Burger Buns', quantity: 1, unit: 'pieces' },
        { name: 'Lettuce', quantity: 0.05, unit: 'kg' },
        { name: 'Tomatoes', quantity: 0.05, unit: 'kg' },
        { name: 'Cheese Slices', quantity: 2, unit: 'pieces' },
        { name: 'Onions', quantity: 0.03, unit: 'kg' },
      ],
    },
    // Chicken Alfredo Pasta
    {
      menuItemName: 'Chicken Alfredo Pasta',
      ingredients: [
        { name: 'Pasta', quantity: 0.2, unit: 'kg' },
        { name: 'Chicken Breast', quantity: 0.15, unit: 'kg' },
        { name: 'Fresh Cream', quantity: 0.15, unit: 'liters' },
        { name: 'Parmesan Cheese', quantity: 0.05, unit: 'kg' },
        { name: 'Garlic', quantity: 0.01, unit: 'kg' },
        { name: 'Butter', quantity: 0.02, unit: 'kg' },
      ],
    },
    // Vegetable Stir Fry
    {
      menuItemName: 'Vegetable Stir Fry',
      ingredients: [
        { name: 'Bell Peppers', quantity: 0.15, unit: 'kg' },
        { name: 'Onions', quantity: 0.1, unit: 'kg' },
        { name: 'Garlic', quantity: 0.02, unit: 'kg' },
        { name: 'Olive Oil', quantity: 0.03, unit: 'liters' },
      ],
    },
    // Tiramisu
    {
      menuItemName: 'Tiramisu',
      ingredients: [
        { name: 'Mascarpone', quantity: 0.15, unit: 'kg' },
        { name: 'Ladyfingers', quantity: 1, unit: 'packs' },
        { name: 'Coffee Beans', quantity: 0.02, unit: 'kg' },
        { name: 'Chocolate', quantity: 0.02, unit: 'kg' },
      ],
    },
    // Chocolate Lava Cake
    {
      menuItemName: 'Chocolate Lava Cake',
      ingredients: [
        { name: 'Chocolate', quantity: 0.1, unit: 'kg' },
        { name: 'Butter', quantity: 0.05, unit: 'kg' },
        { name: 'Vanilla Ice Cream', quantity: 0.1, unit: 'liters' },
      ],
    },
    // Cheesecake
    {
      menuItemName: 'Cheesecake',
      ingredients: [
        { name: 'Cream Cheese', quantity: 0.2, unit: 'kg' },
        { name: 'Butter', quantity: 0.03, unit: 'kg' },
      ],
    },
    // Fresh Orange Juice
    {
      menuItemName: 'Fresh Orange Juice',
      ingredients: [
        { name: 'Orange Juice', quantity: 0.3, unit: 'liters' },
      ],
    },
    // Cappuccino
    {
      menuItemName: 'Cappuccino',
      ingredients: [
        { name: 'Coffee Beans', quantity: 0.02, unit: 'kg' },
        { name: 'Milk', quantity: 0.15, unit: 'liters' },
      ],
    },
    // Iced Tea
    {
      menuItemName: 'Iced Tea',
      ingredients: [
        { name: 'Tea Leaves', quantity: 0.01, unit: 'kg' },
      ],
    },
  ];

  let recipeCount = 0;
  for (const recipe of recipes) {
    const menuItem = createdMenuItems.find(item => item.name === recipe.menuItemName);
    if (!menuItem) {
      console.log(`⚠️  Menu item not found: ${recipe.menuItemName}`);
      continue;
    }

    for (const ingredient of recipe.ingredients) {
      const inventoryItem = createdInventoryItems[ingredient.name];
      if (!inventoryItem) {
        console.log(`⚠️  Inventory item not found: ${ingredient.name}`);
        continue;
      }

      await prisma.recipeItem.upsert({
        where: {
          menu_item_id_ingredient_id: {
            menu_item_id: menuItem.id,
            ingredient_id: inventoryItem.id,
          },
        },
        update: {
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        },
        create: {
          menu_item_id: menuItem.id,
          ingredient_id: inventoryItem.id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        },
      });
      recipeCount++;
    }
  }
  console.log(`✅ Created/updated ${recipeCount} recipe items for ${recipes.length} menu items`);

  // --- Seed Tables ---
  console.log('🪑 Creating tables...');
  const tables = [
    { table_number: 1, capacity: 2 },
    { table_number: 2, capacity: 2 },
    { table_number: 3, capacity: 4 },
    { table_number: 4, capacity: 4 },
    { table_number: 5, capacity: 4 },
    { table_number: 6, capacity: 6 },
    { table_number: 7, capacity: 6 },
    { table_number: 8, capacity: 8 },
  ];

  const createdTables = [];
  for (const table of tables) {
    const createdTable = await prisma.table.upsert({
      where: { table_number: table.table_number },
      update: {},
      create: {
        table_number: table.table_number,
        capacity: table.capacity,
        restaurant_id: 'default-restaurant',
      },
    });
    createdTables.push(createdTable);
  }
  console.log(`✅ Created/updated ${tables.length} tables`);

  // --- Seed Orders ---
  console.log('🍽️ Creating orders...');
  const now = new Date();
  
  // Active order - Placed
  const order1 = await prisma.order.create({
    data: {
      customer_id: customerUsers[0].id,
      table_id: createdTables[4].id,
      created_by_role: Role.customer,
      order_status: OrderStatus.placed,
      payment_status: PaymentStatus.unpaid,
      total_amount: 45.50,
      created_at: new Date(now.getTime() - 5 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price_at_order: 15.99,
            custom_instructions: 'Extra cheese please',
          },
          {
            menu_item_id: createdMenuItems[11].id,
            quantity: 2,
            price_at_order: 4.99,
          },
          {
            menu_item_id: createdMenuItems[9].id,
            quantity: 1,
            price_at_order: 8.99,
          },
        ],
      },
    },
  });

  // Active order - Preparing
  const order2 = await prisma.order.create({
    data: {
      customer_id: customerUsers[1].id,
      table_id: createdTables[6].id,
      created_by_role: Role.customer,
      order_status: OrderStatus.preparing,
      payment_status: PaymentStatus.unpaid,
      total_amount: 58.95,
      created_at: new Date(now.getTime() - 20 * 60 * 1000),
      updated_at: new Date(now.getTime() - 5 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price_at_order: 15.99,
            custom_instructions: 'Well done, no vegetables',
          },
          {
            menu_item_id: createdMenuItems[2].id,
            quantity: 1,
            price_at_order: 9.99,
          },
        ],
      },
    },
  });

  // Active order - Ready
  const order3 = await prisma.order.create({
    data: {
      customer_id: customerUsers[2].id,
      table_id: createdTables[1].id,
      created_by_role: Role.customer,
      order_status: OrderStatus.ready,
      payment_status: PaymentStatus.unpaid,
      total_amount: 35.96,
      created_at: new Date(now.getTime() - 35 * 60 * 1000),
      updated_at: new Date(now.getTime() - 2 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[6].id,
            quantity: 2,
            price_at_order: 16.99,
          },
          {
            menu_item_id: createdMenuItems[10].id,
            quantity: 1,
            price_at_order: 7.99,
            custom_instructions: 'Warm, with vanilla ice cream',
          },
        ],
      },
    },
  });

  // Completed orders
  const order4 = await prisma.order.create({
    data: {
      customer_id: customerUsers[0].id,
      table_id: createdTables[3].id,
      created_by_role: Role.customer,
      order_status: OrderStatus.completed,
      payment_status: PaymentStatus.paid,
      total_amount: 52.95,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price_at_order: 15.99,
          },
          {
            menu_item_id: createdMenuItems[3].id,
            quantity: 1,
            price_at_order: 14.99,
          },
          {
            menu_item_id: createdMenuItems[9].id,
            quantity: 2,
            price_at_order: 8.99,
          },
        ],
      },
    },
  });

  const order5 = await prisma.order.create({
    data: {
      customer_id: customerUsers[1].id,
      table_id: createdTables[5].id,
      created_by_role: Role.customer,
      order_status: OrderStatus.completed,
      payment_status: PaymentStatus.paid,
      total_amount: 67.94,
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[4].id,
            quantity: 2,
            price_at_order: 22.99,
          },
          {
            menu_item_id: createdMenuItems[10].id,
            quantity: 2,
            price_at_order: 7.99,
          },
        ],
      },
    },
  });

  console.log('✅ Created 5 sample orders (3 active, 2 completed)');

  // --- Seed Reservations ---
  console.log('📅 Creating reservations...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = [
    {
      customer_id: customerUsers[0].id,
      table_id: createdTables[2].id,
      date: new Date(today.getTime() + 19 * 60 * 60 * 1000), // Today 7 PM
      party_size: 4,
      special_request: 'Window seat preferred',
      status: 'confirmed' as any,
    },
    {
      customer_id: customerUsers[1].id,
      table_id: createdTables[3].id,
      date: new Date(today.getTime() + 20 * 60 * 60 * 1000), // Today 8 PM
      party_size: 2,
      special_request: 'Anniversary celebration',
      status: 'confirmed' as any,
    },
    {
      customer_id: customerUsers[2].id,
      table_id: createdTables[5].id,
      date: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // Tomorrow 7 PM
      party_size: 6,
      special_request: 'Birthday party, need high chairs',
      status: 'pending' as any,
    },
  ];

  for (const reservation of reservations) {
    await prisma.reservation.create({
      data: reservation,
    });
  }
  console.log(`✅ Created ${reservations.length} reservations`);

  // --- Seed Historical Inventory Transactions for AI Predictions ---
  console.log('📊 Creating historical inventory transactions...');
  const inventoryStaff = createdStaff.find(s => s.role === Role.inventory);
  
  if (inventoryStaff) {
    let transactionCount = 0;
    // Create transactions for the last 30 days
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const transactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Random usage for some items
      const itemsToUse = [
        { name: 'Tomatoes', usage: Math.random() * 3 + 1 },
        { name: 'Mozzarella Cheese', usage: Math.random() * 2 + 0.5 },
        { name: 'Chicken Breast', usage: Math.random() * 4 + 1 },
        { name: 'Pasta', usage: Math.random() * 5 + 2 },
        { name: 'Coffee Beans', usage: Math.random() * 0.5 + 0.2 },
      ];

      for (const item of itemsToUse) {
        const inventoryItem = createdInventoryItems[item.name];
        if (inventoryItem) {
          await prisma.inventoryTransaction.create({
            data: {
              item_id: inventoryItem.id,
              type: 'deduct',
              quantity: item.usage,
              performed_by_id: inventoryStaff.id,
              note: 'Daily usage',
              created_at: transactionDate
            }
          });
          transactionCount++;
        }
      }
    }
    console.log(`✅ Created ${transactionCount} historical inventory transactions`);
  }

  // --- Seed User Preferences for AI Recommendations ---
  console.log('🎯 Creating user preferences...');
  for (const customer of customerUsers) {
    await prisma.userPreference.upsert({
      where: { user_id: customer.id },
      update: {
        preferred_categories: ['main_course', 'desserts'],
        dietary_restrictions: [],
        favorite_items: [createdMenuItems[5].id, createdMenuItems[3].id],
        price_range: {
          min: 10,
          max: 25,
          avg: 17.5
        }
      },
      create: {
        user_id: customer.id,
        preferred_categories: ['main_course', 'desserts'],
        dietary_restrictions: [],
        favorite_items: [createdMenuItems[5].id, createdMenuItems[3].id],
        price_range: {
          min: 10,
          max: 25,
          avg: 17.5
        }
      }
    });
  }
  console.log(`✅ Created/updated ${customerUsers.length} user preferences`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Menu Items: ${menuItems.length}`);
  console.log(`   - Users: 1 admin + ${customerUsers.length} customers + ${staffData.length} staff`);
  console.log(`   - Inventory Items: ${inventoryItemsData.length}`);
  console.log(`   - Recipe Items: ${recipeCount} (linking menu items to ingredients)`);
  console.log(`   - Tables: ${tables.length}`);
  console.log(`   - Orders: 5 (3 active, 2 completed)`);
  console.log(`   - Reservations: ${reservations.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Customer: customer1@example.com / Customer123!`);
  console.log(`   Kitchen Staff: kitchen@restaurant.com / Staff123!`);
  console.log(`   Reception Staff: reception@restaurant.com / Staff123!`);
  console.log(`   Inventory Staff: inventory@restaurant.com / Staff123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
