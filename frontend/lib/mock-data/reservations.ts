import { mockUsers } from './users';

export interface MockReservation {
  id: string;
  customerId: string;
  customer?: any;
  tableNumber: number;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockTable {
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

const now = Date.now();
const today = new Date(now);
const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
const dayAfterTomorrow = new Date(now + 48 * 60 * 60 * 1000);

export const mockReservations: MockReservation[] = [
  // Pending reservations
  {
    id: 'reservation-1',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 5,
    partySize: 4,
    reservationDate: tomorrow.toISOString().split('T')[0],
    reservationTime: '19:00',
    status: 'pending',
    specialRequests: 'Window seat preferred',
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-2',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 8,
    partySize: 2,
    reservationDate: tomorrow.toISOString().split('T')[0],
    reservationTime: '20:00',
    status: 'pending',
    specialRequests: undefined,
    createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-3',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 12,
    partySize: 6,
    reservationDate: dayAfterTomorrow.toISOString().split('T')[0],
    reservationTime: '18:30',
    status: 'pending',
    specialRequests: 'Birthday celebration - need cake service',
    createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 30 * 60 * 1000).toISOString()
  },

  // Confirmed reservations
  {
    id: 'reservation-4',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 3,
    partySize: 2,
    reservationDate: today.toISOString().split('T')[0],
    reservationTime: '19:30',
    status: 'confirmed',
    specialRequests: 'Quiet area please',
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-5',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 7,
    partySize: 4,
    reservationDate: today.toISOString().split('T')[0],
    reservationTime: '20:30',
    status: 'confirmed',
    specialRequests: undefined,
    createdAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-6',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 10,
    partySize: 3,
    reservationDate: tomorrow.toISOString().split('T')[0],
    reservationTime: '19:00',
    status: 'confirmed',
    specialRequests: 'High chair needed for toddler',
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-7',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 14,
    partySize: 8,
    reservationDate: dayAfterTomorrow.toISOString().split('T')[0],
    reservationTime: '19:30',
    status: 'confirmed',
    specialRequests: 'Business dinner - need privacy',
    createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 48 * 60 * 60 * 1000).toISOString()
  },

  // Checked in reservations (currently dining)
  {
    id: 'reservation-8',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 2,
    partySize: 2,
    reservationDate: today.toISOString().split('T')[0],
    reservationTime: '18:00',
    status: 'checked_in',
    specialRequests: undefined,
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-9',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 6,
    partySize: 4,
    reservationDate: today.toISOString().split('T')[0],
    reservationTime: '18:30',
    status: 'checked_in',
    specialRequests: 'Anniversary dinner',
    createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 45 * 60 * 1000).toISOString()
  },

  // Completed reservations
  {
    id: 'reservation-10',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 4,
    partySize: 2,
    reservationDate: new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reservationTime: '19:00',
    status: 'completed',
    specialRequests: undefined,
    createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 22 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-11',
    customerId: 'customer-2',
    customer: mockUsers.find(u => u.id === 'customer-2'),
    tableNumber: 9,
    partySize: 6,
    reservationDate: new Date(now - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    reservationTime: '20:00',
    status: 'completed',
    specialRequests: 'Family gathering',
    createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 46 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'reservation-12',
    customerId: 'customer-3',
    customer: mockUsers.find(u => u.id === 'customer-3'),
    tableNumber: 11,
    partySize: 4,
    reservationDate: new Date(now - 72 * 60 * 60 * 1000).toISOString().split('T')[0],
    reservationTime: '19:30',
    status: 'completed',
    specialRequests: undefined,
    createdAt: new Date(now - 96 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 70 * 60 * 60 * 1000).toISOString()
  },

  // Cancelled reservation
  {
    id: 'reservation-13',
    customerId: 'customer-1',
    customer: mockUsers.find(u => u.id === 'customer-1'),
    tableNumber: 15,
    partySize: 3,
    reservationDate: new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reservationTime: '20:30',
    status: 'cancelled',
    specialRequests: 'Outdoor seating',
    createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString()
  }
];

export const mockTables: MockTable[] = [
  { number: 1, capacity: 2, status: 'available' },
  { number: 2, capacity: 2, status: 'occupied' }, // reservation-8
  { number: 3, capacity: 4, status: 'reserved' }, // reservation-4
  { number: 4, capacity: 2, status: 'available' },
  { number: 5, capacity: 4, status: 'occupied' }, // order-1
  { number: 6, capacity: 4, status: 'occupied' }, // reservation-9
  { number: 7, capacity: 4, status: 'occupied' }, // order-3
  { number: 8, capacity: 2, status: 'occupied' }, // order-5
  { number: 9, capacity: 6, status: 'available' },
  { number: 10, capacity: 4, status: 'occupied' }, // order-7
  { number: 11, capacity: 4, status: 'available' },
  { number: 12, capacity: 6, status: 'occupied' }, // order-4
  { number: 13, capacity: 8, status: 'available' },
  { number: 14, capacity: 8, status: 'available' },
  { number: 15, capacity: 2, status: 'available' }
];
