import { mockInventory } from './inventory';
import { mockUsers } from './users';

export interface MockInventoryTransaction {
  id: string;
  inventoryItemId: string;
  inventoryItem?: any;
  type: 'restock' | 'deduction' | 'adjustment' | 'reservation' | 'release';
  quantity: number;
  reason: string;
  orderId?: string;
  performedBy: string;
  performedByUser?: any;
  createdAt: string;
}

const now = Date.now();

export const mockTransactions: MockInventoryTransaction[] = [
  // Recent restock transactions
  {
    id: 'trans-1',
    inventoryItemId: 'inv-1',
    inventoryItem: mockInventory.find(i => i.id === 'inv-1'),
    type: 'restock',
    quantity: 20,
    reason: 'Weekly restock from Fresh Farms',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-2',
    inventoryItemId: 'inv-5',
    inventoryItem: mockInventory.find(i => i.id === 'inv-5'),
    type: 'restock',
    quantity: 5,
    reason: 'Emergency restock - low stock alert',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-3',
    inventoryItemId: 'inv-8',
    inventoryItem: mockInventory.find(i => i.id === 'inv-8'),
    type: 'restock',
    quantity: 15,
    reason: 'Daily delivery from Premium Meats',
    performedBy: 'inventory-2',
    performedByUser: mockUsers.find(u => u.id === 'inventory-2'),
    createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-4',
    inventoryItemId: 'inv-13',
    inventoryItem: mockInventory.find(i => i.id === 'inv-13'),
    type: 'restock',
    quantity: 25,
    reason: 'Weekly restock from Italian Imports',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Order-related deductions
  {
    id: 'trans-5',
    inventoryItemId: 'inv-5',
    inventoryItem: mockInventory.find(i => i.id === 'inv-5'),
    type: 'deduction',
    quantity: -0.24,
    reason: 'Order #order-8 completed - 2x Margherita Pizza',
    orderId: 'order-8',
    performedBy: 'system',
    createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-6',
    inventoryItemId: 'inv-13',
    inventoryItem: mockInventory.find(i => i.id === 'inv-13'),
    type: 'deduction',
    quantity: -0.6,
    reason: 'Order #order-8 completed - 2x Margherita Pizza',
    orderId: 'order-8',
    performedBy: 'system',
    createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-7',
    inventoryItemId: 'inv-8',
    inventoryItem: mockInventory.find(i => i.id === 'inv-8'),
    type: 'deduction',
    quantity: -0.75,
    reason: 'Order #order-9 completed - 3x Grilled Chicken',
    orderId: 'order-9',
    performedBy: 'system',
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-8',
    inventoryItemId: 'inv-12',
    inventoryItem: mockInventory.find(i => i.id === 'inv-12'),
    type: 'deduction',
    quantity: -0.2,
    reason: 'Order #order-10 completed - 1x Pasta Carbonara',
    orderId: 'order-10',
    performedBy: 'system',
    createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString()
  },

  // Reservation transactions (stock reserved)
  {
    id: 'trans-9',
    inventoryItemId: 'inv-5',
    inventoryItem: mockInventory.find(i => i.id === 'inv-5'),
    type: 'reservation',
    quantity: -0.24,
    reason: 'Stock reserved for order #order-1',
    orderId: 'order-1',
    performedBy: 'system',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-10',
    inventoryItemId: 'inv-13',
    inventoryItem: mockInventory.find(i => i.id === 'inv-13'),
    type: 'reservation',
    quantity: -0.6,
    reason: 'Stock reserved for order #order-1',
    orderId: 'order-1',
    performedBy: 'system',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-11',
    inventoryItemId: 'inv-12',
    inventoryItem: mockInventory.find(i => i.id === 'inv-12'),
    type: 'reservation',
    quantity: -0.2,
    reason: 'Stock reserved for order #order-2',
    orderId: 'order-2',
    performedBy: 'system',
    createdAt: new Date(now - 10 * 60 * 1000).toISOString()
  },

  // Manual adjustments
  {
    id: 'trans-12',
    inventoryItemId: 'inv-15',
    inventoryItem: mockInventory.find(i => i.id === 'inv-15'),
    type: 'adjustment',
    quantity: -0.5,
    reason: 'Spoilage - wilted basil discarded',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-13',
    inventoryItemId: 'inv-11',
    inventoryItem: mockInventory.find(i => i.id === 'inv-11'),
    type: 'adjustment',
    quantity: -5,
    reason: 'Expired fish - removed from inventory',
    performedBy: 'inventory-2',
    performedByUser: mockUsers.find(u => u.id === 'inventory-2'),
    createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-14',
    inventoryItemId: 'inv-3',
    inventoryItem: mockInventory.find(i => i.id === 'inv-3'),
    type: 'adjustment',
    quantity: 2,
    reason: 'Inventory count correction - found extra stock',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Release transactions (cancelled orders)
  {
    id: 'trans-15',
    inventoryItemId: 'inv-12',
    inventoryItem: mockInventory.find(i => i.id === 'inv-12'),
    type: 'release',
    quantity: 0.4,
    reason: 'Stock released - order #order-13 cancelled',
    orderId: 'order-13',
    performedBy: 'system',
    createdAt: new Date(now - 71 * 60 * 60 * 1000).toISOString()
  },

  // More restock transactions
  {
    id: 'trans-16',
    inventoryItemId: 'inv-2',
    inventoryItem: mockInventory.find(i => i.id === 'inv-2'),
    type: 'restock',
    quantity: 15,
    reason: 'Daily delivery from Fresh Farms',
    performedBy: 'inventory-2',
    performedByUser: mockUsers.find(u => u.id === 'inventory-2'),
    createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-17',
    inventoryItemId: 'inv-18',
    inventoryItem: mockInventory.find(i => i.id === 'inv-18'),
    type: 'restock',
    quantity: 30,
    reason: 'Weekly beverage delivery',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-18',
    inventoryItemId: 'inv-21',
    inventoryItem: mockInventory.find(i => i.id === 'inv-21'),
    type: 'restock',
    quantity: 10,
    reason: 'Dessert supplies restock',
    performedBy: 'inventory-2',
    performedByUser: mockUsers.find(u => u.id === 'inventory-2'),
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
  },

  // More deductions
  {
    id: 'trans-19',
    inventoryItemId: 'inv-13',
    inventoryItem: mockInventory.find(i => i.id === 'inv-13'),
    type: 'deduction',
    quantity: -0.6,
    reason: 'Order #order-11 completed - 2x Pepperoni Pizza',
    orderId: 'order-11',
    performedBy: 'system',
    createdAt: new Date(now - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-20',
    inventoryItemId: 'inv-7',
    inventoryItem: mockInventory.find(i => i.id === 'inv-7'),
    type: 'deduction',
    quantity: -0.3,
    reason: 'Order #order-12 completed - 2x Pepperoni Pizza',
    orderId: 'order-12',
    performedBy: 'system',
    createdAt: new Date(now - 47 * 60 * 60 * 1000).toISOString()
  },

  // Additional adjustments
  {
    id: 'trans-21',
    inventoryItemId: 'inv-17',
    inventoryItem: mockInventory.find(i => i.id === 'inv-17'),
    type: 'adjustment',
    quantity: -8,
    reason: 'Expired orange juice - removed',
    performedBy: 'inventory-1',
    performedByUser: mockUsers.find(u => u.id === 'inventory-1'),
    createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'trans-22',
    inventoryItemId: 'inv-6',
    inventoryItem: mockInventory.find(i => i.id === 'inv-6'),
    type: 'adjustment',
    quantity: -1,
    reason: 'Damaged packaging - discarded',
    performedBy: 'inventory-2',
    performedByUser: mockUsers.find(u => u.id === 'inventory-2'),
    createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];
