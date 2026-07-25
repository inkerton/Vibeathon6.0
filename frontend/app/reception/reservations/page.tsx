'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import apiClient from '@/lib/api-client';
import socketClient from '@/lib/socket-client';

interface Reservation {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  table: {
    id: string;
    table_number: number;
    capacity: number;
  };
  date: string;
  party_size: number;
  special_request: string | null;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed';
  created_at: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  seated: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusActions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['seated', 'cancelled'],
  seated: ['completed'],
  cancelled: [],
  completed: [],
};

export default function ReceptionReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'reception' || user?.role === 'admin') {
      fetchReservations();
      setupSocketListeners();
    }

    return () => {
      socketClient.off('reservation:created');
      socketClient.off('reservation:status_updated');
      socketClient.off('reservation:cancelled');
    };
  }, [user, filterStatus, filterDate]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);

      const response = await apiClient.get(`/reservations?${params.toString()}`);
      setReservations(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketClient.on('reservation:created', () => {
      fetchReservations();
    });

    socketClient.on('reservation:status_updated', () => {
      fetchReservations();
    });

    socketClient.on('reservation:cancelled', () => {
      fetchReservations();
    });
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      setUpdatingId(reservationId);
      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: newStatus,
      });
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update reservation status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (user?.role !== 'reception' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reservations Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage all restaurant reservations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold">{reservations.length}</span>
              </span>
              <button
                onClick={fetchReservations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="seated">Seated</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterDate('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilterDate(getTodayDate())}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Today's Reservations
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No reservations found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.customer.email}
                        </div>
                        {reservation.customer.phone && (
                          <div className="text-sm text-gray-500">
                            {reservation.customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Table {reservation.table.table_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Capacity: {reservation.table.capacity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(reservation.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(reservation.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                      </div>
                      {reservation.special_request && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {reservation.special_request}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          statusColors[reservation.status]
                        }`}
                      >
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-2">
                        {statusActions[reservation.status].map((action) => (
                          <button
                            key={action}
                            onClick={() => updateReservationStatus(reservation.id, action)}
                            disabled={updatingId === reservation.id}
                            className={`px-3 py-1 rounded text-white text-xs font-medium transition-colors ${
                              updatingId === reservation.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : action === 'confirmed'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : action === 'seated'
                                ? 'bg-green-600 hover:bg-green-700'
                                : action === 'completed'
                                ? 'bg-gray-600 hover:bg-gray-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {updatingId === reservation.id
                              ? 'Updating...'
                              : `Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
