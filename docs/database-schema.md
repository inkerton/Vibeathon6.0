# Database Schema Documentation

## Overview

The system uses PostgreSQL as the database with Prisma ORM for type-safe database access. The schema is designed to support a multi-role restaurant management system with real-time operations.

## Database Diagram

```
┌─────────────┐
│    User     │
└─────────────┘
      │
      ├──────────────┬──────────────┬──────────────┬──────────────┐
      │              │              │              │              │
      ▼              ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Reservation│  │  Order   │  │  Review  │  │Inventory │  │Waitlist  │
│          │  │          │  │          │  │Transaction│  │Entry     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
      │              │              │              │
      ▼              ▼              │              ▼
┌──────────┐  ┌──────────┐         │        ┌──────────┐
│  Table   │  │OrderItem │         │        │Inventory │
└──────────┘  └──────────┘         │        │  Item    │
                     │              │        └──────────┘
                     ▼              │              │
               ┌──────────┐         │              │
               │ MenuItem │◄────────┘              │
               └──────────┘                        │
                     │                             │
                     ▼                             │
               ┌──────────┐                        │
               │RecipeItem│◄───────────────────────┘
               └──────────┘
```

## Enums

### Role
Defines user roles in the system.

```prisma
enum Role {
  customer    // Regular customers who order food
  reception   // Front desk staff managing reservations
  kitchen     // Kitchen staff preparing orders
  inventory   // Staff managing inventory
  admin       // System administrators with full access
}
```

### AuthProvider
Authentication method used by the user.

```prisma
enum AuthProvider {
  local   // Email/password authentication
  google  // Google OAuth authentication
}
```

### TableStatus
Current status of a restaurant table.

```prisma
enum TableStatus {
  free      // Available for seating
  occupied  // Currently in use
  reserved  // Reserved for upcoming reservation
}
```

### ReservationStatus
Status of a reservation throughout its lifecycle.

```prisma
enum ReservationStatus {
  pending    // Awaiting confirmation
  confirmed  // Confirmed by staff
  seated     // Customer has been seated
  cancelled  // Reservation cancelled
  completed  // Reservation fulfilled
}
```

### OrderItemStatus
Status of individual items within an order.

```prisma
enum OrderItemStatus {
  received   // Order received by kitchen
  preparing  // Currently being prepared
  ready      // Ready to be served
  served     // Delivered to customer
}
```

### OrderStatus
Overall status of an order.

```prisma
enum OrderStatus {
  placed     // Order placed by customer
  preparing  // Being prepared in kitchen
  ready      // All items ready
  served     // Delivered to table
  completed  // Order finished and paid
  cancelled  // Order cancelled
}
```

### PaymentStatus
Payment status of an order.

```prisma
enum PaymentStatus {
  unpaid            // Not yet paid
  pending_at_table  // Customer will pay at table
  paid              // Payment completed
}
```

### PaymentMethod
Method of payment chosen by customer.

```prisma
enum PaymentMethod {
  in_app        // Payment through app
  pay_at_table  // Payment at table (cash/card)
}
```

### InventoryTransactionType
Type of inventory transaction.

```prisma
enum InventoryTransactionType {
  reserve     // Reserve stock for pending order
  deduct      // Remove stock (order completed)
  restock     // Add new stock
  release     // Release reserved stock (order cancelled)
  adjustment  // Manual stock adjustment
}
```

### NotificationType
Type of notification sent to users.

```prisma
enum NotificationType {
  reservation_confirmed  // Reservation confirmed
  table_ready           // Table is ready
  order_ready           // Order is ready
  low_stock             // Inventory low stock alert
  custom                // Custom notification
}
```

## Tables

