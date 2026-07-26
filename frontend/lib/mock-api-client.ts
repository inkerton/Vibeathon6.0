import { mockState } from './mock-state';
import {
  MockUser,
  MockMenuItem,
  MockOrder,
  MockOrderItem,
  MockReservation,
  MockInventoryItem,
  MockStaff
} from './mock-data';

class MockApiClient {
  private delay: number = 300; // Simulate network delay in ms
  private mockToken = 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9);

  constructor() {
    // Restore session from localStorage on initialization
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        this.mockToken = token;
        // Try to restore user from token (in mock, we store email in token)
        const storedEmail = localStorage.getItem('mockUserEmail');
        if (storedEmail) {
          const user = mockState.getUserByEmail(storedEmail);
          if (user) {
            mockState.setCurrentUser(user);
          }
        }
      }
    }
  }

  private async simulateDelay() {
    const delay = parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY || '300');
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async mockRequest<T>(handler: () => T): Promise<{ data: T }> {
    await this.simulateDelay();
    try {
      const data = handler();
      return { data };
    } catch (error: any) {
      throw {
        response: {
          data: {
            message: error.message || 'Mock API error'
          }
        }
      };
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async post(url: string, data?: any): Promise<{ data: any }> {
    // Auth endpoints
    if (url === '/auth/login') {
      return this.login(data.email, data.password);
    }
    if (url === '/auth/register') {
      return this.register(data);
    }
    if (url === '/auth/verify-otp') {
      return this.verifyOtp(data.email, data.otp);
    }
    if (url === '/auth/resend-otp') {
      return this.resendOtp(data.email);
    }
    if (url === '/auth/logout') {
      return this.logout();
    }

    // Menu endpoints
    if (url === '/menu') {
      return this.createMenuItem(data);
    }

    // Order endpoints
    if (url === '/orders') {
      return this.createOrder(data);
    }

    // Reservation endpoints
    if (url === '/reservations') {
      return this.createReservation(data);
    }

    // Inventory endpoints
    if (url === '/inventory') {
      return this.createInventoryItem(data);
    }
    if (url.match(/\/inventory\/(.+)\/restock/)) {
      const id = url.split('/')[2];
      return this.restockItem(id, data);
    }
    if (url.match(/\/inventory\/(.+)\/adjust/)) {
      const id = url.split('/')[2];
      return this.adjustStock(id, data);
    }

    // Recipe endpoints
    if (url.match(/\/recipes\/menu\/(.+)\/ingredients/)) {
      const menuItemId = url.split('/')[3];
      return this.addIngredientToRecipe(menuItemId, data);
    }

    // Staff endpoints
    if (url === '/staff') {
      return this.createStaff(data);
    }

    // Waitlist endpoints
    if (url === '/waitlist') {
      return this.addToWaitlist(data);
    }

    throw new Error(`Mock POST endpoint not implemented: ${url}`);
  }

  async get(url: string): Promise<{ data: any }> {
    // Auth endpoints
    if (url === '/auth/me') {
      return this.getMe();
    }

    // Menu endpoints
    if (url === '/menu') {
      return this.getMenu();
    }
    if (url.match(/\/menu\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getMenuById(id);
    }

    // Order endpoints
    if (url === '/orders/my-orders') {
      return this.getMyOrders();
    }
    if (url === '/orders/active') {
      return this.getActiveOrders();
    }
    if (url === '/orders') {
      return this.getAllOrders();
    }
    if (url.match(/\/orders\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getOrderById(id);
    }

    // Reservation endpoints
    if (url.match(/\/reservations\/available-tables/)) {
      return this.getAvailableTables();
    }
    if (url === '/reservations/my-reservations') {
      return this.getMyReservations();
    }
    if (url === '/reservations') {
      return this.getAllReservations();
    }
    if (url.match(/\/reservations\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getReservationById(id);
    }

    // Inventory endpoints
    if (url === '/inventory/low-stock') {
      return this.getLowStockItems();
    }
    if (url === '/inventory/transactions') {
      return this.getInventoryTransactions();
    }
    if (url === '/inventory') {
      return this.getInventory();
    }
    if (url.match(/\/inventory\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getInventoryItemById(id);
    }

    // Recipe endpoints
    if (url.match(/\/recipes\/menu\/(.+)/)) {
      const menuItemId = url.split('/')[3];
      return this.getRecipeByMenuItemId(menuItemId);
    }

    // Staff endpoints
    if (url === '/staff') {
      return this.getStaff();
    }
    if (url.match(/\/staff\/([^/]+)$/)) {
      const id = url.split('/')[2];
      return this.getStaffById(id);
    }

    // Table endpoints
    if (url === '/tables') {
      return this.getTables();
    }
    if (url === '/tables/available') {
      return this.getAvailableTables();
    }
    if (url.match(/\/tables\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getTableById(id);
    }

    // Waitlist endpoints
    if (url === '/waitlist') {
      return this.getWaitlist();
    }
    if (url.match(/\/waitlist\/(.+)/)) {
      const id = url.split('/')[2];
      return this.getWaitlistById(id);
    }

    // Analytics endpoints
    if (url === '/analytics') {
      return this.getAnalytics();
    }
    if (url === '/analytics/summary') {
      return this.getAnalyticsSummary();
    }

    throw new Error(`Mock GET endpoint not implemented: ${url}`);
  }

  async patch(url: string, data?: any): Promise<{ data: any }> {
    // Menu endpoints
    if (url.match(/\/menu\/(.+)\/availability/)) {
      const id = url.split('/')[2];
      return this.toggleMenuAvailability(id);
    }
    if (url.match(/\/menu\/(.+)/)) {
      const id = url.split('/')[2];
      return this.updateMenuItem(id, data);
    }

    // Order endpoints
    if (url.match(/\/orders\/(.+)\/status/)) {
      const id = url.split('/')[2];
      return this.updateOrderStatus(id, data.status);
    }
    if (url.match(/\/orders\/(.+)\/items\/(.+)\/status/)) {
      const orderId = url.split('/')[2];
      const itemId = url.split('/')[4];
      return this.updateOrderItemStatus(orderId, itemId, data.status);
    }
    if (url.match(/\/orders\/(.+)\/payment/)) {
      const id = url.split('/')[2];
      return this.updateOrderPaymentStatus(id, data.paymentStatus);
    }

    // Reservation endpoints
    if (url.match(/\/reservations\/(.+)\/status/)) {
      const id = url.split('/')[2];
      return this.updateReservationStatus(id, data.status);
    }
    if (url.match(/\/reservations\/(.+)\/cancel/)) {
      const id = url.split('/')[2];
      return this.cancelReservation(id);
    }

    // Inventory endpoints
    if (url.match(/\/inventory\/(.+)/)) {
      const id = url.split('/')[2];
      return this.updateInventoryItem(id, data);
    }

    // Recipe endpoints
    if (url.match(/\/recipes\/items\/(.+)/)) {
      const recipeItemId = url.split('/')[3];
      return this.updateRecipeIngredient(recipeItemId, data);
    }

    // Staff endpoints
    if (url.match(/\/staff\/([^/]+)\/status$/)) {
      const id = url.split('/')[2];
      return this.toggleStaffStatus(id);
    }
    if (url.match(/\/staff\/([^/]+)$/)) {
      const id = url.split('/')[2];
      return this.updateStaff(id, data);
    }

    // Table endpoints
    if (url.match(/\/tables\/(.+)\/status/)) {
      const id = url.split('/')[2];
      return this.updateTableStatus(id, data.status);
    }

    // Waitlist endpoints
    if (url.match(/\/waitlist\/(.+)\/status/)) {
      const id = url.split('/')[2];
      return this.updateWaitlistStatus(id, data.status);
    }

    throw new Error(`Mock PATCH endpoint not implemented: ${url}`);
  }

  async delete(url: string): Promise<{ data: any }> {
    // Menu endpoints
    if (url.match(/\/menu\/(.+)/)) {
      const id = url.split('/')[2];
      return this.deleteMenuItem(id);
    }

    // Order endpoints
    if (url.match(/\/orders\/(.+)/)) {
      const id = url.split('/')[2];
      return this.cancelOrder(id);
    }

    // Inventory endpoints
    if (url.match(/\/inventory\/(.+)/)) {
      const id = url.split('/')[2];
      return this.deleteInventoryItem(id);
    }

    // Recipe endpoints
    if (url.match(/\/recipes\/items\/(.+)/)) {
      const recipeItemId = url.split('/')[3];
      return this.removeIngredientFromRecipe(recipeItemId);
    }

    // Waitlist endpoints
    if (url.match(/\/waitlist\/(.+)/)) {
      const id = url.split('/')[2];
      return this.removeFromWaitlist(id);
    }

    // Staff endpoints
    if (url.match(/\/staff\/([^/]+)$/)) {
      const id = url.split('/')[2];
      return this.deleteStaff(id);
    }

    throw new Error(`Mock DELETE endpoint not implemented: ${url}`);
  }

  async put(url: string, data?: any): Promise<{ data: any }> {
    // Recipe endpoints
    if (url.match(/\/recipes\/menu\/(.+)/)) {
      const menuItemId = url.split('/')[3];
      return this.setMenuItemRecipe(menuItemId, data);
    }

    throw new Error(`Mock PUT endpoint not implemented: ${url}`);
  }

  // ==================== AUTH METHODS ====================

  private async login(email: string, password: string) {
    return this.mockRequest(() => {
      const user = mockState.getUserByEmail(email);
      if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
      }
      mockState.setCurrentUser(user);
      mockState.setAuthToken(this.mockToken);
      // Store email for session restoration
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUserEmail', email);
      }
      return {
        data: {
          accessToken: this.mockToken,
          refreshToken: this.mockToken + '-refresh',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          }
        }
      };
    });
  }

  private async register(data: any) {
    return this.mockRequest(() => {
      const existingUser = mockState.getUserByEmail(data.email);
      if (existingUser) {
        throw new Error('User already exists');
      }
      const newUser: MockUser = {
        id: mockState.generateId('user'),
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'customer',
        isActive: false,
        createdAt: new Date().toISOString()
      };
      mockState.addUser(newUser);
      return {
        message: 'Registration successful. Please verify OTP.',
        userId: newUser.id
      };
    });
  }

  private async verifyOtp(email: string, otp: string) {
    return this.mockRequest(() => {
      // Mock OTP verification - accept any 6-digit code
      if (otp.length !== 6) {
        throw new Error('Invalid OTP');
      }
      const user = mockState.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      mockState.setCurrentUser(user);
      mockState.setAuthToken(this.mockToken);
      return {
        data: {
          accessToken: this.mockToken,
          refreshToken: this.mockToken + '-refresh',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: true
          }
        }
      };
    });
  }

  private async resendOtp(email: string) {
    return this.mockRequest(() => {
      const user = mockState.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      return {
        message: 'OTP resent successfully',
        otp: '123456' // Mock OTP for testing
      };
    });
  }

  private async getMe() {
    return this.mockRequest(() => {
      const user = mockState.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      };
    });
  }

  private async logout() {
    return this.mockRequest(() => {
      mockState.setCurrentUser(null);
      mockState.setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mockUserEmail');
      }
      return { message: 'Logged out successfully' };
    });
  }

  // ==================== MENU METHODS ====================

  private async getMenu() {
    return this.mockRequest(() => {
      return mockState.getMenuItems();
    });
  }

  private async getMenuById(id: string) {
    return this.mockRequest(() => {
      const item = mockState.getMenuItemById(id);
      if (!item) {
        throw new Error('Menu item not found');
      }
      return item;
    });
  }

  private async createMenuItem(data: any) {
    return this.mockRequest(() => {
      const newItem: MockMenuItem = {
        id: mockState.generateId('menu'),
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        imageUrl: data.imageUrl || 'https://via.placeholder.com/300x200',
        isAvailable: data.isAvailable !== false,
        preparationTime: data.preparationTime || 15,
        createdAt: new Date().toISOString()
      };
      mockState.addMenuItem(newItem);
      return newItem;
    });
  }

  private async updateMenuItem(id: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateMenuItem(id, data);
      return mockState.getMenuItemById(id);
    });
  }

  private async deleteMenuItem(id: string) {
    return this.mockRequest(() => {
      mockState.deleteMenuItem(id);
      return { message: 'Menu item deleted successfully' };
    });
  }

  private async toggleMenuAvailability(id: string) {
    return this.mockRequest(() => {
      const item = mockState.getMenuItemById(id);
      if (!item) {
        throw new Error('Menu item not found');
      }
      mockState.updateMenuItem(id, { isAvailable: !item.isAvailable });
      return mockState.getMenuItemById(id);
    });
  }

  // ==================== ORDER METHODS ====================

  private async createOrder(data: any) {
    return this.mockRequest(() => {
      const user = mockState.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const items: MockOrderItem[] = data.items.map((item: any) => ({
        id: mockState.generateId('order-item'),
        menuItemId: item.menuItemId,
        menuItem: mockState.getMenuItemById(item.menuItemId),
        quantity: item.quantity,
        price: item.price,
        status: 'pending',
        customInstructions: item.customInstructions,
        allergyInfo: item.allergyInfo
      }));

      const newOrder: MockOrder = {
        id: mockState.generateId('order'),
        customerId: user.id,
        customer: user,
        tableNumber: data.tableNumber,
        orderStatus: 'placed',
        paymentStatus: 'pending',
        totalAmount: data.totalAmount,
        gstAmount: data.gstAmount,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockState.addOrder(newOrder);
      return newOrder;
    });
  }

  private async getMyOrders() {
    return this.mockRequest(() => {
      const user = mockState.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      return mockState.getOrdersByCustomerId(user.id);
    });
  }

  private async getAllOrders() {
    return this.mockRequest(() => {
      return mockState.getOrders();
    });
  }

  private async getActiveOrders() {
    return this.mockRequest(() => {
      return mockState.getActiveOrders();
    });
  }

  private async getOrderById(id: string) {
    return this.mockRequest(() => {
      const order = mockState.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    });
  }

  private async updateOrderStatus(id: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateOrderStatus(id, status);
      return mockState.getOrderById(id);
    });
  }

  private async updateOrderItemStatus(orderId: string, itemId: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateOrderItemStatus(orderId, itemId, status);
      return mockState.getOrderById(orderId);
    });
  }

  private async updateOrderPaymentStatus(id: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateOrderPaymentStatus(id, status);
      return mockState.getOrderById(id);
    });
  }

  private async cancelOrder(id: string) {
    return this.mockRequest(() => {
      mockState.updateOrderStatus(id, 'cancelled');
      return { message: 'Order cancelled successfully' };
    });
  }

  // ==================== RESERVATION METHODS ====================

  private async createReservation(data: any) {
    return this.mockRequest(() => {
      const user = mockState.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const newReservation: MockReservation = {
        id: mockState.generateId('reservation'),
        customerId: user.id,
        customer: user,
        tableNumber: data.tableNumber,
        partySize: data.partySize,
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        status: 'pending',
        specialRequests: data.specialRequests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockState.addReservation(newReservation);
      return newReservation;
    });
  }

  private async getMyReservations() {
    return this.mockRequest(() => {
      const user = mockState.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      return mockState.getReservationsByCustomerId(user.id);
    });
  }

  private async getAllReservations() {
    return this.mockRequest(() => {
      return mockState.getReservations();
    });
  }

  private async getReservationById(id: string) {
    return this.mockRequest(() => {
      const reservation = mockState.getReservationById(id);
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      return reservation;
    });
  }

  private async updateReservationStatus(id: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateReservationStatus(id, status);
      return mockState.getReservationById(id);
    });
  }

  private async cancelReservation(id: string) {
    return this.mockRequest(() => {
      mockState.updateReservationStatus(id, 'cancelled');
      return { message: 'Reservation cancelled successfully' };
    });
  }

  // ==================== INVENTORY METHODS ====================

  private async getInventory() {
    return this.mockRequest(() => {
      return mockState.getInventory();
    });
  }

  private async getInventoryItemById(id: string) {
    return this.mockRequest(() => {
      const item = mockState.getInventoryItemById(id);
      if (!item) {
        throw new Error('Inventory item not found');
      }
      return item;
    });
  }

  private async getLowStockItems() {
    return this.mockRequest(() => {
      return mockState.getLowStockItems();
    });
  }

  private async getInventoryTransactions() {
    return this.mockRequest(() => {
      return mockState.getTransactions();
    });
  }

  private async createInventoryItem(data: any) {
    return this.mockRequest(() => {
      const newItem: MockInventoryItem = {
        id: mockState.generateId('inv'),
        name: data.name,
        unit: data.unit,
        totalStock: data.totalStock || 0,
        reservedStock: 0,
        availableStock: data.totalStock || 0,
        reorderThreshold: data.reorderThreshold || 10,
        category: data.category,
        supplier: data.supplier,
        lastRestocked: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      mockState.addInventoryItem(newItem);
      return newItem;
    });
  }

  private async updateInventoryItem(id: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateInventoryItem(id, data);
      return mockState.getInventoryItemById(id);
    });
  }

  private async deleteInventoryItem(id: string) {
    return this.mockRequest(() => {
      // Note: In real app, should check if item is used in recipes
      return { message: 'Inventory item deleted successfully' };
    });
  }

  private async restockItem(id: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateInventoryStock(
        id,
        data.quantity,
        'restock',
        data.notes || 'Restock',
        undefined
      );
      return mockState.getInventoryItemById(id);
    });
  }

  private async adjustStock(id: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateInventoryStock(
        id,
        data.quantity,
        'adjustment',
        data.reason || 'Manual adjustment',
        undefined
      );
      return mockState.getInventoryItemById(id);
    });
  }

  // ==================== RECIPE METHODS ====================

  private async getRecipeByMenuItemId(menuItemId: string) {
    return this.mockRequest(() => {
      const recipe = mockState.getRecipeByMenuItemId(menuItemId);
      if (!recipe) {
        return { menuItemId, items: [], maxServings: 0 };
      }
      return recipe;
    });
  }

  private async addIngredientToRecipe(menuItemId: string, data: any) {
    return this.mockRequest(() => {
      mockState.addIngredientToRecipe(
        menuItemId,
        data.inventoryItemId,
        data.quantityRequired
      );
      return mockState.getRecipeByMenuItemId(menuItemId);
    });
  }

  private async updateRecipeIngredient(recipeItemId: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateRecipeIngredient(recipeItemId, data.quantityRequired);
      return { message: 'Recipe ingredient updated successfully' };
    });
  }

  private async removeIngredientFromRecipe(recipeItemId: string) {
    return this.mockRequest(() => {
      mockState.removeIngredientFromRecipe(recipeItemId);
      return { message: 'Ingredient removed from recipe successfully' };
    });
  }

  private async setMenuItemRecipe(menuItemId: string, data: any) {
    return this.mockRequest(() => {
      // Bulk update recipe - not implemented in mock state yet
      return { message: 'Recipe updated successfully' };
    });
  }

  // ==================== STAFF METHODS ====================

  private async getStaff() {
    return this.mockRequest(() => {
      const staff = mockState.getStaff();
      return staff.map((s: MockStaff) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || null,
        role: s.role,
        is_active: s.isActive,
        auth_provider: 'local',
        created_at: s.createdAt,
        updated_at: s.updatedAt || s.createdAt,
      }));
    });
  }

  private async getStaffById(id: string) {
    return this.mockRequest(() => {
      const staff = mockState.getStaffById(id);
      if (!staff) {
        throw new Error('Staff member not found');
      }
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone || null,
        role: staff.role,
        is_active: staff.isActive,
        auth_provider: 'local',
        created_at: staff.createdAt,
        updated_at: staff.updatedAt || staff.createdAt,
      };
    });
  }

  private async createStaff(data: any) {
    return this.mockRequest(() => {
      const newStaff: MockStaff = {
        id: mockState.generateId('staff'),
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        role: data.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockState.addStaff(newStaff);
      return {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone || null,
        role: newStaff.role,
        is_active: newStaff.isActive,
        auth_provider: 'local',
        created_at: newStaff.createdAt,
        updated_at: newStaff.updatedAt,
      };
    });
  }

  private async updateStaff(id: string, data: any) {
    return this.mockRequest(() => {
      mockState.updateStaff(id, data);
      const updatedStaff = mockState.getStaffById(id);
      if (!updatedStaff) {
        throw new Error('Staff member not found');
      }
      return {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        phone: updatedStaff.phone || null,
        role: updatedStaff.role,
        is_active: updatedStaff.isActive,
        auth_provider: 'local',
        created_at: updatedStaff.createdAt,
        updated_at: updatedStaff.updatedAt || updatedStaff.createdAt,
      };
    });
  }

  private async toggleStaffStatus(id: string) {
    return this.mockRequest(() => {
      const updatedStaff = mockState.toggleStaffStatus(id);
      return {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        phone: updatedStaff.phone || null,
        role: updatedStaff.role,
        is_active: updatedStaff.isActive,
        auth_provider: 'local',
        created_at: updatedStaff.createdAt,
        updated_at: updatedStaff.updatedAt || updatedStaff.createdAt,
      };
    });
  }

  private async deleteStaff(id: string) {
    return this.mockRequest(() => {
      mockState.deleteStaff(id);
      return { message: 'Staff member deleted successfully' };
    });
  }



  // ==================== TABLE METHODS ====================

  private async getTables() {
    return this.mockRequest(() => {
      return mockState.getTables();
    });
  }

  private async getTableById(id: string) {
    return this.mockRequest(() => {
      const table = mockState.getTableById(id);
      if (!table) {
        throw new Error('Table not found');
      }
      return table;
    });
  }

  private async getAvailableTables() {
    return this.mockRequest(() => {
      return mockState.getAvailableTables();
    });
  }

  private async updateTableStatus(id: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateTableStatus(id, status as any);
      return mockState.getTableById(id);
    });
  }

  // ==================== WAITLIST METHODS ====================

  private async getWaitlist() {
    return this.mockRequest(() => {
      return mockState.getWaitlist();
    });
  }

  private async getWaitlistById(id: string) {
    return this.mockRequest(() => {
      const entry = mockState.getWaitlistById(id);
      if (!entry) {
        throw new Error('Waitlist entry not found');
      }
      return entry;
    });
  }

  private async addToWaitlist(data: any) {
    return this.mockRequest(() => {
      const newEntry = {
        id: mockState.generateId('wait'),
        customerName: data.customerName,
        partySize: data.partySize,
        quotedTime: data.quotedTime || 15,
        status: 'waiting' as const,
        createdAt: new Date().toISOString()
      };
      mockState.addToWaitlist(newEntry);
      return newEntry;
    });
  }

  private async updateWaitlistStatus(id: string, status: string) {
    return this.mockRequest(() => {
      mockState.updateWaitlistStatus(id, status as any);
      return mockState.getWaitlistById(id);
    });
  }

  private async removeFromWaitlist(id: string) {
    return this.mockRequest(() => {
      mockState.removeFromWaitlist(id);
      return { message: 'Waitlist entry removed successfully' };
    });
  }

  // ==================== ANALYTICS METHODS ====================

  private async getAnalytics() {
    return this.mockRequest(() => {
      return mockState.getAnalytics();
    });
  }

  private async getAnalyticsSummary() {
    return this.mockRequest(() => {
      return mockState.getAnalytics().summary;
    });
  }
}

export const mockApiClient = new MockApiClient();
