'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, Star, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface RecommendedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

interface Recommendation {
  id: string;
  menuItem: RecommendedMenuItem;
  score: number;
  reason: string;
}

interface RecommendationsSectionProps {
  onAddToCart?: (item: RecommendedMenuItem) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function RecommendationsSection({ onAddToCart }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/ai/recommendations');
      const data = response.data?.data ?? response.data ?? [];
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError('Could not load recommendations right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '/placeholder-food.jpg';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const scoreLabel = (score: number) => {
    if (score >= 0.9) return { text: 'Perfect Match', variant: 'success' as const };
    if (score >= 0.75) return { text: 'Great Pick', variant: 'info' as const };
    return { text: 'Suggested', variant: 'gray' as const };
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Recommended For You</h2>
        </div>
        <LoadingSpinner size="md" className="py-8" />
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Silently hide if no recommendations or error
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recommended For You</h2>
            <p className="text-sm text-slate-500">AI-powered picks based on your taste</p>
          </div>
        </div>
        <button
          onClick={() => loadRecommendations(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {recommendations.slice(0, 5).map((rec) => {
          const label = scoreLabel(rec.score);
          return (
            <Card
              key={rec.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <Image
                  src={getImageUrl(rec.menuItem?.image_url)}
                  alt={rec.menuItem?.name ?? 'Menu item'}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant={label.variant} className="text-xs">
                    <Star className="mr-1 h-3 w-3 inline" />
                    {label.text}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">
                    {rec.menuItem?.name}
                  </h3>
                  <span className="text-sm font-bold text-blue-600 shrink-0">
                    ₹{rec.menuItem?.price}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 capitalize">
                  {rec.menuItem?.category?.replaceAll('_', ' ')}
                </p>

                {/* AI Reason */}
                <div className="rounded-lg bg-blue-50 p-2">
                  <p className="text-xs text-blue-700 line-clamp-2 leading-relaxed">
                    <span className="font-semibold">Why: </span>
                    {rec.reason}
                  </p>
                </div>

                {onAddToCart && (
                  <Button
                    size="sm"
                    className="w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs"
                    onClick={() => onAddToCart(rec.menuItem)}
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confidence Note */}
      <p className="mt-4 text-xs text-slate-400 text-center">
        Recommendations are generated by AI based on your order history and preferences.
      </p>
    </div>
  );
}
