# Manual Testing Guide - Smart Restaurant Management System

## Prerequisites

### Required Software
- ✅ Node.js (v18+)
- ✅ PostgreSQL (running locally)
- ✅ curl or Postman for API testing
- ✅ Web browser for frontend testing

### Setup Verification
```bash
# Check backend server
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}

# Check frontend (if running)
curl http://localhost:3000
# Expected: HTML response

# Check database
psql -U yashraj -d yashraj -c "SELECT COUNT(*) FROM \"MenuItem\";"
# Expected: 14 rows
```

---

## Test Plan Overview

| Module | Priority | Time | Status |
|--------|----------|------|--------|
| 1. Authentication | HIGH | 30 min | ⏳ |
| 2. Menu Management | HIGH | 20 min | ⏳ |
| 3. Inventory System | HIGH | 45 min | ⏳ |
| 4. Recipe Management | HIGH | 30 min | ⏳ |
| 5. Order Flow | HIGH | 40 min | ⏳ |
| 6. Reservations | MEDIUM | 25 min | ⏳ |
| 7. Real-time Updates | MEDIUM | 20 min | ⏳ |
| 8. Edge Cases | LOW | 30 min | ⏳ |

**Total Estimated Time:** ~4 hours

---

## 1. Authentication Testing (30 min)

### 1.1 User Registration

**Test Case:** Register new users with different roles

```bash
# Test 1: Register Admin
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "admin"
  }'

# Expected Response:
# {
#   "status": "success",
#   "message": "OTP sent to email",
#   "data": { "email": "admin@test.com" }
# }

# Test 2: Register Inventory Manager
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inventory@test.com",
    "password": "Inventory123!",
    "name": "Inventory Manager",
    "role": "inventory"
  }'

# Test 3: Register Kitchen Staff
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kitchen@test.com",
    "password": "Kitchen123!",
    "name": "Kitchen Staff",
    "role": "kitchen"
  }'

# Test 4: Register Customer
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Customer123!",
    "name": "Test Customer",
    "role": "customer"
  }'
```

**Verification:**
- ✅ Check server logs for OTP codes
- ✅ Verify email format validation
- ✅ Verify password strength requirements
- ✅ Check database: `SELECT * FROM "User" WHERE email LIKE '%@test.com';`

### 1.2 OTP Verification

**Get OTP from server logs:**
```bash
# Check backend output for OTP
# Look for: "OTP for user@email.com: 123456"
```

**Verify OTP:**
```bash
# Replace 123456 with actual OTP from logs
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "otp": "123456"
  }'

# Expected Response:
# {
#   "status": "success",
#   "message": "Email verified successfully"
# }
```

**Test Cases:**
- ✅ Valid OTP → Success
- ✅ Invalid OTP → Error
- ✅ Expired OTP (wait 5 min) → Error
- ✅ Already verified email → Error

### 1.3 Login & Token Management

```bash
# Login as admin
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'

# Expected Response:
# {
#   "status": "success",
#   "data": {
#     "user": { "id": "...", "email": "...", "role": "admin" },
#     "accessToken": "eyJhbGc...",
#     "refreshToken": "eyJhbGc..."
#   }
# }

# SAVE THE ACCESS TOKEN FOR NEXT TESTS
export ADMIN_TOKEN="<accessToken_here>"
export INVENTORY_TOKEN="<token_for_inventory_user>"
export KITCHEN_TOKEN="<token_for_kitchen_user>"
export CUSTOMER_TOKEN="<token_for_customer_user>"
```

### 1.4 Protected Endpoints

```bash
# Test with valid token
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: User details

# Test without token
curl -X GET http://localhost:5000/api/v1/auth/me

# Expected: {"status":"error","message":"No token provided"}

# Test with invalid token
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"

# Expected: {"status":"error","message":"Invalid token"}
```

**Checklist:**
- [ ] Admin user registered and verified
- [ ] Inventory user registered and verified
- [ ] Kitchen user registered and verified
- [ ] Customer user registered and verified
- [ ] All tokens saved for subsequent tests
- [ ] Protected endpoints reject unauthenticated requests

---

## 2. Menu Management Testing (20 min)

### 2.1 View Menu (Public)

```bash
# Get all menu items
curl -X GET http://localhost:5000/api/v1/menu

# Expected: Array of 14 menu items

# Get menu by category
curl -X GET "http://localhost:5000/api/v1/menu/by-category?category=main_course"

# Get specific menu item
MENU_ITEM_ID="<id_from_previous_response>"
curl -X GET http://localhost:5000/api/v1/menu/$MENU_ITEM_ID
```

