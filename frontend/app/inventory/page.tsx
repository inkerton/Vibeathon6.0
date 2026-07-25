'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastRestockedAt: string | null;
}

interface RestockForm {
  quantity: string;
  notes: string;
}

interface AdjustForm {
  quantity: string;
  reason: string;
  type: 'add' | 'remove';
}

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [restockForm, setRestockForm] = useState<RestockForm>({ quantity: '', notes: '' });
  const [adjustForm, setAdjustForm] = useState<AdjustForm>({ quantity: '', reason: '', type: 'add' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/inventory');
      setInventory(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await apiClient.post(`/inventory/${selectedItem.id}/restock`, {
        quantity: parseFloat(restockForm.quantity),
        notes: restockForm.notes,
      });
      setToast({ show: true, message: 'Item restocked successfully', type: 'success' });
      setIsRestockModalOpen(false);
      setRestockForm({ quantity: '', notes: '' });
      fetchInventory();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to restock item', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      const quantity = parseFloat(adjustForm.quantity);
      await apiClient.post(`/inventory/${selectedItem.id}/adjust`, {
        quantity: adjustForm.type === 'remove' ? -quantity : quantity,
        reason: adjustForm.reason,
      });
      setToast({ show: true, message: 'Stock adjusted successfully', type: 'success' });
      setIsAdjustModalOpen(false);
      setAdjustForm({ quantity: '', reason: '', type: 'add' });
      fetchInventory();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to adjust stock', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openRestockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockForm({ quantity: item.reorderQuantity.toString(), notes: '' });
    setIsRestockModalOpen(true);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustForm({ quantity: '', reason: '', type: 'add' });
    setIsAdjustModalOpen(true);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (item.availableQuantity <= item.reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'low') return item.availableQuantity <= item.reorderLevel && item.availableQuantity > 0;
    if (filter === 'out') return item.availableQuantity === 0;
    return true;
  });

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <Button onClick={fetchInventory}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Filter Buttons */}
        <Card>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items ({inventory.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'low' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock ({inventory.filter(i => i.availableQuantity <= i.reorderLevel && i.availableQuantity > 0).length})
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Out of Stock ({inventory.filter(i => i.availableQuantity === 0).length})
            </button>
          </div>
        </Card>

        {/* Inventory Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th>Total Qty</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Last Restocked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No items found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <tr key={item.id}>
                        <td className="font-medium">{item.name}</td>
                        <td>{item.unit}</td>
                        <td>{item.totalQuantity}</td>
                        <td className="text-orange-600 font-medium">{item.reservedQuantity}</td>
                        <td className="font-bold text-lg">{item.availableQuantity}</td>
                        <td>{item.reorderLevel}</td>
                        <td>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td>
                          {item.lastRestockedAt 
                            ? new Date(item.lastRestockedAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => openRestockModal(item)}
                            >
                              Restock
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openAdjustModal(item)}
                            >
                              Adjust
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={`Restock: ${selectedItem?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRestockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestock} disabled={submitting}>
              {submitting ? 'Restocking...' : 'Restock'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRestock} className="space-y-4">
          <div>
            <label className="form-label">Quantity to Add</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={restockForm.quantity}
              onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
              required
              min="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              Suggested reorder quantity: {selectedItem?.reorderQuantity} {selectedItem?.unit}
            </p>
          </div>

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              rows={3}
              value={restockForm.notes}
              onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
              placeholder="e.g., Supplier name, invoice number, etc."
            />
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedItem?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={submitting}>
              {submitting ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="form-label">Adjustment Type</label>
            <select
              className="form-input"
              value={adjustForm.type}
              onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as 'add' | 'remove' })}
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
            </select>
          </div>

          <div>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              required
              min="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              Current available: {selectedItem?.availableQuantity} {selectedItem?.unit}
            </p>
          </div>

          <div>
            <label className="form-label">Reason</label>
            <textarea
              className="form-input"
              rows={3}
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              required
              placeholder="e.g., Damaged goods, inventory correction, etc."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
