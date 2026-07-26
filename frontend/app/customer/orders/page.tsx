'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { apiClient } from '@/lib/api-client';

interface OrderItem {
  id: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  table: {
    tableNumber: number;
  };
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/orders/my-orders');
      setOrders(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase()));
    }
  };

  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleReorder = (order: Order) => {
    // Add items to cart
    const cartItems = order.items.map(item => ({
      menuItem: {
        id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        imageUrl: null
      },
      quantity: item.quantity,
      customInstructions: '',
      allergyInfo: ''
    }));
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    router.push('/customer/menu');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
              <p className="text-sm text-gray-600">View all your past orders</p>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage message={error} className="mb-6" />}

        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No Orders Yet' : `No ${statusFilter} Orders`}
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === 'all' 
                  ? "You haven't placed any orders yet"
                  : `You don't have any ${statusFilter} orders`
                }
              </p>
              <Button onClick={() => router.push('/customer/menu')}>
                Browse Menu
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Card key={order.id}>
                {/* Order Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Table #{order.table.tableNumber}</p>
                      <p>{formatDate(order.createdAt)}</p>
                      <p className="font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleExpanded(order.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {expandedOrders.has(order.id) ? 'Hide' : 'Show'} Details
                    </button>
                    {order.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleReorder(order)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Reorder
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrders.has(order.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × ₹{item.menuItem.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₹{(item.quantity * item.menuItem.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/customer/menu')}
            className="w-full"
          >
            Browse Menu
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/customer/orders/tracking')}
            className="w-full"
          >
            Track Active Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