### 2.2 Create Menu Item (Admin Only)

```bash
curl -X POST http://localhost:5000/api/v1/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Pizza",
    "description": "Test pizza for inventory testing",
    "price": "19.99",
    "category": "main_course",
    "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    "is_available": true
  }'

# Save the returned ID
export TEST_MENU_ID="<id_from_response>"
```

### 2.3 Update Menu Item

```bash
curl -X PATCH http://localhost:5000/api/v1/menu/$TEST_MENU_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "price": "21.99",
    "description": "Updated test pizza"
  }'
```

### 2.4 Toggle Availability

```bash
curl -X PATCH http://localhost:5000/api/v1/menu/$TEST_MENU_ID/availability \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Check availability changed
curl -X GET http://localhost:5000/api/v1/menu/$TEST_MENU_ID | grep is_available
```

**Checklist:**
- [ ] Public can view menu without auth
- [ ] Admin can create menu items
- [ ] Admin can update menu items
- [ ] Admin/Kitchen can toggle availability
- [ ] Non-admin cannot create/update menu

---

## 3. Inventory System Testing (45 min)

### 3.1 Create Inventory Items

```bash
# Create Tomatoes
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Tomatoes",
    "unit": "kg",
    "total_stock": 50,
    "reorder_threshold": 10
  }'
export TOMATO_ID="<id_from_response>"

# Create Mozzarella
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Mozzarella Cheese",
    "unit": "kg",
    "total_stock": 30,
    "reorder_threshold": 5
  }'
export CHEESE_ID="<id_from_response>"

# Create Basil
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Fresh Basil",
    "unit": "bunch",
    "total_stock": 20,
    "reorder_threshold": 5
  }'
export BASIL_ID="<id_from_response>"

# Create Flour
curl -X POST http://localhost:5000/api/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Pizza Dough",
    "unit": "kg",
    "total_stock": 40,
    "reorder_threshold": 8
  }'
export DOUGH_ID="<id_from_response>"
```

### 3.2 View Inventory

```bash
# Get all inventory items
curl -X GET http://localhost:5000/api/v1/inventory \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Get specific item
curl -X GET http://localhost:5000/api/v1/inventory/$TOMATO_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Expected fields:
# - total_stock
# - reserved_stock
# - available_quantity (calculated)
# - is_low_stock (boolean)
```

### 3.3 Restock Operations

```bash
# Restock tomatoes
curl -X POST http://localhost:5000/api/v1/inventory/$TOMATO_ID/restock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 25,
    "notes": "Weekly supplier delivery"
  }'

# Verify stock increased
curl -X GET http://localhost:5000/api/v1/inventory/$TOMATO_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep total_stock
# Expected: 75 kg (50 + 25)
```

### 3.4 Manual Stock Adjustment

```bash
# Adjust stock (e.g., for waste/damage)
curl -X POST http://localhost:5000/api/v1/inventory/$CHEESE_ID/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 2,
    "reason": "Damaged during storage",
    "is_increase": false
  }'

# Verify adjustment
curl -X GET http://localhost:5000/api/v1/inventory/$CHEESE_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep total_stock
# Expected: 28 kg (30 - 2)
```

### 3.5 View Transactions

```bash
# Get all transactions
curl -X GET http://localhost:5000/api/v1/inventory/transactions \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Get transactions for specific item
curl -X GET "http://localhost:5000/api/v1/inventory/transactions?itemId=$TOMATO_ID" \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Expected: List of transactions with type, quantity, user, timestamp
```

### 3.6 Low Stock Alerts

```bash
# Reduce stock below threshold
curl -X POST http://localhost:5000/api/v1/inventory/$BASIL_ID/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 16,
    "reason": "Testing low stock alert",
    "is_increase": false
  }'

# Check low stock items
curl -X GET http://localhost:5000/api/v1/inventory/low-stock \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Expected: Basil should appear in list (4 remaining, threshold 5)
```

### 3.7 Daily Summary

```bash
curl -X GET http://localhost:5000/api/v1/inventory/summary/daily \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Expected:
# {
#   "date": "2026-07-25",
#   "total_transactions": X,
#   "restocked_items": Y,
#   "deducted_items": Z,
#   ...
# }
```

