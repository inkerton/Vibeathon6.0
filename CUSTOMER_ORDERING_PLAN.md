# Customer Menu & Ordering Flow - Implementation Plan

## Current Status
- ✅ Menu browsing with categories and search
- ✅ Cart functionality (add, remove, update quantity)
- ✅ Cart total calculation
- ❌ Checkout flow
- ❌ Order placement
- ❌ Order confirmation
- ❌ Order tracking
- ❌ Order history

## Implementation Plan (3-4 hours)

### Phase 1: Checkout Page (1.5 hours)
**File:** `frontend/app/customer/checkout/page.tsx`

**Features:**
1. Cart review with item list
2. Custom instructions input per item (expandable)
3. Allergy information input per item (expandable)
4. Table number selection
5. Order notes (general)
6. Order summary with total
7. Place order button
8. Loading states
9. Error handling

**API Integration:**
- `POST /api/v1/orders` - Place order
- Request body:
```json
{
  "tableId": "uuid",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "customInstructions": "No onions",
      "allergyInfo": "Peanut allergy"
    }
  ],
  "notes": "Please serve quickly"
}
```

**State Management:**
- Cart items from localStorage or context
- Form state for instructions and allergy info
- Loading state for order placement
- Error state for API failures

**Validation:**
- At least one item in cart
- Table number selected
- Valid quantities

**User Flow:**
1. Review cart items
2. Add custom instructions (optional)
3. Add allergy info (optional)
4. Select table number
5. Add order notes (optional)
6. Click "Place Order"
7. Redirect to confirmation page

---

### Phase 2: Order Confirmation Page (30 minutes)
**File:** `frontend/app/customer/orders/[id]/page.tsx`

**Features:**
1. Order success message
2. Order ID display
3. Estimated preparation time
4. Order summary (items, quantities, total)
5. Table number
6. Custom instructions per item
7. "Track Order" button
8. "Back to Menu" button

**API Integration:**
- `GET /api/v1/orders/:id` - Get order details

**State Management:**
- Order data from API
- Loading state
- Error state

**User Flow:**
1. Show success message
2. Display order details
3. Provide navigation options

---

### Phase 3: Order Tracking Page (1 hour)
**File:** `frontend/app/customer/orders/tracking/page.tsx`

**Features:**
1. Active orders list
2. Order status timeline (Received → Preparing → Ready → Completed)
3. Real-time status updates (polling every 10s)
4. Estimated time remaining
5. Order details expandable
6. Cancel order option (if status is Received)
7. Auto-refresh toggle

**API Integration:**
- `GET /api/v1/orders/my-orders?status=active` - Get active orders
- `PATCH /api/v1/orders/:id` - Cancel order (if allowed)

**State Management:**
- Active orders list
- Polling interval
- Loading state
- Error state

**Status Display:**
- Received: Blue badge, "Order received"
- Preparing: Yellow badge, "Being prepared"
- Ready: Green badge, "Ready for pickup"
- Completed: Gray badge, "Completed"

**User Flow:**
1. View all active orders
2. See real-time status updates
3. Expand to see order details
4. Cancel if needed (early stage only)

---

### Phase 4: Order History Page (1 hour)
**File:** `frontend/app/customer/orders/page.tsx`

**Features:**
1. Past orders list (paginated)
2. Filter by date range
3. Filter by status
4. Order cards with summary
5. Expandable details
6. Reorder button
7. Leave review button (if completed)

**API Integration:**
- `GET /api/v1/orders/my-orders` - Get all orders
- Query params: `page`, `limit`, `status`, `startDate`, `endDate`

**State Management:**
- Orders list
- Filters (date range, status)
- Pagination state
- Loading state
- Error state

**User Flow:**
1. View order history
2. Filter by date or status
3. Expand to see details
4. Reorder favorite items
5. Leave review for completed orders

---

## Shared Components Needed

### 1. OrderItemCard Component
**File:** `frontend/components/OrderItemCard.tsx`

**Props:**
- `item`: OrderItem
- `showInstructions`: boolean
- `showStatus`: boolean

