import {
  mockUsers,
  mockMenuItems,
  mockOrders,
  mockReservations,
  mockInventory,
  mockRecipes,
  mockStaff,
  mockTransactions,
  mockTables,
  mockWaitlist,
  mockAnalytics,
  MockUser,
  MockMenuItem,
  MockOrder,
  MockReservation,
  MockInventoryItem,
  MockRecipe,
  MockStaff,
  MockInventoryTransaction,
  MockTable,
  MockWaitlistEntry,
  MockAnalytics
} from './mock-data';

class MockState {
  private users: MockUser[] = [...mockUsers];
  private menuItems: MockMenuItem[] = [...mockMenuItems];
  private orders: MockOrder[] = [...mockOrders];
  private reservations: MockReservation[] = [...mockReservations];
  private inventory: MockInventoryItem[] = [...mockInventory];
  private recipes: MockRecipe[] = [...mockRecipes];
  private staff: MockStaff[] = [...mockStaff];
  private transactions: MockInventoryTransaction[] = [...mockTransactions];
  private tables: MockTable[] = [...mockTables];
  private waitlist: MockWaitlistEntry[] = [...mockWaitlist];
  private analytics: MockAnalytics = { ...mockAnalytics };
  private currentUser: MockUser | null = null;
  private authToken: string | null = null;

