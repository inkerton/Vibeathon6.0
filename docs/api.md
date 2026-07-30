# API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Token Storage
- Store the token in localStorage or secure cookie
- Token expires after configured duration (default: 24h)
- Refresh token mechanism (planned)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Optional validation errors
}
```

## API Endpoints

---

## 1. Authentication (`/auth`)

### Register User
**POST** `/auth/register`

**Access**: Public

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent to email",
  "data": {
    "userId": "clx123abc",
    "email": "john@example.com"
  }
}
```

---

### Verify OTP
**POST** `/auth/verify-otp`

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

---

### Login
**POST** `/auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "is_active": true
    }
  }
}
```

---

### Resend OTP
**POST** `/auth/resend-otp`

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

---

### Google OAuth
**GET** `/auth/google`

**Access**: Public

Redirects to Google OAuth consent screen.

---

### Google OAuth Callback
**GET** `/auth/google/callback`

**Access**: Public (OAuth callback)

Handles Google OAuth callback and redirects to frontend with token.

---

### Get Current User
**GET** `/auth/me`

**Access**: Protected

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "+1234567890",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Logout
**POST** `/auth/logout`

**Access**: Protected

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Menu (`/menu`)

### Get All Menu Items
**GET** `/menu`

**Access**: Public

**Query Parameters**:
- `category` (optional): Filter by category
- `available` (optional): Filter by availability (true/false)
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "price": "12.99",
      "category": "Pizza",
      "image_url": "https://example.com/pizza.jpg",
      "is_available": true,
      "preparation_time": 15,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Menu by Category
**GET** `/menu/by-category`

**Access**: Public

**Response** (200):
```json
{
  "success": true,
  "data": {
    "Pizza": [
      {
        "id": "clx123abc",
        "name": "Margherita Pizza",
        "price": "12.99",
        "is_available": true
      }
    ],
    "Pasta": [...]
  }
}
```

---

### Get Menu Item by ID
**GET** `/menu/:id`

