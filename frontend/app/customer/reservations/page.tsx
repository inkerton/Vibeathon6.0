'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface Reservation {
  id: string;
  customer_id: string;
  table_id: string;
  date: string;
  party_size: number;
  status: string;
  special_requests: string | null;
  created_at: string;
  table?: {
    table_number: number;
  };
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
}

export default function CustomerReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: '', time: '', party_size: 2, special_requests: '', table_id: '' });
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await apiClient.get('/reservations/my-reservations');
      setReservations(response.data?.data || []);
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to load reservations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTables = async () => {
    if (!formData.date || !formData.time) {
      return;
    }

    setLoadingTables(true);
    try {
      const response = await apiClient.get('/reservations/available-tables', {
        params: {
          date: formData.date,
          time: formData.time,
          party_size: formData.party_size
        }
      });
      setAvailableTables(response.data?.data || []);
      if (response.data?.data?.length === 0) {
        setToast({ show: true, message: 'No tables available for this time slot', type: 'error' });
      }
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to fetch available tables', type: 'error' });
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const createReservation = async () => {
    if (!formData.date || !formData.time || !formData.table_id) {
      setToast({ show: true, message: 'Please fill all required fields and select a table', type: 'error' });
      return;
    }

    try {
      await apiClient.post('/reservations', {
        table_id: formData.table_id,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.party_size,
        special_requests: formData.special_requests || undefined
      });
      setToast({ show: true, message: 'Reservation created successfully', type: 'success' });
      setShowModal(false);
      setFormData({ date: '', time: '', party_size: 2, special_requests: '', table_id: '' });
      setAvailableTables([]);
      fetchReservations();
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || 'Failed to create reservation', type: 'error' });
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/status`, { status: 'cancelled' });
      setToast({ show: true, message: 'Reservation cancelled', type: 'success' });
      fetchReservations();
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to cancel reservation', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
      pending: 'warning',
      confirmed: 'info',
      seated: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'info';
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Reservations</h1>
          <Button onClick={() => setShowModal(true)}>New Reservation</Button>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-gray-500">No reservations yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map(res => (
              <Card key={res.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center mb-2">
                      <h3 className="font-bold text-lg">{new Date(res.date).toLocaleDateString()}</h3>
                      <Badge variant={getStatusBadge(res.status)}>{res.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Time: {new Date(res.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-gray-600">Party Size: {res.party_size} guests</p>
                    {res.table && <p className="text-sm text-gray-600">Table: {res.table.table_number}</p>}
                    {res.special_requests && <p className="text-sm text-gray-600 mt-2">Note: {res.special_requests}</p>}
                  </div>
                  {res.status === 'pending' && (
                    <Button variant="danger" size="sm" onClick={() => cancelReservation(res.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setAvailableTables([]); setFormData({ date: '', time: '', party_size: 2, special_requests: '', table_id: '' }); }} title="New Reservation">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => { setFormData({ ...formData, date: e.target.value, table_id: '' }); setAvailableTables([]); }}
              className="input w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => { setFormData({ ...formData, time: e.target.value, table_id: '' }); setAvailableTables([]); }}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Party Size *</label>
            <input
              type="number"
              value={formData.party_size}
              onChange={(e) => { setFormData({ ...formData, party_size: parseInt(e.target.value), table_id: '' }); setAvailableTables([]); }}
              className="input w-full"
              min="1"
              max="20"
            />
          </div>
          
          {formData.date && formData.time && (
            <div>
              <Button 
                onClick={fetchAvailableTables} 
                variant="secondary" 
                className="w-full mb-2"
                disabled={loadingTables}
              >
                {loadingTables ? 'Checking...' : 'Check Available Tables'}
              </Button>
            </div>
          )}

          {availableTables.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Table *</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setFormData({ ...formData, table_id: table.id })}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.table_id === table.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">Table {table.table_number}</div>
                    <div className="text-sm text-gray-600">Capacity: {table.capacity}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Special Requests</label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>
          <Button 
            onClick={createReservation} 
            className="w-full"
            disabled={!formData.table_id}
          >
            Create Reservation
          </Button>
        </div>
      </Modal>
    </div>
  );
}
