import { mockUsers } from './users';

export interface MockStaff {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kitchen' | 'reception' | 'inventory';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockStaff: MockStaff[] = [
  // Admin staff
  {
    id: 'admin-1',
    email: 'admin@restaurant.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'admin-2',
    email: 'manager@restaurant.com',
    name: 'Restaurant Manager',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },

  // Kitchen staff
  {
    id: 'kitchen-1',
    email: 'chef@restaurant.com',
    name: 'Chef Mario',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  },
  {
    id: 'kitchen-2',
    email: 'sous.chef@restaurant.com',
    name: 'Sous Chef Anna',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 'kitchen-3',
    email: 'cook@restaurant.com',
    name: 'Line Cook Tom',
    role: 'kitchen',
    isActive: true,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },

  // Inventory staff
  {
    id: 'inventory-1',
    email: 'inventory@restaurant.com',
    name: 'Stock Manager Sarah',
    role: 'inventory',
    isActive: true,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z'
  },
  {
    id: 'inventory-2',
    email: 'warehouse@restaurant.com',
    name: 'Warehouse Manager Mike',
    role: 'inventory',
    isActive: true,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z'
  },

  // Reception staff
  {
    id: 'reception-1',
    email: 'reception@restaurant.com',
    name: 'Front Desk Lisa',
    role: 'reception',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  },
  {
    id: 'reception-2',
    email: 'hostess@restaurant.com',
    name: 'Hostess Emma',
    role: 'reception',
    isActive: true,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z'
  },
  {
    id: 'reception-3',
    email: 'greeter@restaurant.com',
    name: 'Greeter David',
    role: 'reception',
    isActive: false,
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z'
  }
];
