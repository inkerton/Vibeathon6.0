import { PrismaClient } from '@prisma/client';

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

  console.log('📝 Creating menu items...');
  
  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log(`✅ Created ${menuItems.length} menu items`);
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