**Access**: Public

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato and mozzarella",
    "price": "12.99",
    "category": "Pizza",
    "image_url": "https://example.com/pizza.jpg",
    "is_available": true,
    "preparation_time": 15,
    "recipe": [
      {
        "ingredient": {
          "id": "ing123",
          "name": "Mozzarella",
          "unit": "g"
        },
        "quantity": 200
      }
    ]
  }
}
```

---

### Create Menu Item
**POST** `/menu`

**Access**: Admin only

**Request Body**:
```json
{
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato and mozzarella",
  "price": 12.99,
  "category": "Pizza",
  "image_url": "https://example.com/pizza.jpg",
  "preparation_time": 15
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "Margherita Pizza",
    "is_available": true
  }
}
```

---

### Update Menu Item
**PATCH** `/menu/:id`

**Access**: Admin only

**Request Body** (all fields optional):
```json
{
  "name": "Updated Pizza Name",
  "description": "Updated description",
  "price": 13.99,
  "category": "Pizza",
  "image_url": "https://example.com/new-pizza.jpg",
  "preparation_time": 20
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "Updated Pizza Name",
    "price": "13.99"
  }
}
```

---

### Delete Menu Item
**DELETE** `/menu/:id`

**Access**: Admin only

**Response** (200):
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

### Toggle Menu Item Availability
**PATCH** `/menu/:id/availability`

**Access**: Admin, Kitchen

**Request Body**:
```json
{
  "is_available": false
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "is_available": false
  }
}
```

---

## 3. Orders (`/orders`)

### Create Order
**POST** `/orders`

**Access**: Customer (authenticated)

**Request Body**:
```json
{
  "table_id": "table123",
  "payment_method": "in_app",
  "items": [
    {
      "menu_item_id": "clx123abc",
      "quantity": 2,
      "custom_instructions": "Extra cheese",
      "allergy_info": "No nuts"
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "order123",
    "order_status": "placed",
    "payment_status": "unpaid",
    "total_amount": "25.98",
    "items": [
      {
        "id": "item123",
        "menu_item": {
          "name": "Margherita Pizza",
          "price": "12.99"
        },
        "quantity": 2,
        "status": "received"
      }
    ]
  }
}
```

---

### Get Customer Orders
**GET** `/orders/my-orders`

**Access**: Customer (authenticated)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "order123",
      "order_status": "preparing",
      "payment_status": "paid",
      "total_amount": "25.98",
      "created_at": "2024-01-01T12:00:00.000Z",
      "items": [...]
    }
  ]
}
```

---

### Get All Orders
**GET** `/orders`

**Access**: Kitchen, Reception, Admin

**Query Parameters**:
- `status` (optional): Filter by order status
- `payment_status` (optional): Filter by payment status
- `date` (optional): Filter by date

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "order123",
      "table": {
        "table_number": 5
      },
      "customer": {
        "name": "John Doe"
      },
      "order_status": "preparing",
      "payment_status": "paid",
      "total_amount": "25.98",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Active Orders
**GET** `/orders/active`

**Access**: Kitchen, Reception, Admin

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "order123",
      "table_number": 5,
      "order_status": "preparing",
      "items": [
        {
          "menu_item": {
            "name": "Margherita Pizza"
          },
          "quantity": 2,
          "status": "preparing"
        }
      ],
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Order by ID
**GET** `/orders/:id`

**Access**: Authenticated (own orders for customers, all for staff)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "order123",
    "table": {
      "table_number": 5
    },
    "customer": {
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "order_status": "preparing",
    "payment_status": "paid",
    "payment_method": "in_app",
    "total_amount": "25.98",
    "items": [
      {
        "id": "item123",
        "menu_item": {
          "name": "Margherita Pizza",
          "preparation_time": 15
        },
        "quantity": 2,
        "price_at_order": "12.99",
        "status": "preparing",
        "custom_instructions": "Extra cheese"
      }
    ],
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### Update Order Status
**PATCH** `/orders/:id/status`

**Access**: Kitchen, Reception, Admin

**Request Body**:
```json
{
  "order_status": "ready"
}
```

**Valid Status Transitions**:
- placed → preparing
- preparing → ready
- ready → served
- served → completed
- any → cancelled

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "order123",
    "order_status": "ready"
  }
}
```

---

### Update Order Item Status
**PATCH** `/orders/:id/items/:itemId/status`

**Access**: Kitchen, Admin

**Request Body**:
```json
{
  "status": "preparing"
}
```

**Valid Item Statuses**:
- received
- preparing
- ready
- served

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "item123",
    "status": "preparing"
  }
}
```

---

### Update Payment Status
**PATCH** `/orders/:id/payment`

**Access**: Reception, Admin

**Request Body**:
```json
{
  "payment_status": "paid"
}
```

**Valid Payment Statuses**:
- unpaid
- pending_at_table
- paid

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "order123",
    "payment_status": "paid"
  }
}
```

---

### Cancel Order
**DELETE** `/orders/:id`

**Access**: Customer (own orders), Admin (any order)

**Response** (200):
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## 4. Reservations (`/reservations`)

### Get Available Tables
**GET** `/reservations/available-tables`

**Access**: Public

**Query Parameters**:
- `date` (required): ISO date string
- `party_size` (required): Number of people

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "table123",
      "table_number": 5,
      "capacity": 4,
      "status": "free"
    }
  ]
}
```

---

### Create Reservation
**POST** `/reservations`

**Access**: Customer (authenticated)

**Request Body**:
```json
{
  "table_id": "table123",
  "date": "2024-01-15T19:00:00.000Z",
  "party_size": 4,
  "special_request": "Window seat preferred"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "res123",
    "table": {
      "table_number": 5
    },
    "date": "2024-01-15T19:00:00.000Z",
    "party_size": 4,
    "status": "pending"
  }
}
```

---

