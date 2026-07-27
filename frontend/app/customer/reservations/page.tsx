'use client';

import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { Toast } from '@/components/Toast';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  CalendarDays,
  Clock3,
  Users,
  Armchair,
  Plus,
  XCircle,
  Sparkles,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/Modal';

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

export default function CustomerReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    party_size: 2,
    special_requests: '',
    table_id: '',
  });

  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await apiClient.get(
        '/reservations/my-reservations'
      );

      setReservations(response.data?.data || []);
    } catch {
      setToast({
        show: true,
        message: 'Failed to load reservations',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTables = async () => {
    if (!formData.date || !formData.time) {
      return;
    }

    try {
      setLoadingTables(true);
      const response = await apiClient.get('/reservations/available-tables', {
        params: {
          date: formData.date,
          time: formData.time,
          party_size: formData.party_size,
        },
      });
      setAvailableTables(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch available tables:', err);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const createReservation = async () => {
    if (!formData.date || !formData.time || !formData.table_id) {
      setToast({
        show: true,
        message: 'Please fill all required fields and select a table',
        type: 'error',
      });

      return;
    }

    try {
      await apiClient.post('/reservations', {
        table_id: formData.table_id,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.party_size,
        special_requests: formData.special_requests || undefined,
      });

      setToast({
        show: true,
        message: 'Reservation created successfully!',
        type: 'success',
      });

      setShowModal(false);
      setFormData({
        date: '',
        time: '',
        party_size: 2,
        special_requests: '',
        table_id: '',
      });
      setAvailableTables([]);

      setFormData({
        date: '',
        time: '',
        party_size: 2,
        special_requests: '',
        table_id: '',
      });

      fetchReservations();
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err.response?.data?.message ||
          'Failed to create reservation',
        type: 'error',
      });
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      await apiClient.patch(`/reservations/${id}/cancel`);

      setToast({
        show: true,
        message: 'Reservation cancelled',
        type: 'success',
      });

      fetchReservations();
    } catch {
      setToast({
        show: true,
        message: 'Failed to cancel reservation',
        type: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500';

      case 'pending':
        return 'bg-amber-500';

      case 'cancelled':
        return 'bg-red-500';

      case 'seated':
        return 'bg-blue-500';

      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md rounded-3xl shadow-xl">
          <CardContent className="flex flex-col items-center gap-5 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">
                Loading Reservations
              </h2>

              <p className="text-sm text-muted-foreground">
                Please wait while we fetch your reservations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            show: false,
          }))
        }
      />

      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-500 shadow-xl">
          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">

            <div className="text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h1 className="text-4xl font-bold">
                My Reservations
              </h1>

              <p className="mt-2 text-blue-100">
                Manage your table reservations and create new
                bookings whenever you plan your next visit.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setShowModal(true)}
              className="gap-2 rounded-xl bg-white text-blue-700 shadow-lg hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              New Reservation
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {reservations.length === 0 ? (
          <Card className="rounded-3xl border-0 bg-white/80 shadow-xl backdrop-blur">
            <CardContent className="flex flex-col items-center py-20 text-center">

              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <CalendarDays className="h-10 w-10 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold">
                No Reservations Yet
              </h2>

              <p className="mt-2 max-w-md text-muted-foreground">
                Reserve your favorite table and enjoy a seamless
                dining experience.
              </p>

              <Button
                className="mt-8 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowModal(true)}
              >
                <Plus className="h-4 w-4" />
                Create Reservation
              </Button>

            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">

            {reservations.map((reservation) => (
              <Card
                key={reservation.id}
                className="overflow-hidden rounded-3xl border-0 bg-white/80 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <CardHeader>

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>

                      <div className="mb-3 flex flex-wrap items-center gap-3">

                        <CardTitle className="text-2xl">
                          {new Date(
                            reservation.date
                          ).toLocaleDateString()}
                        </CardTitle>

                        <Badge
                          className={`${getStatusColor(
                            reservation.status
                          )} text-white`}
                        >
                          {reservation.status.toUpperCase()}
                        </Badge>

                      </div>

                      <CardDescription>
                        Reservation created on{" "}
                        {new Date(
                          reservation.created_at
                        ).toLocaleDateString()}
                      </CardDescription>

                    </div>

                    {reservation.status === "pending" && (
                      <Button
                        variant="destructive"
                        className="gap-2 rounded-xl"
                        onClick={() =>
                          cancelReservation(reservation.id)
                        }
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}

                  </div>

                </CardHeader>

                <CardContent>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div className="rounded-2xl bg-slate-100 p-5">
                      <div className="mb-3 flex items-center gap-2 text-blue-600">
                        <Clock3 className="h-5 w-5" />
                        <span className="font-semibold">
                          Time
                        </span>
                      </div>

                      <p className="text-lg font-semibold">
                        {new Date(
                          reservation.date
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-5">
                      <div className="mb-3 flex items-center gap-2 text-blue-600">
                        <Users className="h-5 w-5" />
                        <span className="font-semibold">
                          Guests
                        </span>
                      </div>

                      <p className="text-lg font-semibold">
                        {reservation.party_size} People
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 p-5">
                      <div className="mb-3 flex items-center gap-2 text-blue-600">
                        <Armchair className="h-5 w-5" />
                        <span className="font-semibold">
                          Table
                        </span>
                      </div>

                      <p className="text-lg font-semibold">
                        {reservation.table
                          ? `#${reservation.table.table_number}`
                          : "Not Assigned"}
                      </p>
                    </div>

                  </div>

                  {reservation.special_requests && (
                    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

                      <div className="mb-3 flex items-center gap-2 text-blue-700">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-semibold">
                          Special Requests
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed text-slate-700">
                        {reservation.special_requests}
                      </p>

                    </div>
                  )}

                </CardContent>
              </Card>
            ))}

          </div>
        )}

      </div>

      {/* Reservation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Reservation"
      >
        <div className="space-y-5">

          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            <p className="font-medium">
              Reserve your table in just a few steps.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Date
            </label>

            <Input
              type="date"
              value={formData.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Time
            </label>

            <Input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  time: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Party Size
            </label>

            <Input
              type="number"
              min={1}
              max={20}
              value={formData.party_size}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  party_size: Number(e.target.value),
                })
              }
            />
          </div>

          {formData.date && formData.time && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Available Tables
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchAvailableTables}
                  disabled={loadingTables}
                  className="h-8"
                >
                  {loadingTables ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Check Availability'
                  )}
                </Button>
              </div>

              {availableTables.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          table_id: table.id,
                        })
                      }
                      className={`rounded-lg border-2 p-3 text-center transition-all ${
                        formData.table_id === table.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold">Table {table.table_number}</div>
                      <div className="text-xs text-slate-500">
                        Seats {table.capacity}
                      </div>
                    </button>
                  ))}
                </div>
              ) : availableTables.length === 0 && !loadingTables ? (
                <p className="text-sm text-slate-500">
                  Click "Check Availability" to see available tables
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Special Requests
            </label>

            <Textarea
              rows={4}
              placeholder="Window seat, birthday celebration, allergies..."
              value={formData.special_requests}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  special_requests: e.target.value,
                })
              }
            />
          </div>

          <Button
            onClick={createReservation}
            className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Create Reservation
          </Button>

        </div>
      </Modal>
    </div>
  );
}