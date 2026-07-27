'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { Toast } from '@/components/Toast';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Modal } from '@/components/Modal';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';

import {
  CalendarDays,
  Clock3,
  Users,
  CreditCard,
  RefreshCcw,
  ClipboardList,
  Receipt,
} from 'lucide-react';

/* ---------------- MUI TABLE ---------------- */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from '@mui/utils';

/* ---------------- TYPES ---------------- */

interface Reservation {
  id: string;
  customer_id: string;
  table_id: string;
  date: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  special_requests: string | null;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  table?: {
    id: string;
    table_number: number;
  };
}

interface Order {
  id: string;
  order_status: string;
  total_amount: string;
  payment_status: string;
  customer: {
    name: string;
  };
  table: {
    table_number: number;
  };
}

type OrderDirection = 'asc' | 'desc';

/* ---------------- TABLE ---------------- */

interface HeadCell {
  id: keyof Reservation | 'customer';
  label: string;
  numeric: boolean;
}

const reservationHeadCells: readonly HeadCell[] = [
  {
    id: 'date',
    label: 'Time',
    numeric: false,
  },
  {
    id: 'customer',
    label: 'Customer',
    numeric: false,
  },
  {
    id: 'party_size',
    label: 'Guests',
    numeric: true,
  },
  {
    id: 'table_id',
    label: 'Table',
    numeric: false,
  },
  {
    id: 'status',
    label: 'Status',
    numeric: false,
  },
];

function descendingComparator(
  a: Reservation,
  b: Reservation,
  orderBy: keyof Reservation | 'customer'
) {
  let aValue: any;
  let bValue: any;

  if (orderBy === 'customer') {
    aValue = a.customer?.name || '';
    bValue = b.customer?.name || '';
  } else if (orderBy === 'table_id') {
    aValue = a.table?.table_number || 0;
    bValue = b.table?.table_number || 0;
  } else {
    aValue = a[orderBy as keyof Reservation];
    bValue = b[orderBy as keyof Reservation];
  }

  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
  return 0;
}

function getComparator(
  order: OrderDirection,
  orderBy: keyof Reservation | 'customer'
) {
  return order === 'desc'
    ? (a: Reservation, b: Reservation) =>
        descendingComparator(a, b, orderBy)
    : (a: Reservation, b: Reservation) =>
        -descendingComparator(a, b, orderBy);
}

interface ReservationTableHeadProps {
  order: OrderDirection;
  orderBy: string;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Reservation
  ) => void;
}

