'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { OrderItemCard } from '@/components/OrderItemCard';
import { apiClient } from '@/lib/api-client';

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
  quantity: number;
  customInstructions: string;
  allergyInfo: string;
}

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadCart();
    fetchTables();
  }, []);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Initialize empty instructions and allergy info
        const cartWithFields = parsedCart.map((item: any) => ({
          ...item,
          customInstructions: item.customInstructions || '',
          allergyInfo: item.allergyInfo || ''
        }));
        setCart(cartWithFields);
      } else {
        router.push('/customer/menu');
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      router.push('/customer/menu');
    }
  };

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      // For now, create mock tables since we don't have a tables endpoint
      // In production, this would be: const response = await apiClient.get('/tables');
      const mockTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
        id: `table-${i + 1}`,
        tableNumber: i + 1,
        capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        status: 'AVAILABLE'
      }));
      setTables(mockTables);
    } catch (err: any) {
      console.error('Failed to fetch tables:', err);
      // Use mock data on error
      const mockTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
        id: `table-${i + 1}`,
        tableNumber: i + 1,
        capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        status: 'AVAILABLE'
      }));
      setTables(mockTables);
    } finally {
      setLoadingTables(false);
    }
  };

  const updateItemField = (itemId: string, field: 'customInstructions' | 'allergyInfo', value: string) => {
    setCart(cart.map(item =>
      item.menuItem.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedTableId) {
      setToast({ show: true, message: 'Please select a table', type: 'error' });
      return;
    }

    if (cart.length === 0) {
      setToast({ show: true, message: 'Your cart is empty', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare order data
      const orderData = {
        tableId: selectedTableId,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          customInstructions: item.customInstructions || undefined,
          allergyInfo: item.allergyInfo || undefined
        })),
        notes: orderNotes || undefined
      };

      const response = await apiClient.post('/orders', orderData);
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Show success message
      setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/customer/orders/${response.data.id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to place order');
      setToast({ show: true, message: 'Failed to place order', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTables) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600">Review your order and complete checkout</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage message={error} className="mb-6" />}

        <div className="space-y-6">
          {/* Order Items */}
          <Card title="Order Items" className="space-y-4">
            {cart.map(item => (
              <div key={item.menuItem.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.menuItem.name}</h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ₹{item.menuItem.price.toFixed(2)} = ₹{(item.quantity * item.menuItem.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExpanded(item.menuItem.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedItems.has(item.menuItem.id) ? 'Hide Details' : 'Add Details'}
                  </button>
                </div>

                {expandedItems.has(item.menuItem.id) && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Instructions (Optional)
                      </label>
                      <textarea
                        value={item.customInstructions}
                        onChange={(e) => updateItemField(item.menuItem.id, 'customInstructions', e.target.value)}
                        placeholder="e.g., No onions, extra spicy, well done..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergy Information (Optional)
                      </label>
                      <textarea
                        value={item.allergyInfo}
                        onChange={(e) => updateItemField(item.menuItem.id, 'allergyInfo', e.target.value)}
                        placeholder="e.g., Peanut allergy, lactose intolerant..."
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        rows={2}
                      />
                      <p className="text-xs text-red-600 mt-1">⚠️ Please inform us of any allergies</p>
                    </div>
                  </div>
                )}

                {!expandedItems.has(item.menuItem.id) && (item.customInstructions || item.allergyInfo) && (
                  <div className="text-sm text-gray-600 pl-4">
                    {item.customInstructions && <p>✓ Custom instructions added</p>}
                    {item.allergyInfo && <p className="text-red-600">⚠️ Allergy info added</p>}
                  </div>
                )}
              </div>
            ))}
          </Card>

          {/* Table Selection */}
          <Card title="Select Table">
            <div className="grid grid-cols-5 gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  disabled={table.status !== 'AVAILABLE'}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTableId === table.id
                      ? 'border-blue-600 bg-blue-50'
                      : table.status === 'AVAILABLE'
                      ? 'border-gray-300 hover:border-blue-400'
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-lg">#{table.tableNumber}</p>
                    <p className="text-xs text-gray-600">{table.capacity} seats</p>
                  </div>
                </button>
              ))}
            </div>
            {!selectedTableId && (
              <p className="text-sm text-gray-600 mt-3">Please select a table to continue</p>
            )}
          </Card>

          {/* Order Notes */}
          <Card title="Order Notes (Optional)">
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Any special requests or notes for your order..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </Card>

          {/* Order Summary */}
          <Card title="Order Summary">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>GST (5%)</span>
                <span>₹{(getTotalAmount() * 0.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{(getTotalAmount() * 1.05).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Place Order Button */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
              disabled={loading}
            >
              Back to Menu
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={loading || !selectedTableId}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
