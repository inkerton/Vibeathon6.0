'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
}

interface Reservation {
  id: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: string;
  specialRequests?: string | null;
  table: {
    tableNumber: number;
    capacity: number;
  };
  createdAt: string;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'my-reservations'>('new');
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: 2,
    tableId: '',
    specialRequests: '',
  });

  useEffect(() => {
    if (activeTab === 'my-reservations') {
      fetchMyReservations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (formData.date && formData.time && formData.partySize) {
      fetchAvailableTables();
    } else {
      setAvailableTables([]);
    }
  }, [formData.date, formData.time, formData.partySize]);

  const fetchAvailableTables = async () => {
    try {
      setLoadingTables(true);
      const response = await apiClient.get('/reservations/available-tables', {
        params: {
          date: formData.date,
          time: formData.time,
          partySize: formData.partySize,
        },
      });
      setAvailableTables(response.data || []);
      setFormData(prev => ({ ...prev, tableId: '' })); // Reset table selection
    } catch (err: any) {
      console.error('Failed to fetch available tables:', err);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchMyReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/reservations/my-reservations');
      setMyReservations(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.tableId) {
      setToast({ show: true, message: 'Please select a table', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/reservations', {
        tableId: formData.tableId,
        reservationDate: formData.date,
        reservationTime: formData.time,
        partySize: formData.partySize,
        specialRequests: formData.specialRequests || undefined,
      });

      setToast({ 
        show: true, 
        message: 'Reservation created successfully! Check your email for confirmation.', 
        type: 'success' 
      });
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        partySize: 2,
        tableId: '',
        specialRequests: '',
      });
      setAvailableTables([]);
      
      // Switch to my reservations tab after a delay
      setTimeout(() => {
        setActiveTab('my-reservations');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create reservation');
      setToast({ show: true, message: 'Failed to create reservation', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await apiClient.patch(`/reservations/${id}/cancel`);
      setToast({ show: true, message: 'Reservation cancelled successfully', type: 'success' });
      fetchMyReservations();
    } catch (err: any) {
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to cancel reservation', 
        type: 'error' 
      });
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'seated':
        return 'info';
      case 'completed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum time (current time if today is selected)
  const getMinTime = () => {
    if (formData.date === today) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    return '00:00';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customer/menu')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Table Reservations</h1>
              <p className="text-sm text-gray-600">Book a table or manage your reservations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Reservation
            </button>
            <button
              onClick={() => setActiveTab('my-reservations')}
              className={`${
                activeTab === 'my-reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Reservations
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'new' ? (
          <div className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <Card title="Reservation Details">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      min={getMinTime()}
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Party Size *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.partySize}
                      onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                    placeholder="Any dietary restrictions, allergies, special occasions, or seating preferences..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            </Card>

            {/* Available Tables */}
            {formData.date && formData.time && formData.partySize && (
              <Card title="Select Table">
                {loadingTables ? (
                  <LoadingSpinner size="md" className="py-8" />
                ) : availableTables.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {availableTables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, tableId: table.id })}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          formData.tableId === table.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {table.tableNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {table.capacity} seats
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 font-medium">No tables available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try a different date, time, or party size
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Submit Button */}
            {formData.date && formData.time && formData.partySize && (
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setFormData({
                      date: '',
                      time: '',
                      partySize: 2,
                      tableId: '',
                      specialRequests: '',
                    });
                    setAvailableTables([]);
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading || !formData.tableId}
                >
                  {loading ? 'Creating Reservation...' : 'Confirm Reservation'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <LoadingSpinner size="lg" className="py-20" />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : myReservations.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations</h3>
                  <p className="text-gray-600 mb-6">You haven't made any reservations yet</p>
                  <Button onClick={() => setActiveTab('new')}>
                    Make a Reservation
                  </Button>
                </div>
              </Card>
            ) : (
              myReservations.map((reservation) => (
                <Card key={reservation.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          Table {reservation.table.tableNumber}
                        </h3>
                        <Badge variant={getStatusVariant(reservation.status)}>
                          {reservation.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(reservation.reservationDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTime(reservation.reservationTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Party of {reservation.partySize}</span>
                        </div>
                        {reservation.specialRequests && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-1">Special Requests:</p>
                            <p className="text-sm text-blue-800">{reservation.specialRequests}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {(reservation.status.toLowerCase() === 'pending' ||
                      reservation.status.toLowerCase() === 'confirmed') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}