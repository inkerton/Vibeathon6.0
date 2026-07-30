# Inventory System Testing Guide

## ✅ Backend Setup Complete

### What's Working:
- ✅ Backend server running on http://localhost:5000
- ✅ PostgreSQL database connected (local)
- ✅ Database schema deployed
- ✅ Initial data seeded (14 menu items)
- ✅ All API endpoints configured

### Quick Tests Performed:

```bash
# Health Check
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"2026-07-25T18:04:48.320Z"}

# Public Menu Endpoint
curl http://localhost:5000/api/v1/menu
# Response: 14 menu items returned successfully

# Protected Inventory Endpoint (without auth)
curl http://localhost:5000/api/v1/inventory
# Response: {"status":"error","message":"No token provided"}
# ✅ Auth middleware working correctly
```

## 📋 Available API Endpoints

### Inventory Management
```
GET    /api/v1/inventory                    # Get all inventory items
GET    /api/v1/inventory/low-stock          # Get low stock items
GET    /api/v1/inventory/transactions       # Get inventory transactions
GET    /api/v1/inventory/summary/daily      # Get daily summary
GET    /api/v1/inventory/:id                # Get item by ID
POST   /api/v1/inventory                    # Create inventory item
PATCH  /api/v1/inventory/:id                # Update item details
DELETE /api/v1/inventory/:id                # Delete item
POST   /api/v1/inventory/:id/restock        # Restock item
POST   /api/v1/inventory/:id/adjust         # Adjust stock
POST   /api/v1/inventory/:id/reserve        # Reserve stock (order placed)
POST   /api/v1/inventory/:id/deduct         # Deduct stock (order completed)
POST   /api/v1/inventory/:id/release        # Release stock (order cancelled)
```

### Recipe Management
```
GET    /api/v1/recipes/menu/:menuItemId                    # Get recipe for menu item
POST   /api/v1/recipes/menu/:menuItemId/ingredients        # Add ingredient to recipe
PATCH  /api/v1/recipes/items/:recipeItemId                 # Update ingredient quantity
DELETE /api/v1/recipes/items/:recipeItemId                 # Remove ingredient
PUT    /api/v1/recipes/menu/:menuItemId                    # Bulk update recipe
GET    /api/v1/recipes/menu/:menuItemId/availability       # Calculate max servings
```

## 🧪 Testing the Inventory System

### Step 1: Register and Login

```bash
# 1. Register an admin user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "admin"
  }'

# 2. Check email for OTP (or check server logs)
# 3. Verify OTP
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "otp": "YOUR_OTP_HERE"
  }'

# 4. Login to get JWT token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin123!"
  }'
# Save the "accessToken" from response
```

### Step 2: Create Inventory Items

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Create tomatoes inventory
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tomatoes",
    "unit": "kg",
    "total_stock": 50,
    "reorder_threshold": 10
  }'

# Create mozzarella inventory
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mozzarella Cheese",
    "unit": "kg",
    "total_stock": 30,
    "reorder_threshold": 5
  }'

# Create basil inventory
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Fresh Basil",
    "unit": "bunch",
    "total_stock": 20,
    "reorder_threshold": 5
  }'
```

### Step 3: Link Recipes to Menu Items

```bash
# Get menu items to find Margherita Pizza ID
curl http://localhost:5000/api/v1/menu | grep -A 5 "Margherita"

# Add ingredients to Margherita Pizza recipe
PIZZA_ID="menu_item_id_here"
TOMATO_ID="inventory_item_id_here"
CHEESE_ID="inventory_item_id_here"
BASIL_ID="inventory_item_id_here"

curl -X POST http://localhost:5000/api/v1/recipes/menu/$PIZZA_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ingredient_id": "'$TOMATO_ID'",
    "quantity": 0.3
  }'

curl -X POST http://localhost:5000/api/v1/recipes/menu/$PIZZA_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ingredient_id": "'$CHEESE_ID'",
    "quantity": 0.2
  }'

curl -X POST http://localhost:5000/api/v1/recipes/menu/$PIZZA_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ingredient_id": "'$BASIL_ID'",
    "quantity": 1
  }'
```

### Step 4: Test Order Flow with Inventory

```bash
# 1. Create an order (this will reserve stock)
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "table_id": "table_id_here",
    "items": [
      {
        "menu_item_id": "'$PIZZA_ID'",
        "quantity": 2,
        "special_instructions": "Extra cheese"
      }
    ],
    "payment_method": "cash"
  }'

# 2. Check inventory - stock should be reserved
curl -X GET http://localhost:5000/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"

# 3. Complete order (this will deduct stock)
ORDER_ID="order_id_from_step_1"
curl -X PATCH http://localhost:5000/api/v1/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "completed"
  }'

# 4. Check inventory again - stock should be deducted
curl -X GET http://localhost:5000/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Test Low Stock Alerts

```bash
# Get low stock items
curl -X GET http://localhost:5000/api/v1/inventory/low-stock \
  -H "Authorization: Bearer $TOKEN"

# Restock an item
curl -X POST http://localhost:5000/api/v1/inventory/$TOMATO_ID/restock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "quantity": 50,
    "notes": "Weekly restock from supplier"
  }'
```

## 🎯 Expected Behavior

### Stock Reservation Flow:
1. **Order Placed** → Stock moves from available to reserved
2. **Order Completed** → Stock deducted from both total and reserved
3. **Order Cancelled** → Reserved stock released back to available

### Availability Calculation:
- Menu items automatically marked unavailable when ingredients run out
- Max servings calculated based on lowest ingredient availability
- Real-time updates via Socket.io

### Transaction Logging:
- All stock movements logged with user, timestamp, and reason
- Audit trail for inventory management
- Daily summaries available

## 📊 Database Verification

```bash
# Connect to database
psql -U yashraj -d yashraj

# Check inventory items
SELECT * FROM "InventoryItem";

# Check inventory transactions
SELECT * FROM "InventoryTransaction" ORDER BY created_at DESC LIMIT 10;

# Check recipes
SELECT * FROM "RecipeItem";

# Check menu item availability
SELECT name, is_available FROM "MenuItem";
```

## 🚀 Next Steps

1. **Frontend Implementation:**
   - Create inventory management dashboard
   - Build recipe management interface
   - Add real-time stock alerts
   - Integrate with order flow

2. **Additional Testing:**
   - Load testing with multiple concurrent orders
   - Edge cases (negative stock, concurrent updates)
   - Performance optimization

3. **Production Readiness:**
   - Add rate limiting
   - Implement caching
   - Set up monitoring and alerts
   - Configure production database

## 📝 Notes

- Backend server must be running: `npm run dev` in backend directory
- All inventory endpoints require authentication
- Admin and inventory roles have full access
- Kitchen role can reserve/deduct/release stock
- Socket.io notifications configured for real-time updates
