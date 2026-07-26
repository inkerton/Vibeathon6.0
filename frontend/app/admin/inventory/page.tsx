'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
}

interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export default function AdminInventoryOverview() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [inventoryRes, lowStockRes] = await Promise.all([
        apiClient.get('/inventory'),
        apiClient.get('/inventory/low-stock'),
      ]);

      // Handle backend response structure: { status: 'success', data: [...] }
      const items = Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : (Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      const lowStock = Array.isArray(lowStockRes.data?.data) ? lowStockRes.data.data : (Array.isArray(lowStockRes.data) ? lowStockRes.data : []);
      
      // Transform backend snake_case to frontend camelCase
      const transformedItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        totalQuantity: item.total_stock || 0,
        reservedQuantity: item.reserved_stock || 0,
        availableQuantity: (item.total_stock || 0) - (item.reserved_stock || 0),
        reorderLevel: item.reorder_threshold || 0,
        reorderQuantity: item.reorder_quantity || 0,
      }));
      
      setInventory(transformedItems);
      
      // Calculate summary
      const outOfStock = items.filter((item: InventoryItem) => item.availableQuantity === 0);
      setSummary({
        totalItems: items.length,
        lowStockItems: lowStock.length,
        outOfStockItems: outOfStock.length,
        totalValue: 0, // Would need cost data to calculate
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (item.availableQuantity <= item.reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
        <Link href="/inventory">
          <Button>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Full Inventory Management
          </Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.lowStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{summary.outOfStockItems}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Stock</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {summary.totalItems - summary.outOfStockItems}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card title="Current Stock Levels">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Unit</th>
                <th>Total</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td className="font-medium">{item.name}</td>
                      <td>{item.unit}</td>
                      <td>{item.totalQuantity}</td>
                      <td className="text-orange-600">{item.reservedQuantity}</td>
                      <td className="font-semibold">{item.availableQuantity}</td>
                      <td>{item.reorderLevel}</td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/inventory">
            <button className="w-full btn btn-primary">
              Manage Full Inventory
            </button>
          </Link>
          <Link href="/inventory/transactions">
            <button className="w-full btn btn-secondary">
              View Transactions
            </button>
          </Link>
          <Link href="/admin/recipes">
            <button className="w-full btn btn-secondary">
              Manage Recipes
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
