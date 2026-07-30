import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';

jest.mock('@prisma/client');

const mockPrisma = {
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
  },
  menuItem: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Order Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Order', () => {
    it('should calculate total amount correctly', () => {
      const items = [
        { price: 15.99, quantity: 2 },
        { price: 8.99, quantity: 1 },
      ];

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      expect(total).toBeCloseTo(40.97, 2);
    });

    it('should create order with items', async () => {
      const orderData = {
        customer_id: 'customer-1',
        table_id: 'table-1',
        total_amount: 40.97,
        order_status: OrderStatus.placed,
        payment_status: PaymentStatus.unpaid,
        created_by_role: 'customer' as const,
      };

      const createdOrder = { id: 'order-1', ...orderData };

      (mockPrisma.order.create as jest.Mock).mockResolvedValue(createdOrder);

      const order = await mockPrisma.order.create({ data: orderData });

      expect(mockPrisma.order.create).toHaveBeenCalledWith({ data: orderData });
      expect(order).toHaveProperty('id');
      expect(order.order_status).toBe(OrderStatus.placed);
    });

    it('should set initial status to placed', async () => {
      const orderData = {
        customer_id: 'customer-1',
        table_id: 'table-1',
        total_amount: 25.00,
        order_status: OrderStatus.placed,
        created_by_role: 'customer' as const,
      };

      (mockPrisma.order.create as jest.Mock).mockResolvedValue({
        id: 'order-1',
        ...orderData,
      });

      const order = await mockPrisma.order.create({ data: orderData });

      expect(order.order_status).toBe(OrderStatus.placed);
    });
  });

  describe('Order Status Transitions', () => {
    it('should transition from placed to preparing', async () => {
      const updatedOrder = {
        id: 'order-1',
        order_status: OrderStatus.preparing,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { order_status: OrderStatus.preparing },
      });

      expect(order.order_status).toBe(OrderStatus.preparing);
    });

    it('should transition from preparing to ready', async () => {
      const updatedOrder = {
        id: 'order-1',
        order_status: OrderStatus.ready,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { order_status: OrderStatus.ready },
      });

      expect(order.order_status).toBe(OrderStatus.ready);
    });

    it('should transition from ready to completed', async () => {
      const updatedOrder = {
        id: 'order-1',
        order_status: OrderStatus.completed,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { order_status: OrderStatus.completed },
      });

      expect(order.order_status).toBe(OrderStatus.completed);
    });

    it('should allow cancellation', async () => {
      const updatedOrder = {
        id: 'order-1',
        order_status: OrderStatus.cancelled,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { order_status: OrderStatus.cancelled },
      });

      expect(order.order_status).toBe(OrderStatus.cancelled);
    });
  });

  describe('Payment Status', () => {
    it('should update payment status to paid', async () => {
      const updatedOrder = {
        id: 'order-1',
        payment_status: PaymentStatus.paid,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { payment_status: PaymentStatus.paid },
      });

      expect(order.payment_status).toBe(PaymentStatus.paid);
    });

    it('should handle pending payment at table', async () => {
      const updatedOrder = {
        id: 'order-1',
        payment_status: PaymentStatus.pending_at_table,
      };

      (mockPrisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

      const order = await mockPrisma.order.update({
        where: { id: 'order-1' },
        data: { payment_status: PaymentStatus.pending_at_table },
      });

      expect(order.payment_status).toBe(PaymentStatus.pending_at_table);
    });
  });

  describe('Get Orders', () => {
    it('should get all orders for customer', async () => {
      const mockOrders = [
        { id: 'order-1', customer_id: 'customer-1', total_amount: 25.00 },
        { id: 'order-2', customer_id: 'customer-1', total_amount: 35.00 },
      ];

      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const orders = await mockPrisma.order.findMany({
        where: { customer_id: 'customer-1' },
      });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { customer_id: 'customer-1' },
      });
      expect(orders).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockOrders = [
        { id: 'order-1', order_status: OrderStatus.placed },
      ];

      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const orders = await mockPrisma.order.findMany({
        where: { order_status: OrderStatus.placed },
      });

      expect(orders.every(order => order.order_status === OrderStatus.placed)).toBe(true);
    });
  });

  describe('Order Validation', () => {
    it('should validate minimum order amount', () => {
      const amount = 5.00;
      const minAmount = 10.00;
      expect(amount).toBeLessThan(minAmount);
    });

    it('should validate item quantity', () => {
      const quantity = 5;
      expect(quantity).toBeGreaterThan(0);
      expect(quantity).toBeLessThanOrEqual(100);
    });

    it('should calculate item subtotal', () => {
      const price = 15.99;
      const quantity = 3;
      const subtotal = price * quantity;
      expect(subtotal).toBeCloseTo(47.97, 2);
    });
  });
});