**Features:**
- Item name, quantity, price
- Custom instructions (if any)
- Allergy info (if any)
- Status badge (if applicable)

### 2. OrderStatusBadge Component
**File:** `frontend/components/OrderStatusBadge.tsx`

**Props:**
- `status`: OrderStatus
- `size`: 'sm' | 'md' | 'lg'

**Features:**
- Color-coded badges
- Status text
- Icon (optional)

### 3. OrderTimeline Component
**File:** `frontend/components/OrderTimeline.tsx`

**Props:**
- `currentStatus`: OrderStatus
- `createdAt`: Date
- `estimatedTime`: number

**Features:**
- Visual timeline
- Progress indicator
- Time estimates

---

## Data Flow

### Cart to Checkout
```typescript
// Store cart in localStorage
localStorage.setItem('cart', JSON.stringify(cartItems));

// Retrieve in checkout
const cart = JSON.parse(localStorage.getItem('cart') || '[]');
```

### Checkout to Confirmation
```typescript
// After successful order placement
const orderId = response.data.id;
router.push(`/customer/orders/${orderId}`);

// Clear cart
localStorage.removeItem('cart');
```

### Confirmation to Tracking
```typescript
// Navigate to tracking
router.push('/customer/orders/tracking');
```

---

## API Endpoints Reference

### Orders API
- `POST /api/v1/orders` - Place new order
- `GET /api/v1/orders/my-orders` - Get user's orders
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id` - Update order (cancel)
- `PATCH /api/v1/orders/:id/status` - Update status (staff only)

### Menu API
- `GET /api/v1/menu` - Get all menu items
- `GET /api/v1/menu/:id` - Get menu item details

### Tables API (if needed)
- `GET /api/v1/tables` - Get available tables

---

## Implementation Order

1. **First:** Create shared components (OrderItemCard, OrderStatusBadge, OrderTimeline)
2. **Second:** Implement checkout page with order placement
3. **Third:** Implement order confirmation page
4. **Fourth:** Implement order tracking page with polling
5. **Fifth:** Implement order history page with filters

---

## Testing Checklist

### Checkout Flow
- [ ] Cart items display correctly
- [ ] Can add custom instructions per item
- [ ] Can add allergy info per item
- [ ] Can select table number
- [ ] Can add general order notes
- [ ] Order total calculates correctly
- [ ] Place order API call works
- [ ] Redirects to confirmation on success
- [ ] Shows error on failure
- [ ] Cart clears after successful order

### Order Confirmation
- [ ] Order details display correctly
- [ ] Shows order ID
- [ ] Shows estimated time
- [ ] Shows all items with instructions
- [ ] Navigation buttons work

### Order Tracking
- [ ] Active orders display correctly
- [ ] Status updates in real-time (polling)
- [ ] Status timeline shows correctly
- [ ] Can expand order details
- [ ] Can cancel order (if allowed)
- [ ] Auto-refresh works

### Order History
- [ ] Past orders display correctly
- [ ] Filters work (date, status)
- [ ] Pagination works
- [ ] Can expand order details
- [ ] Reorder button works
- [ ] Review button works (if implemented)

---

## Time Estimates

- Shared components: 30 minutes
- Checkout page: 1.5 hours
- Order confirmation: 30 minutes
- Order tracking: 1 hour
- Order history: 1 hour
- Testing & bug fixes: 30 minutes

**Total: 4.5 hours**

---

## Success Criteria

✅ Customer can browse menu and add items to cart (DONE)
✅ Customer can proceed to checkout
✅ Customer can add custom instructions per item
✅ Customer can add allergy information per item
✅ Customer can place order successfully
✅ Customer receives order confirmation
✅ Customer can track active orders in real-time
✅ Customer can view order history
✅ All API integrations work correctly
✅ Error handling is robust
✅ Loading states are clear
✅ UI is responsive and user-friendly

---

## Next Steps

1. Start with shared components (OrderItemCard, OrderStatusBadge)
2. Implement checkout page
3. Test order placement flow
4. Implement confirmation and tracking pages
5. Test end-to-end flow
6. Fix any bugs found during testing
