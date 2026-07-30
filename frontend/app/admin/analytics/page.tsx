'use client';

import { useState } from 'react';
import { RevenueAnalytics } from '@/components/RevenueAnalytics';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { TrendingUp, Activity } from 'lucide-react';

const TABS = [
  { id: 'revenue', label: 'Revenue Analytics', Icon: TrendingUp },
  { id: 'performance', label: 'Performance Metrics', Icon: Activity },
] as const;

type Tab = typeof TABS[number]['id'];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('revenue');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Tab bar */}
      <div className="mb-8 flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && <RevenueAnalytics />}
      {tab === 'performance' && <PerformanceMetrics />}
    </div>
  );
}
