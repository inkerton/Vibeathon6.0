import { mockMenuItems } from './menu';
import { mockUsers } from './users';

export interface MockOrderItem {
  id: string;
  menuItemId: string;
  menuItem: any;
  quantity: number;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  customInstructions?: string;
  allergyInfo?: string;
}

export interface MockOrder {
  id: string;
  customerId: string;
  customer?: any;
  tableNumber: number;
  orderStatus: 'placed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  totalAmount: number;
  gstAmount: number;
  items: MockOrderItem[];
  createdAt: string;
  updatedAt: string;
}

const now = Date.now();

export const mockOrders: MockOrder[] = [
  // Active orders - Placed
  {
    id: 'order-1',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 5,
    orderStatus: 'placed',
    paymentStatus: 'pending',
    totalAmount: 45.50,
    gstAmount: 2.28,
    items: [
      {
        id: 'order-item-1',
        menuItemId: 'menu-6',
        menuItem: mockMenuItems.find(m => m.id === 'menu-6'),
        quantity: 2,
        price: 12.99,
        status: 'pending',
        customInstructions: 'Extra cheese please'
      },
      {
        id: 'order-item-2',
        menuItemId: 'menu-18',
        menuItem: mockMenuItems.find(m => m.id === 'menu-18'),
        quantity: 2,
        price: 2.99,
        status: 'pending',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-3',
        menuItemId: 'menu-14',
        menuItem: mockMenuItems.find(m => m.id === 'menu-14'),
        quantity: 1,
        price: 7.99,
        status: 'pending',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'order-2',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 3,
    orderStatus: 'placed',
    paymentStatus: 'pending',
    totalAmount: 32.97,
    gstAmount: 1.65,
    items: [
      {
        id: 'order-item-4',
        menuItemId: 'menu-8',
        menuItem: mockMenuItems.find(m => m.id === 'menu-8'),
        quantity: 1,
        price: 13.99,
        status: 'pending',
        customInstructions: 'No bacon, vegetarian version',
        allergyInfo: 'Dairy allergy - use dairy-free alternative'
      },
      {
        id: 'order-item-5',
        menuItemId: 'menu-2',
        menuItem: mockMenuItems.find(m => m.id === 'menu-2'),
        quantity: 1,
        price: 9.99,
        status: 'pending',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-6',
        menuItemId: 'menu-19',
        menuItem: mockMenuItems.find(m => m.id === 'menu-19'),
        quantity: 1,
        price: 4.99,
        status: 'pending',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 10 * 60 * 1000).toISOString()
  },

  // Active orders - Preparing
  {
    id: 'order-3',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 7,
    orderStatus: 'preparing',
    paymentStatus: 'pending',
    totalAmount: 58.95,
    gstAmount: 2.95,
    items: [
      {
        id: 'order-item-7',
        menuItemId: 'menu-10',
        menuItem: mockMenuItems.find(m => m.id === 'menu-10'),
        quantity: 2,
        price: 15.99,
        status: 'preparing',
        customInstructions: 'Well done, no vegetables',
        allergyInfo: undefined
      },
      {
        id: 'order-item-8',
        menuItemId: 'menu-3',
        menuItem: mockMenuItems.find(m => m.id === 'menu-3'),
        quantity: 1,
        price: 5.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-9',
        menuItemId: 'menu-20',
        menuItem: mockMenuItems.find(m => m.id === 'menu-20'),
        quantity: 2,
        price: 3.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'order-4',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 12,
    orderStatus: 'preparing',
    paymentStatus: 'pending',
    totalAmount: 41.96,
    gstAmount: 2.10,
    items: [
      {
        id: 'order-item-10',
        menuItemId: 'menu-12',
        menuItem: mockMenuItems.find(m => m.id === 'menu-12'),
        quantity: 2,
        price: 16.99,
        status: 'preparing',
        customInstructions: 'Extra tartar sauce',
        allergyInfo: 'Gluten sensitivity'
      },
      {
        id: 'order-item-11',
        menuItemId: 'menu-21',
        menuItem: mockMenuItems.find(m => m.id === 'menu-21'),
        quantity: 2,
        price: 2.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 8 * 60 * 1000).toISOString()
  },
  {
    id: 'order-5',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 8,
    orderStatus: 'preparing',
    paymentStatus: 'pending',
    totalAmount: 27.97,
    gstAmount: 1.40,
    items: [
      {
        id: 'order-item-12',
        menuItemId: 'menu-7',
        menuItem: mockMenuItems.find(m => m.id === 'menu-7'),
        quantity: 1,
        price: 14.99,
        status: 'preparing',
        customInstructions: 'Thin crust',
        allergyInfo: undefined
      },
      {
        id: 'order-item-13',
        menuItemId: 'menu-1',
        menuItem: mockMenuItems.find(m => m.id === 'menu-1'),
        quantity: 1,
        price: 8.99,
        status: 'preparing',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-14',
        menuItemId: 'menu-18',
        menuItem: mockMenuItems.find(m => m.id === 'menu-18'),
        quantity: 1,
        price: 2.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 10 * 60 * 1000).toISOString()
  },

  // Active orders - Ready
  {
    id: 'order-6',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 2,
    orderStatus: 'ready',
    paymentStatus: 'pending',
    totalAmount: 35.96,
    gstAmount: 1.80,
    items: [
      {
        id: 'order-item-15',
        menuItemId: 'menu-9',
        menuItem: mockMenuItems.find(m => m.id === 'menu-9'),
        quantity: 2,
        price: 12.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-16',
        menuItemId: 'menu-15',
        menuItem: mockMenuItems.find(m => m.id === 'menu-15'),
        quantity: 1,
        price: 8.99,
        status: 'ready',
        customInstructions: 'Warm, with vanilla ice cream',
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'order-7',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 10,
    orderStatus: 'ready',
    paymentStatus: 'pending',
    totalAmount: 23.97,
    gstAmount: 1.20,
    items: [
      {
        id: 'order-item-17',
        menuItemId: 'menu-13',
        menuItem: mockMenuItems.find(m => m.id === 'menu-13'),
        quantity: 1,
        price: 11.99,
        status: 'ready',
        customInstructions: 'Spicy',
        allergyInfo: 'Nut allergy'
      },
      {
        id: 'order-item-18',
        menuItemId: 'menu-5',
        menuItem: mockMenuItems.find(m => m.id === 'menu-5'),
        quantity: 1,
        price: 6.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-19',
        menuItemId: 'menu-19',
        menuItem: mockMenuItems.find(m => m.id === 'menu-19'),
        quantity: 1,
        price: 4.99,
        status: 'ready',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 3 * 60 * 1000).toISOString()
  },

  // Completed orders
  {
    id: 'order-8',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 4,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    totalAmount: 52.95,
    gstAmount: 2.65,
    items: [
      {
        id: 'order-item-20',
        menuItemId: 'menu-6',
        menuItem: mockMenuItems.find(m => m.id === 'menu-6'),
        quantity: 2,
        price: 12.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-21',
        menuItemId: 'menu-4',
        menuItem: mockMenuItems.find(m => m.id === 'menu-4'),
        quantity: 1,
        price: 7.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-22',
        menuItemId: 'menu-14',
        menuItem: mockMenuItems.find(m => m.id === 'menu-14'),
        quantity: 2,
        price: 7.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-9',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 6,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    totalAmount: 67.94,
    gstAmount: 3.40,
    items: [
      {
        id: 'order-item-23',
        menuItemId: 'menu-10',
        menuItem: mockMenuItems.find(m => m.id === 'menu-10'),
        quantity: 3,
        price: 15.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-24',
        menuItemId: 'menu-16',
        menuItem: mockMenuItems.find(m => m.id === 'menu-16'),
        quantity: 2,
        price: 7.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-10',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 1,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    totalAmount: 29.97,
    gstAmount: 1.50,
    items: [
      {
        id: 'order-item-25',
        menuItemId: 'menu-8',
        menuItem: mockMenuItems.find(m => m.id === 'menu-8'),
        quantity: 1,
        price: 13.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-26',
        menuItemId: 'menu-2',
        menuItem: mockMenuItems.find(m => m.id === 'menu-2'),
        quantity: 1,
        price: 9.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-27',
        menuItemId: 'menu-19',
        menuItem: mockMenuItems.find(m => m.id === 'menu-19'),
        quantity: 1,
        price: 4.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-11',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 9,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    totalAmount: 44.96,
    gstAmount: 2.25,
    items: [
      {
        id: 'order-item-28',
        menuItemId: 'menu-12',
        menuItem: mockMenuItems.find(m => m.id === 'menu-12'),
        quantity: 2,
        price: 16.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-29',
        menuItemId: 'menu-17',
        menuItem: mockMenuItems.find(m => m.id === 'menu-17'),
        quantity: 1,
        price: 6.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-12',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 11,
    orderStatus: 'completed',
    paymentStatus: 'paid',
    totalAmount: 38.96,
    gstAmount: 1.95,
    items: [
      {
        id: 'order-item-30',
        menuItemId: 'menu-7',
        menuItem: mockMenuItems.find(m => m.id === 'menu-7'),
        quantity: 2,
        price: 14.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      },
      {
        id: 'order-item-31',
        menuItemId: 'menu-15',
        menuItem: mockMenuItems.find(m => m.id === 'menu-15'),
        quantity: 1,
        price: 8.99,
        status: 'served',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 47 * 60 * 60 * 1000).toISOString()
  },

  // Cancelled order
  {
    id: 'order-13',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 15,
    orderStatus: 'cancelled',
    paymentStatus: 'pending',
    totalAmount: 25.98,
    gstAmount: 1.30,
    items: [
      {
        id: 'order-item-32',
        menuItemId: 'menu-9',
        menuItem: mockMenuItems.find(m => m.id === 'menu-9'),
        quantity: 2,
        price: 12.99,
        status: 'pending',
        customInstructions: undefined,
        allergyInfo: undefined
      }
    ],
    createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 71 * 60 * 60 * 1000).toISOString()
  }
];
