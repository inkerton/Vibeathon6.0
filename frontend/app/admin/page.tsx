'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  ShoppingCart,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  Package,
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  lowStockCount: number;
  todayRevenue: number;
  ordersByStatus: {
    placed: number;
    preparing: number;
    ready: number;
    completed: number;
  };
  reservationsToday: {
    pending: number;
    confirmed: number;
    checkedIn: number;
  };
  recentOrders: any[];
  lowStockItems: any[];
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setError('');

      // Fetch all required data
      const [ordersRes, inventoryRes, reservationsRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/inventory/low-stock'),
        apiClient.get('/reservations')
      ]);

      const orders = ordersRes.data;
      const lowStockItems = inventoryRes.data;
      const reservations = reservationsRes.data;

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];

      const activeOrders = orders.filter((o: any) =>
        ['placed', 'preparing', 'ready'].includes(o.orderStatus)
      );

      const completedToday = orders.filter((o: any) =>
        o.orderStatus === 'completed' &&
        o.updatedAt.startsWith(today)
      );

      const todayRevenue = completedToday.reduce((sum: number, o: any) =>
        sum + o.totalAmount, 0
      );

      const ordersByStatus = {
        placed: orders.filter((o: any) => o.orderStatus === 'placed').length,
        preparing: orders.filter((o: any) => o.orderStatus === 'preparing').length,
        ready: orders.filter((o: any) => o.orderStatus === 'ready').length,
        completed: orders.filter((o: any) => o.orderStatus === 'completed').length
      };

      const reservationsToday = reservations.filter((r: any) =>
        r.reservationDate === today
      );

      const reservationsByStatus = {
        pending: reservationsToday.filter((r: any) => r.status === 'pending').length,
        confirmed: reservationsToday.filter((r: any) => r.status === 'confirmed').length,
        checkedIn: reservationsToday.filter((r: any) => r.status === 'checked_in').length
      };

      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        lowStockCount: lowStockItems.length,
        todayRevenue,
        ordersByStatus,
        reservationsToday: reservationsByStatus,
        recentOrders,
        lowStockItems: lowStockItems.slice(0, 5)
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();

      // Poll for updates every 15 seconds
      const interval = setInterval(fetchDashboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  // Statistics card data, mirroring the admin template's statistics-card pattern
  const statisticsCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart className="size-5" />,
      iconClass: 'bg-primary/10 text-primary',
      trend: 'All time',
      trendClass: 'text-success',
      TrendIcon: TrendingUp
    },
    {
      label: 'Active Orders',
      value: stats.activeOrders,
      icon: <Clock className="size-5" />,
      iconClass: 'bg-warning-light text-warning',
      trend: 'In progress',
      trendClass: 'text-warning',
      TrendIcon: Clock
    },
    {
      label: 'Low Stock',
      value: stats.lowStockCount,
      icon: <AlertTriangle className="size-5" />,
      iconClass: 'bg-danger-light text-danger',
      trend: 'Needs attention',
      trendClass: 'text-danger',
      TrendIcon: AlertTriangle
    },
    {
      label: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: <DollarSign className="size-5" />,
      iconClass: 'bg-success-light text-success',
      trend: 'Completed orders',
      trendClass: 'text-success',
      TrendIcon: DollarSign
    }
  ];

  const quickActions = [
    { label: 'Inventory', icon: Package, href: '/admin/inventory' },
    { label: 'Menu', icon: ShoppingCart, href: '/admin/menu' },
    { label: 'Staff', icon: Users, href: '/admin/staff' },
    { label: 'Recipes', icon: Package, href: '/admin/recipes' }
  ];

  return (
    <div className="p-2 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            Auto-refreshing every 15s
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsCards.map((card) => (
          <Card key={card.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {card.value}
                </p>
                <div className={`flex items-center mt-2 text-sm ${card.trendClass}`}>
                  <card.TrendIcon className="w-4 h-4 mr-1" />
                  <span>{card.trend}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="info" className="mr-2">Placed</Badge>
                <span className="text-sm text-muted-foreground">New orders</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.ordersByStatus.placed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="warning" className="mr-2">Preparing</Badge>
                <span className="text-sm text-muted-foreground">In kitchen</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.ordersByStatus.preparing}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="success" className="mr-2">Ready</Badge>
                <span className="text-sm text-muted-foreground">Ready to serve</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.ordersByStatus.ready}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center">
                <span className="text-sm font-medium text-foreground">Completed</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.ordersByStatus.completed}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Reservations Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="warning" className="mr-2">Pending</Badge>
                <span className="text-sm text-muted-foreground">Awaiting confirmation</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.reservationsToday.pending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="info" className="mr-2">Confirmed</Badge>
                <span className="text-sm text-muted-foreground">Confirmed bookings</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.reservationsToday.confirmed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="success" className="mr-2">Checked-in</Badge>
                <span className="text-sm text-muted-foreground">Currently dining</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {stats.reservationsToday.checkedIn}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent orders
              </p>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-foreground">
                        Order #{order.id.slice(-8)}
                      </span>
                      <span className="mx-2 text-muted-foreground/50">•</span>
                      <span className="text-sm text-muted-foreground">
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        order.orderStatus === 'completed' ? 'success' :
                        order.orderStatus === 'ready' ? 'success' :
                        order.orderStatus === 'preparing' ? 'warning' : 'info'
                      }
                    >
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-danger" />
              Low Stock Alerts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/inventory')}
            >
              Manage
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All items are well stocked
              </p>
            ) : (
              stats.lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-danger-light/50 rounded-lg border border-danger/20"
                >
                  <div className="flex items-center flex-1">
                    <Package className="w-5 h-5 text-danger mr-3" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-danger">
                      {item.availableStock} {item.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Threshold: {item.reorderThreshold}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col items-center justify-center h-24"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="w-6 h-6 mb-2" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
