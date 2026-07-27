'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OrderTimeline } from '@/components/OrderTimeline';
import { OrderItemCard } from '@/components/OrderItemCard';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';
import Image from "next/image";
import { Receipt, RefreshCcw } from "lucide-react";

interface OrderItem {
  id: string;
  price_at_order: number;
  menu_item: {
    id: string;
    name: string;
    image_url?: string | null;
  };
  quantity: number;
  custom_instructions?: string | null;
  allergy_info?: string | null;
  status: string;
}

interface Order {
  id: string;
  order_status: string;
  total_amount: string;
  notes?: string | null;
  created_at: string;
  table: {
    id: string;
    table_number: number;
  };
  items: OrderItem[];
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActiveOrders(true);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchActiveOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      
      const response = await apiClient.get('/orders/my-orders', {
        params: { status: 'active' }
      });
      
      setOrders(response.data?.data || []);
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.message || err.message || 'Failed to load orders');
      }
    } finally {
      if (!silent) setLoading(false);
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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiClient.delete(`/orders/${orderId}`);
      setToast({ show: true, message: 'Order cancelled successfully', type: 'success' });
      fetchActiveOrders();
    } catch (err: any) {
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to cancel order', 
        type: 'error' 
      });
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.order_status === 'placed' || order.order_status === 'preparing';
  };

  const getEstimatedTime = (order: Order) => {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(15, itemCount * 5);
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        <div className="overflow-hidden rounded-3xl bg-gradient-to-r  from-blue-600 via-sky-500 to-cyan-500  shadow-xl">
          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">

            <div className="text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Receipt className="h-7 w-7" />
              </div>

              <h1 className="text-4xl font-bold">
                Track Orders
              </h1>

              <p className="mt-2 text-orange-100">
                Monitor your active orders in real time and stay updated
                with live kitchen progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <Button
                variant="secondary"
                size="lg"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2 rounded-xl shadow-lg"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    autoRefresh ? 'animate-spin' : ''
                  }`}
                />

                {autoRefresh
                  ? 'Auto Refresh ON'
                  : 'Auto Refresh OFF'}
              </Button>

              <Button
                size="lg"
                onClick={fetchActiveOrders}
                className="gap-2 rounded-xl bg-white text-orange-600 shadow-lg hover:bg-orange-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>

            </div>

          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage message={error} className="mb-6" />}

        {orders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-600 mb-6">You don't have any active orders at the moment</p>
              <Button onClick={() => router.push('/customer/menu')}>
                Browse Menu
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id}>
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <OrderStatusBadge status={order.order_status} showIcon />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Table #{order.table.table_number}</span>
                      <span>•</span>
                      <span>{order.items.length} items</span>
                      <span>•</span>
                      <span>₹{Number(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(order.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedOrders.has(order.id) ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* Order Timeline */}
                <OrderTimeline
                  currentStatus={order.order_status}
                  createdAt={order.created_at}
                  estimatedTime={getEstimatedTime(order)}
                />

                {/* Expanded Details */}
                {expandedOrders.has(order.id) && (
                  <div className="mt-6 space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map(item => (
                          <OrderItemCard
                            key={item.id}
                            item={item}
                            showInstructions={true}
                            showStatus={true}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Order Notes</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-gray-700">{order.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Cancel Button */}
                    {canCancelOrder(order) && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          variant="danger"
                          onClick={() => handleCancelOrder(order.id)}
                          className="w-full"
                        >
                          Cancel Order
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          You can only cancel orders that haven't started preparation
                        </p>
                      </div>
                    )}
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
            Back to Menu
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/customer/orders')}
            className="w-full"
          >
            View Order History
          </Button>
        </div>
      </div>
    </div>
  );
}