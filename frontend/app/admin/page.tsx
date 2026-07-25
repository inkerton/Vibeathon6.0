'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  occupancy: number;
  lowStockCount: number;
  activeOrders: number;
  todayReservations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch data from multiple endpoints
      const [ordersRes, inventoryRes, reservationsRes] = await Promise.all([
        apiClient.get('/orders/active'),
        apiClient.get('/inventory/low-stock'),
        apiClient.get('/reservations'),
      ]);

      const orders = ordersRes.data || [];
      const lowStockItems = inventoryRes.data || [];
      const reservations = reservationsRes.data || [];

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter((o: any) => 
        o.createdAt.startsWith(today)
      );
      
      const todayReservations = reservations.filter((r: any) => 
        r.date.startsWith(today) && r.status !== 'cancelled'
      );

      const revenueToday = todayOrders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      );

      // Mock occupancy calculation (would need table status endpoint)
      const occupancy = Math.round((todayReservations.length / 20) * 100);

      setStats({
        ordersToday: todayOrders.length,
        revenueToday,
        occupancy: Math.min(occupancy, 100),
        lowStockCount: lowStockItems.length,
        activeOrders: orders.length,
        todayReservations: todayReservations.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <button
          onClick={fetchDashboardStats}
          className="btn btn-secondary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Orders Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.ordersToday || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Revenue Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Revenue Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats?.revenueToday?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Occupancy */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Table Occupancy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.occupancy || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.lowStockCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Active Orders */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Today's Reservations */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Reservations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.todayReservations || 0}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/staff" className="btn btn-primary">
            Manage Staff
          </a>
          <a href="/admin/menu" className="btn btn-primary">
            Manage Menu
          </a>
          <a href="/admin/inventory" className="btn btn-primary">
            View Inventory
          </a>
          <a href="/kitchen" className="btn btn-secondary">
            Kitchen View
          </a>
        </div>
      </Card>
    </div>
  );
}
