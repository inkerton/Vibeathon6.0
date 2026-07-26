# Customer API Contract

This document outlines all API endpoints available for the customer-facing application.

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

### Register Customer
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent."
  }
}
```

### Verify OTP
**POST** `/auth/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "+1234567890"
  }
}
```

---

## Menu

### Get All Menu Items
**GET** `/menu`

**Query Parameters:**
- `category` (optional): Filter by category (appetizer, main_course, dessert, beverage)
- `available` (optional): Filter by availability (true/false)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "menu_item_id",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "category": "main_course",
      "price": 12.99,
      "image_url": "https://example.com/pizza.jpg",
      "is_available": true,
      "preparation_time": 15,
      "is_vegetarian": true,
      "is_vegan": false,
      "allergens": ["gluten", "dairy"],
      "created_at": "2026-07-26T10:00:00.000Z"
    }
  ]
}
```

### Get Menu Item by ID
**GET** `/menu/:id`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "menu_item_id",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato and mozzarella",
    "category": "main_course",
    "price": 12.99,
    "image_url": "https://example.com/pizza.jpg",
    "is_available": true,
    "preparation_time": 15,
    "is_vegetarian": true,
    "is_vegan": false,
    "allergens": ["gluten", "dairy"],
    "recipe": [
      {
        "id": "recipe_item_id",
        "ingredient_id": "ingredient_id",
        "quantity": 200,
        "unit": "g",
        "ingredient": {
          "id": "ingredient_id",
          "name": "Mozzarella Cheese",
          "total_stock": 5000,
          "reserved_stock": 500
        }
      }
    ]
  }
}
```

### Get Menu by Category
**GET** `/menu/category/:category`

**Categories:** `appetizer`, `main_course`, `dessert`, `beverage`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "menu_item_id",
      "name": "Caesar Salad",
      "category": "appetizer",
      "price": 8.99,
      "is_available": true
    }
  ]
}
```

---

## Orders

### Create Order
**POST** `/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "table_id": "table_id",
  "items": [
    {
      "menu_item_id": "menu_item_id",
      "quantity": 2,
      "special_instructions": "No onions"
    }
  ],
  "special_instructions": "Please serve hot"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "order_id",
    "order_number": "ORD-001",
    "table_id": "table_id",
    "customer_id": "customer_id",
    "order_status": "placed",
    "payment_status": "pending",
    "total_amount": 25.98,
    "special_instructions": "Please serve hot",
    "created_at": "2026-07-26T12:00:00.000Z",
    "items": [
      {
        "id": "order_item_id",
        "menu_item_id": "menu_item_id",
        "quantity": 2,
        "price": 12.99,
        "special_instructions": "No onions",
        "menu_item": {
          "name": "Margherita Pizza",
          "image_url": "https://example.com/pizza.jpg"
        }
      }
    ]
  }
}
```

### Get Customer Orders
**GET** `/orders/my-orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (optional): Filter by status (placed, preparing, ready, served, completed, cancelled)
- `limit` (optional): Number of orders to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "order_id",
      "order_number": "ORD-001",
      "table_id": "table_id",
      "order_status": "preparing",
      "payment_status": "pending",
      "total_amount": 25.98,
      "created_at": "2026-07-26T12:00:00.000Z",
      "items": [
        {
          "id": "order_item_id",
          "quantity": 2,
          "price": 12.99,
          "menu_item": {
            "name": "Margherita Pizza",
            "image_url": "https://example.com/pizza.jpg"
          }
        }
      ],
      "table": {
        "table_number": 5,
        "capacity": 4
      }
    }
  ]
}
```

### Get Order by ID
**GET** `/orders/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "order_id",
    "order_number": "ORD-001",
    "table_id": "table_id",
    "customer_id": "customer_id",
    "order_status": "preparing",
    "payment_status": "pending",
    "total_amount": 25.98,
    "special_instructions": "Please serve hot",
    "created_at": "2026-07-26T12:00:00.000Z",
    "updated_at": "2026-07-26T12:05:00.000Z",
    "items": [
      {
        "id": "order_item_id",
        "menu_item_id": "menu_item_id",
        "quantity": 2,
        "price": 12.99,
        "special_instructions": "No onions",
        "menu_item": {
          "id": "menu_item_id",
          "name": "Margherita Pizza",
          "description": "Classic pizza",
          "image_url": "https://example.com/pizza.jpg",
          "preparation_time": 15
        }
      }
    ],
    "table": {
      "id": "table_id",
      "table_number": 5,
      "capacity": 4
    },
    "customer": {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Update Order Status (Customer can cancel)
**PATCH** `/orders/:id/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "cancelled"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "order_id",
    "order_status": "cancelled",
    "message": "Order cancelled successfully"
  }
}
```

---

## Reservations

### Create Reservation
**POST** `/reservations`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "date": "2026-07-27T19:00:00.000Z",
  "party_size": 4,
  "special_requests": "Window seat preferred"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "reservation_id",
    "customer_id": "customer_id",
    "date": "2026-07-27T19:00:00.000Z",
    "party_size": 4,
    "status": "pending",
    "special_requests": "Window seat preferred",
    "created_at": "2026-07-26T12:00:00.000Z",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}
```