### Get User Reservations
**GET** `/reservations/my-reservations`

**Access**: Customer (authenticated)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "res123",
      "table": {
        "table_number": 5
      },
      "date": "2024-01-15T19:00:00.000Z",
      "party_size": 4,
      "status": "confirmed",
      "special_request": "Window seat preferred"
    }
  ]
}
```

---

### Get All Reservations
**GET** `/reservations`

**Access**: Reception, Admin

**Query Parameters**:
- `date` (optional): Filter by date
- `status` (optional): Filter by status

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "res123",
      "customer": {
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "table": {
        "table_number": 5
      },
      "date": "2024-01-15T19:00:00.000Z",
      "party_size": 4,
      "status": "confirmed"
    }
  ]
}
```

---

### Get Reservation by ID
**GET** `/reservations/:id`

**Access**: Authenticated (own reservations for customers, all for staff)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "res123",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "table": {
      "table_number": 5,
      "capacity": 4
    },
    "date": "2024-01-15T19:00:00.000Z",
    "party_size": 4,
    "status": "confirmed",
    "special_request": "Window seat preferred",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

---

### Update Reservation Status
**PATCH** `/reservations/:id/status`

**Access**: Reception, Admin

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Valid Statuses**:
- pending
- confirmed
- seated
- cancelled
- completed

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "res123",
    "status": "confirmed"
  }
}
```

---

### Cancel Reservation
**PATCH** `/reservations/:id/cancel`

**Access**: Customer (own reservations), Reception, Admin

**Response** (200):
```json
{
  "success": true,
  "message": "Reservation cancelled successfully"
}
```

---

## 5. Inventory (`/inventory`)

### Get All Inventory Items
**GET** `/inventory`

**Access**: Inventory, Admin

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv123",
      "name": "Mozzarella Cheese",
      "unit": "kg",
      "total_stock": 50.5,
      "reserved_stock": 5.0,
      "available_stock": 45.5,
      "reorder_threshold": 10.0,
      "is_low_stock": false
    }
  ]
}
```

---

### Get Low Stock Items
**GET** `/inventory/low-stock`

**Access**: Inventory, Admin

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv123",
      "name": "Tomato Sauce",
      "total_stock": 8.0,
      "reorder_threshold": 10.0,
      "unit": "L"
    }
  ]
}
```

---

### Get Inventory Transactions
**GET** `/inventory/transactions`

**Access**: Inventory, Admin

**Query Parameters**:
- `item_id` (optional): Filter by item
- `type` (optional): Filter by transaction type
- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "trans123",
      "item": {
        "name": "Mozzarella Cheese"
      },
      "type": "restock",
      "quantity": 20.0,
      "performed_by": {
        "name": "Staff Member"
      },
      "note": "Weekly restock",
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

---

### Get Daily Summary
**GET** `/inventory/summary/daily`

**Access**: Inventory, Admin

**Query Parameters**:
- `date` (optional): Date for summary (defaults to today)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "total_items": 50,
    "low_stock_items": 3,
    "transactions": {
      "restock": 5,
      "deduct": 20,
      "reserve": 15,
      "release": 2,
      "adjustment": 1
    }
  }
}
```

---

### Get Inventory Item by ID
**GET** `/inventory/:id`

**Access**: Inventory, Admin

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "name": "Mozzarella Cheese",
    "unit": "kg",
    "total_stock": 50.5,
    "reserved_stock": 5.0,
    "available_stock": 45.5,
    "reorder_threshold": 10.0,
    "recent_transactions": [...]
  }
}
```

---

### Create Inventory Item
**POST** `/inventory`

**Access**: Admin only

**Request Body**:
```json
{
  "name": "Mozzarella Cheese",
  "unit": "kg",
  "total_stock": 50.0,
  "reorder_threshold": 10.0
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "name": "Mozzarella Cheese",
    "total_stock": 50.0
  }
}
```

---

### Update Inventory Item
**PATCH** `/inventory/:id`

**Access**: Admin only

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "unit": "g",
  "reorder_threshold": 15.0
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "name": "Updated Name"
  }
}
```

