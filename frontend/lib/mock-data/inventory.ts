export interface MockInventoryItem {
  id: string;
  name: string;
  unit: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  reorderThreshold: number;
  category: string;
  supplier?: string;
  lastRestocked?: string;
  createdAt: string;
}

const now = Date.now();

export const mockInventory: MockInventoryItem[] = [
  // Vegetables - Normal stock
  {
    id: 'inv-1',
    name: 'Tomatoes',
    unit: 'kg',
    totalStock: 50,
    reservedStock: 10,
    availableStock: 40,
    reorderThreshold: 20,
    category: 'vegetables',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-2',
    name: 'Lettuce',
    unit: 'kg',
    totalStock: 30,
    reservedStock: 5,
    availableStock: 25,
    reorderThreshold: 15,
    category: 'vegetables',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-3',
    name: 'Onions',
    unit: 'kg',
    totalStock: 40,
    reservedStock: 8,
    availableStock: 32,
    reorderThreshold: 20,
    category: 'vegetables',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-4',
    name: 'Bell Peppers',
    unit: 'kg',
    totalStock: 25,
    reservedStock: 3,
    availableStock: 22,
    reorderThreshold: 10,
    category: 'vegetables',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Dairy - Low stock
  {
    id: 'inv-5',
    name: 'Mozzarella Cheese',
    unit: 'kg',
    totalStock: 8,
    reservedStock: 3,
    availableStock: 5,
    reorderThreshold: 10,
    category: 'dairy',
    supplier: 'Dairy Co',
    lastRestocked: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-6',
    name: 'Parmesan Cheese',
    unit: 'kg',
    totalStock: 6,
    reservedStock: 2,
    availableStock: 4,
    reorderThreshold: 8,
    category: 'dairy',
    supplier: 'Dairy Co',
    lastRestocked: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-7',
    name: 'Fresh Cream',
    unit: 'liters',
    totalStock: 15,
    reservedStock: 4,
    availableStock: 11,
    reorderThreshold: 10,
    category: 'dairy',
    supplier: 'Dairy Co',
    lastRestocked: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Meat - Normal stock
  {
    id: 'inv-8',
    name: 'Chicken Breast',
    unit: 'kg',
    totalStock: 35,
    reservedStock: 8,
    availableStock: 27,
    reorderThreshold: 15,
    category: 'meat',
    supplier: 'Premium Meats',
    lastRestocked: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-9',
    name: 'Beef Steak',
    unit: 'kg',
    totalStock: 20,
    reservedStock: 5,
    availableStock: 15,
    reorderThreshold: 10,
    category: 'meat',
    supplier: 'Premium Meats',
    lastRestocked: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-10',
    name: 'Bacon',
    unit: 'kg',
    totalStock: 12,
    reservedStock: 2,
    availableStock: 10,
    reorderThreshold: 8,
    category: 'meat',
    supplier: 'Premium Meats',
    lastRestocked: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Seafood - Out of stock
  {
    id: 'inv-11',
    name: 'Fresh Fish Fillet',
    unit: 'kg',
    totalStock: 0,
    reservedStock: 0,
    availableStock: 0,
    reorderThreshold: 10,
    category: 'seafood',
    supplier: 'Ocean Fresh',
    lastRestocked: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Pantry - Normal stock
  {
    id: 'inv-12',
    name: 'Pasta',
    unit: 'kg',
    totalStock: 60,
    reservedStock: 12,
    availableStock: 48,
    reorderThreshold: 30,
    category: 'pantry',
    supplier: 'Italian Imports',
    lastRestocked: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-13',
    name: 'Pizza Dough',
    unit: 'kg',
    totalStock: 45,
    reservedStock: 10,
    availableStock: 35,
    reorderThreshold: 25,
    category: 'pantry',
    supplier: 'Italian Imports',
    lastRestocked: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-14',
    name: 'Olive Oil',
    unit: 'liters',
    totalStock: 20,
    reservedStock: 3,
    availableStock: 17,
    reorderThreshold: 10,
    category: 'pantry',
    supplier: 'Italian Imports',
    lastRestocked: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Herbs & Spices - Low stock
  {
    id: 'inv-15',
    name: 'Fresh Basil',
    unit: 'kg',
    totalStock: 3,
    reservedStock: 1,
    availableStock: 2,
    reorderThreshold: 5,
    category: 'herbs',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-16',
    name: 'Garlic',
    unit: 'kg',
    totalStock: 15,
    reservedStock: 3,
    availableStock: 12,
    reorderThreshold: 8,
    category: 'herbs',
    supplier: 'Fresh Farms',
    lastRestocked: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Beverages - Out of stock
  {
    id: 'inv-17',
    name: 'Orange Juice',
    unit: 'liters',
    totalStock: 2,
    reservedStock: 2,
    availableStock: 0,
    reorderThreshold: 15,
    category: 'beverages',
    supplier: 'Beverage Distributors',
    lastRestocked: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-18',
    name: 'Coca Cola',
    unit: 'liters',
    totalStock: 50,
    reservedStock: 8,
    availableStock: 42,
    reorderThreshold: 30,
    category: 'beverages',
    supplier: 'Beverage Distributors',
    lastRestocked: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-19',
    name: 'Coffee Beans',
    unit: 'kg',
    totalStock: 10,
    reservedStock: 2,
    availableStock: 8,
    reorderThreshold: 5,
    category: 'beverages',
    supplier: 'Coffee Roasters',
    lastRestocked: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Dessert ingredients
  {
    id: 'inv-20',
    name: 'Chocolate',
    unit: 'kg',
    totalStock: 8,
    reservedStock: 2,
    availableStock: 6,
    reorderThreshold: 5,
    category: 'desserts',
    supplier: 'Sweet Supplies',
    lastRestocked: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'inv-21',
    name: 'Vanilla Ice Cream',
    unit: 'liters',
    totalStock: 20,
    reservedStock: 4,
    availableStock: 16,
    reorderThreshold: 10,
    category: 'desserts',
    supplier: 'Sweet Supplies',
    lastRestocked: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Helper to get low stock items
export const getLowStockItems = () => {
  return mockInventory.filter(item => item.availableStock <= item.reorderThreshold);
};

// Helper to get out of stock items
export const getOutOfStockItems = () => {
  return mockInventory.filter(item => item.availableStock === 0);
};
