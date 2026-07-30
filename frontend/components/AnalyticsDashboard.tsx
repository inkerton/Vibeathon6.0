'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data: {
    recommendations?: string[];
    [key: string]: any;
  };
}

interface InsightsResponse {
  insights: AIInsight[];
}

const PRIORITY_CONFIG = {
  high: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'danger' as const,
    icon: AlertCircle,
    iconColor: 'text-red-500',
    label: 'HIGH',
  },
  medium: {
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    badge: 'warning' as const,
    icon: Info,
    iconColor: 'text-yellow-500',
    label: 'MEDIUM',
  },
  low: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    badge: 'success' as const,
    icon: CheckCircle,
    iconColor: 'text-green-500',
    label: 'LOW',
  },
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export function AnalyticsDashboard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch insights for all types
      const types = ['REVENUE', 'OPERATIONAL', 'CUSTOMER', 'INVENTORY'];
      const responses = await Promise.all(
        types.map(type => apiClient.get(`/ai/insights/${type}`).catch(() => ({ data: { insights: [] } })))
      );
      
      // Combine all insights
      const allInsights = responses.flatMap(response => {
        const d = response.data?.data ?? response.data;
        return d?.insights ?? (Array.isArray(d) ? d : []);
      });
      
      setInsights(allInsights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateInsights = async () => {
    setRefreshing(true);
    try {
      await apiClient.post('/ai/insights/generate', {
        types: ['REVENUE', 'OPERATIONAL', 'CUSTOMER', 'INVENTORY'],
      });
      // After generation, reload the list
      await loadInsights(false);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Derived stats
  const highCount = insights.filter((i) => i.priority === 'high').length;
  const mediumCount = insights.filter((i) => i.priority === 'medium').length;
  const lowCount = insights.filter((i) => i.priority === 'low').length;
  const actionableCount = insights.filter((i) => i.actionable).length;

  const pieData = [
    { name: 'High', value: highCount },
    { name: 'Medium', value: mediumCount },
    { name: 'Low', value: lowCount },
  ].filter((d) => d.value > 0);

  const typeGroups = insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(typeGroups).map(([type, count]) => ({ type, count }));

  const types = ['all', ...Array.from(new Set(insights.map((i) => i.type)))];
  const filtered = filterType === 'all' ? insights : insights.filter((i) => i.type === filterType);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">AI-Powered Insights</h2>
        </div>
        <LoadingSpinner size="md" className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI-Powered Insights</h2>
            <p className="text-sm text-slate-500">Operational intelligence generated by Gemini AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateInsights}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Brain className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Generate
          </button>
          <button
            onClick={() => loadInsights(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{insights.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Insights</p>
        </Card>
        <Card className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-3xl font-bold text-red-600">{highCount}</p>
          <p className="text-xs text-slate-500 mt-1">High Priority</p>
        </Card>
        <Card className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-center">
          <p className="text-3xl font-bold text-yellow-600">{mediumCount}</p>
          <p className="text-xs text-slate-500 mt-1">Medium Priority</p>
        </Card>
        <Card className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{actionableCount}</p>
          <p className="text-xs text-slate-500 mt-1">Actionable</p>
        </Card>
      </div>

      {/* Charts Row */}
      {insights.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Priority Breakdown Pie */}
          <Card className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Priority Breakdown</h3>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'High', count: highCount, color: 'bg-red-500' },
                  { label: 'Medium', count: mediumCount, color: 'bg-yellow-500' },
                  { label: 'Low', count: lowCount, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900 ml-1">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Insight Types Bar */}
          <Card className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Insights by Type</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Type Filter */}
      {insights.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all capitalize ${
                filterType === t
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Insights List */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200 p-12 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No insights available yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Insights are generated from aggregated operational data.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((insight) => {
            const cfg = PRIORITY_CONFIG[insight.priority] ?? PRIORITY_CONFIG.medium;
            const Icon = cfg.icon;
            const isOpen = expanded.has(insight.id);

            return (
              <Card
                key={insight.id}
                className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 transition-all duration-200`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{insight.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={cfg.badge} className="text-xs">
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-slate-500 capitalize">{insight.type}</span>
                        {insight.actionable && (
                          <Badge variant="info" className="text-xs">Actionable</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(insight.id)}
                    className="shrink-0 text-slate-400 hover:text-slate-600"
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                <p className={`text-sm text-slate-700 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                  {insight.description}
                </p>

                {/* Expanded: Recommendations */}
                {isOpen && insight.actionable && insight.data?.recommendations && insight.data.recommendations.length > 0 && (
                  <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Recommended Actions
                    </p>
                    <ul className="space-y-1.5">
                      {insight.data.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
