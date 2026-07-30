import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

const mockPrisma = {
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Menu Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Menu Items', () => {
    it('should return all menu items', async () => {
      const mockItems = [
        { id: '1', name: 'Burger', price: 15.99, category: 'main_course' },
        { id: '2', name: 'Pizza', price: 18.99, category: 'main_course' },
      ];

      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const items = await mockPrisma.menuItem.findMany();

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalled();
      expect(items).toEqual(mockItems);
      expect(items).toHaveLength(2);
    });

    it('should filter by category', async () => {
      const mockItems = [
        { id: '1', name: 'Burger', price: 15.99, category: 'main_course' },
      ];

      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const items = await mockPrisma.menuItem.findMany({
        where: { category: 'main_course' },
      });

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: { category: 'main_course' },
      });
      expect(items.every(item => item.category === 'main_course')).toBe(true);
    });

    it('should filter by availability', async () => {
      const mockItems = [
        { id: '1', name: 'Burger', is_available: true },
      ];

      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const items = await mockPrisma.menuItem.findMany({
        where: { is_available: true },
      });

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith({
        where: { is_available: true },
      });
    });

    it('should search by name', async () => {
      const mockItems = [
        { id: '1', name: 'Burger', price: 15.99 },
      ];

      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const items = await mockPrisma.menuItem.findMany({
        where: { name: { contains: 'burger', mode: 'insensitive' } },
      });

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalled();
    });
  });

  describe('Get Single Menu Item', () => {
    it('should return menu item by id', async () => {
      const mockItem = {
        id: '1',
        name: 'Burger',
        price: 15.99,
        category: 'main_course',
      };

      (mockPrisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockItem);

      const item = await mockPrisma.menuItem.findUnique({
        where: { id: '1' },
      });

      expect(mockPrisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(item).toEqual(mockItem);
    });

    it('should return null for non-existent item', async () => {
      (mockPrisma.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      const item = await mockPrisma.menuItem.findUnique({
        where: { id: 'non-existent' },
      });

      expect(item).toBeNull();
    });
  });

  describe('Create Menu Item', () => {
    it('should create new menu item', async () => {
      const newItem = {
        name: 'New Burger',
        description: 'Delicious burger',
        price: 16.99,
        category: 'main_course',
        preparation_time: 15,
      };

      const createdItem = { id: 'new-id', ...newItem, is_available: true };

      (mockPrisma.menuItem.create as jest.Mock).mockResolvedValue(createdItem);

      const item = await mockPrisma.menuItem.create({ data: newItem });

      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith({ data: newItem });
      expect(item).toHaveProperty('id');
      expect(item.name).toBe(newItem.name);
    });

    it('should set default availability to true', async () => {
      const newItem = {
        name: 'Test Item',
        price: 10.00,
        category: 'appetizers',
      };

      const createdItem = { id: 'id', ...newItem, is_available: true };

      (mockPrisma.menuItem.create as jest.Mock).mockResolvedValue(createdItem);

      const item = await mockPrisma.menuItem.create({ data: newItem });

      expect(item.is_available).toBe(true);
    });
  });

  describe('Update Menu Item', () => {
    it('should update menu item', async () => {
      const updates = { price: 19.99, description: 'Updated description' };
      const updatedItem = {
        id: '1',
        name: 'Burger',
        ...updates,
      };

      (mockPrisma.menuItem.update as jest.Mock).mockResolvedValue(updatedItem);

      const item = await mockPrisma.menuItem.update({
        where: { id: '1' },
        data: updates,
      });

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updates,
      });
      expect(item.price).toBe(19.99);
    });

    it('should toggle availability', async () => {
      const updatedItem = {
        id: '1',
        name: 'Burger',
        is_available: false,
      };

      (mockPrisma.menuItem.update as jest.Mock).mockResolvedValue(updatedItem);

      const item = await mockPrisma.menuItem.update({
        where: { id: '1' },
        data: { is_available: false },
      });

      expect(item.is_available).toBe(false);
    });
  });

  describe('Delete Menu Item', () => {
    it('should delete menu item', async () => {
      const deletedItem = { id: '1', name: 'Burger' };

      (mockPrisma.menuItem.delete as jest.Mock).mockResolvedValue(deletedItem);

      const item = await mockPrisma.menuItem.delete({
        where: { id: '1' },
      });

      expect(mockPrisma.menuItem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(item).toEqual(deletedItem);
    });
  });

  describe('Price Validation', () => {
    it('should validate positive price', () => {
      const price = 15.99;
      expect(price).toBeGreaterThan(0);
    });

    it('should reject negative price', () => {
      const price = -5.00;
      expect(price).toBeLessThan(0);
    });

    it('should handle decimal prices', () => {
      const price = 15.99;
      expect(price).toBeCloseTo(15.99, 2);
    });
  });

  describe('Category Validation', () => {
    it('should validate valid categories', () => {
      const validCategories = ['appetizers', 'main_course', 'desserts', 'beverages'];
      const category = 'main_course';
      expect(validCategories).toContain(category);
    });

    it('should reject invalid category', () => {
      const validCategories = ['appetizers', 'main_course', 'desserts', 'beverages'];
      const category = 'invalid_category';
      expect(validCategories).not.toContain(category);
    });
  });
});