---

### Delete Inventory Item
**DELETE** `/inventory/:id`

**Access**: Admin only

**Response** (200):
```json
{
  "success": true,
  "message": "Inventory item deleted successfully"
}
```

---

### Restock Item
**POST** `/inventory/:id/restock`

**Access**: Inventory, Admin

**Request Body**:
```json
{
  "quantity": 20.0,
  "note": "Weekly restock"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "total_stock": 70.5,
    "transaction_id": "trans123"
  }
}
```

---

### Adjust Stock
**POST** `/inventory/:id/adjust`

**Access**: Inventory, Admin

**Request Body**:
```json
{
  "quantity": -2.5,
  "note": "Damaged goods"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "total_stock": 68.0,
    "transaction_id": "trans124"
  }
}
```

---

### Reserve Stock
**POST** `/inventory/:id/reserve`

**Access**: Kitchen, Admin

**Request Body**:
```json
{
  "quantity": 5.0,
  "order_id": "order123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "reserved_stock": 10.0,
    "available_stock": 58.0
  }
}
```

---

### Deduct Stock
**POST** `/inventory/:id/deduct`

**Access**: Kitchen, Admin

**Request Body**:
```json
{
  "quantity": 5.0,
  "order_id": "order123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "total_stock": 63.0,
    "reserved_stock": 5.0
  }
}
```

---

### Release Stock
**POST** `/inventory/:id/release`

**Access**: Kitchen, Admin

**Request Body**:
```json
{
  "quantity": 5.0,
  "order_id": "order123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "inv123",
    "reserved_stock": 0.0,
    "available_stock": 63.0
  }
}
```

---

### Update Menu Item Availability
**POST** `/inventory/menu/:menuItemId/availability`

**Access**: Inventory, Admin

Checks if menu item can be prepared based on current inventory.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "menu_item_id": "menu123",
    "is_available": true,
    "max_servings": 25
  }
}
```

---

### Update All Menu Items Availability
**POST** `/inventory/menu/availability/update-all`

**Access**: Inventory, Admin

Updates availability for all menu items based on current inventory.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "updated_count": 15,
    "unavailable_items": ["Pizza Margherita", "Pasta Carbonara"]
  }
}
```

---

## 6. Recipes (`/recipes`)

### Get Menu Item Recipe
**GET** `/recipes/menu/:menuItemId`

**Access**: Authenticated

**Response** (200):
```json
{
  "success": true,
  "data": {
    "menu_item": {
      "id": "menu123",
      "name": "Margherita Pizza"
    },
    "ingredients": [
      {
        "id": "recipe123",
        "ingredient": {
          "id": "inv123",
          "name": "Mozzarella Cheese",
          "unit": "g"
        },
        "quantity": 200
      }
    ]
  }
}
```

---

### Add Ingredient to Recipe
**POST** `/recipes/menu/:menuItemId/ingredients`

**Access**: Inventory, Admin

**Request Body**:
```json
{
  "ingredient_id": "inv123",
  "quantity": 200,
  "unit": "g"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "recipe123",
    "menu_item_id": "menu123",
    "ingredient_id": "inv123",
    "quantity": 200
  }
}
```

---

### Update Recipe Ingredient
**PATCH** `/recipes/items/:recipeItemId`

**Access**: Inventory, Admin

**Request Body**:
```json
{
  "quantity": 250,
  "unit": "g"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "recipe123",
    "quantity": 250
  }
}
```

---

### Remove Ingredient from Recipe
**DELETE** `/recipes/items/:recipeItemId`

**Access**: Inventory, Admin

**Response** (200):
```json
{
  "success": true,
  "message": "Ingredient removed from recipe"
}
```

---

### Set Menu Item Recipe (Bulk Update)
**PUT** `/recipes/menu/:menuItemId`

