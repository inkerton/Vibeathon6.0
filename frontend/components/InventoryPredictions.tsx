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
import { AlertTriangle, TrendingUp, Package, RefreshCw, ChevronRight, X, History } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/* ─── Spec types for per-item detail ─── */
interface DetailedPrediction {
  id: string;
  inventoryItem: { id: string; name: string; currentQuantity: number; unit: string };
  dailyPredictions: { date: string; predictedUsage: number; confidence: number }[];
  totalPredictedUsage: number;
  restockRecommendation: { shouldRestock: boolean; recommendedQuantity: number; recommendedDate: string };
}

interface PredictionHistory {
  id: string;
  predictedUsage: number;
  actualUsage: number | null;
  accuracy: number | null;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

interface DrilldownState {
  itemId: string;
  itemName: string;
  detail: DetailedPrediction | null;
  history: PredictionHistory[];
  loading: boolean;
  tab: 'detail' | 'history';
}

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
  // Spec shape: inventoryItem + daysUntilStockout + predictedDailyUsage + recommendedAction + severity
  predictedUsage?: number;           // legacy flat shape
  predictedDailyUsage?: number;      // spec shape
  recommendedRestock?: number;       // legacy flat shape
  recommendedAction?: string;        // spec shape
  severity?: string;
  daysUntilStockout?: number;
  estimatedStockoutDate?: string;
  inventoryItem?: {                  // spec shape
    id: string;
    name: string;
    currentQuantity: number;
    unit: string;
  };
  item?: {                           // legacy flat shape
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
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);

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
        const d = alertRes.value.data?.data ?? alertRes.value.data ?? {};
        // Spec: data.alerts[] — also handle legacy flat array
        const list = d?.alerts ?? (Array.isArray(d) ? d : []);
        setAlerts(Array.isArray(list) ? list : []);
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

