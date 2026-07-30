'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';

interface UserPrefs {
  dietaryRestrictions: string[];
  favoriteCategories: string[];
  dislikedIngredients: string[];
  spiceLevel: string;
  priceRange: { min: number; max: number };
}

const DIETARY_OPTIONS = ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'HALAL', 'KOSHER'];
const CATEGORY_OPTIONS = ['ITALIAN', 'ASIAN', 'INDIAN', 'MEXICAN', 'MEDITERRANEAN', 'AMERICAN', 'SEAFOOD'];
const SPICE_OPTIONS = ['NONE', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'];

const DEFAULT_PREFS: UserPrefs = {
  dietaryRestrictions: [],
  favoriteCategories: [],
  dislikedIngredients: [],
  spiceLevel: 'MEDIUM',
  priceRange: { min: 0, max: 1000 },
};

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function UserPreferences() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [dislikedInput, setDislikedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing preferences if available
  useEffect(() => {
    apiClient
      .get('/ai/preferences')
      .then((res: any) => {
        const d = res.data?.data ?? res.data;
        if (d) {
          setPrefs({
            dietaryRestrictions: d.dietaryRestrictions ?? [],
            favoriteCategories: d.favoriteCategories ?? [],
            dislikedIngredients: d.dislikedIngredients ?? [],
            spiceLevel: d.spiceLevel ?? 'MEDIUM',
            priceRange: d.priceRange ?? { min: 0, max: 1000 },
          });
        }
      })
      .catch(() => {
        // No existing prefs — use defaults
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient.post('/ai/preferences', prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addDisliked = () => {
    const val = dislikedInput.trim().toLowerCase();
    if (val && !prefs.dislikedIngredients.includes(val)) {
      setPrefs((p) => ({ ...p, dislikedIngredients: [...p.dislikedIngredients, val] }));
    }
    setDislikedInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Food Preferences</h2>
            <p className="text-sm text-slate-500">Help AI give better recommendations</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Preferences'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dietary Restrictions */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Dietary Restrictions</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => {
            const active = prefs.dietaryRestrictions.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => setPrefs((p) => ({ ...p, dietaryRestrictions: toggle(p.dietaryRestrictions, opt) }))}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {opt.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Favourite Categories */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Favourite Cuisines</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const active = prefs.favoriteCategories.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => setPrefs((p) => ({ ...p, favoriteCategories: toggle(p.favoriteCategories, opt) }))}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Spice Level */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Spice Preference</h3>
        <div className="flex flex-wrap gap-2">
          {SPICE_OPTIONS.map((opt) => {
            const active = prefs.spiceLevel === opt;
            return (
              <button
                key={opt}
                onClick={() => setPrefs((p) => ({ ...p, spiceLevel: opt }))}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Price Range */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Budget per Meal (₹)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Min (₹)</label>
            <input
              type="number"
              min={0}
              value={prefs.priceRange.min}
              onChange={(e) => setPrefs((p) => ({ ...p, priceRange: { ...p.priceRange, min: Number(e.target.value) } }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Max (₹)</label>
            <input
              type="number"
              min={0}
              value={prefs.priceRange.max}
              onChange={(e) => setPrefs((p) => ({ ...p, priceRange: { ...p.priceRange, max: Number(e.target.value) } }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </Card>

      {/* Disliked Ingredients */}
      <Card className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Ingredients to Avoid</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={dislikedInput}
            onChange={(e) => setDislikedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDisliked()}
            placeholder="e.g. mushrooms"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={addDisliked}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {prefs.dislikedIngredients.map((ing) => (
            <button
              key={ing}
              onClick={() => setPrefs((p) => ({ ...p, dislikedIngredients: p.dislikedIngredients.filter((i) => i !== ing) }))}
              className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200 transition-colors cursor-pointer"
            >
              {ing} ×
            </button>
          ))}
          {prefs.dislikedIngredients.length === 0 && (
            <p className="text-sm text-slate-400">None added yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