**Access**: Inventory, Admin

**Request Body**:
```json
{
  "ingredients": [
    {
      "ingredient_id": "inv123",
      "quantity": 200,
      "unit": "g"
    },
    {
      "ingredient_id": "inv456",
      "quantity": 100,
      "unit": "g"
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "menu_item_id": "menu123",
    "ingredients_count": 2
  }
}
```

---

### Calculate Max Servings
**GET** `/recipes/menu/:menuItemId/availability`

**Access**: Authenticated

**Response** (200):
```json
{
  "success": true,
  "data": {
    "menu_item_id": "menu123",
    "max_servings": 25,
    "is_available": true,
    "limiting_ingredient": {
      "name": "Mozzarella Cheese",
      "available": 5000,
      "required_per_serving": 200
    }
  }
}
```

---

## 7. Staff (`/staff`)

### Get All Staff
**GET** `/staff`

**Access**: Admin only

**Query Parameters**:
- `role` (optional): Filter by role
- `is_active` (optional): Filter by active status

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "staff123",
      "name": "Jane Smith",
      "email": "jane@restaurant.com",
      "role": "kitchen",
      "phone": "+1234567890",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Staff by ID
**GET** `/staff/:id`

**Access**: Admin only

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "staff123",
    "name": "Jane Smith",
    "email": "jane@restaurant.com",
    "role": "kitchen",
    "phone": "+1234567890",
    "is_active": true,
    "auth_provider": "local",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Create Staff
**POST** `/staff`

**Access**: Admin only

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@restaurant.com",
  "password": "SecurePass123!",
  "role": "kitchen",
  "phone": "+1234567890"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "staff123",
    "name": "Jane Smith",
    "email": "jane@restaurant.com",
    "role": "kitchen"
  }
}
```

---

### Update Staff
**PATCH** `/staff/:id`

**Access**: Admin only

**Request Body** (all fields optional):
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@restaurant.com",
  "phone": "+0987654321",
  "role": "reception"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "staff123",
    "name": "Jane Doe",
    "role": "reception"
  }
}
```

---

### Toggle Staff Status
**PATCH** `/staff/:id/status`

**Access**: Admin only

**Request Body**:
```json
{
  "is_active": false
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "staff123",
    "is_active": false
  }
}
```

---

### Delete Staff
**DELETE** `/staff/:id`

**Access**: Admin only

**Response** (200):
```json
{
  "success": true,
  "message": "Staff member deleted successfully"
}
```

---

## 8. Seed (`/seed`)

### Seed Database
**POST** `/seed/all`

**Access**: Development only (should be disabled in production)

Seeds the database with sample data for testing.

**Response** (200):
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "users": 10,
    "menu_items": 20,
    "inventory_items": 15,
    "tables": 10
  }
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');
```

### Join Rooms
```javascript
// Join role-specific room
socket.emit('join:role', 'kitchen');

// Join restaurant room
socket.emit('join:restaurant', 'restaurant_id');

// Join order tracking room
socket.emit('join:order', 'order_id');
```

### Listen for Events
```javascript
// New order notification (kitchen)
socket.on('order:new', (order) => {
  console.log('New order:', order);
});

// Order status update
socket.on('order:status', (data) => {
  console.log('Order status updated:', data);
});

// Inventory low stock alert
socket.on('inventory:low-stock', (item) => {
  console.log('Low stock alert:', item);
});

// Reservation update
socket.on('reservation:update', (reservation) => {
  console.log('Reservation updated:', reservation);
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

---

## Rate Limiting

(To be implemented)

- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute
- WebSocket connections: 10 per IP

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle errors gracefully** - check response status
3. **Use WebSocket** for real-time updates instead of polling
4. **Validate input** on client side before sending
5. **Store tokens securely** - use httpOnly cookies or secure storage
6. **Implement retry logic** for failed requests
7. **Use pagination** for large data sets (to be implemented)
8. **Cache responses** where appropriate