  constructor() {
    // Restore user from localStorage on initialization
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        this.authToken = token;
        // Try to find user by checking all users (in real app, decode JWT)
        // For mock, we'll set it when login is called
      }
    }
  }

  // Auth methods
  setCurrentUser(user: MockUser | null) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token); // Keep for backward compatibility
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
    }
  }

  getAuthToken() {
    return this.authToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  // User methods
  getUsers() {
    return [...this.users];
  }

  getUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }

  addUser(user: MockUser) {
    this.users.push(user);
  }

  // Menu methods
  getMenuItems() {
    return [...this.menuItems];
  }

  getMenuItemById(id: string) {
    return this.menuItems.find(m => m.id === id);
  }

  addMenuItem(item: MockMenuItem) {
    this.menuItems.push(item);
  }

  updateMenuItem(id: string, updates: Partial<MockMenuItem>) {
    const index = this.menuItems.findIndex(m => m.id === id);
    if (index !== -1) {
      this.menuItems[index] = { ...this.menuItems[index], ...updates };
    }
  }

  deleteMenuItem(id: string) {
    this.menuItems = this.menuItems.filter(m => m.id !== id);
  }

  // Order methods
  getOrders() {
    return [...this.orders];
  }

  getOrderById(id: string) {
    return this.orders.find(o => o.id === id);
  }

  getOrdersByCustomerId(customerId: string) {
    return this.orders.filter(o => o.customerId === customerId);
  }

  getActiveOrders() {
    return this.orders.filter(o => 
      ['placed', 'preparing', 'ready'].includes(o.orderStatus)
    );
  }

  addOrder(order: MockOrder) {
    this.orders.push(order);
    // Reserve inventory
    order.items.forEach(item => {
      const recipe = this.recipes.find(r => r.menuItemId === item.menuItemId);
      if (recipe) {
        recipe.items.forEach(recipeItem => {
          this.updateInventoryStock(
            recipeItem.inventoryItemId,
            -recipeItem.quantityRequired * item.quantity,
            'reservation',
            `Stock reserved for order #${order.id}`,
            order.id
          );
        });
      }
    });
  }

  updateOrderStatus(id: string, status: string) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const order = this.orders[index];
      const oldStatus = order.orderStatus;
      this.orders[index] = { 
        ...order, 
        orderStatus: status as any,
        updatedAt: new Date().toISOString()
      };

      // Handle inventory based on status change
      if (status === 'completed' && oldStatus !== 'completed') {
        // Deduct reserved stock
        order.items.forEach(item => {
          const recipe = this.recipes.find(r => r.menuItemId === item.menuItemId);
          if (recipe) {
            recipe.items.forEach(recipeItem => {
              this.updateInventoryStock(
                recipeItem.inventoryItemId,
                -recipeItem.quantityRequired * item.quantity,
                'deduction',
                `Order #${order.id} completed`,
                order.id
              );
            });
          }
        });
      } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
        // Release reserved stock
        order.items.forEach(item => {
          const recipe = this.recipes.find(r => r.menuItemId === item.menuItemId);
          if (recipe) {
            recipe.items.forEach(recipeItem => {
              this.updateInventoryStock(
                recipeItem.inventoryItemId,
                recipeItem.quantityRequired * item.quantity,
                'release',
                `Stock released - order #${order.id} cancelled`,
                order.id
              );
            });
          }
        });
      }
    }
  }

  updateOrderItemStatus(orderId: string, itemId: string, status: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.id === itemId);
      if (item) {
        item.status = status as any;
        order.updatedAt = new Date().toISOString();
      }
    }
  }

  updateOrderPaymentStatus(id: string, status: string) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      this.orders[index] = { 
        ...this.orders[index], 
        paymentStatus: status as any,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Reservation methods
  getReservations() {
    return [...this.reservations];
  }

  getReservationById(id: string) {
    return this.reservations.find(r => r.id === id);
  }

  getReservationsByCustomerId(customerId: string) {
    return this.reservations.filter(r => r.customerId === customerId);
  }

  addReservation(reservation: MockReservation) {
    this.reservations.push(reservation);
  }

  updateReservationStatus(id: string, status: string) {
    const index = this.reservations.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reservations[index] = { 
        ...this.reservations[index], 
        status: status as any,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Inventory methods
  getInventory() {
    return [...this.inventory];
  }

  getInventoryItemById(id: string) {
    return this.inventory.find(i => i.id === id);
  }

  getLowStockItems() {
    return this.inventory.filter(i => i.availableStock <= i.reorderThreshold);
  }

  addInventoryItem(item: MockInventoryItem) {
    this.inventory.push(item);
  }

  updateInventoryItem(id: string, updates: Partial<MockInventoryItem>) {
    const index = this.inventory.findIndex(i => i.id === id);
    if (index !== -1) {
      this.inventory[index] = { ...this.inventory[index], ...updates };
    }
  }

  updateInventoryStock(
    id: string, 
    quantity: number, 
    type: 'restock' | 'deduction' | 'adjustment' | 'reservation' | 'release',
    reason: string,
    orderId?: string
  ) {
    const item = this.inventory.find(i => i.id === id);
    if (item) {
      if (type === 'restock') {
        item.totalStock += quantity;
        item.availableStock += quantity;
      } else if (type === 'reservation') {
        item.reservedStock += Math.abs(quantity);
        item.availableStock -= Math.abs(quantity);
      } else if (type === 'deduction') {
        item.totalStock += quantity; // quantity is negative
        item.reservedStock += quantity; // reduce reserved
      } else if (type === 'release') {
        item.reservedStock -= quantity;
        item.availableStock += quantity;
      } else if (type === 'adjustment') {
        item.totalStock += quantity;
        item.availableStock += quantity;
      }

      // Add transaction
      const transaction: MockInventoryTransaction = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        inventoryItemId: id,
        inventoryItem: item,
        type,
        quantity,
        reason,
        orderId,
        performedBy: this.currentUser?.id || 'system',
        performedByUser: this.currentUser,
        createdAt: new Date().toISOString()
      };
      this.transactions.unshift(transaction);
    }
  }

  // Recipe methods
  getRecipes() {
    return [...this.recipes];
  }

  getRecipeByMenuItemId(menuItemId: string) {
    return this.recipes.find(r => r.menuItemId === menuItemId);
  }

  addIngredientToRecipe(menuItemId: string, inventoryItemId: string, quantity: number) {
    const recipe = this.recipes.find(r => r.menuItemId === menuItemId);
    const inventoryItem = this.inventory.find(i => i.id === inventoryItemId);
    
    if (recipe && inventoryItem) {
      const newItem = {
        id: `recipe-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        inventoryItemId,
        inventoryItem,
        quantityRequired: quantity
      };
      recipe.items.push(newItem);
      this.recalculateMaxServings(menuItemId);
    } else if (!recipe && inventoryItem) {
      // Create new recipe
      const newRecipe: MockRecipe = {
        menuItemId,
        items: [{
          id: `recipe-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          inventoryItemId,
          inventoryItem,
          quantityRequired: quantity
        }],
        maxServings: 0
      };
      this.recipes.push(newRecipe);
      this.recalculateMaxServings(menuItemId);
    }
  }

  updateRecipeIngredient(recipeItemId: string, quantity: number) {
    for (const recipe of this.recipes) {
      const item = recipe.items.find(i => i.id === recipeItemId);
      if (item) {
        item.quantityRequired = quantity;
        this.recalculateMaxServings(recipe.menuItemId);
        break;
      }
    }
  }

  removeIngredientFromRecipe(recipeItemId: string) {
    for (const recipe of this.recipes) {
      const index = recipe.items.findIndex(i => i.id === recipeItemId);
      if (index !== -1) {
        recipe.items.splice(index, 1);
        this.recalculateMaxServings(recipe.menuItemId);
        break;
      }
    }
  }

  private recalculateMaxServings(menuItemId: string) {
    const recipe = this.recipes.find(r => r.menuItemId === menuItemId);
    if (recipe && recipe.items.length > 0) {
      const servings = recipe.items.map(item => {
        const inventoryItem = this.inventory.find(i => i.id === item.inventoryItemId);
        if (inventoryItem && item.quantityRequired > 0) {
          return Math.floor(inventoryItem.availableStock / item.quantityRequired);
        }
        return 0;
      });
      recipe.maxServings = Math.min(...servings);
    }
  }

  // Staff methods
  getStaff() {
    return [...this.staff];
  }

  addStaff(staff: MockStaff) {
    this.staff.push(staff);
  }

  updateStaff(id: string, updates: Partial<MockStaff>) {
    const index = this.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      this.staff[index] = { 
        ...this.staff[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
  }

  getStaffById(id: string) {
    return this.staff.find(s => s.id === id);
  }

  toggleStaffStatus(id: string) {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Staff member not found');
    }
    this.staff[index] = {
      ...this.staff[index],
      isActive: !this.staff[index].isActive,
      updatedAt: new Date().toISOString()
    };
    return this.staff[index];
  }

  deleteStaff(id: string) {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Staff member not found');
    }
    // Soft delete - set isActive to false
    this.staff[index] = {
      ...this.staff[index],
      isActive: false,
      updatedAt: new Date().toISOString()
    };
  }


  // Transaction methods
  getTransactions() {
    return [...this.transactions];
  }

  // Table methods
  getTables() {
    return [...this.tables];
  }

  getTableById(id: string) {
    return this.tables.find(t => t.id === id);
  }

  getTableByNumber(number: number) {
    return this.tables.find(t => t.tableNumber === number);
  }

  updateTableStatus(id: string, status: MockTable['status']) {
    const index = this.tables.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tables[index] = { ...this.tables[index], status };
    }
  }

  getAvailableTables() {
    return this.tables.filter(t => t.status === 'available');
  }

  // Waitlist methods
  getWaitlist() {
    return [...this.waitlist];
  }

  getWaitlistById(id: string) {
    return this.waitlist.find(w => w.id === id);
  }

  addToWaitlist(entry: MockWaitlistEntry) {
    this.waitlist.push(entry);
  }

  updateWaitlistStatus(id: string, status: MockWaitlistEntry['status']) {
    const index = this.waitlist.findIndex(w => w.id === id);
    if (index !== -1) {
      this.waitlist[index] = { ...this.waitlist[index], status };
    }
  }

  removeFromWaitlist(id: string) {
    this.waitlist = this.waitlist.filter(w => w.id !== id);
  }

  // Analytics methods
  getAnalytics() {
    //  Recalculate dynamic values
    const today = new Date().toISOString().split('T')[0];
    return {
      ...this.analytics,
      summary: {
        todaysReservations: this.reservations.filter(r => 
          r.reservationDate === today
        ).length,
        pendingCheckIn: this.reservations.filter(r => 
          r.reservationDate === today && r.status === 'confirmed'
        ).length,
        currentlySeated: this.reservations.filter(r => 
          r.reservationDate === today && r.status === 'checked_in'
        ).length,
        pendingPayments: this.orders.filter(o => 
          o.paymentStatus === 'pending'
        ).length,
      }
    };
  }

  // Utility methods
  generateId(prefix: string = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  reset() {
    this.users = [...mockUsers];
    this.menuItems = [...mockMenuItems];
    this.orders = [...mockOrders];
    this.reservations = [...mockReservations];
    this.inventory = [...mockInventory];
    this.recipes = [...mockRecipes];
    this.staff = [...mockStaff];
    this.transactions = [...mockTransactions];
    this.tables = [...mockTables];
    this.waitlist = [...mockWaitlist];
    this.analytics = { ...mockAnalytics };
    this.currentUser = null;
    this.authToken = null;
  }
}

export const mockState = new MockState();
