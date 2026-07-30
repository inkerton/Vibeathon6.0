'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, RefreshCw, ArrowUpRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

interface DayRevenue {
  day: string;
  revenue: number;
  percentage: number;
}

interface HourRevenue {
  hour: number;
  revenue: number;
  percentage: number;
}

interface RevenueAnalyticsData {
  period: { start: string; end: string };
  totalRevenue: number;
  avgDailyRevenue: number;
  trend: string;
  growthRate: number;
  breakdown: {
    byCategory: CategoryRevenue[];
    byDayOfWeek: DayRevenue[];
    byHour: HourRevenue[];
  };
  insights: string[];
}

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f97316', '#10b981'];

export function RevenueAnalytics() {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get('/ai/analytics/revenue');
      const raw = res.data?.data ?? res.data;
      setData(raw?.analytics ?? raw ?? null);
    } catch (err) {
      console.error('Failed to load revenue analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Revenue Analytics</h2>
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
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Revenue Analytics</h2>
        </div>
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No revenue data available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Analytics are generated from completed order history.</p>
        </Card>
      </div>
    );
  }

  const trendBadge = data.trend === 'INCREASING' ? 'success' : data.trend === 'DECREASING' ? 'danger' : 'info';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Revenue Analytics</h2>
            <p className="text-sm text-slate-500">
              {data.period.start} → {data.period.end}
            </p>
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">₹{data.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Total Revenue</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">₹{Math.round(data.avgDailyRevenue).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Daily Average</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ArrowUpRight className="h-5 w-5 text-green-500" />
            <p className="text-3xl font-bold text-green-600">{(data.growthRate * 100).toFixed(1)}%</p>
          </div>
          <p className="text-xs text-slate-500 mt-1">Growth Rate</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <Badge variant={trendBadge} className="text-sm font-bold">{data.trend}</Badge>
          <p className="text-xs text-slate-500 mt-2">Revenue Trend</p>
        </Card>
      </div>

      {/* Revenue by Category */}
      {data.breakdown.byCategory.length > 0 && (
        <Card className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-6">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.breakdown.byCategory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {data.breakdown.byCategory.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Day of Week & Hourly Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Day of Week */}
        {data.breakdown.byDayOfWeek.length > 0 && (
          <Card className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Revenue by Day</h3>
            <div className="space-y-3">
              {data.breakdown.byDayOfWeek.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-medium text-slate-700">{d.day}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-bold text-slate-900">
                    ₹{(d.revenue / 1000).toFixed(1)}k
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* By Hour */}
        {data.breakdown.byHour.length > 0 && (
          <Card className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Revenue by Hour</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.breakdown.byHour} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* AI Insights */}
      {data.insights.length > 0 && (
        <Card className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-blue-900">Revenue Insights</h3>
          </div>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm text-blue-800">{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
