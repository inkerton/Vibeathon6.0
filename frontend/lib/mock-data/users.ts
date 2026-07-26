export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'customer' | 'kitchen' | 'reception' | 'inventory';
  isActive: boolean;
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  // Admin users
  {
    id: 'admin-1',
    email: 'admin@restaurant.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'admin-2',
    email: 'manager@restaurant.com',
    password: 'manager123',
    name: 'Restaurant Manager',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  
  // Customer users
  {
    id: 'customer-1',
    email: 'customer@example.com',
    password: 'customer123',
    name: 'John Doe',
    role: 'customer',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'customer-2',
    email: 'jane.smith@example.com',
    password: 'customer123',
    name: 'Jane Smith',
    role: 'customer',
    isActive: true,
    createdAt: '2024-02-10T00:00:00Z'
  },
  {
    id: 'customer-3',
    email: 'bob.wilson@example.com',
    password: 'customer123',
    name: 'Bob Wilson',
    role: 'customer',
    isActive: true,
    createdAt: '2024-02-15T00:00:00Z'
  },
  
  // Kitchen staff
  {
    id: 'kitchen-1',
    email: 'chef@restaurant.com',
    password: 'chef123',
    name: 'Chef Mario',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'kitchen-2',
    email: 'sous.chef@restaurant.com',
    password: 'chef123',
    name: 'Sous Chef Anna',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 'kitchen-3',
    email: 'cook@restaurant.com',
    password: 'chef123',
    name: 'Line Cook Tom',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-20T00:00:00Z'
  },
  
  // Inventory staff
  {
    id: 'inventory-1',
    email: 'inventory@restaurant.com',
    password: 'inventory123',
    name: 'Stock Manager Sarah',
    role: 'inventory',
    isActive: true,
    createdAt: '2024-01-08T00:00:00Z'
  },
  {
    id: 'inventory-2',
    email: 'warehouse@restaurant.com',
    password: 'inventory123',
    name: 'Warehouse Manager Mike',
    role: 'inventory',
    isActive: true,
    createdAt: '2024-01-12T00:00:00Z'
  },
  
  // Reception staff
  {
    id: 'reception-1',
    email: 'reception@restaurant.com',
    password: 'reception123',
    name: 'Front Desk Lisa',
    role: 'reception',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z'
  },
  {
    id: 'reception-2',
    email: 'hostess@restaurant.com',
    password: 'reception123',
    name: 'Hostess Emma',
    role: 'reception',
    isActive: true,
    createdAt: '2024-01-18T00:00:00Z'
  },
  {
    id: 'reception-3',
    email: 'greeter@restaurant.com',
    password: 'reception123',
    name: 'Greeter David',
    role: 'reception',
    isActive: false,
    createdAt: '2024-01-25T00:00:00Z'
  }
];

export const mockCurrentUser = mockUsers[0]; // Default to admin
