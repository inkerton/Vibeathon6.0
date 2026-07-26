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
    { email: 'reception@restaurant.com', name: 'Sarah Reception', role: Role.reception, phone: '+1234567894' },
    { email: 'inventory@restaurant.com', name: 'Tom Inventory', role: Role.inventory, phone: '+1234567895' },
  ];

  for (const staff of staffData) {
    const hashedPassword = await bcrypt.hash('Staff123!', 10);
    await prisma.user.upsert({
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
  }
  console.log(`✅ Created/updated ${staffData.length} staff users`);

  // --- Seed Inventory Items ---
  console.log('📦 Creating inventory items...');
  const inventoryItems = [
    // Vegetables
    { name: 'Tomatoes', unit: 'kg', total_quantity: 50, reserved_quantity: 10, reorder_level: 20, reorder_quantity: 30 },
    { name: 'Lettuce', unit: 'kg', total_quantity: 30, reserved_quantity: 5, reorder_level: 15, reorder_quantity: 20 },
    { name: 'Onions', unit: 'kg', total_quantity: 40, reserved_quantity: 8, reorder_level: 20, reorder_quantity: 25 },
    { name: 'Bell Peppers', unit: 'kg', total_quantity: 25, reserved_quantity: 3, reorder_level: 10, reorder_quantity: 15 },
    // Dairy - Low stock
    { name: 'Mozzarella Cheese', unit: 'kg', total_quantity: 8, reserved_quantity: 3, reorder_level: 10, reorder_quantity: 15 },
    { name: 'Parmesan Cheese', unit: 'kg', total_quantity: 6, reserved_quantity: 2, reorder_level: 8, reorder_quantity: 12 },
    { name: 'Fresh Cream', unit: 'liters', total_quantity: 15, reserved_quantity: 4, reorder_level: 10, reorder_quantity: 20 },
    // Meat
    { name: 'Chicken Breast', unit: 'kg', total_quantity: 35, reserved_quantity: 8, reorder_level: 15, reorder_quantity: 25 },
    { name: 'Beef Steak', unit: 'kg', total_quantity: 20, reserved_quantity: 5, reorder_level: 10, reorder_quantity: 15 },
    { name: 'Bacon', unit: 'kg', total_quantity: 12, reserved_quantity: 2, reorder_level: 8, reorder_quantity: 10 },
    // Seafood - Out of stock
    { name: 'Fresh Fish Fillet', unit: 'kg', total_quantity: 0, reserved_quantity: 0, reorder_level: 10, reorder_quantity: 15 },
    // Pantry
    { name: 'Pasta', unit: 'kg', total_quantity: 60, reserved_quantity: 12, reorder_level: 30, reorder_quantity: 40 },
    { name: 'Pizza Dough', unit: 'kg', total_quantity: 45, reserved_quantity: 10, reorder_level: 25, reorder_quantity: 35 },
    { name: 'Olive Oil', unit: 'liters', total_quantity: 20, reserved_quantity: 3, reorder_level: 10, reorder_quantity: 15 },
    // Herbs - Low stock
    { name: 'Fresh Basil', unit: 'kg', total_quantity: 3, reserved_quantity: 1, reorder_level: 5, reorder_quantity: 8 },
    { name: 'Garlic', unit: 'kg', total_quantity: 15, reserved_quantity: 3, reorder_level: 8, reorder_quantity: 12 },
    // Beverages
    { name: 'Orange Juice', unit: 'liters', total_quantity: 2, reserved_quantity: 2, reorder_level: 15, reorder_quantity: 25 },
    { name: 'Coca Cola', unit: 'liters', total_quantity: 50, reserved_quantity: 8, reorder_level: 30, reorder_quantity: 40 },
    { name: 'Coffee Beans', unit: 'kg', total_quantity: 10, reserved_quantity: 2, reorder_level: 5, reorder_quantity: 10 },
    // Dessert ingredients
    { name: 'Chocolate', unit: 'kg', total_quantity: 8, reserved_quantity: 2, reorder_level: 5, reorder_quantity: 10 },
    { name: 'Vanilla Ice Cream', unit: 'liters', total_quantity: 20, reserved_quantity: 4, reorder_level: 10, reorder_quantity: 15 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }
  console.log(`✅ Created/updated ${inventoryItems.length} inventory items`);

  // --- Seed Orders ---
  console.log('🍽️ Creating orders...');
  const now = new Date();
  
  // Active order - Placed
  const order1 = await prisma.order.create({
    data: {
      customer_id: customerUsers[0].id,
      table_number: 5,
      order_status: OrderStatus.placed,
      payment_status: PaymentStatus.pending,
      total_amount: 45.50,
      gst_amount: 2.28,
      created_at: new Date(now.getTime() - 5 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price: 12.99,
            custom_instructions: 'Extra cheese please',
          },
          {
            menu_item_id: createdMenuItems[11].id,
            quantity: 2,
            price: 2.99,
          },
          {
            menu_item_id: createdMenuItems[9].id,
            quantity: 1,
            price: 7.99,
          },
        ],
      },
    },
  });

  // Active order - Preparing
  const order2 = await prisma.order.create({
    data: {
      customer_id: customerUsers[1].id,
      table_number: 7,
      order_status: OrderStatus.preparing,
      payment_status: PaymentStatus.pending,
      total_amount: 58.95,
      gst_amount: 2.95,
      created_at: new Date(now.getTime() - 20 * 60 * 1000),
      updated_at: new Date(now.getTime() - 5 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price: 15.99,
            custom_instructions: 'Well done, no vegetables',
          },
          {
            menu_item_id: createdMenuItems[2].id,
            quantity: 1,
            price: 5.99,
          },
        ],
      },
    },
  });

  // Active order - Ready
  const order3 = await prisma.order.create({
    data: {
      customer_id: customerUsers[2].id,
      table_number: 2,
      order_status: OrderStatus.ready,
      payment_status: PaymentStatus.pending,
      total_amount: 35.96,
      gst_amount: 1.80,
      created_at: new Date(now.getTime() - 35 * 60 * 1000),
      updated_at: new Date(now.getTime() - 2 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[6].id,
            quantity: 2,
            price: 12.99,
          },
          {
            menu_item_id: createdMenuItems[10].id,
            quantity: 1,
            price: 8.99,
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
      table_number: 4,
      order_status: OrderStatus.completed,
      payment_status: PaymentStatus.paid,
      total_amount: 52.95,
      gst_amount: 2.65,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 2,
            price: 12.99,
          },
          {
            menu_item_id: createdMenuItems[3].id,
            quantity: 1,
            price: 7.99,
          },
          {
            menu_item_id: createdMenuItems[9].id,
            quantity: 2,
            price: 7.99,
          },
        ],
      },
    },
  });

  const order5 = await prisma.order.create({
    data: {
      customer_id: customerUsers[1].id,
      table_number: 6,
      order_status: OrderStatus.completed,
      payment_status: PaymentStatus.paid,
      total_amount: 67.94,
      gst_amount: 3.40,
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      items: {
        create: [
          {
            menu_item_id: createdMenuItems[5].id,
            quantity: 3,
            price: 15.99,
          },
          {
            menu_item_id: createdMenuItems[10].id,
            quantity: 2,
            price: 7.99,
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
      reservation_date: new Date(today.getTime() + 19 * 60 * 60 * 1000), // Today 7 PM
      party_size: 4,
      special_requests: 'Window seat preferred',
      status: 'confirmed',
    },
    {
      customer_id: customerUsers[1].id,
      reservation_date: new Date(today.getTime() + 20 * 60 * 60 * 1000), // Today 8 PM
      party_size: 2,
      special_requests: 'Anniversary celebration',
      status: 'confirmed',
    },
    {
      customer_id: customerUsers[2].id,
      reservation_date: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000), // Tomorrow 7 PM
      party_size: 6,
      special_requests: 'Birthday party, need high chairs',
      status: 'pending',
    },
  ];

  for (const reservation of reservations) {
    await prisma.reservation.create({
      data: reservation,
    });
  }
  console.log(`✅ Created ${reservations.length} reservations`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Menu Items: ${menuItems.length}`);
  console.log(`   - Users: 1 admin + ${customerUsers.length} customers + ${staffData.length} staff`);
  console.log(`   - Inventory Items: ${inventoryItems.length}`);
  console.log(`   - Orders: 5 (3 active, 2 completed)`);
  console.log(`   - Reservations: ${reservations.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Customer: customer1@example.com / Customer123!`);
  console.log(`   Kitchen: kitchen@restaurant.com / Staff123!`);
  console.log(`   Reception: reception@restaurant.com / Staff123!`);
  console.log(`   Inventory: inventory@restaurant.com / Staff123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });