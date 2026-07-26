export interface MockMenuItem {
  id: string;
  name: string;
  description: string;
  category: 'appetizer' | 'main_course' | 'dessert' | 'beverage';
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
}

export const mockMenuItems: MockMenuItem[] = [
  // Starters
  {
    id: 'menu-1',
    name: 'Bruschetta',
    description: 'Toasted bread topped with fresh tomatoes, garlic, basil, and olive oil',
    category: 'appetizer',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
    isAvailable: true,
    preparationTime: 10,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-2',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing',
    category: 'appetizer',
    price: 9.99,
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    isAvailable: true,
    preparationTime: 8,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-3',
    name: 'Garlic Bread',
    description: 'Freshly baked bread with garlic butter and herbs',
    category: 'appetizer',
    price: 5.99,
    imageUrl: 'https://images.unsplash.com/photo-1573140401552-388e3ead0b5e?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-4',
    name: 'Mozzarella Sticks',
    description: 'Crispy fried mozzarella with marinara sauce',
    category: 'appetizer',
    price: 7.99,
    imageUrl: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400',
    isAvailable: true,
    preparationTime: 12,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-5',
    name: 'Soup of the Day',
    description: 'Chef\'s special homemade soup',
    category: 'appetizer',
    price: 6.99,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Main Course
  {
    id: 'menu-6',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    category: 'main_course',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    isAvailable: true,
    preparationTime: 15,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-7',
    name: 'Pepperoni Pizza',
    description: 'Loaded with pepperoni and mozzarella cheese',
    category: 'main_course',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    isAvailable: true,
    preparationTime: 15,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-8',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with bacon, eggs, and parmesan',
    category: 'main_course',
    price: 13.99,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    isAvailable: true,
    preparationTime: 18,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-9',
    name: 'Spaghetti Bolognese',
    description: 'Traditional Italian pasta with meat sauce',
    category: 'main_course',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    isAvailable: true,
    preparationTime: 20,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-10',
    name: 'Grilled Chicken',
    description: 'Herb-marinated grilled chicken with vegetables',
    category: 'main_course',
    price: 15.99,
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    isAvailable: true,
    preparationTime: 25,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-11',
    name: 'Beef Steak',
    description: 'Premium beef steak with mashed potatoes',
    category: 'main_course',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    isAvailable: false,
    preparationTime: 30,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-12',
    name: 'Fish and Chips',
    description: 'Crispy battered fish with french fries',
    category: 'main_course',
    price: 16.99,
    imageUrl: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400',
    isAvailable: true,
    preparationTime: 20,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-13',
    name: 'Vegetable Stir Fry',
    description: 'Fresh vegetables in Asian-style sauce with rice',
    category: 'main_course',
    price: 11.99,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    isAvailable: true,
    preparationTime: 15,
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Desserts
  {
    id: 'menu-14',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee and mascarpone',
    category: 'dessert',
    price: 7.99,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-15',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center',
    category: 'dessert',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    isAvailable: true,
    preparationTime: 12,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-16',
    name: 'Cheesecake',
    description: 'New York style cheesecake with berry compote',
    category: 'dessert',
    price: 7.99,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-17',
    name: 'Ice Cream Sundae',
    description: 'Three scoops with toppings and whipped cream',
    category: 'dessert',
    price: 6.99,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Beverages
  {
    id: 'menu-18',
    name: 'Coca Cola',
    description: 'Classic soft drink',
    category: 'beverage',
    price: 2.99,
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    isAvailable: true,
    preparationTime: 2,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-19',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    category: 'beverage',
    price: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    isAvailable: true,
    preparationTime: 3,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-20',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    category: 'beverage',
    price: 3.99,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    isAvailable: true,
    preparationTime: 5,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-21',
    name: 'Iced Tea',
    description: 'Refreshing iced tea with lemon',
    category: 'beverage',
    price: 2.99,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    isAvailable: true,
    preparationTime: 2,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'menu-22',
    name: 'Mineral Water',
    description: 'Still or sparkling water',
    category: 'beverage',
    price: 1.99,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    isAvailable: true,
    preparationTime: 1,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockCategories = ['appetizer', 'main_course', 'dessert', 'beverage'];