### User
Stores all user accounts (customers and staff).

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `name` (String): Full name
- `email` (String, Unique): Email address
- `phone` (String?, Optional): Phone number
- `password_hash` (String?, Optional): Hashed password (null for OAuth users)
- `auth_provider` (AuthProvider): Authentication method
- `role` (Role): User role
- `is_active` (Boolean): Account active status (default: true)
- `otp_code` (String?, Optional): Current OTP for verification
- `otp_expires_at` (DateTime?, Optional): OTP expiration time
- `created_at` (DateTime): Account creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Relations:**
- `reservations` → Reservation[] (one-to-many)
- `orders` → Order[] (one-to-many)
- `reviews` → Review[] (one-to-many)
- `transactions` → InventoryTransaction[] (one-to-many, as performer)
- `notifications` → Notification[] (one-to-many)
- `waitlist_entries` → WaitlistEntry[] (one-to-many)

**Indexes:**
- Unique index on `email`

---

### Table
Represents physical tables in the restaurant.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `table_number` (Int, Unique): Table number
- `capacity` (Int): Maximum seating capacity
- `status` (TableStatus): Current status (default: free)
- `current_order_id` (String?, Optional): ID of current order
- `restaurant_id` (String): Restaurant identifier (for multi-restaurant support)

**Relations:**
- `reservations` → Reservation[] (one-to-many)
- `orders` → Order[] (one-to-many)

**Indexes:**
- Unique index on `table_number`

---

### Reservation
Stores table reservations.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `customer_id` (String, FK): Reference to User
- `table_id` (String, FK): Reference to Table
- `date` (DateTime): Reservation date and time
- `party_size` (Int): Number of people
- `special_request` (String?, Optional): Special requests or notes
- `status` (ReservationStatus): Current status (default: pending)
- `created_at` (DateTime): Creation timestamp

**Relations:**
- `customer` → User (many-to-one)
- `table` → Table (many-to-one)

**Indexes:**
- Index on `customer_id`
- Index on `table_id`
- Index on `date`
- Index on `status`

---

### MenuItem
Menu items available for ordering.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `name` (String, Unique): Item name
- `description` (String): Item description
- `price` (Decimal): Price (10,2 precision)
- `category` (String): Category (e.g., "Pizza", "Pasta")
- `image_url` (String?, Optional): Image URL
- `is_available` (Boolean): Availability status (default: true)
- `preparation_time` (Int): Estimated prep time in minutes (default: 15)
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Relations:**
- `recipe` → RecipeItem[] (one-to-many)
- `order_items` → OrderItem[] (one-to-many)

**Indexes:**
- Unique index on `name`
- Index on `category`
- Index on `is_available`

---

### RecipeItem
Links menu items to their required ingredients.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `menu_item_id` (String, FK): Reference to MenuItem
- `ingredient_id` (String, FK): Reference to InventoryItem
- `quantity` (Float): Required quantity
- `unit` (String): Unit of measurement

**Relations:**
- `menu_item` → MenuItem (many-to-one)
- `ingredient` → InventoryItem (many-to-one)

**Indexes:**
- Unique composite index on `(menu_item_id, ingredient_id)`

---

### Order
Customer orders.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `table_id` (String, FK): Reference to Table
- `customer_id` (String, FK): Reference to User
- `created_by_role` (Role): Role of user who created order
- `order_status` (OrderStatus): Current order status (default: placed)
- `payment_status` (PaymentStatus): Payment status (default: unpaid)
- `payment_method` (PaymentMethod?, Optional): Payment method
- `total_amount` (Decimal): Total order amount (10,2 precision)
- `created_at` (DateTime): Order creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Relations:**
- `table` → Table (many-to-one)
- `customer` → User (many-to-one)
- `items` → OrderItem[] (one-to-many)
- `reviews` → Review[] (one-to-many)
- `inventory_transactions` → InventoryTransaction[] (one-to-many)

**Indexes:**
- Index on `table_id`
- Index on `customer_id`
- Index on `order_status`
- Index on `payment_status`
- Index on `created_at`

---

