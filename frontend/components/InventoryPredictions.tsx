'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface DailyPrediction {
  date: string;
  predictedUsage: number;
  confidence: number;
}

interface ItemPrediction {
  itemId?: string;
  itemName?: string;
  predictions: DailyPrediction[];
  recommendedRestock: number;
  restockDate: string;
  overallConfidence: number;
  reasoning?: string;
}

interface LowStockAlert {
  id: string;
  predictedUsage: number;
  recommendedRestock: number;
  item: {
    id: string;
    name: string;
    total_stock: number;
    unit: string;
    reorder_threshold: number;
  };
}

export function InventoryPredictions() {
  const [predictions, setPredictions] = useState<ItemPrediction[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [predRes, alertRes] = await Promise.allSettled([
        apiClient.get('/ai/predictions/inventory'),
        apiClient.get('/ai/predictions/low-stock-alerts'),
      ]);

      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data?.data ?? predRes.value.data ?? [];
        setPredictions(Array.isArray(d) ? d : []);
      }
      if (alertRes.status === 'fulfilled') {
        const d = alertRes.value.data?.data ?? alertRes.value.data ?? [];
        setAlerts(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Failed to load inventory predictions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'success';
    if (c >= 0.6) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Inventory Predictions</h2>
        </div>
        <LoadingSpinner size="md" className="py-12" />
      </div>
    );
  }

  const active = predictions[selectedItem];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory Predictions</h2>
            <p className="text-sm text-slate-500">AI-powered usage forecasts for the next 7 days</p>
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

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <Card className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">
              Low Stock Alerts ({alerts.length})
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => {
              const daysLeft = alert.item.total_stock > 0 && alert.predictedUsage > 0
                ? (alert.item.total_stock / alert.predictedUsage).toFixed(1)
                : '?';
              return (
                <div
                  key={alert.id}
                  className="rounded-xl bg-white border border-red-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="font-semibold text-slate-900 text-sm">{alert.item.name}</p>
                    </div>
                    <Badge variant="danger" className="text-xs shrink-0">
                      ~{daysLeft}d left
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                    <span>Stock: <strong className="text-slate-700">{alert.item.total_stock} {alert.item.unit}</strong></span>
                    <span>Daily use: <strong className="text-slate-700">{alert.predictedUsage.toFixed(1)}</strong></span>
                    <span className="col-span-2">Restock: <strong className="text-blue-600">{alert.recommendedRestock} {alert.item.unit}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Predictions Section */}
      {predictions.length > 0 ? (
        <Card className="rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Usage Forecast Chart</h3>
            {/* Item selector */}
            {predictions.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {predictions.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItem(idx)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedItem === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {p.itemName ?? `Item ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {active && (
            <>
              {/* Summary row */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{active.recommendedRestock}</p>
                  <p className="text-xs text-slate-500 mt-1">Units to Restock</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {active.restockDate
                      ? new Date(active.restockDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Restock Date</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {active.predictions?.length ?? 0} days
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Forecast Window</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <Badge
                    variant={confidenceColor(active.overallConfidence) as any}
                    className="text-sm font-bold"
                  >
                    {(active.overallConfidence * 100).toFixed(0)}% Confidence
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">AI Certainty</p>
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={active.predictions} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(l: any) =>
                      new Date(String(l)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                    }
                    formatter={(value: any, name: any) => [
                      name === 'predictedUsage' ? `${Number(value).toFixed(1)} units` : `${(Number(value) * 100).toFixed(0)}%`,
                      name === 'predictedUsage' ? 'Predicted Usage' : 'Confidence',
                    ]}
                  />
                  <Legend formatter={(v: any) => (v === 'predictedUsage' ? 'Predicted Usage' : 'Confidence')} />
                  <Line
                    type="monotone"
                    dataKey="predictedUsage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* AI Reasoning */}
              {active.reasoning && (
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">AI Reasoning</p>
                  <p className="text-sm text-blue-800">{active.reasoning}</p>
                </div>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No prediction data available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Predictions are generated based on inventory transaction history.</p>
        </Card>
      )}
    </div>
  );
}
