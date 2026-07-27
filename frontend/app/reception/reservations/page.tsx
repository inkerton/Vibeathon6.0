'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import apiClient from '@/lib/api-client';
import socketClient from '@/lib/socket-client';

// Material React Table
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  MRT_GlobalFilterTextField,
  MRT_ToggleFiltersButton,
} from 'material-react-table';

// MUI
import {
  Box,
  Button,
  Chip,
  IconButton,
  ListItemIcon,
  MenuItem,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Avatar,
  lighten,
} from '@mui/material';

// Icons
import {
  Refresh,
  CheckCircle,
  Cancel,
  Restaurant,
  DoneAll,
  AccountCircle,
  Send,
} from '@mui/icons-material';

// Date Picker
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

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
  status:
    | 'pending'
    | 'confirmed'
    | 'seated'
    | 'cancelled'
    | 'completed';
  created_at: string;
}

const statusColors: Record<
  Reservation['status'],
  'warning' | 'info' | 'success' | 'error' | 'default'
> = {
  pending: 'warning',
  confirmed: 'info',
  seated: 'success',
  cancelled: 'error',
  completed: 'default',
};

const statusActions: Record<
  Reservation['status'],
  Reservation['status'][]
> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['seated', 'cancelled'],
  seated: ['completed'],
  cancelled: [],
  completed: [],
};

function ReceptionReservationsContent() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filterDate) {
        params.append('date', filterDate);
      }

      const response = await apiClient.get(
        `/reservations?${params.toString()}`
      );

      setReservations(response.data.data ?? []);
      setError('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          'Failed to fetch reservations'
      );
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    if (
      user?.role !== 'admin' &&
      user?.role !== 'reception'
    ) {
      return;
    }

    fetchReservations();

    const refreshReservations = () => fetchReservations();

    socketClient.on(
      'reservation:created',
      refreshReservations,
    );
    socketClient.on(
      'reservation:status_updated',
      refreshReservations,
    );
    socketClient.on(
      'reservation:cancelled',
      refreshReservations,
    );

    return () => {
      socketClient.off(
        'reservation:created',
        refreshReservations,
      );
      socketClient.off(
        'reservation:status_updated',
        refreshReservations,
      );
      socketClient.off(
        'reservation:cancelled',
        refreshReservations,
      );
    };
  }, [user, fetchReservations]);

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: string,
  ) => {
    try {
      setUpdatingId(reservationId);

      await apiClient.patch(
        `/reservations/${reservationId}/status`,
        {
          status: newStatus,
        },
      );

      await fetchReservations();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ??
          'Failed to update reservation status',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTodayDate = () =>
    new Date().toISOString().split('T')[0];

  // ===========================================================================
  // Material React Table Columns
  // (Continue in Part 1B)
  // ===========================================================================

  const columns = useMemo<MRT_ColumnDef<Reservation>[]>(
  () => [
    {
      id: 'customer',
      header: 'Customer',
      columns: [
        {
          accessorFn: (row) => row.customer?.name || 'N/A',
          id: 'customerName',
          header: 'Name',
          size: 220,
          Cell: ({ row }) => (
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 600 }}>
                {row.original.customer?.name || 'N/A'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {row.original.customer?.email || 'N/A'}
              </Typography>

              {row.original.customer?.phone && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {row.original.customer.phone}
                </Typography>
              )}
            </Stack>
          ),
        },
      ],
    },

    {
      id: 'tableInfo',
      header: 'Table',
      columns: [
        {
          accessorFn: (row) => row.table?.table_number || 0,
          id: 'tableNumber',
          header: 'Table No.',
          size: 120,
          Cell: ({ row }) => (
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 600 }}>
                Table {row.original.table?.table_number || 'N/A'}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Capacity: {row.original.table?.capacity || 'N/A'}
              </Typography>
            </Stack>
          ),
        },
      ],
    },

    {
      id: 'reservationInfo',
      header: 'Reservation',
      columns: [
        {
          accessorFn: (row) => new Date(row.date),
          id: 'reservationDate',
          header: 'Date',
          sortingFn: 'datetime',
          filterVariant: 'date',
          Cell: ({ row }) => (
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 500 }}>
                {formatDate(row.original.date)}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {formatTime(row.original.date)}
              </Typography>
            </Stack>
          ),
        },

        {
          accessorKey: 'party_size',
          header: 'Party Size',
          size: 120,
          Cell: ({ row }) => (
            <Stack spacing={0.25}>
              <Typography>
                {row.original.party_size}{' '}
                {row.original.party_size === 1
                  ? 'Person'
                  : 'People'}
              </Typography>

              {row.original.special_request && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {row.original.special_request}
                </Typography>
              )}
            </Stack>
          ),
        },

        {
          accessorKey: 'status',
          header: 'Status',
          filterVariant: 'multi-select',
          size: 140,
          Cell: ({ cell }) => (
            <Chip
              size="small"
              label={
                String(cell.getValue())
                  .charAt(0)
                  .toUpperCase() +
                String(cell.getValue()).slice(1)
              }
              color={
                statusColors[
                  cell.getValue<Reservation['status']>()
                ]
              }
            />
          ),
        },
      ],
    },
        {
      id: 'actions',
      header: 'Actions',
      size: 260,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => {
        const reservation = row.original;
        const actions = statusActions[reservation.status];

        if (actions.length === 0) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              No Actions
            </Typography>
          );
        }

        return (
          <Stack
            direction="column"
            spacing={1}
            sx={{ minWidth: 180 }}
          >
            {actions.map((action) => {
              let color:
                | 'primary'
                | 'success'
                | 'error'
                | 'secondary'
                | 'inherit' = 'primary';

              let icon = null;

              switch (action) {
                case 'confirmed':
                  color = 'primary';
                  icon = <CheckCircle fontSize="small" />;
                  break;

                case 'seated':
                  color = 'success';
                  icon = <Restaurant fontSize="small" />;
                  break;

                case 'completed':
                  color = 'secondary';
                  icon = <DoneAll fontSize="small" />;
                  break;

                case 'cancelled':
                  color = 'error';
                  icon = <Cancel fontSize="small" />;
                  break;
              }

              return (
                <Button
                  key={action}
                  variant="contained"
                  color={color}
                  size="small"
                  startIcon={icon}
                  disabled={updatingId === reservation.id}
                  onClick={() =>
                    updateReservationStatus(
                      reservation.id,
                      action,
                    )
                  }
                >
                  {updatingId === reservation.id
                    ? 'Updating...'
                    : `Mark ${
                        action.charAt(0).toUpperCase() +
                        action.slice(1)
                      }`}
                </Button>
              );
            })}
          </Stack>
        );
      },
    },
  ],
  [updatingId],
);

