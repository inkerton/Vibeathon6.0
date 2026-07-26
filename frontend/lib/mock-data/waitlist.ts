export interface MockWaitlistEntry {
  id: string;
  customerName: string;
  partySize: number;
  quotedTime: number; // in minutes
  status: 'waiting' | 'seated' | 'cancelled';
  createdAt: string;
}

const now = Date.now();

export const mockWaitlist: MockWaitlistEntry[] = [
  {
    id: 'wait-1',
    customerName: 'Frank Castle',
    partySize: 3,
    quotedTime: 15,
    status: 'waiting',
    createdAt: new Date(now - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'wait-2',
    customerName: 'Jessica Jones',
    partySize: 2,
    quotedTime: 20,
    status: 'waiting',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString()
  }
];
