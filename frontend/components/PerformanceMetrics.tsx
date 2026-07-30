'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, Clock, RefreshCw, TrendingUp, Lightbulb } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface OrderMetrics {
  totalOrders: number;
  avgOrderValue: number;
  completionRate: number;
  avgPreparationTime: number;
  onTimeDeliveryRate: number;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  avgOrdersPerCustomer: number;
}

interface EfficiencyMetrics {
  tableUtilization: number;
  staffProductivity: number;
  inventoryTurnover: number;
  wastePercentage: number;
}

interface PerformanceData {
  period: { start: string; end: string };
  orderMetrics: OrderMetrics;
  customerMetrics: CustomerMetrics;
  efficiencyMetrics: EfficiencyMetrics;
  insights: string[];
  recommendations: string[];
}

function Meter({ value, label, format = 'percent' }: { value: number; label: string; format?: 'percent' | 'number' | 'time' }) {
  const pct = format === 'percent' ? value * 100 : format === 'number' ? Math.min((value / 20) * 100, 100) : Math.min((value / 30) * 100, 100);
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  const display =
    format === 'percent' ? `${(value * 100).toFixed(1)}%` :
    format === 'time' ? `${value.toFixed(1)} min` :
    value.toFixed(1);
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-900">{display}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function PerformanceMetrics() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get('/ai/analytics/performance');
      const raw = res.data?.data ?? res.data;
      setData(raw?.metrics ?? raw ?? null);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Performance Metrics</h2>
        </div>
        <LoadingSpinner size="md" className="py-12" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Metrics</h2>
        </div>
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No performance data available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Requires at least 30 days of order history.</p>
        </Card>
      </div>
    );
  }

  const o = data?.orderMetrics;
  const c = data?.customerMetrics;
  const e = data?.efficiencyMetrics;

  // Safety check - if any metrics are missing, show no data message
  if (!o || !c || !e) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Metrics</h2>
        </div>
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No performance data available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Requires at least 30 days of order history.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Performance Metrics</h2>
            <p className="text-sm text-slate-500">{data.period.start} → {data.period.end}</p>
          </div>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 3 KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{o.totalOrders.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Total Orders</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">₹{o.avgOrderValue.toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-1">Avg Order Value</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 col-span-2 sm:col-span-1 p-5 text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="h-5 w-5 text-indigo-500" />
            <p className="text-3xl font-bold text-indigo-600">{c.totalCustomers}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1">Total Customers</p>
        </Card>
      </div>

      {/* Order & Customer Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Order Metrics</h3>
          </div>
          <div className="space-y-3">
            <Meter value={o.completionRate} label="Completion Rate" />
            <Meter value={o.onTimeDeliveryRate} label="On-Time Delivery" />
            <Meter value={o.avgPreparationTime} label="Avg Prep Time" format="time" />
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Customer Metrics</h3>
          </div>
          <div className="space-y-3">
            <Meter value={c.retentionRate} label="Retention Rate" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{c.newCustomers}</p>
                <p className="text-xs text-slate-500 mt-1">New Customers</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{c.returningCustomers}</p>
                <p className="text-xs text-slate-500 mt-1">Returning</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{c.avgOrdersPerCustomer.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-1">Orders per Customer (avg)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Efficiency Metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Meter value={e.tableUtilization} label="Table Utilization" />
          <Meter value={e.staffProductivity} label="Staff Productivity" />
          <Meter value={e.inventoryTurnover} label="Inventory Turnover" format="number" />
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Waste %</span>
              <Badge variant={e.wastePercentage < 0.05 ? 'success' : 'warning'} className="text-xs">
                {(e.wastePercentage * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-orange-400 transition-all"
                style={{ width: `${Math.min(e.wastePercentage * 1000, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">AI Insights</h3>
          </div>
          <ul className="space-y-2">
            {data.insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm text-blue-800">{i}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-indigo-900">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {data.recommendations.map((r, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-sm text-indigo-800">{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