**Checklist:**
- [ ] Created 4+ inventory items
- [ ] Viewed inventory list
- [ ] Restocked items successfully
- [ ] Manual adjustments work
- [ ] Transaction history visible
- [ ] Low stock alerts working
- [ ] Daily summary generated

---

## 4. Recipe Management Testing (30 min)

### 4.1 Link Ingredients to Menu Item

```bash
# Add tomatoes to Test Pizza recipe
curl -X POST http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "ingredient_id": "'$TOMATO_ID'",
    "quantity": 0.3
  }'
export RECIPE_ITEM_1="<id_from_response>"

# Add cheese
curl -X POST http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "ingredient_id": "'$CHEESE_ID'",
    "quantity": 0.25
  }'

# Add basil
curl -X POST http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "ingredient_id": "'$BASIL_ID'",
    "quantity": 1
  }'

# Add dough
curl -X POST http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "ingredient_id": "'$DOUGH_ID'",
    "quantity": 0.4
  }'
```

### 4.2 View Recipe

```bash
curl -X GET http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Expected: List of ingredients with quantities
```

### 4.3 Calculate Max Servings

```bash
curl -X GET http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID/availability \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Expected:
# {
#   "available": true,
#   "max_servings": X  (based on lowest ingredient availability)
# }

# Calculate manually:
# Tomatoes: 75 kg / 0.3 kg = 250 servings
# Cheese: 28 kg / 0.25 kg = 112 servings
# Basil: 4 bunch / 1 bunch = 4 servings  ← LIMITING FACTOR
# Dough: 40 kg / 0.4 kg = 100 servings
# Expected max_servings: 4
```

### 4.4 Update Recipe Ingredient

```bash
# Update tomato quantity
curl -X PATCH http://localhost:5000/api/v1/recipes/items/$RECIPE_ITEM_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 0.35
  }'

# Verify update
curl -X GET http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | grep -A 2 "Tomatoes"
```

### 4.5 Remove Ingredient

```bash
# Remove basil from recipe
curl -X DELETE http://localhost:5000/api/v1/recipes/items/$RECIPE_ITEM_1 \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Verify removal
curl -X GET http://localhost:5000/api/v1/recipes/menu/$TEST_MENU_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
# Basil should not appear
```

**Checklist:**
- [ ] Added ingredients to recipe
- [ ] Viewed recipe details
- [ ] Max servings calculated correctly
- [ ] Updated ingredient quantity
- [ ] Removed ingredient from recipe

---

## 5. Order Flow with Inventory Integration (40 min)

### 5.1 Get Table ID

```bash
# First, check available tables (you may need to seed tables)
psql -U yashraj -d yashraj -c "SELECT id, table_number FROM \"Table\" LIMIT 1;"
export TABLE_ID="<id_from_query>"
```

### 5.2 Create Order (Stock Reservation)

```bash
# Check current stock before order
curl -X GET http://localhost:5000/api/v1/inventory/$TOMATO_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep -E "(total_stock|reserved_stock)"
# Note the values

# Create order with Test Pizza
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "table_id": "'$TABLE_ID'",
    "items": [
      {
        "menu_item_id": "'$TEST_MENU_ID'",
        "quantity": 2,
        "special_instructions": "Extra cheese"
      }
    ],
    "payment_method": "cash"
  }'
export ORDER_ID="<id_from_response>"

# Check stock after order - should be RESERVED
curl -X GET http://localhost:5000/api/v1/inventory/$TOMATO_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep -E "(total_stock|reserved_stock)"

# Expected:
# - total_stock: unchanged
# - reserved_stock: increased by (0.3 kg × 2 pizzas = 0.6 kg)
```

### 5.3 Complete Order (Stock Deduction)

```bash
# Update order status to completed
curl -X PATCH http://localhost:5000/api/v1/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -d '{
    "status": "completed"
  }'

# Check stock after completion - should be DEDUCTED
curl -X GET http://localhost:5000/api/v1/inventory/$TOMATO_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep -E "(total_stock|reserved_stock)"

# Expected:
# - total_stock: decreased by 0.6 kg
# - reserved_stock: decreased by 0.6 kg (back to original)
```

### 5.4 Cancel Order (Stock Release)