const table = useMaterialReactTable({
  columns,
  data: reservations,

  state: {
    isLoading: loading,
    showProgressBars: loading,
  },

  enableColumnFilterModes: true,
  enableColumnOrdering: true,
  enableColumnPinning: true,
  enableGrouping: true,
  enableFacetedValues: true,
  enableRowSelection: true,
  enableRowActions: true,
  enableStickyHeader: true,
  enableDensityToggle: false,
  enableFullScreenToggle: true,

  initialState: {
    showColumnFilters: true,
    showGlobalFilter: true,
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    columnPinning: {
      left: ['mrt-row-select'],
      right: ['mrt-row-actions'],
    },
  },

  paginationDisplayMode: 'pages',
  positionToolbarAlertBanner: 'bottom',

  muiSearchTextFieldProps: {
    placeholder: 'Search reservations...',
    size: 'small',
    variant: 'outlined',
  },

  muiPaginationProps: {
    color: 'primary',
    rowsPerPageOptions: [10, 20, 50],
    shape: 'rounded',
    variant: 'outlined',
  },

  muiTablePaperProps: {
    elevation: 0,
    sx: {
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
    },
  },

  muiTableContainerProps: {
    sx: {
      maxHeight: '70vh',
    },
  },

  muiTableBodyRowProps: ({ row }) => ({
    hover: true,
    sx: {
      transition: 'all 0.2s ease',

      '&:hover': {
        backgroundColor: 'action.hover',
      },

      ...(row.original.status === 'cancelled' && {
        opacity: 0.65,
      }),
    },
  }),

  muiToolbarAlertBannerProps: error
    ? {
        color: 'error',
        children: error,
      }
    : undefined,

      renderTopToolbar: ({ table }) => {
    const selectedRows = table.getSelectedRowModel().flatRows;

    const handleBulkStatusUpdate = async (
      status: Reservation['status'],
    ) => {
      try {
        await Promise.all(
          selectedRows.map((row) =>
            updateReservationStatus(row.original.id, status),
          ),
        );
      } catch (error) {
        console.error(error);
      }
    };

    return (
      <Box
        sx={(theme) => ({
          backgroundColor: lighten(
            theme.palette.background.default,
            0.04,
          ),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          p: 2,
        })}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <MRT_GlobalFilterTextField table={table} />
          <MRT_ToggleFiltersButton table={table} />

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchReservations}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            onClick={() => setFilterDate(getTodayDate())}
          >
            Today
          </Button>

          <Button
            variant="text"
            onClick={() => setFilterDate('')}
          >
            Clear Date
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={!table.getIsSomeRowsSelected()}
            onClick={() =>
              handleBulkStatusUpdate('confirmed')
            }
          >
            Confirm
          </Button>

          <Button
            color="success"
            variant="contained"
            startIcon={<Restaurant />}
            disabled={!table.getIsSomeRowsSelected()}
            onClick={() =>
              handleBulkStatusUpdate('seated')
            }
          >
            Seat
          </Button>

          <Button
            color="secondary"
            variant="contained"
            startIcon={<DoneAll />}
            disabled={!table.getIsSomeRowsSelected()}
            onClick={() =>
              handleBulkStatusUpdate('completed')
            }
          >
            Complete
          </Button>

          <Button
            color="error"
            variant="contained"
            startIcon={<Cancel />}
            disabled={!table.getIsSomeRowsSelected()}
            onClick={() =>
              handleBulkStatusUpdate('cancelled')
            }
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    );
  },

  renderDetailPanel: ({ row }) => (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h6">
        Reservation Details
      </Typography>

      <Typography>
        <strong>Customer:</strong>{' '}
        {row.original.customer?.name || 'N/A'}
      </Typography>

      <Typography>
        <strong>Email:</strong>{' '}
        {row.original.customer?.email || 'N/A'}
      </Typography>

      <Typography>
        <strong>Phone:</strong>{' '}
        {row.original.customer?.phone ?? 'N/A'}
      </Typography>

      <Typography>
        <strong>Table:</strong>{' '}
        {row.original.table?.table_number || 'N/A'}
      </Typography>

      <Typography>
        <strong>Capacity:</strong>{' '}
        {row.original.table?.capacity || 'N/A'}
      </Typography>

      <Typography>
        <strong>Date:</strong>{' '}
        {formatDate(row.original.date)}
      </Typography>

      <Typography>
        <strong>Time:</strong>{' '}
        {formatTime(row.original.date)}
      </Typography>

      <Typography>
        <strong>Party Size:</strong>{' '}
        {row.original.party_size}
      </Typography>

      <Typography>
        <strong>Special Request:</strong>{' '}
        {row.original.special_request || 'None'}
      </Typography>
    </Box>
  ),

  renderRowActionMenuItems: ({ row, closeMenu }) => [
    <MenuItem
      key="view"
      onClick={() => {
        console.log(row.original);
        closeMenu();
      }}
    >
      <ListItemIcon>
        <AccountCircle />
      </ListItemIcon>
      View Reservation
    </MenuItem>,

    <MenuItem
      key="email"
      onClick={() => {
        if (row.original.customer?.email) {
          window.location.href = `mailto:${row.original.customer.email}`;
        }
        closeMenu();
      }}
      disabled={!row.original.customer?.email}
    >
      <ListItemIcon>
        <Send />
      </ListItemIcon>
      Email Customer
    </MenuItem>,
  ],
});


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <MaterialReactTable table={table} />
      </Paper>
    </LocalizationProvider>
  );
}

export default function ReceptionReservationsPage() {
  return <ReceptionReservationsContent />;
}
