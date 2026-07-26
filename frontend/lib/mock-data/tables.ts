export interface MockTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export const mockTables: MockTable[] = [
  { id: 'tbl-1', tableNumber: 1, capacity: 2, status: 'available' },
  { id: 'tbl-2', tableNumber: 2, capacity: 4, status: 'occupied' },
  { id: 'tbl-3', tableNumber: 3, capacity: 4, status: 'reserved' },
  { id: 'tbl-4', tableNumber: 4, capacity: 6, status: 'available' },
  { id: 'tbl-5', tableNumber: 5, capacity: 2, status: 'available' },
  { id: 'tbl-6', tableNumber: 10, capacity: 8, status: 'occupied' },
  { id: 'tbl-7', tableNumber: 11, capacity: 4, status: 'maintenance' },
];
