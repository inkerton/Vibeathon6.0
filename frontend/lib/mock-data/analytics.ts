import { mockReservations } from './reservations';
import { mockOrders } from './orders';

export interface MockAnalytics {
  summary: {
    todaysReservations: number;
    pendingCheckIn: number;
    currentlySeated: number;
    pendingPayments: number;
  };
  sales: {
    today: number;
    week: number;
    month: number;
  };
  popularItems: Array<{ name: string; count: number }>;
  peakHours: Array<{ hour: string; count: number }>;
}

const today = new Date().toISOString().split('T')[0];

export const mockAnalytics: MockAnalytics = {
  summary: {
    todaysReservations: mockReservations.filter(r => 
      r.reservationDate === today
    ).length,
    pendingCheckIn: mockReservations.filter(r => 
      r.reservationDate === today && r.status === 'confirmed'
    ).length,
    currentlySeated: mockReservations.filter(r => 
      r.reservationDate === today && r.status === 'checked_in'
    ).length,
    pendingPayments: mockOrders.filter(o => 
      o.paymentStatus === 'pending'
    ).length,
  },
  sales: {
    today: 1250.75,
    week: 8750.50,
    month: 35000.00,
  },
  popularItems: [
    { name: 'Spaghetti Carbonara', count: 150 },
    { name: 'Margherita Pizza', count: 120 },
    { name: 'Chicken Alfredo', count: 95 },
  ],
  peakHours: [
    { hour: '18:00', count: 30 },
    { hour: '19:00', count: 55 },
    { hour: '20:00', count: 45 },
  ]
};
