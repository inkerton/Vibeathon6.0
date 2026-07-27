'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OrderItemCard } from '@/components/OrderItemCard';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { apiClient } from '@/lib/api-client';

interface OrderItem {
  id: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
  quantity: number;
  customInstructions?: string | null;
  allergyInfo?: string | null;
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

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTime = () => {
    if (!order) return 0;
    // Calculate based on number of items and their preparation times
    // For now, use a simple estimate: 5 minutes per item, minimum 15 minutes
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(15, itemCount * 5);
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/customer/menu')}>
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-green-100 text-lg">Your order has been received and is being prepared</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-lg font-bold text-gray-900">#{order.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Table Number</p>
                <p className="text-lg font-bold text-gray-900">#{order.table.table_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <OrderStatusBadge status={order.order_status} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Est. Time</p>
                <p className="text-lg font-bold text-blue-600">{getEstimatedTime()} mins</p>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card title="Order Items">
            <div className="space-y-4">
              {order.items.map(item => (
                <OrderItemCard
                  key={item.id}
                  item={{
                    id: item.id,
                    price_at_order: item.menuItem.price,
                    menu_item: {
                      id: item.menuItem.id,
                      name: item.menuItem.name,
                      image_url: item.menuItem.imageUrl
                    },
                    quantity: item.quantity,
                    custom_instructions: item.customInstructions,
                    allergy_info: item.allergyInfo,
                    status: item.status
                  }}
                  showInstructions={true}
                  showStatus={false}
                />
              ))}
            </div>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card title="Order Notes">
              <p className="text-gray-700">{order.notes}</p>
            </Card>
          )}

          {/* Order Summary */}
          <Card title="Order Summary">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
              <span>₹{(Number(order.total_amount) / 1.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>GST (5%)</span>
              <span>₹{(Number(order.total_amount) - Number(order.total_amount) / 1.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
              ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Important Info */}
          <Card>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">What's Next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your order is being prepared by our kitchen staff</li>
                    <li>• You can track your order status in real-time</li>
                    <li>• We'll notify you when your order is ready</li>
                    <li>• Estimated preparation time: {getEstimatedTime()} minutes</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/customer/menu')}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Menu
            </Button>
            <Button
              size="lg"
              onClick={() => router.push('/customer/orders/tracking')}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