### Get Customer Reservations
**GET** `/reservations/my-reservations`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, seated, completed, cancelled)
- `upcoming` (optional): Get only upcoming reservations (true/false)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "reservation_id",
      "customer_id": "customer_id",
      "table_id": "table_id",
      "date": "2026-07-27T19:00:00.000Z",
      "party_size": 4,
      "status": "confirmed",
      "special_requests": "Window seat preferred",
      "created_at": "2026-07-26T12:00:00.000Z",
      "table": {
        "id": "table_id",
        "table_number": 8,
        "capacity": 4
      }
    }
  ]
}
```

### Get Reservation by ID
**GET** `/reservations/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "reservation_id",
    "customer_id": "customer_id",
    "table_id": "table_id",
    "date": "2026-07-27T19:00:00.000Z",
    "party_size": 4,
    "status": "confirmed",
    "special_requests": "Window seat preferred",
    "created_at": "2026-07-26T12:00:00.000Z",
    "updated_at": "2026-07-26T13:00:00.000Z",
    "customer": {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "table": {
      "id": "table_id",
      "table_number": 8,
      "capacity": 4,
      "location": "Window side"
    }
  }
}
```

### Cancel Reservation
**PATCH** `/reservations/:id/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "cancelled"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "reservation_id",
    "status": "cancelled",
    "message": "Reservation cancelled successfully"
  }
}
```

---

## Tables

### Get Available Tables
**GET** `/tables/available`

**Query Parameters:**
- `date` (required): ISO date string
- `party_size` (required): Number of guests

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "table_id",
      "table_number": 5,
      "capacity": 4,
      "location": "Main dining area",
      "is_available": true
    }
  ]
}
```

---

## WebSocket Events (Real-time Updates)

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken
  }
});
```

### Join Customer Room
```javascript
socket.emit('join-room', { room: 'customer' });
```

### Listen for Order Updates
```javascript
socket.on('order-update', (data) => {
  console.log('Order status changed:', data);
  // data structure:
  {
    orderId: "order_id",
    status: "preparing",
    message: "Your order is being prepared"
  }
});
```

### Listen for Reservation Updates
```javascript
socket.on('reservation-update', (data) => {
  console.log('Reservation status changed:', data);
  // data structure:
  {
    reservationId: "reservation_id",
    status: "confirmed",
    tableNumber: 8,
    message: "Your reservation has been confirmed"
  }
});
```

---

## Data Models

### Order Status Flow
```
placed → preparing → ready → served → completed
         ↓
      cancelled
```

### Reservation Status Flow
```
pending → confirmed → seated → completed
          ↓
       cancelled
```

### Payment Status
- `pending`: Payment not yet made
- `paid`: Payment completed

---

## Error Responses

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Order creation**: 10 requests per minute
- **Other endpoints**: 100 requests per minute

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle WebSocket reconnection** for real-time updates
3. **Implement optimistic UI updates** for better UX
4. **Cache menu items** to reduce API calls
5. **Show loading states** during API requests
6. **Handle errors gracefully** with user-friendly messages
7. **Validate data on client-side** before sending to API
8. **Use pagination** for large lists (orders, reservations)

---

## Example Customer Flow

### 1. Browse Menu
```javascript
GET /menu?available=true
```

### 2. Add Items to Cart (Client-side)
```javascript
// Store in local state/context
const cart = [
  { menuItemId: 'item1', quantity: 2, specialInstructions: 'No onions' },
  { menuItemId: 'item2', quantity: 1 }
];
```

### 3. Create Order
```javascript
POST /orders
{
  table_id: 'table_id',
  items: cart
}
```

### 4. Track Order Status (WebSocket)
```javascript
socket.on('order-update', (data) => {
  // Update UI with new status
  updateOrderStatus(data.orderId, data.status);
});
```

### 5. View Order History
```javascript
GET /orders/my-orders?limit=10&offset=0
```

---

## Testing Endpoints

Use tools like:
- **Postman**: For manual API testing
- **curl**: For command-line testing
- **Insomnia**: For API exploration

Example curl command:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```
