'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { apiClient } from '@/lib/api-client';

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  created_at: string;
  item: {
    name: string;
    unit: string;
  };
  performed_by: {
    name: string;
  };
}

export default function InventoryTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterType !== 'all' ? `?type=${filterType}` : '';
      const response = await apiClient.get(`/inventory/transactions${params}`);
      setTransactions(response.data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'gray', label: string }> = {
      restock: { variant: 'success', label: 'Restock' },
      adjustment: { variant: 'warning', label: 'Adjustment' },
      reserve: { variant: 'info', label: 'Reserved' },
      deduct: { variant: 'danger', label: 'Deducted' },
      release: { variant: 'gray', label: 'Released' },
    };
    return variants[type] || { variant: 'gray', label: type };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Transactions</h1>
        <Button variant="secondary" onClick={fetchTransactions}>
          Refresh
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Filter */}
      <Card>
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="restock">Restock</option>
            <option value="adjustment">Adjustment</option>
            <option value="reserve">Reserved</option>
            <option value="deduct">Deducted</option>
            <option value="release">Released</option>
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Stock Change</th>
                <th>Performed By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const badge = getTypeBadge(txn.transaction_type);
                  const isIncrease = txn.quantity > 0;
                  
                  return (
                    <tr key={txn.id}>
                      <td className="text-sm">{formatDate(txn.created_at)}</td>
                      <td>
                        <div className="font-medium">{txn.item.name}</div>
                        <div className="text-sm text-gray-500">{txn.item.unit}</div>
                      </td>
                      <td>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td>
                        <span className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? '+' : ''}{txn.quantity}
                        </span>
                      </td>
                      <td className="text-sm">
                        <span className="text-gray-500">{txn.previous_stock}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{txn.new_stock}</span>
                      </td>
                      <td>{txn.performed_by.name}</td>
                      <td className="text-sm text-gray-600">{txn.reason || txn.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