function ReservationTableHead({
  order,
  orderBy,
  onRequestSort,
}: ReservationTableHeadProps) {
  const createSortHandler =
    (property: keyof Reservation) =>
    (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {reservationHeadCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={
              headCell.numeric ? 'right' : 'left'
            }
            sortDirection={
              orderBy === headCell.id ? order : false
            }
            sx={{
              fontWeight: 700,
              bgcolor: '#eff6ff',
            }}
          >
            {headCell.id === 'customer' ? (
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={
                  orderBy === headCell.id
                    ? order
                    : 'asc'
                }
                onClick={createSortHandler(
                  headCell.id as keyof Reservation
                )}
              >
                {headCell.label}

                {orderBy === headCell.id && (
                  <Box
                    component="span"
                    sx={visuallyHidden}
                  >
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                )}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
        <TableCell
          align="center"
          sx={{
            fontWeight: 700,
            bgcolor: '#eff6ff',
          }}
        >
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

/* ---------------- PAGE ---------------- */

export default function ReceptionDashboard() {
  const [reservations, setReservations] = useState<
    Reservation[]
  >([]);

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState<Reservation | null>(null);

  const [
    isDetailModalOpen,
    setIsDetailModalOpen,
  ] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as
      | 'success'
      | 'error',
  });

  const [filterStatus, setFilterStatus] =
    useState('all');

  /* Table State */

  const [order, setOrder] =
    useState<OrderDirection>('asc');

  const [orderBy, setOrderBy] =
    useState<keyof Reservation>('date');

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      fetchData,
      15000
    );

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError('');

      const [reservationsRes, ordersRes] =
        await Promise.all([
          apiClient.get('/reservations'),
          apiClient.get('/orders/active'),
        ]);

      setReservations(
        reservationsRes.data?.data || []
      );

      setOrders(
        ordersRes.data?.data || []
      );
    } catch (err: any) {
      setError(
        err.message || 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      await apiClient.patch(
        `/reservations/${reservationId}/status`,
        {
          status: newStatus,
        }
      );

      setToast({
        show: true,
        message: `Reservation ${newStatus}`,
        type: 'success',
      });

      fetchData();

      setIsDetailModalOpen(false);
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err.message ||
          'Failed to update reservation',
        type: 'error',
      });
    }
  };

  const updatePaymentStatus = async (
    orderId: string
  ) => {
    try {
      await apiClient.patch(
        `/orders/${orderId}/payment`,
        {
          payment_status: 'paid',
        }
      );

      setToast({
        show: true,
        message: 'Payment marked as paid',
        type: 'success',
      });

      fetchData();
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err.message ||
          'Failed to update payment',
        type: 'error',
      });
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await apiClient.patch(
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      setToast({
        show: true,
        message: `Order marked as ${newStatus}`,
        type: 'success',
      });

      fetchData();
    } catch (err: any) {
      setToast({
        show: true,
        message:
          err.message ||
          'Failed to update order status',
        type: 'error',
      });
    }
  };

  const openReservationDetail = (
    reservation: Reservation
  ) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const getTodayReservations = () => {
    const today = new Date()
      .toISOString()
      .split('T')[0];

    return reservations.filter(
      (r) =>
        r.date.startsWith(today) &&
        r.status !== 'cancelled'
    );
  };

  const filteredReservations =
    filterStatus === 'all'
      ? getTodayReservations()
      : getTodayReservations().filter(
          (r) => r.status === filterStatus
        );

  const visibleReservations = useMemo(
    () =>
      [...filteredReservations]
        .sort(
          getComparator(order, orderBy)
        )
        .slice(
          page * rowsPerPage,
          page * rowsPerPage +
            rowsPerPage
        ),
    [
      filteredReservations,
      order,
      orderBy,
      page,
      rowsPerPage,
    ]
  );

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Reservation
  ) => {
    const isAsc =
      orderBy === property &&
      order === 'asc';

    setOrder(
      isAsc ? 'desc' : 'asc'
    );

    setOrderBy(property);
  };

  const handleChangePage = (
    event: unknown,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(
      parseInt(event.target.value, 10)
    );

    setPage(0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <RefreshCcw className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
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

      <div className="mx-auto max-w-7xl space-y-8">

        {/* Hero */}

        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 shadow-2xl">

          <div className="flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="text-white">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <ClipboardList className="h-8 w-8" />
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Reception Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-blue-100">
                Monitor reservations, manage guest check-ins,
                handle payments, and keep track of live orders
                from one place.
              </p>

            </div>

            <Button
              size="lg"
              onClick={fetchData}
              className="gap-2 rounded-xl bg-white text-blue-700 shadow-xl hover:bg-blue-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Dashboard
            </Button>

          </div>

        </div>

        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Summary Cards */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <Card className="rounded-3xl border-0 shadow-lg">

            <CardContent className="flex items-center justify-between p-6">

              <div>

                <p className="text-sm font-medium text-muted-foreground">
                  Today's Reservations
                </p>

                <h2 className="mt-2 text-4xl font-bold">
                  {getTodayReservations().length}
                </h2>

              </div>

              <div className="rounded-2xl bg-blue-100 p-4">
                <CalendarDays className="h-8 w-8 text-blue-600" />
              </div>

            </CardContent>

          </Card>

          <Card className="rounded-3xl border-0 shadow-lg">

            <CardContent className="flex items-center justify-between p-6">

              <div>

                <p className="text-sm font-medium text-muted-foreground">
                  Pending Check-ins
                </p>

                <h2 className="mt-2 text-4xl font-bold text-amber-600">
                  {
                    getTodayReservations().filter(
                      (r) => r.status === "confirmed"
                    ).length
                  }
                </h2>

              </div>

              <div className="rounded-2xl bg-amber-100 p-4">
                <Clock3 className="h-8 w-8 text-amber-600" />
              </div>

            </CardContent>

          </Card>

          <Card className="rounded-3xl border-0 shadow-lg">

            <CardContent className="flex items-center justify-between p-6">

              <div>

                <p className="text-sm font-medium text-muted-foreground">
                  Guests Seated
                </p>

                <h2 className="mt-2 text-4xl font-bold text-emerald-600">
                  {
                    getTodayReservations().filter(
                      (r) => r.status === "seated"
                    ).length
                  }
                </h2>

              </div>

              <div className="rounded-2xl bg-emerald-100 p-4">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>

            </CardContent>

          </Card>

          <Card className="rounded-3xl border-0 shadow-lg">

            <CardContent className="flex items-center justify-between p-6">

              <div>

                <p className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </p>

                <h2 className="mt-2 text-4xl font-bold text-red-600">
                  {
                    orders.filter(
                      (o) =>
                        o.payment_status === "pending_at_table" ||
                        o.payment_status === "unpaid"
                    ).length
                  }
                </h2>

              </div>

              <div className="rounded-2xl bg-red-100 p-4">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>

            </CardContent>

          </Card>

        </div>

        {/* Reservations */}

        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">

          <CardHeader className="border-b bg-white">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <CardTitle className="text-2xl text-green-800">
                  Today's Reservations
                </CardTitle>

                <CardDescription>
                  Manage reservations and guest arrivals.
                </CardDescription>

              </div>

              <div className="flex flex-wrap gap-2">

                {["all", "confirmed", "seated"].map((status) => (

                  <Button
                    key={status}
                    variant={
                      filterStatus === status
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setFilterStatus(status)
                    }
                    className="capitalize rounded-xl"
                  >
                    {status}
                  </Button>

                ))}

              </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            <TableContainer>

              <Table>

                <ReservationTableHead
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />

                <TableBody>

                  {visibleReservations.length === 0 ? (

                    <TableRow>

                      <TableCell
                        align="center"
                        colSpan={6}
                        sx={{
                          py: 8,
                        }}
                      >
                        No reservations found.
                      </TableCell>

                    </TableRow>

                  ) : (

                    visibleReservations.map(
                      (reservation) => (

                        <TableRow
                          key={reservation.id}
                          hover
                        >
                          <TableCell>
                            {new Date(
                              reservation.date
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>

                          <TableCell>
                            <div>

                              <p className="font-semibold">
                                {reservation.customer
                                  ?.name || "N/A"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {reservation.customer
                                  ?.phone || "-"}
                              </p>

                            </div>
                          </TableCell>

                          <TableCell align="right">
                            {reservation.party_size}
                          </TableCell>

                          <TableCell>
                            {reservation.table
                              ?.table_number || "-"}
                          </TableCell>

                          <TableCell>

                            <Badge
                              className={
                                reservation.status ===
                                "confirmed"
                                  ? "bg-blue-600"
                                  : reservation.status ===
                                    "seated"
                                  ? "bg-emerald-600"
                                  : reservation.status ===
                                    "pending"
                                  ? "bg-amber-500"
                                  : reservation.status ===
                                    "completed"
                                  ? "bg-slate-600"
                                  : "bg-red-600"
                              }
                            >
                              {reservation.status}
                            </Badge>

                          </TableCell>

                          <TableCell align="center">

                            <div className="flex justify-center gap-2">

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openReservationDetail(
                                    reservation
                                  )
                                }
                              >
                                Details
                              </Button>

                              {reservation.status ===
                                "confirmed" && (

                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateReservationStatus(
                                      reservation.id,
                                      "seated"
                                    )
                                  }
                                >
                                  Check In
                                </Button>

                              )}

                            </div>

                          </TableCell>

                        </TableRow>

                      )
                    )

                  )}

                </TableBody>

              </Table>

            </TableContainer>

            <TablePagination
              component="div"
              rowsPerPageOptions={[
                5,
                10,
                20,
              ]}
              count={filteredReservations.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={
                handleChangeRowsPerPage
              }
            />

          </CardContent>

        </Card>

        {/* Active Orders */}
              {/* Active Orders */}

        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">

          <CardHeader className="border-b bg-white">

            <div className="flex items-center justify-between">

              <div>

                <CardTitle className="flex items-center gap-2 text-2xl text-blue-800">
                  <Receipt className="h-6 w-6 text-blue-600" />
                  Active Orders
                </CardTitle>

                <CardDescription>
                  Live orders currently being prepared or served.
                </CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            <TableContainer>

              <Table>

                <TableHead>

                  <TableRow>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Order #
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Table
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Customer
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      Amount
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Actions
                    </TableCell>

                  </TableRow>

                </TableHead>

                <TableBody>

                  {orders.length === 0 ? (

                    <TableRow>

                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 8 }}
                      >
                        No active orders.
                      </TableCell>

                    </TableRow>

                  ) : (

                    orders.map((order) => (

                      <TableRow
                        hover
                        key={order.id}
                      >

                        <TableCell className="font-semibold">
                          #{order.id.slice(-8)}
                        </TableCell>

                        <TableCell>
                          Table {order.table.table_number}
                        </TableCell>

                        <TableCell>
                          {order.customer.name}
                        </TableCell>

                        <TableCell
                          align="right"
                          className="font-semibold"
                        >
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </TableCell>

                        <TableCell>

                          <Badge
                            className={
                              order.order_status ===
                              "ready"
                                ? "bg-emerald-600"
                                : order.order_status ===
                                  "preparing"
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }
                          >
                            {order.order_status}
                          </Badge>

                        </TableCell>

                        <TableCell align="center">

                          {order.order_status ===
                          "ready" ? (

                            <Button
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  "served"
                                )
                              }
                            >
                              Mark Served
                            </Button>

                          ) : order.order_status ===
                            "served" ? (

                            <Badge className="bg-emerald-600">
                              Served
                            </Badge>

                          ) : (

                            <span className="text-muted-foreground">
                              —
                            </span>

                          )}

                        </TableCell>

                      </TableRow>

                    ))

                  )}

                </TableBody>

              </Table>

            </TableContainer>

          </CardContent>

        </Card>

        {/* Pending Payments */}

        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">

          <CardHeader className="border-b bg-white text-red-700 ">

            <div className="flex items-center justify-between">

              <div>

                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6 text-red-7700" />
                  Pending Payments
                </CardTitle>

                <CardDescription>
                  Orders waiting for payment confirmation.
                </CardDescription>

              </div>

            </div>

          </CardHeader>

          <CardContent className="p-0">

            <TableContainer>

              <Table>

                <TableHead>

                  <TableRow>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Order #
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Table
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Customer
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      Amount
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Payment
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Action
                    </TableCell>

                  </TableRow>

                </TableHead>

                <TableBody>

                  {orders.filter(
                    (o) =>
                      o.payment_status ===
                        "pending_at_table" ||
                      o.payment_status ===
                        "unpaid"
                  ).length === 0 ? (

                    <TableRow>

                      <TableCell
                        align="center"
                        colSpan={6}
                        sx={{ py: 8 }}
                      >
                        No pending payments.
                      </TableCell>

                    </TableRow>

                  ) : (

                    orders
                      .filter(
                        (o) =>
                          o.payment_status ===
                            "pending_at_table" ||
                          o.payment_status ===
                            "unpaid"
                      )
                      .map((order) => (

                        <TableRow
                          hover
                          key={order.id}
                        >

                          <TableCell className="font-semibold">
                            #{order.id.slice(-8)}
                          </TableCell>

                          <TableCell>
                            Table{" "}
                            {order.table.table_number}
                          </TableCell>

                          <TableCell>
                            {order.customer.name}
                          </TableCell>

                          <TableCell
                            align="right"
                            className="font-semibold"
                          >
                            ₹
                            {Number(
                              order.total_amount
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell>

                            <Badge className="bg-amber-500">
                              Pending
                            </Badge>

                          </TableCell>

                          <TableCell align="center">

                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() =>
                                updatePaymentStatus(
                                  order.id
                                )
                              }
                            >
                              Mark Paid
                            </Button>

                          </TableCell>

                        </TableRow>

                      ))

                  )}

                </TableBody>

              </Table>

            </TableContainer>

          </CardContent>

        </Card>
              {/* Reservation Details */}

        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title=""
        >
          {selectedReservation && (
            <div className="space-y-6">

              {/* Header */}

              <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <Users className="h-7 w-7" />
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">
                      {selectedReservation.customer?.name ||
                        "Guest"}
                    </h2>

                    <p className="text-blue-100">
                      Reservation Details
                    </p>

                  </div>

                </div>

              </div>

              {/* Customer */}

              <Card className="border-0 shadow-sm">

                <CardHeader>

                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>

                </CardHeader>

                <CardContent className="grid gap-5 md:grid-cols-2">

                  <div>

                    <p className="text-sm text-muted-foreground">
                      Name
                    </p>

                    <p className="font-semibold">
                      {selectedReservation.customer?.name ??
                        "N/A"}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-muted-foreground">
                      Phone
                    </p>

                    <p className="font-semibold">
                      {selectedReservation.customer?.phone ??
                        "N/A"}
                    </p>

                  </div>

                  <div className="md:col-span-2">

                    <p className="text-sm text-muted-foreground">
                      Email
                    </p>

                    <p className="font-semibold break-all">
                      {selectedReservation.customer?.email ??
                        "N/A"}
                    </p>

                  </div>

                </CardContent>

              </Card>

              {/* Reservation */}

              <Card className="border-0 shadow-sm">

                <CardHeader>

                  <CardTitle className="text-lg">
                    Reservation Information
                  </CardTitle>

                </CardHeader>

                <CardContent>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <CalendarDays className="h-5 w-5" />
                        <span className="font-medium">
                          Date
                        </span>
                      </div>

                      <p className="font-semibold">
                        {new Date(
                          selectedReservation.date
                        ).toLocaleDateString()}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <Clock3 className="h-5 w-5" />
                        <span className="font-medium">
                          Time
                        </span>
                      </div>

                      <p className="font-semibold">
                        {new Date(
                          selectedReservation.date
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">
                          Guests
                        </span>
                      </div>

                      <p className="font-semibold">
                        {selectedReservation.party_size}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <ClipboardList className="h-5 w-5" />
                        <span className="font-medium">
                          Table
                        </span>
                      </div>

                      <p className="font-semibold">
                        {selectedReservation.table
                          ? `#${selectedReservation.table.table_number}`
                          : "Not Assigned"}
                      </p>

                    </div>

                  </div>

                </CardContent>

              </Card>

              {/* Requests */}

              {selectedReservation.special_requests && (

                <Card className="border-0 shadow-sm">

                  <CardHeader>

                    <CardTitle className="text-lg">
                      Special Requests
                    </CardTitle>

                  </CardHeader>

                  <CardContent>

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed">
                      {selectedReservation.special_requests}
                    </div>

                  </CardContent>

                </Card>

              )}

              {/* Status */}

              <Card className="border-0 shadow-sm">

                <CardContent className="flex items-center justify-between p-6">

                  <div>

                    <p className="text-sm text-muted-foreground">
                      Current Status
                    </p>

                    <div className="mt-2">

                      <Badge
                        className={
                          selectedReservation.status ===
                          "confirmed"
                            ? "bg-blue-600"
                            : selectedReservation.status ===
                              "seated"
                            ? "bg-emerald-600"
                            : selectedReservation.status ===
                              "completed"
                            ? "bg-slate-600"
                            : selectedReservation.status ===
                              "pending"
                            ? "bg-amber-500"
                            : "bg-red-600"
                        }
                      >
                        {selectedReservation.status.toUpperCase()}
                      </Badge>

                    </div>

                  </div>

                  <div className="flex gap-3">

                    <Button
                      variant="outline"
                      onClick={() =>
                        setIsDetailModalOpen(false)
                      }
                    >
                      Close
                    </Button>

                    {selectedReservation.status ===
                      "confirmed" && (

                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          updateReservationStatus(
                            selectedReservation.id,
                            "seated"
                          )
                        }
                      >
                        Check In
                      </Button>

                    )}

                    {selectedReservation.status ===
                      "seated" && (

                      <Button
                        onClick={() =>
                          updateReservationStatus(
                            selectedReservation.id,
                            "completed"
                          )
                        }
                      >
                        Complete
                      </Button>

                    )}

                  </div>

                </CardContent>

              </Card>

            </div>
          )}
        </Modal>
      </div>
    </div>
  );

}