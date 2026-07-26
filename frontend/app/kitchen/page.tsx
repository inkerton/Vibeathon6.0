'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  status: 'received' | 'preparing' | 'ready' | 'served';
  custom_instructions: string | null;
  allergy_info: string | null;
  menu_item: {
    name: string;
    preparation_time: number;
  };
}

interface Order {
  id: string;
  order_status: 'placed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  total_amount: string;
  created_at: string;
  items: OrderItem[];
  customer: {
    name: string;
  };
  table: {
    table_number: number;
  };
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchActiveOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchActiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async () => {
    try {
      setError('');
      const response = await apiClient.get('/orders/active');
      const activeOrders = (response.data?.data || []).filter(
        (order: Order) => ['placed', 'preparing', 'ready'].includes(order.order_status)
      );
      setOrders(activeOrders);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      setToast({ show: true, message: `Order status updated to ${newStatus}`, type: 'success' });
      fetchActiveOrders();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update order status', type: 'error' });
    }
  };

  const updateOrderItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, { status: newStatus });
      setToast({ show: true, message: 'Item status updated', type: 'success' });
      fetchActiveOrders();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update item status', type: 'error' });
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.order_status === status);
  };

  const getTimeSinceOrder = (created_at: string) => {
    const minutes = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const getItemStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success'> = {
      received: 'warning',
      preparing: 'info',
      ready: 'success',
      served: 'success',
    };
    return variants[status] || 'warning';
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <Button onClick={fetchActiveOrders}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Order Queue - Kanban Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Received Orders */}
          <div className="space-y-4">
            <div className="bg-yellow-100 rounded-lg p-4">
              <h2 className="text-xl font-bold text-yellow-900">
                Received ({getOrdersByStatus('placed').length})
              </h2>
            </div>
            <div className="space-y-4">
              {getOrdersByStatus('placed').map(order => (
                <Card key={order.id} className="border-l-4 border-yellow-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          Table {order.table.table_number} • {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeSinceOrder(order.created_at)}
                        </p>
                      </div>
                      <Badge variant="warning">NEW</Badge>
                    </div>

                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.menu_item.name}
                              </p>
                              {item.custom_instructions && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Note: {item.custom_instructions}
                                </p>
                              )}
                              {item.allergy_info && (
                                <p className="text-sm text-red-600 font-medium mt-1">
                                  ⚠️ Allergy: {item.allergy_info}
                                </p>
                              )}
                            </div>
                            <Badge variant={getItemStatusBadge(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  </div>
                </Card>
              ))}
              {getOrdersByStatus('placed').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No new orders
                </div>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div className="space-y-4">
            <div className="bg-blue-100 rounded-lg p-4">
              <h2 className="text-xl font-bold text-blue-900">
                Preparing ({getOrdersByStatus('preparing').length})
              </h2>
            </div>
            <div className="space-y-4">
              {getOrdersByStatus('preparing').map(order => (
                <Card key={order.id} className="border-l-4 border-blue-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          Table {order.table.table_number} • {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeSinceOrder(order.created_at)}
                        </p>
                      </div>
                      <Badge variant="info">IN PROGRESS</Badge>
                    </div>

                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                        {item.quantity}x {item.menu_item.name}
                              </p>
                              {item.customInstructions && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Note: {item.customInstructions}
                                </p>
                              )}
                              {item.allergyInfo && (
                                <p className="text-sm text-red-600 font-medium mt-1">
                                  ⚠️ Allergy: {item.allergyInfo}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getItemStatusBadge(item.status)}>
                                {item.status}
                              </Badge>
                              {item.status === 'received' && (
                                <button
                                  onClick={() => updateOrderItemStatus(order.id, item.id, 'preparing')}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Start
                                </button>
                              )}
                              {item.status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderItemStatus(order.id, item.id, 'ready')}
                                  className="text-xs text-green-600 hover:underline"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      Mark as Ready
                    </Button>
                  </div>
                </Card>
              ))}
              {getOrdersByStatus('preparing').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders in preparation
                </div>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div className="space-y-4">
            <div className="bg-green-100 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-900">
                Ready ({getOrdersByStatus('ready').length})
              </h2>
            </div>
            <div className="space-y-4">
              {getOrdersByStatus('ready').map(order => (
                <Card key={order.id} className="border-l-4 border-green-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          Table {order.table.table_number} • {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeSinceOrder(order.created_at)}
                        </p>
                      </div>
                      <Badge variant="success">READY</Badge>
                    </div>

                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="bg-gray-50 p-2 rounded">
                          <p className="font-medium">
                            {item.quantity}x {item.menu_item.name}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                      <p className="text-sm font-medium text-green-800">
                        Waiting for pickup by server
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {getOrdersByStatus('ready').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders ready
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