### OrderItem
Individual items within an order.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `order_id` (String, FK): Reference to Order
- `menu_item_id` (String, FK): Reference to MenuItem
- `quantity` (Int): Quantity ordered
- `price_at_order` (Decimal): Price at time of order (10,2 precision)
- `custom_instructions` (String?, Optional): Special instructions
- `allergy_info` (String?, Optional): Allergy information
- `status` (OrderItemStatus): Item status (default: received)
- `status_updated_at` (DateTime): Last status update (default: now)

**Relations:**
- `order` → Order (many-to-one)
- `menu_item` → MenuItem (many-to-one)

**Indexes:**
- Index on `order_id`
- Index on `menu_item_id`
- Index on `status`

---

### InventoryItem
Inventory items (ingredients).

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `name` (String, Unique): Item name
- `unit` (String): Unit of measurement (e.g., "kg", "L", "pcs")
- `total_stock` (Float): Total available stock
- `reserved_stock` (Float): Stock reserved for pending orders (default: 0)
- `reorder_threshold` (Float): Minimum stock level before reorder
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Relations:**
- `recipe_items` → RecipeItem[] (one-to-many)
- `transactions` → InventoryTransaction[] (one-to-many)

**Computed Fields:**
- `available_stock`: `total_stock - reserved_stock`
- `is_low_stock`: `total_stock <= reorder_threshold`

**Indexes:**
- Unique index on `name`
- Index on `total_stock`

---

### InventoryTransaction
Logs all inventory changes.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `item_id` (String, FK): Reference to InventoryItem
- `type` (InventoryTransactionType): Transaction type
- `quantity` (Float): Quantity changed (positive or negative)
- `order_id` (String?, FK, Optional): Related order (if applicable)
- `performed_by_id` (String, FK): User who performed transaction
- `note` (String?, Optional): Additional notes
- `created_at` (DateTime): Transaction timestamp

**Relations:**
- `item` → InventoryItem (many-to-one)
- `order` → Order (many-to-one, optional)
- `performed_by` → User (many-to-one)

**Indexes:**
- Index on `item_id`
- Index on `type`
- Index on `created_at`
- Index on `performed_by_id`

---

### Review
Customer reviews for orders.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `order_id` (String, FK): Reference to Order
- `customer_id` (String, FK): Reference to User
- `rating` (Int): Rating (1-5)
- `comment` (String?, Optional): Review comment
- `created_at` (DateTime): Review timestamp

**Relations:**
- `order` → Order (many-to-one)
- `customer` → User (many-to-one)

**Indexes:**
- Index on `order_id`
- Index on `customer_id`
- Index on `rating`

---

### Notification
User notifications.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `user_id` (String, FK): Reference to User
- `type` (NotificationType): Notification type
- `title` (String): Notification title
- `message` (String): Notification message
- `is_read` (Boolean): Read status (default: false)
- `created_at` (DateTime): Creation timestamp

**Relations:**
- `user` → User (many-to-one)

**Indexes:**
- Index on `user_id`
- Index on `is_read`
- Index on `created_at`

---

### WaitlistEntry
Walk-in customer waitlist.

**Fields:**
- `id` (String, PK): Unique identifier (CUID)
- `customer_id` (String?, FK, Optional): Reference to User (if registered)
- `party_name` (String): Name for the party
- `party_size` (Int): Number of people
- `phone` (String): Contact phone number
- `status` (String): Status (default: "waiting")
- `created_at` (DateTime): Entry creation timestamp
- `seated_at` (DateTime?, Optional): Time when seated

**Relations:**
- `customer` → User (many-to-one, optional)

**Indexes:**
- Index on `status`
- Index on `created_at`

---

## Key Relationships

### User Relationships
- **One User → Many Reservations**: A customer can make multiple reservations
- **One User → Many Orders**: A customer can place multiple orders
- **One User → Many Reviews**: A customer can leave multiple reviews
- **One User → Many Transactions**: Staff can perform multiple inventory transactions
- **One User → Many Notifications**: Users receive multiple notifications

