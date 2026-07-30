"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
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
} from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/Badge";

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
  staffOverview: {
    total: number;
    active: number;
    byRole: {
      admin: number;
      kitchen: number;
      inventory: number;
      reception: number;
    };
  };
  recentOrders: any[];
  lowStockItems: any[];
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setError("");

      // Fetch all required data
      const [ordersRes, inventoryRes, reservationsRes, staffRes] =
        await Promise.all([
          apiClient.get("/orders"),
          apiClient.get("/inventory/low-stock"),
          apiClient.get("/reservations"),
          apiClient.get("/staff"),
        ]);

      // Backend returns { status: 'success', data: [...] }
      // Extract the actual data array from response.data.data
      const ordersData = ordersRes.data?.data || [];
      const inventoryData = inventoryRes.data?.data || [];
      const reservationsData = reservationsRes.data?.data || [];
      const staffData = staffRes.data?.data || [];

      // Handle response data - ensure arrays
      const orders = Array.isArray(ordersData) ? ordersData : [];
      const reservations = Array.isArray(reservationsData)
        ? reservationsData
        : [];
      const staff = Array.isArray(staffData) ? staffData : [];

      // Transform inventory data from snake_case to camelCase
      const lowStockItems = (
        Array.isArray(inventoryData) ? inventoryData : []
      ).map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category || "General",
        availableStock: (item.total_stock || 0) - (item.reserved_stock || 0),
        reorderThreshold: item.reorder_threshold || 0,
      }));

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];

      const activeOrders = orders.filter((o: any) =>
        ["placed", "preparing", "ready"].includes(o.order_status),
      );

      const completedToday = orders.filter(
        (o: any) =>
          o.order_status === "completed" && o.updated_at.startsWith(today),
      );

      const todayRevenue = completedToday.reduce((sum: number, o: any) => {
        const amount = Number(o.total_amount) || 0;
        return sum + amount;
      }, 0);

      const ordersByStatus = {
        placed: orders.filter((o: any) => o.order_status === "placed").length,
        preparing: orders.filter((o: any) => o.order_status === "preparing")
          .length,
        ready: orders.filter((o: any) => o.order_status === "ready").length,
        completed: orders.filter((o: any) => o.order_status === "completed")
          .length,
      };

      const reservationsToday = reservations.filter(
        (r: any) => r.date === today,
      );

      const reservationsByStatus = {
        pending: reservationsToday.filter((r: any) => r.status === "pending")
          .length,
        confirmed: reservationsToday.filter(
          (r: any) => r.status === "confirmed",
        ).length,
        checkedIn: reservationsToday.filter(
          (r: any) => r.status === "checked_in",
        ).length,
      };

      const recentOrders = orders
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5);

      // Calculate staff statistics
      const activeStaff = staff.filter((s: any) => s.is_active);
      const staffByRole = {
        admin: staff.filter((s: any) => s.role === "admin").length,
        kitchen: staff.filter((s: any) => s.role === "kitchen").length,
        inventory: staff.filter((s: any) => s.role === "inventory").length,
        reception: staff.filter((s: any) => s.role === "reception").length,
      };

      setStats({
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        lowStockCount: lowStockItems.length,
        todayRevenue,
        ordersByStatus,
        reservationsToday: reservationsByStatus,
        staffOverview: {
          total: staff.length,
          active: activeStaff.length,
          byRole: staffByRole,
        },
        recentOrders,
        lowStockItems: lowStockItems.slice(0, 5),
      });

      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData();

      // Poll for updates every 15 seconds
      const interval = setInterval(fetchDashboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 pb-28 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Auto-refreshing every 15s
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalOrders}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>All time</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Active Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.activeOrders}
              </p>
              <div className="flex items-center mt-2 text-sm text-orange-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>In progress</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Low Stock Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.lowStockCount}
              </p>
              <div className="flex items-center mt-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>Needs attention</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Today's Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Revenue
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{Number(stats.todayRevenue).toFixed(2)}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>Completed orders</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Staff Overview */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Staff Overview
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-medium text-gray-700">
                Total Staff
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {stats.staffOverview.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-lg font-semibold text-green-600">
                {stats.staffOverview.active}
              </span>
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Admin</span>
                <span className="font-medium text-gray-900">
                  {stats.staffOverview.byRole.admin}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Kitchen</span>
                <span className="font-medium text-gray-900">
                  {stats.staffOverview.byRole.kitchen}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Inventory</span>
                <span className="font-medium text-gray-900">
                  {stats.staffOverview.byRole.inventory}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reception</span>
                <span className="font-medium text-gray-900">
                  {stats.staffOverview.byRole.reception}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Orders by Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="info" className="mr-2">
                  Placed
                </Badge>
                <span className="text-sm text-gray-600">New orders</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.ordersByStatus.placed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="warning" className="mr-2">
                  Preparing
                </Badge>
                <span className="text-sm text-gray-600">In kitchen</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.ordersByStatus.preparing}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="success" className="mr-2">
                  Ready
                </Badge>
                <span className="text-sm text-gray-600">Ready to serve</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.ordersByStatus.ready}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  Completed
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.ordersByStatus.completed}
              </span>
            </div>
          </div>
        </Card>

        {/* Reservations Today */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Reservations Today
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="warning" className="mr-2">
                  Pending
                </Badge>
                <span className="text-sm text-gray-600">
                  Awaiting confirmation
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.reservationsToday.pending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="info" className="mr-2">
                  Confirmed
                </Badge>
                <span className="text-sm text-gray-600">
                  Confirmed bookings
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.reservationsToday.confirmed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant="success" className="mr-2">
                  Checked-in
                </Badge>
                <span className="text-sm text-gray-600">Currently dining</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.reservationsToday.checkedIn}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h2>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent orders
              </p>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(-8)}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        Table {order.table.table_number}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{Number(order.total_amount || 0).toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        order.order_status === "completed"
                          ? "success"
                          : order.order_status === "ready"
                            ? "success"
                            : order.order_status === "preparing"
                              ? "warning"
                              : "info"
                      }
                    >
                      {order.order_status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Low Stock Alerts
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/inventory")}
            >
              Manage
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                All items are well stocked
              </p>
            ) : (
              stats.lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center flex-1">
                    <Package className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {item.availableStock} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Threshold: {item.reorderThreshold}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Desktop Quick Actions */}
      <Card className="hidden md:block p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24"
            onClick={() => router.push("/admin/inventory")}
          >
            <Package className="w-6 h-6 mb-2" />
            <span>Inventory</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24"
            onClick={() => router.push("/admin/menu")}
          >
            <ShoppingCart className="w-6 h-6 mb-2" />
            <span>Menu</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24"
            onClick={() => router.push("/admin/staff")}
          >
            <Users className="w-6 h-6 mb-2" />
            <span>Staff</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24"
            onClick={() => router.push("/admin/recipes")}
          >
            <Package className="w-6 h-6 mb-2" />
            <span>Recipes</span>
          </Button>
        </div>
      </Card>

      {/* Mobile Quick Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="border-t bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] p-2">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-16 rounded-xl"
              onClick={() => router.push("/admin/inventory")}
            >
              <Package className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Inventory</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-16 rounded-xl"
              onClick={() => router.push("/admin/menu")}
            >
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Menu</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-16 rounded-xl"
              onClick={() => router.push("/admin/staff")}
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Staff</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-16 rounded-xl"
              onClick={() => router.push("/admin/recipes")}
            >
              <Package className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Recipes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