  const openDrilldown = async (itemId: string, itemName: string) => {
    setDrilldown({ itemId, itemName, detail: null, history: [], loading: true, tab: 'detail' });
    try {
      const [detailRes, historyRes] = await Promise.allSettled([
        apiClient.get(`/ai/predictions/inventory/${itemId}`),
        apiClient.get(`/ai/predictions/inventory/${itemId}/history`),
      ]);

      let detail: DetailedPrediction | null = null;
      let history: PredictionHistory[] = [];

      if (detailRes.status === 'fulfilled') {
        const d = detailRes.value.data?.data ?? detailRes.value.data;
        detail = d?.prediction ?? d ?? null;
      }
      if (historyRes.status === 'fulfilled') {
        const d = historyRes.value.data?.data ?? historyRes.value.data;
        history = d?.history ?? (Array.isArray(d) ? d : []);
      }

      setDrilldown((prev) => prev ? { ...prev, detail, history, loading: false } : null);
    } catch {
      setDrilldown((prev) => prev ? { ...prev, loading: false } : null);
    }
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
                // Normalise across spec shape (inventoryItem) and legacy shape (item)
                const itemName = alert.inventoryItem?.name ?? alert.item?.name ?? 'Unknown';
                const stockQty = alert.inventoryItem?.currentQuantity ?? alert.item?.total_stock ?? 0;
                const unit = alert.inventoryItem?.unit ?? alert.item?.unit ?? '';
                const dailyUse = alert.predictedDailyUsage ?? alert.predictedUsage ?? 0;
                const daysLeft = alert.daysUntilStockout != null
                  ? alert.daysUntilStockout.toFixed(1)
                  : stockQty > 0 && dailyUse > 0
                    ? (stockQty / dailyUse).toFixed(1)
                    : '?';
                const restockInfo = alert.recommendedAction ?? (alert.recommendedRestock != null ? `${alert.recommendedRestock} ${unit}` : '—');
                const severityVariant = alert.severity === 'HIGH' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'info';
                return (
                  <div
                    key={alert.id}
                    className="rounded-xl bg-white border border-red-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="font-semibold text-slate-900 text-sm">{itemName}</p>
                      </div>
                      <Badge variant={severityVariant as any} className="text-xs shrink-0">
                        ~{daysLeft}d left
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                      <span>Stock: <strong className="text-slate-700">{stockQty} {unit}</strong></span>
                      <span>Daily use: <strong className="text-slate-700">{dailyUse > 0 ? dailyUse.toFixed(1) : '—'}</strong></span>
                      <span className="col-span-2">Action: <strong className="text-blue-600">{restockInfo}</strong></span>
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
                  <div key={idx} className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedItem(idx)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        selectedItem === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      {p.itemName ?? `Item ${idx + 1}`}
                    </button>
                    {p.itemId && (
                      <button
                        onClick={() => openDrilldown(p.itemId!, p.itemName ?? `Item ${idx + 1}`)}
                        title="View detail & history"
                        className="rounded-full p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
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
      {/* ─── Per-item Drilldown Modal ─── */}
      {drilldown && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-16 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl mb-16">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{drilldown.itemName}</h3>
                <p className="text-sm text-slate-500">Item-level prediction detail</p>
              </div>
              <button
                onClick={() => setDrilldown(null)}
                className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {(['detail', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrilldown((prev) => prev ? { ...prev, tab } : null)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    drilldown.tab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'history' && <History className="h-4 w-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {drilldown.loading ? (
                <LoadingSpinner size="md" className="py-8" />
              ) : drilldown.tab === 'detail' ? (
                drilldown.detail ? (
                  <>
                    {/* Restock summary */}
                    <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{drilldown.detail.inventoryItem.currentQuantity}</p>
                        <p className="text-xs text-slate-500 mt-1">Current Stock ({drilldown.detail.inventoryItem.unit})</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{drilldown.detail.totalPredictedUsage.toFixed(1)}</p>
                        <p className="text-xs text-slate-500 mt-1">Predicted Usage (period)</p>
                      </div>
                      {drilldown.detail.restockRecommendation.shouldRestock && (
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center col-span-2 sm:col-span-1">
                          <p className="text-2xl font-bold text-blue-700">{drilldown.detail.restockRecommendation.recommendedQuantity}</p>
                          <p className="text-xs text-slate-500 mt-1">Restock by {drilldown.detail.restockRecommendation.recommendedDate}</p>
                        </div>
                      )}
                    </div>

                    {/* Daily chart */}
                    {drilldown.detail.dailyPredictions.length > 0 && (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={drilldown.detail.dailyPredictions} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            labelFormatter={(l: any) => new Date(String(l)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            formatter={(v: any, n: any) => [n === 'predictedUsage' ? `${Number(v).toFixed(1)} units` : `${(Number(v) * 100).toFixed(0)}%`, n === 'predictedUsage' ? 'Predicted' : 'Confidence']}
                          />
                          <Legend formatter={(v: any) => (v === 'predictedUsage' ? 'Predicted Usage' : 'Confidence')} />
                          <Line type="monotone" dataKey="predictedUsage" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                          <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </>
                ) : (
                  <p className="py-8 text-center text-slate-400">No detail data available for this item.</p>
                )
              ) : (
                /* History tab */
                drilldown.history.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-4">Past predictions vs. actual usage</p>
                    {drilldown.history.map((h) => (
                      <div key={h.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            {h.periodStart} → {h.periodEnd}
                          </span>
                          {h.accuracy != null && (
                            <Badge variant={h.accuracy >= 0.9 ? 'success' : h.accuracy >= 0.75 ? 'warning' : 'danger'} className="text-xs">
                              {(h.accuracy * 100).toFixed(0)}% accurate
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <span>Predicted: <strong className="text-slate-800">{h.predictedUsage.toFixed(1)}</strong></span>
                          <span>Actual: <strong className="text-slate-800">{h.actualUsage != null ? h.actualUsage.toFixed(1) : '—'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-slate-400">No prediction history available yet.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
