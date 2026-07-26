'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface Order {
  id: string;
  order_number: string;
  table_id: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menu_item: {
      name: string;
      image_url: string;
    };
  }>;
  table: {
    table_number: number;
  };
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders/my-orders');
      setOrders(response.data?.data || []);
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      setToast({ show: true, message: 'Order cancelled', type: 'success' });
      fetchOrders();
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to cancel order', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
      placed: 'warning',
      preparing: 'info',
      ready: 'success',
      served: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'info';
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Button variant="secondary" onClick={fetchOrders}>Refresh</Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-gray-500">No orders yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-600">Table {order.table?.table_number}</p>
                    <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadge(order.order_status)}>
                      {order.order_status.toUpperCase()}
                    </Badge>
                    <p className="font-bold text-lg mt-2">₹{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.menu_item.name} × {item.quantity}</span>
                      <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.order_status === 'placed' && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel Order
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}