'use client';

import { useEffect, useState } from 'react';
import {
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
import { BarChart2, Users, Clock, Lightbulb, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface DailyForecast {
  date: string;
  predictedOrders: number;
  peakHours: number[];
  confidence: number;
}

interface ItemForecast {
  itemId: string;
  itemName: string;
  predictedOrders: number;
  confidence: number;
}

interface ForecastData {
  forecasts: DailyForecast[];
  itemForecasts: ItemForecast[];
  insights: string[];
}

interface StaffingData {
  date: string;
  predictedOrders: number;
  recommendedStaff: number;
  peakHours: number[];
  confidence: number;
}

interface RecentForecast {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalPredictedOrders: number;
  accuracy: number | null;
  generatedAt: string;
}

const HOUR_LABELS = ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
                     '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'];

const BAR_COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316'];

export function DemandForecast() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [staffing, setStaffing] = useState<StaffingData | null>(null);
  const [recentForecasts, setRecentForecasts] = useState<RecentForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [forecastRes, staffRes, recentRes] = await Promise.allSettled([
        apiClient.get('/ai/forecast/demand'),
        apiClient.get('/ai/forecast/staffing?date=' + new Date().toISOString().split('T')[0]),
        apiClient.get('/ai/forecast/recent'),
      ]);

      if (forecastRes.status === 'fulfilled') {
        // API returns { data: { forecasts, itemForecasts, insights } }
        const response = forecastRes.value;
        console.log('Full forecast response:', response);
        console.log('Response data:', response.data);
        
        // Extract the actual data - axios wraps in .data, then API wraps in .data again
        const apiData = response.data?.data || response.data;
        console.log('Extracted API data:', apiData);
        
        // Backend returns { forecasts, itemForecasts, insights }
        if (apiData?.forecasts && Array.isArray(apiData.forecasts)) {
          console.log('Setting forecast with', apiData.forecasts.length, 'daily forecasts');
          setForecast({
            forecasts: apiData.forecasts,
            itemForecasts: apiData.itemForecasts || [],
            insights: apiData.insights || [],
          });
        } else {
          console.warn('Unexpected forecast response structure. Expected forecasts array, got:', apiData);
          setForecast(null);
        }
      } else {
        console.error('Forecast request failed:', forecastRes.status === 'rejected' ? forecastRes.reason : 'Unknown error');
      }
      if (staffRes.status === 'fulfilled') {
        // Spec: data.recommendations.{ date, predictedOrders, totalStaffRecommended, peakHours[], confidence }
        const raw = staffRes.value.data?.data ?? staffRes.value.data;
        if (raw?.recommendations) {
          const r = raw.recommendations;
          setStaffing({
            date: r.date,
            predictedOrders: r.predictedOrders,
            recommendedStaff: r.totalStaffRecommended ?? r.recommendedStaff,
            peakHours: Array.isArray(r.peakHours)
              ? r.peakHours.map((p: any) => (typeof p === 'object' ? p.hour : p))
              : [],
            confidence: r.confidence,
          });
        } else {
          // Backend returns flat shape (legacy)
          setStaffing(raw ?? null);
        }
      }
      if (recentRes.status === 'fulfilled') {
        const d = recentRes.value.data?.data ?? recentRes.value.data;
        const list = d?.forecasts ?? (Array.isArray(d) ? d : []);
        setRecentForecasts(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load demand forecast:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Demand Forecast</h2>
        </div>
        <LoadingSpinner size="md" className="py-12" />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <BarChart2 className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Demand Forecast</h2>
        </div>
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <BarChart2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No forecast data available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Forecasts are generated from at least 7 days of order history.</p>
        </Card>
      </div>
    );
  }

  // Compute totals for summary
  const totalPredictedOrders = forecast.forecasts.reduce((s, f) => s + f.predictedOrders, 0);
  const avgConfidence = forecast.forecasts.length
    ? forecast.forecasts.reduce((s, f) => s + f.confidence, 0) / forecast.forecasts.length
    : 0;
  const peakDay = forecast.forecasts.reduce(
    (max, f) => (f.predictedOrders > max.predictedOrders ? f : max),
    forecast.forecasts[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <BarChart2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Demand Forecast</h2>
            <p className="text-sm text-slate-500">7-day order demand prediction powered by AI</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalPredictedOrders}</p>
          <p className="text-xs text-slate-500 mt-1">Total Predicted Orders (7d)</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{Math.round(totalPredictedOrders / 7)}</p>
          <p className="text-xs text-slate-500 mt-1">Daily Average</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-lg font-bold text-slate-900 leading-tight">
            {peakDay ? formatDate(peakDay.date) : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Busiest Day</p>
        </Card>
        {staffing && (
          <Card className="rounded-2xl border border-slate-200 p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-5 w-5 text-indigo-500" />
              <p className="text-3xl font-bold text-indigo-600">{staffing.recommendedStaff}</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Staff Recommended Today</p>
          </Card>
        )}
        {!staffing && (
          <Card className="rounded-2xl border border-slate-200 p-5 text-center">
            <Badge variant={avgConfidence >= 0.8 ? 'success' : avgConfidence >= 0.6 ? 'warning' : 'danger'}>
              {(avgConfidence * 100).toFixed(0)}% Avg Confidence
            </Badge>
            <p className="text-xs text-slate-500 mt-1">AI Certainty</p>
          </Card>
        )}
      </div>

      {/* Main Bar Chart */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">7-Day Order Demand</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={forecast.forecasts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => formatDate(v)}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(l: any) => formatDate(String(l))}
              formatter={(value: any, name: any) => [
                name === 'predictedOrders' ? `${value} orders` : `${(Number(value) * 100).toFixed(0)}%`,
                name === 'predictedOrders' ? 'Predicted Orders' : 'Confidence',
              ]}
            />
            <Legend formatter={(v: any) => v === 'predictedOrders' ? 'Predicted Orders' : 'Confidence'} />
            <Bar dataKey="predictedOrders" radius={[6, 6, 0, 0]}>
              {forecast.forecasts.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Peak Hours & Staffing */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peak Hours */}
        <Card className="rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Peak Hours</h3>
          </div>
          <div className="space-y-3">
            {forecast.forecasts.slice(0, 4).map((f) => (
              <div key={f.date} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-700 w-24 shrink-0">
                  {formatDate(f.date)}
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {(f.peakHours ?? []).map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {HOUR_LABELS[h]}
                    </span>
                  ))}
                </div>
                <Badge
                  variant={f.predictedOrders > (totalPredictedOrders / 7) ? 'warning' : 'success'}
                  className="text-xs shrink-0"
                >
                  {f.predictedOrders} orders
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Staffing Recommendation */}
        {staffing ? (
          <Card className="rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Today's Staffing</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-indigo-50 p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{staffing.recommendedStaff}</p>
                  <p className="text-xs text-slate-500 mt-1">Recommended Staff</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{staffing.predictedOrders}</p>
                  <p className="text-xs text-slate-500 mt-1">Expected Orders</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Peak Hours Today</p>
                <div className="flex flex-wrap gap-1">
                  {(staffing.peakHours ?? []).map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {HOUR_LABELS[h]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <Badge variant={staffing.confidence >= 0.8 ? 'success' : 'warning'}>
                  {(staffing.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </div>
          </Card>
        ) : (
          /* Popular Items Forecast */
          <Card className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Popular Items Forecast</h3>
            <div className="space-y-3">
              {forecast.itemForecasts.slice(0, 6).map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">{item.itemName}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-sm font-bold text-blue-600">{item.predictedOrders} orders</span>
                    <Badge variant={item.confidence >= 0.8 ? 'success' : 'warning'} className="text-xs">
                      {(item.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Popular Items (when staffing is shown above) */}
      {staffing && forecast.itemForecasts.length > 0 && (
        <Card className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Popular Items Forecast</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forecast.itemForecasts.slice(0, 6).map((item) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-800 truncate flex-1">{item.itemName}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-bold text-blue-600">{item.predictedOrders}</span>
                  <Badge variant={item.confidence >= 0.8 ? 'success' : 'warning'} className="text-xs">
                    {(item.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      {forecast.insights && forecast.insights.length > 0 && (
        <Card className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-900">Key Insights</h3>
          </div>
          <ul className="space-y-2">
            {forecast.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm text-blue-800">{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recent Forecasts */}
      {recentForecasts.length > 0 && (
        <Card className="rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Forecast History</h3>
          <div className="space-y-3">
            {recentForecasts.map((rf) => (
              <div key={rf.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 gap-4">
                <div className="text-sm">
                  <span className="font-medium text-slate-800">
                    {new Date(rf.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(rf.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    Generated {new Date(rf.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-blue-600">{rf.totalPredictedOrders} orders</span>
                  {rf.accuracy != null && (
                    <Badge
                      variant={rf.accuracy >= 0.9 ? 'success' : rf.accuracy >= 0.75 ? 'warning' : 'danger'}
                      className="text-xs"
                    >
                      {(rf.accuracy * 100).toFixed(0)}% accurate
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
