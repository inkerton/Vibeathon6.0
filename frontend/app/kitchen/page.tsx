'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';

// shadcn/ui
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toast } from '@/components/Toast';

// lucide icons
import {
  ChefHat,
  RefreshCw,
  Clock3,
  Timer,
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Users,
  Receipt,
  Loader2,
} from 'lucide-react';

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
  order_status:
    | 'placed'
    | 'preparing'
    | 'ready'
    | 'served'
    | 'cancelled';
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

const ORDER_COLUMNS = [
  {
    title: 'New Orders',
    status: 'placed',
    color: 'amber',
  },
  {
    title: 'Preparing',
    status: 'preparing',
    color: 'blue',
  },
  {
    title: 'Ready',
    status: 'ready',
    color: 'emerald',
  },
] as const;

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      setError('');

      const response = await apiClient.get('/orders/active');

      const activeOrders = (response.data?.data || []).filter(
        (order: Order) =>
          ['placed', 'preparing', 'ready'].includes(
            order.order_status,
          ),
      );

      setOrders(activeOrders);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');

      showToast(
        err.message || 'Failed to load kitchen orders',
        'error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchActiveOrders();

    const interval = setInterval(fetchActiveOrders, 10000);

    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveOrders();
  }, [fetchActiveOrders]);

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: string,
  ) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      showToast(
        `Order marked as ${newStatus}`,
        'success'
      );

      fetchActiveOrders();
    } catch (err: any) {
      showToast(
        err.message || 'Failed to update order',
        'error'
      );
    }
  }, [showToast, fetchActiveOrders]);

  const updateOrderItemStatus = useCallback(async (
    orderId: string,
    itemId: string,
    newStatus: string,
  ) => {
    try {
      await apiClient.patch(
        `/orders/${orderId}/items/${itemId}/status`,
        {
          status: newStatus,
        },
      );

      showToast('Item updated', 'success');

      fetchActiveOrders();
    } catch (err: any) {
      showToast(
        err.message || 'Failed to update item',
        'error'
      );
    }
  }, [showToast, fetchActiveOrders]);

  const getOrdersByStatus = useCallback(
    (status: string) =>
      orders.filter(
        (order) => order.order_status === status,
      ),
    [orders],
  );

  const getTimeSinceOrder = (createdAt: string) => {
    const minutes = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) /
        60000,
    );

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';

    return `${minutes} mins ago`;
  };

  const totalItems = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + order.items.length,
        0,
      ),
    [orders],
  );

  const stats = useMemo(
    () => [
      {
        title: 'Active Orders',
        value: orders.length,
        icon: Receipt,
      },
      {
        title: 'New',
        value: getOrdersByStatus('placed').length,
        icon: Clock3,
      },
      {
        title: 'Preparing',
        value: getOrdersByStatus('preparing').length,
        icon: Flame,
      },
      {
        title: 'Items',
        value: totalItems,
        icon: UtensilsCrossed,
      },
    ],
    [orders, totalItems, getOrdersByStatus],
  );

  // =====================================================
  // Reusable UI Components
  // =====================================================

  const getStatusBadge = useCallback((
    status: Order['order_status'] | OrderItem['status'],
  ) => {
    switch (status) {
      case 'placed':
      case 'received':
        return (
          <Badge
            variant="warning"
            className="bg-amber-100 text-amber-700 border border-amber-200"
          >
            New
          </Badge>
        );

      case 'preparing':
        return (
          <Badge
            variant="info"
            className="bg-blue-100 text-blue-700 border border-blue-200"
          >
            Preparing
          </Badge>
        );

      case 'ready':
        return (
          <Badge
            variant="success"
            className="bg-emerald-100 text-emerald-700 border border-emerald-200"
          >
            Ready
          </Badge>
        );

      case 'served':
        return (
          <Badge
            variant="success"
            className="bg-green-100 text-green-700 border border-green-200"
          >
            Served
          </Badge>
        );

      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  }, []);

  const StatCard = useCallback(({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
  }) => (
    <Card className="shadow-sm border-0 bg-card/70 backdrop-blur transition-all hover:shadow-lg">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {value}
          </h2>
        </div>

        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  ), []);

  const TimeBadge = ({
    createdAt,
  }: {
    createdAt: string;
  }) => {
    const minutes = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) /
        60000,
    );

    const color =
      minutes >= 20
        ? 'text-red-600 bg-red-50 border-red-200'
        : minutes >= 10
        ? 'text-orange-600 bg-orange-50 border-orange-200'
        : 'text-emerald-600 bg-emerald-50 border-emerald-200';

    return (
      <Badge
        variant="info"
        className={`gap-1 ${color}`}
      >
        <Timer className="h-3.5 w-3.5" />
        {getTimeSinceOrder(createdAt)}
      </Badge>
    );
  };

  const AllergyAlert = ({
    allergy,
  }: {
    allergy: string;
  }) => (
    <Alert className="border-red-300 bg-red-50 py-2">
      <AlertTriangle className="h-4 w-4 text-red-600" />

      <AlertDescription className="font-medium text-red-700">
        Allergy: {allergy}
      </AlertDescription>
    </Alert>
  );

  const EmptyColumn = ({
    title,
  }: {
    title: string;
  }) => (
    <Card className="border-dashed">
      <CardContent className="flex h-48 flex-col items-center justify-center text-center">
        <ChefHat className="mb-3 h-10 w-10 text-muted-foreground/40" />

        <h3 className="font-semibold">
          No {title.toLowerCase()}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Orders will appear here automatically.
        </p>
      </CardContent>
    </Card>
  );

  const OrderCard = ({
    order,
  }: {
    order: Order;
  }) => (
    <Card className="overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-primary" />
              Order #{order.id.slice(-8)}
            </CardTitle>

            <CardDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="info">
                Table {order.table.table_number}
              </Badge>

              <Badge variant="info">
                <Users className="mr-1 h-3 w-3" />
                {order.customer.name}
              </Badge>
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(order.order_status)}
            <TimeBadge createdAt={order.created_at} />
          </div>
        </div>

        <Separator />

        {/* Order-level Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {order.order_status === 'preparing' && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() =>
                updateOrderStatus(order.id, 'ready')
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark All Ready
            </Button>
          )}

          {order.order_status === 'ready' && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() =>
                updateOrderStatus(order.id, 'served')
              }
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Mark Served
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[320px] pr-2">
          <div className="space-y-3">
            {order.items.map((item) => (
              <Card
                key={item.id}
                className="border bg-muted/30 shadow-none"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="gray"
                          className="rounded-full"
                        >
                          {item.quantity}×
                        </Badge>

                        <h4 className="truncate font-semibold">
                          {item.menu_item.name}
                        </h4>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {item.menu_item.preparation_time} min
                        </div>

                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>

                  {item.custom_instructions && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-sm">
                        <span className="font-medium">
                          Special Instructions:
                        </span>{' '}
                        {item.custom_instructions}
                      </AlertDescription>
                    </Alert>
                  )}

                  {item.allergy_info && (
                    <AllergyAlert
                      allergy={item.allergy_info}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    {item.status === 'received' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          updateOrderItemStatus(
                            order.id,
                            item.id,
                            'preparing',
                          )
                        }
                      >
                        Start Preparing
                      </Button>
                    )}

                    {item.status === 'preparing' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          updateOrderItemStatus(
                            order.id,
                            item.id,
                            'ready',
                          )
                        }
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // =====================================================
  // Loading State
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Loading Kitchen Dashboard
            </h2>
            <p className="text-muted-foreground">
              Fetching active kitchen orders...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // Main Render
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* ===================================================== */}
        {/* Header */}
        {/* ===================================================== */}

        <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white shadow-xl">
          <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
                  <ChefHat className="h-8 w-8" />
                </div>

                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Kitchen Dashboard
                  </h1>

                  <p className="mt-1 text-orange-100">
                    Manage incoming orders in real time
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 text-white hover:bg-white/20">
                  {orders.length} Active Orders
                </Badge>

                <Badge className="bg-white/20 text-white hover:bg-white/20">
                  {totalItems} Items
                </Badge>
              </div>
            </div>

            <Button
              size="lg"
              variant="secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}

              Refresh Orders
            </Button>
          </CardContent>
        </Card>

        {/* ===================================================== */}
        {/* Error */}
        {/* ===================================================== */}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* ===================================================== */}
        {/* Stats */}
        {/* ===================================================== */}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* ===================================================== */}
        {/* Kitchen Queue */}
        {/* ===================================================== */}

        <div className="space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Live Kitchen Queue
              </h2>

              <p className="text-muted-foreground">
                Orders are automatically refreshed every 10 seconds.
              </p>
            </div>

            <Badge variant="info" className="px-4 py-2">
              Live
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">

            {ORDER_COLUMNS.map((column) => {
              const columnOrders = getOrdersByStatus(column.status);

              return (
                <div
                  key={column.status}
                  className="flex flex-col"
                >
                  <Card className="mb-4 border-0 shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">

                        <div>
                          <CardTitle>
                            {column.title}
                          </CardTitle>

                          <CardDescription>
                            {columnOrders.length} orders
                          </CardDescription>
                        </div>

                        <Badge>
                          {columnOrders.length}
                        </Badge>

                      </div>
                    </CardHeader>
                  </Card>

                  <ScrollArea className="h-[72vh] pr-2">

                    <div className="space-y-5">

                      {columnOrders.length === 0 ? (
                        <EmptyColumn title={column.title} />
                      ) : (
                        columnOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                          />
                        ))
                      )}

                    </div>
                  </ScrollArea>
                </div>
              );
            })}

          </div>
        </div>

        {/* ===================================================== */}
        {/* Footer */}
        {/* ===================================================== */}

        <Card className="border-0 bg-muted/40">
          <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">

            <div>
              <h3 className="font-semibold">
                Kitchen Status
              </h3>

              <p className="text-sm text-muted-foreground">
                Dashboard refreshes automatically every 10 seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <Badge
                variant="warning"
                className="bg-amber-100 text-amber-700"
              >
                {getOrdersByStatus('placed').length} New
              </Badge>

              <Badge
                variant="info"
                className="bg-blue-100 text-blue-700"
              >
                {getOrdersByStatus('preparing').length} Preparing
              </Badge>

              <Badge
                variant="success"
                className="bg-emerald-100 text-emerald-700"
              >
                {getOrdersByStatus('ready').length} Ready
              </Badge>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