```bash
# Create another order
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "table_id": "'$TABLE_ID'",
    "items": [
      {
        "menu_item_id": "'$TEST_MENU_ID'",
        "quantity": 1
      }
    ],
    "payment_method": "card"
  }'
export ORDER_ID_2="<id_from_response>"

# Check reserved stock increased
curl -X GET http://localhost:5000/api/v1/inventory/$CHEESE_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep reserved_stock

# Cancel the order
curl -X DELETE http://localhost:5000/api/v1/orders/$ORDER_ID_2 \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# Check reserved stock decreased (released)
curl -X GET http://localhost:5000/api/v1/inventory/$CHEESE_ID \
  -H "Authorization: Bearer $INVENTORY_TOKEN" | grep reserved_stock
```

### 5.5 Insufficient Stock Scenario

```bash
# Try to order more than available
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "table_id": "'$TABLE_ID'",
    "items": [
      {
        "menu_item_id": "'$TEST_MENU_ID'",
        "quantity": 100
      }
    ],
    "payment_method": "cash"
  }'

# Expected: Error message about insufficient stock
```

### 5.6 Menu Availability Update

```bash
# Reduce basil to 0
curl -X POST http://localhost:5000/api/v1/inventory/$BASIL_ID/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 4,
    "reason": "Testing availability",
    "is_increase": false
  }'

# Update menu item availability
curl -X POST http://localhost:5000/api/v1/inventory/menu/$TEST_MENU_ID/availability \
  -H "Authorization: Bearer $INVENTORY_TOKEN"

# Check menu item
curl -X GET http://localhost:5000/api/v1/menu/$TEST_MENU_ID | grep is_available
# Expected: false (if basil is in recipe)
```

**Checklist:**
- [ ] Order creation reserves stock
- [ ] Order completion deducts stock
- [ ] Order cancellation releases stock
- [ ] Insufficient stock prevents order
- [ ] Menu availability updates based on stock

---

## 6. Reservations Testing (25 min)

### 6.1 Check Available Tables

```bash
curl -X GET "http://localhost:5000/api/v1/reservations/available-tables?date=2026-07-26&time=19:00&party_size=4"

# Expected: List of available tables
```

### 6.2 Create Reservation

```bash
curl -X POST http://localhost:5000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "table_id": "'$TABLE_ID'",
    "date": "2026-07-26",
    "reservation_time": "19:00",
    "party_size": 4,
    "special_requests": "Window seat preferred"
  }'
export RESERVATION_ID="<id_from_response>"
```

### 6.3 View Reservations

```bash
# Customer's own reservations
curl -X GET http://localhost:5000/api/v1/reservations/my-reservations \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

# All reservations (staff only)
curl -X GET http://localhost:5000/api/v1/reservations \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 6.4 Update Reservation Status

```bash
curl -X PATCH http://localhost:5000/api/v1/reservations/$RESERVATION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

### 6.5 Cancel Reservation

```bash
curl -X PATCH http://localhost:5000/api/v1/reservations/$RESERVATION_ID/cancel \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

**Checklist:**
- [ ] Can check available tables
- [ ] Can create reservation
- [ ] Can view own reservations
- [ ] Staff can view all reservations
- [ ] Can update reservation status
- [ ] Can cancel reservation

---

## 7. Real-time Updates Testing (20 min)

### 7.1 Setup Socket.io Client

Create a test HTML file:

```html
<!-- test-socket.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Socket.io Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.io Real-time Test</h1>
  <div id="messages"></div>
  
  <script>
    const socket = io('http://localhost:5000');
    const messages = document.getElementById('messages');
    
    function addMessage(msg) {
      const div = document.createElement('div');
      div.textContent = JSON.stringify(msg, null, 2);
      messages.appendChild(div);
    }
    
    socket.on('connect', () => {
      addMessage({ event: 'connected', id: socket.id });
    });
    
    socket.on('order:created', (data) => {
      addMessage({ event: 'order:created', data });
    });
    
    socket.on('order:status_updated', (data) => {
      addMessage({ event: 'order:status_updated', data });
    });
    
    socket.on('inventory:low_stock', (data) => {
      addMessage({ event: 'inventory:low_stock', data });
    });
    
    socket.on('reservation:status_updated', (data) => {
      addMessage({ event: 'reservation:status_updated', data });
    });
  </script>
