'use client';

import { useEffect, useState } from 'react';
import {
  RefreshCcw,
  ShoppingBag,
  Clock3,
  MapPin,
  XCircle,
  Receipt,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
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
    price_at_order: number;

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

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders/my-orders');

      console.log('Orders:', response.data);

      setOrders(response.data?.data || []);
    } catch (err) {
      console.error(err);

      setToast({
        show: true,
        message: 'Failed to load orders',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await apiClient.delete(`/orders/${orderId}`);

      setToast({
        show: true,
        message: 'Order cancelled',
        type: 'success',
      });

      fetchOrders();
    } catch (err) {
      console.error(err);

      setToast({
        show: true,
        message: 'Failed to cancel order',
        type: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-yellow-500 hover:bg-yellow-500';

      case 'preparing':
        return 'bg-blue-500 hover:bg-blue-500';

      case 'ready':
        return 'bg-green-500 hover:bg-green-500';

      case 'served':
        return 'bg-emerald-600 hover:bg-emerald-600';

      case 'cancelled':
        return 'bg-red-500 hover:bg-red-500';

      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600 hover:bg-green-600';

      case 'pending':
        return 'bg-orange-500 hover:bg-orange-500';

      case 'failed':
        return 'bg-red-500 hover:bg-red-500';

      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-blue-50">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">

          <Skeleton className="h-40 rounded-3xl" />

          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="rounded-3xl"
            >
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-3 h-4 w-64" />
              </CardHeader>

              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-white">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            show: false,
          }))
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r   from-blue-600 via-sky-500 to-cyan-500  shadow-xl">
          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">

            <div className="text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <Receipt className="h-7 w-7" />
              </div>

              <h1 className="text-4xl font-bold">
                My Orders
              </h1>

              <p className="mt-2 text-blue-100">
                Track your food orders in real time and
                stay updated with their latest status.
              </p>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={fetchOrders}
              className="gap-2 rounded-xl shadow-lg"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Orders
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-24">

              <div className="mb-6 rounded-full bg-blue-100 p-6">
                <ShoppingBag className="h-12 w-12 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold">
                No Orders Yet
              </h2>

              <p className="mt-3 max-w-md text-center text-muted-foreground">
                Looks like you haven't placed any food
                orders yet. Once you do, they'll appear
                here with live status updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">

            {orders.map((order) => (
              <Card
                key={order.id}
                className="overflow-hidden rounded-3xl border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {/* Header */}
                <CardHeader className="border-b bg-slate-50">

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    <div>

                      <CardTitle className="text-2xl">
                        Order #{order.order_number}
                      </CardTitle>

                      <CardDescription className="mt-4 space-y-2 text-sm">

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Table {order.table?.table_number}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </div>

                      </CardDescription>

                    </div>

                    <div className="flex flex-col items-end gap-3">

                      <div className="flex flex-wrap justify-end gap-2">

                        <Badge
                          className={`${getStatusColor(
                            order.order_status
                          )} text-white`}
                        >
                          {order.order_status.toUpperCase()}
                        </Badge>

                        <Badge
                          className={`${getPaymentColor(
                            order.payment_status
                          )} text-white`}
                        >
                          {order.payment_status.toUpperCase()}
                        </Badge>

                      </div>

                      <div className="text-right">

                        <p className="text-sm text-muted-foreground">
                          Total Amount
                        </p>

                        <p className="text-3xl font-bold text-blue-600">
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </p>

                      </div>

                    </div>

                  </div>

                </CardHeader>

                <CardContent className="p-6">

                  {/* Order Items */}
                  <ScrollArea className="max-h-64 pr-2">

                    <div className="space-y-3">
                                            {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-2xl border bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                              <Image
                                src={item.menu_item.image_url}
                                alt={item.menu_item.name}
                                width={56}
                                height={56}
                                className="rounded-xl object-cover"
                              />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.menu_item.name}
                              </p>

                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-slate-800">
                              ₹
                              {(
                                Number(item.price_at_order || 0) *
                                item.quantity
                              ).toFixed(2)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              ₹{Number(item.price_at_order || 0).toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator className="my-6" />

                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Total Items</span>
                      <span>
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Payment Status</span>

                      <Badge
                        variant="info"
                        className="capitalize"
                      >
                        {order.payment_status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>

                      <span className="text-blue-600">
                        ₹
                        {Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {order.order_status === 'placed' && (
                    <Button
                      variant="destructive"
                      className="mt-6 w-full rounded-xl"
                      onClick={() => cancelOrder(order.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}