### Order Flow
1. **Customer** places **Order** for a **Table**
2. **Order** contains multiple **OrderItems**
3. Each **OrderItem** references a **MenuItem**
4. **MenuItem** has **RecipeItems** (ingredients)
5. **RecipeItems** link to **InventoryItems**
6. **InventoryTransactions** track stock changes for the **Order**

### Inventory Management
1. **MenuItem** → **RecipeItem** → **InventoryItem**
2. When order placed: Create **InventoryTransaction** (type: reserve)
3. When order completed: Create **InventoryTransaction** (type: deduct)
4. When order cancelled: Create **InventoryTransaction** (type: release)
5. Manual restock: Create **InventoryTransaction** (type: restock)

### Reservation Flow
1. **Customer** creates **Reservation** for a **Table**
2. **Reception** confirms **Reservation**
3. **Customer** arrives and is seated
4. **Table** status changes to occupied
5. **Order** is created for the **Table**

---

## Data Integrity Rules

### Constraints
1. **Email Uniqueness**: Each email can only be used once
2. **Table Number Uniqueness**: Each table number is unique
3. **Menu Item Name Uniqueness**: Each menu item name is unique
4. **Inventory Item Name Uniqueness**: Each inventory item name is unique
5. **Recipe Uniqueness**: Each menu item can only have one recipe entry per ingredient

### Cascading Deletes
- Deleting a **User** should handle related records appropriately
- Deleting a **MenuItem** should handle related **OrderItems** and **RecipeItems**
- Deleting an **InventoryItem** should prevent if used in recipes
- Deleting an **Order** should handle related **OrderItems** and **Transactions**

### Business Rules
1. **Stock Validation**: Cannot reserve more stock than available
2. **Order Validation**: Cannot order unavailable menu items
3. **Reservation Validation**: Cannot reserve occupied tables
4. **Payment Validation**: Order must be paid before completion
5. **Role Validation**: Only authorized roles can perform certain actions

---

## Indexes and Performance

### Primary Indexes
- All tables have a primary key on `id` (CUID)

### Foreign Key Indexes
- Automatic indexes on all foreign key columns for join performance

### Custom Indexes
- **User.email**: Unique index for fast login lookups
- **Table.table_number**: Unique index for table identification
- **MenuItem.name**: Unique index for menu item lookups
- **MenuItem.category**: Index for category filtering
- **Order.created_at**: Index for date-based queries
- **Order.order_status**: Index for status filtering
- **InventoryItem.name**: Unique index for inventory lookups

### Composite Indexes
- **RecipeItem(menu_item_id, ingredient_id)**: Unique composite for recipe integrity

---

## Migration Strategy

### Initial Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed
```

### Schema Updates
1. Modify `schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Review generated SQL
4. Apply to production: `npx prisma migrate deploy`

---

## Backup and Recovery

### Recommended Backup Strategy
1. **Daily automated backups** of entire database
2. **Transaction log backups** every hour
3. **Point-in-time recovery** capability
4. **Test restore procedures** monthly

### Critical Data
- User accounts and authentication data
- Order history and payment records
- Inventory transaction logs
- Customer reviews and feedback

---

## Security Considerations

### Sensitive Data
- **password_hash**: Never expose in API responses
- **otp_code**: Temporary, expires after use
- **payment information**: Not stored (handled by payment gateway)

### Access Control
- Row-level security based on user role
- Customers can only access their own data
- Staff can access data relevant to their role
- Admins have full access

### Audit Trail
- All inventory transactions logged with performer
- Order status changes tracked with timestamps
- User actions logged for accountability

---

## Future Enhancements

1. **Multi-restaurant Support**: Add restaurant_id to all relevant tables
2. **Payment Integration**: Add payment transaction table
3. **Loyalty Program**: Add points and rewards tables
4. **Analytics**: Add aggregated data tables for reporting
5. **Delivery**: Add delivery address and driver tables
6. **Promotions**: Add discount and coupon tables
7. **Table QR Codes**: Add QR code generation and tracking
8. **Kitchen Display**: Add kitchen station assignments
