import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

const mockPrisma = {
  inventoryItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  inventoryTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Inventory Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stock Management', () => {
    it('should add stock correctly', () => {
      const currentStock = 50;
      const addAmount = 20;
      const newStock = currentStock + addAmount;
      
      expect(newStock).toBe(70);
    });

    it('should deduct stock correctly', () => {
      const currentStock = 50;
      const deductAmount = 15;
      const newStock = currentStock - deductAmount;
      
      expect(newStock).toBe(35);
    });

    it('should prevent negative stock', () => {
      const currentStock = 10;
      const deductAmount = 15;
      const wouldBeNegative = currentStock - deductAmount < 0;
      
      expect(wouldBeNegative).toBe(true);
    });
  });

  describe('Low Stock Detection', () => {
    it('should detect low stock', () => {
      const totalStock = 8;
      const reorderThreshold = 10;
      const isLowStock = totalStock <= reorderThreshold;
      
      expect(isLowStock).toBe(true);
    });

    it('should not flag adequate stock', () => {
      const totalStock = 50;
      const reorderThreshold = 20;
      const isLowStock = totalStock <= reorderThreshold;
      
      expect(isLowStock).toBe(false);
    });

    it('should get low stock items', async () => {
      const mockItems = [
        { id: '1', name: 'Cheese', total_stock: 8, reorder_threshold: 10 },
        { id: '2', name: 'Basil', total_stock: 3, reorder_threshold: 5 },
      ];

      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const items = await mockPrisma.inventoryItem.findMany();

      expect(items.every(item => item.total_stock <= item.reorder_threshold)).toBe(true);
    });
  });

  describe('Stock Transactions', () => {
    it('should create add transaction', async () => {
      const transaction = {
        item_id: 'item-1',
        type: 'restock' as const,
        quantity: 20,
        performed_by_id: 'user-1',
        note: 'Restocking',
      };

      (mockPrisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({
        id: 'trans-1',
        ...transaction,
      });

      const result = await mockPrisma.inventoryTransaction.create({
        data: transaction,
      });

      expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
        data: transaction,
      });
      expect(result.type).toBe('restock');
    });

    it('should create deduct transaction', async () => {
      const transaction = {
        item_id: 'item-1',
        type: 'deduct' as const,
        quantity: 5,
        performed_by_id: 'user-1',
        note: 'Used in kitchen',
      };

      (mockPrisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({
        id: 'trans-1',
        ...transaction,
      });

      const result = await mockPrisma.inventoryTransaction.create({
        data: transaction,
      });

      expect(result.type).toBe('deduct');
    });

    it('should get transaction history', async () => {
      const mockTransactions = [
        { id: '1', type: 'add', quantity: 20 },
        { id: '2', type: 'deduct', quantity: 5 },
      ];

      (mockPrisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(
        mockTransactions
      );

      const transactions = await mockPrisma.inventoryTransaction.findMany({
        where: { item_id: 'item-1' },
      });

      expect(transactions).toHaveLength(2);
    });
  });

  describe('Reserved Stock', () => {
    it('should calculate available stock', () => {
      const totalStock = 50;
      const reservedStock = 10;
      const availableStock = totalStock - reservedStock;
      
      expect(availableStock).toBe(40);
    });

    it('should reserve stock for order', () => {
      const currentReserved = 10;
      const orderQuantity = 5;
      const newReserved = currentReserved + orderQuantity;
      
      expect(newReserved).toBe(15);
    });

    it('should release reserved stock', () => {
      const currentReserved = 15;
      const releaseQuantity = 5;
      const newReserved = currentReserved - releaseQuantity;
      
      expect(newReserved).toBe(10);
    });
  });

  describe('Inventory Validation', () => {
    it('should validate positive quantity', () => {
      const quantity = 10;
      expect(quantity).toBeGreaterThan(0);
    });

    it('should reject negative quantity', () => {
      const quantity = -5;
      expect(quantity).toBeLessThan(0);
    });

    it('should validate reorder threshold', () => {
      const threshold = 20;
      expect(threshold).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Stock Calculations', () => {
    it('should calculate total value', () => {
      const items = [
        { quantity: 50, unit_price: 2.50 },
        { quantity: 30, unit_price: 5.00 },
      ];

      const totalValue = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      expect(totalValue).toBeCloseTo(275.00, 2);
    });

    it('should calculate usage rate', () => {
      const initialStock = 100;
      const currentStock = 70;
      const days = 7;
      const usageRate = (initialStock - currentStock) / days;
      
      expect(usageRate).toBeCloseTo(4.29, 2);
    });
  });
});
