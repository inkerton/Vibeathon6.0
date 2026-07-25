'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
}

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  special_requests?: string;
  table: {
    table_number: number;
    capacity: number;
  };
}

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'my-reservations'>('new');
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    party_size: 2,
    table_id: '',
    special_requests: '',
  });

  useEffect(() => {
    if (activeTab === 'my-reservations') {
      fetchMyReservations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (formData.date && formData.time && formData.party_size) {
      fetchAvailableTables();
    }
  }, [formData.date, formData.time, formData.party_size]);

  const fetchAvailableTables = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reservations/available-tables', {
        params: {
          date: formData.date,
          time: formData.time,
          party_size: formData.party_size,
        },
      });
      setAvailableTables(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch available tables:', err);
      setAvailableTables([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reservations/my-reservations');
      setMyReservations(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.table_id) {
      setError('Please select a table');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/reservations', {
        table_id: formData.table_id,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.party_size,
        special_requests: formData.special_requests,
      });

      setSuccess('Reservation created successfully! Check your email for confirmation.');
      setFormData({
        date: '',
        time: '',
        party_size: 2,
        table_id: '',
        special_requests: '',
      });
      setAvailableTables([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reservation');
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
      setSuccess('Reservation cancelled successfully');
      fetchMyReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Book a table or manage your reservations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('new')}
              className={`${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              New Reservation
            </button>
            <button
              onClick={() => setActiveTab('my-reservations')}
              className={`${
                activeTab === 'my-reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Reservations
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {activeTab === 'new' ? (
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Party Size
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.party_size}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          party_size: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                {availableTables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Table
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {availableTables.map((table) => (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, table_id: table.id })
                          }
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            formData.table_id === table.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {table.table_number}
                            </div>
                            <div className="text-sm text-gray-600">
                              Seats {table.capacity}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.date && formData.time && formData.party_size && availableTables.length === 0 && !loading && (
                  <div className="text-center py-4 text-gray-500">
                    No tables available for the selected date, time, and party size.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.special_requests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_requests: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="Any dietary restrictions, allergies, or special occasions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.table_id}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Reservation...' : 'Create Reservation'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : myReservations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">No reservations found</p>
                </div>
              ) : (
                myReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white shadow rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Table {reservation.table.table_number}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {reservation.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            📅 {new Date(reservation.reservation_date).toLocaleDateString()} at {reservation.reservation_time}
                          </p>
                          <p>👥 Party of {reservation.party_size}</p>
                          {reservation.special_requests && (
                            <p className="text-gray-500">
                              Note: {reservation.special_requests}
                            </p>
                          )}
                        </div>
                      </div>
                      {(reservation.status === 'pending' ||
                        reservation.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