</body>
</html>
```

### 7.2 Test Real-time Events

1. Open `test-socket.html` in browser
2. Create an order via API
3. Update order status
4. Trigger low stock alert
5. Verify events appear in browser

**Checklist:**
- [ ] Socket.io connection established
- [ ] Order events received
- [ ] Inventory events received
- [ ] Reservation events received

---

## 8. Edge Cases & Error Handling (30 min)

### 8.1 Authentication Edge Cases

```bash
# Expired token (wait 15+ minutes or modify JWT_EXPIRES_IN)
# Invalid credentials
# Duplicate email registration
# Invalid OTP format
```

### 8.2 Inventory Edge Cases

```bash
# Negative stock adjustment beyond available
curl -X POST http://localhost:5000/api/v1/inventory/$TOMATO_ID/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVENTORY_TOKEN" \
  -d '{
    "quantity": 1000,
    "reason": "Testing negative stock prevention",
    "is_increase": false
  }'
# Expected: Error

# Reserve more than available
# Deduct without reservation
# Delete item with active recipes
```

### 8.3 Order Edge Cases

```bash
# Order with invalid menu item ID
# Order with 0 quantity
# Order with negative quantity
# Complete already completed order
# Cancel already completed order
```

### 8.4 Concurrent Operations

Open two terminal windows and execute simultaneously:
- Window 1: Create order
- Window 2: Create order with same items
- Verify: Stock correctly reserved for both

**Checklist:**
- [ ] Negative stock prevented
- [ ] Invalid inputs rejected
- [ ] Concurrent operations handled
- [ ] Error messages are clear

---

## Test Results Template

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** Development

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Detailed Results

#### 1. Authentication
- [ ] Registration: PASS/FAIL
- [ ] OTP Verification: PASS/FAIL
- [ ] Login: PASS/FAIL
- [ ] Protected Routes: PASS/FAIL

#### 2. Menu Management
- [ ] View Menu: PASS/FAIL
- [ ] Create Item: PASS/FAIL
- [ ] Update Item: PASS/FAIL
- [ ] Toggle Availability: PASS/FAIL

#### 3. Inventory System
- [ ] Create Items: PASS/FAIL
- [ ] Restock: PASS/FAIL
- [ ] Adjust Stock: PASS/FAIL
- [ ] View Transactions: PASS/FAIL
- [ ] Low Stock Alerts: PASS/FAIL

#### 4. Recipe Management
- [ ] Link Ingredients: PASS/FAIL
- [ ] Calculate Servings: PASS/FAIL
- [ ] Update Recipe: PASS/FAIL

#### 5. Order Flow
- [ ] Stock Reservation: PASS/FAIL
- [ ] Stock Deduction: PASS/FAIL
- [ ] Stock Release: PASS/FAIL
- [ ] Insufficient Stock: PASS/FAIL

#### 6. Reservations
- [ ] Create: PASS/FAIL
- [ ] View: PASS/FAIL
- [ ] Update: PASS/FAIL
- [ ] Cancel: PASS/FAIL

#### 7. Real-time Updates
- [ ] Socket Connection: PASS/FAIL
- [ ] Order Events: PASS/FAIL
- [ ] Inventory Events: PASS/FAIL

#### 8. Edge Cases
- [ ] Error Handling: PASS/FAIL
- [ ] Concurrent Operations: PASS/FAIL

### Issues Found
1. Issue description
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Recommendations
- List of improvements
- Performance observations
- Security concerns
```

---

## Quick Verification Script

Save as `quick-test.sh`:

```bash
#!/bin/bash

echo "🧪 Quick System Verification"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test health
echo -n "Health Check: "
if curl -s http://localhost:5000/health | grep -q "ok"; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
fi

# Test menu
echo -n "Menu API: "
if curl -s http://localhost:5000/api/v1/menu | grep -q "status"; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
fi

# Test auth protection
echo -n "Auth Middleware: "
if curl -s http://localhost:5000/api/v1/inventory | grep -q "No token"; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
fi

# Test database
echo -n "Database: "
if psql -U yashraj -d yashraj -c "SELECT 1" &>/dev/null; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
fi

echo ""
echo "Run full tests: See MANUAL_TESTING_GUIDE.md"
```

---

## Notes

- **Time Estimates:** Based on manual testing, may vary
- **Prerequisites:** Ensure backend server is running
- **Database:** Use local PostgreSQL for testing
- **Tokens:** Save tokens as environment variables for convenience
- **Logs:** Monitor backend logs for errors and OTPs
- **Documentation:** Refer to INVENTORY_TESTING_GUIDE.md for API details

---

**Happy Testing! 🧪**
