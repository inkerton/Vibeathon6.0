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

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  numberOfGuests: number;
  tableNumber: number | null;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  specialRequests: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number | null;
  status: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
  customer: {
    name: string;
  };
}

export default function ReceptionDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError('');
      const [reservationsRes, ordersRes] = await Promise.all([
        apiClient.get('/reservations'),
        apiClient.get('/orders/active'),
      ]);
      setReservations(reservationsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/reservations/${reservationId}/status`, { status: newStatus });
      setToast({ show: true, message: `Reservation ${newStatus}`, type: 'success' });
      fetchData();
      setIsDetailModalOpen(false);
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update reservation', type: 'error' });
    }
  };

  const updatePaymentStatus = async (orderId: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/payment`, { paymentStatus: 'paid' });
      setToast({ show: true, message: 'Payment marked as paid', type: 'success' });
      fetchData();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update payment', type: 'error' });
    }
  };

  const openReservationDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'gray'> = {
      pending: 'warning',
      confirmed: 'info',
      seated: 'success',
      completed: 'gray',
      cancelled: 'danger',
    };
    return variants[status] || 'gray';
  };

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => r.date.startsWith(today) && r.status !== 'cancelled');
  };

  const filteredReservations = filterStatus === 'all' 
    ? getTodayReservations()
    : getTodayReservations().filter(r => r.status === filterStatus);

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
          <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
          <Button onClick={fetchData}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Reservations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{getTodayReservations().length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Check-in</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {getTodayReservations().filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Currently Seated</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {getTodayReservations().filter(r => r.status === 'seated').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Payments</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {orders.filter(o => o.paymentStatus === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Reservations Section */}
        <Card title="Today's Reservations">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilterStatus('seated')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'seated' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Seated
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Guests</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No reservations found
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="font-medium">{reservation.time}</td>
                      <td>{reservation.customerName}</td>
                      <td className="text-sm text-gray-600">{reservation.customerPhone}</td>
                      <td>{reservation.numberOfGuests}</td>
                      <td>{reservation.tableNumber || '-'}</td>
                      <td>
                        <Badge variant={getStatusBadge(reservation.status)}>
                          {reservation.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openReservationDetail(reservation)}
                          >
                            Details
                          </Button>
                          {reservation.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateReservationStatus(reservation.id, 'seated')}
                            >
                              Check In
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pending Payments Section */}
        <Card title="Pending Payments">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.paymentStatus === 'pending').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No pending payments
                    </td>
                  </tr>
                ) : (
                  orders
                    .filter(o => o.paymentStatus === 'pending')
                    .map((order) => (
                      <tr key={order.id}>
                        <td className="font-medium">#{order.orderNumber}</td>
                        <td>Table {order.tableNumber || 'N/A'}</td>
                        <td>{order.customer.name}</td>
                        <td className="font-bold">₹{order.totalAmount.toFixed(2)}</td>
                        <td>
                          <Badge variant="warning">PENDING</Badge>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => updatePaymentStatus(order.id)}
                          >
                            Mark as Paid
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Reservation Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Reservation Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
            {selectedReservation?.status === 'confirmed' && (
              <Button
                variant="success"
                onClick={() => updateReservationStatus(selectedReservation.id, 'seated')}
              >
                Check In
              </Button>
            )}
            {selectedReservation?.status === 'seated' && (
              <Button
                variant="success"
                onClick={() => updateReservationStatus(selectedReservation.id, 'completed')}
              >
                Complete
              </Button>
            )}
          </>
        }
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Customer Name</label>
              <p className="text-lg">{selectedReservation.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contact</label>
              <p>{selectedReservation.customerPhone}</p>
              <p className="text-sm text-gray-600">{selectedReservation.customerEmail}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date & Time</label>
                <p>{new Date(selectedReservation.date).toLocaleDateString()}</p>
                <p>{selectedReservation.time}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Guests</label>
                <p className="text-lg font-bold">{selectedReservation.numberOfGuests}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Table Number</label>
              <p className="text-lg">{selectedReservation.tableNumber || 'Not assigned'}</p>
            </div>
            {selectedReservation.specialRequests && (
              <div>
                <label className="text-sm font-medium text-gray-700">Special Requests</label>
                <p className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  {selectedReservation.specialRequests}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadge(selectedReservation.status)}>
                  {selectedReservation.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
