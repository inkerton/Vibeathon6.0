'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  MRT_GlobalFilterTextField,
  MRT_ToggleFiltersButton,
} from 'material-react-table';

import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';

import {
  RefreshCw,
  Package,
  PackageCheck,
  PackageX,
  AlertTriangle,
  Plus,
  Pencil,
  MoreVertical,
  Warehouse,
  Boxes,
  TrendingDown,
  History,
} from 'lucide-react';


import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/Badge';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { Progress } from '@/components/ui/progress';

import { Separator } from '@/components/ui/separator';

import { apiClient } from '@/lib/api-client';
import { Toast } from '@/components/Toast';

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

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) return 'out';
    if (item.availableQuantity <= item.reorderLevel) return 'low';
    return 'good';
  };

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/inventory');
      
      // Backend returns { status: 'success', data: [...] }
      const inventoryData = response.data?.data || [];
      
      // Transform backend format to frontend format
      const transformedInventory = inventoryData.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        totalQuantity: item.total_stock || 0,
        reservedQuantity: item.reserved_stock || 0,
        availableQuantity: (item.total_stock || 0) - (item.reserved_stock || 0),
        reorderLevel: item.reorder_threshold || 0,
        reorderQuantity: item.reorder_quantity || 0,
        lastRestockedAt: item.last_restocked_at || null,
      }));
      
      setInventory(transformedInventory);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const columns = useMemo<MRT_ColumnDef<InventoryItem>[]>(
  () => [
    {
      accessorKey: 'name',
      header: 'Item',
      size: 220,
      Cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Package className="h-5 w-5 text-primary" />
            </div>

            <div>
              <div className="font-semibold">
                {item.name}
              </div>

              <div className="text-xs text-muted-foreground">
                {item.unit}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: 'totalQuantity',
      header: 'Total',
      size: 90,
      Cell: ({ cell }) => (
        <span className="font-semibold">
          {cell.getValue<number>()}
        </span>
      ),
    },

    {
      accessorKey: 'reservedQuantity',
      header: 'Reserved',
      size: 100,
      Cell: ({ cell }) => (
        <Badge
          variant="warning"
          className="bg-orange-100 text-orange-700"
        >
          {cell.getValue<number>()}
        </Badge>
      ),
    },

    {
      accessorKey: 'availableQuantity',
      header: 'Available',
      size: 180,
      Cell: ({ row }) => {
        const item = row.original;

        const percent =
          item.totalQuantity === 0
            ? 0
            : (item.availableQuantity /
                item.totalQuantity) *
              100;

        return (
          <div className="space-y-2">
            <div className="font-semibold">
              {item.availableQuantity}{' '}
              {item.unit}
            </div>

            <Progress value={percent} />
          </div>
        );
      },
    },

    {
      accessorKey: 'reorderLevel',
      header: 'Reorder',
      size: 90,
      Cell: ({ row }) => (
        <span>
          {row.original.reorderLevel}{' '}
          {row.original.unit}
        </span>
      ),
    },

    {
      id: 'status',
      header: 'Status',
      size: 140,
      Cell: ({ row }) => {
        const item = row.original;

        const status =
          getStockStatus(item);

        if (status === 'good') {
          return (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <PackageCheck className="mr-1 h-3 w-3" />
              In Stock
            </Badge>
          );
        }

        if (status === 'low') {
          return (
            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Low Stock
            </Badge>
          );
        }

        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <PackageX className="mr-1 h-3 w-3" />
            Out of Stock
          </Badge>
        );
      },
    },

    {
      accessorKey: 'lastRestockedAt',
      header: 'Last Restocked',
      size: 150,
      Cell: ({ row }) =>
        row.original.lastRestockedAt
          ? new Date(
              row.original.lastRestockedAt,
            ).toLocaleDateString()
          : (
            <span className="text-muted-foreground">
              Never
            </span>
          ),
    },

    {
      id: 'actions',
      header: '',
      size: 110,
      enableSorting: false,
      Cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center gap-2">
            <Tooltip title="Restock">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setSelectedItem(item);

                  setRestockForm({
                    quantity:
                      item.reorderQuantity.toString(),
                    notes: '',
                  });

                  setIsRestockModalOpen(
                    true,
                  );
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip>

            <Tooltip title="Adjust Stock">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setSelectedItem(item);

                  setAdjustForm({
                    quantity: '',
                    reason: '',
                    type: 'add',
                  });

                  setIsAdjustModalOpen(
                    true,
                  );
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        );
      },
    },
  ],
  [getStockStatus, setSelectedItem, setRestockForm, setIsRestockModalOpen, setAdjustForm, setIsAdjustModalOpen],
);

const filteredInventory = inventory.filter(item => {
  if (filter === 'low') return item.availableQuantity <= item.reorderLevel && item.availableQuantity > 0;
  if (filter === 'out') return item.availableQuantity === 0;
  return true;
});

const stats = useMemo(() => ({
  total: inventory.length,
  low: inventory.filter(item => item.availableQuantity <= item.reorderLevel && item.availableQuantity > 0).length,
  out: inventory.filter(item => item.availableQuantity === 0).length,
  inStock: inventory.filter(item => item.availableQuantity > item.reorderLevel).length,
  reserved: inventory.reduce((sum, item) => sum + item.reservedQuantity, 0),
}), [inventory]);

const table = useMaterialReactTable({
  columns,
  data: filteredInventory,

  state: {
    isLoading: loading,
    showAlertBanner: !!error,
    showProgressBars: loading,
  },

  enableRowSelection: true,
  enableColumnOrdering: true,
  enableColumnResizing: true,
  enableStickyHeader: true,
  enableDensityToggle: true,
  enableFullScreenToggle: true,
  enableHiding: true,
  enableColumnFilters: true,
  enableGlobalFilter: true,
  enableSorting: true,
  enablePagination: true,
  enableTopToolbar: true,
  enableBottomToolbar: true,
  enableRowActions: false,
  enableRowNumbers: false,

  initialState: {
    density: 'comfortable',

    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },

    sorting: [
      {
        id: 'name',
        desc: false,
      },
    ],

    showGlobalFilter: true,

    columnPinning: {
      left: ['mrt-row-select', 'name'],
      right: ['actions'],
    },
  },
    muiTableContainerProps: {
    sx: {
      maxHeight: '72vh',
      borderRadius: '0.75rem',
    },
  },

  muiTablePaperProps: {
    elevation: 0,
    sx: {
      borderRadius: '1rem',
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
    },
  },

  muiTableHeadCellProps: {
    sx: {
      fontWeight: 700,
      fontSize: '0.875rem',
      bgcolor: 'background.default',
      whiteSpace: 'nowrap',
    },
  },

  muiTableBodyCellProps: {
    sx: {
      py: 1.5,
    },
  },

  muiTableBodyRowProps: ({ row }) => {
    const status = getStockStatus(row.original);

    return {
      hover: true,
      sx: {
        transition: 'all .2s ease',

        '&:hover': {
          backgroundColor: 'action.hover',
        },

        ...(status === 'good' && {
          borderLeft: '4px solid',
          borderLeftColor: '#22c55e',
        }),

        ...(status === 'low' && {
          borderLeft: '4px solid',
          borderLeftColor: '#eab308',
        }),

        ...(status === 'out' && {
          borderLeft: '4px solid',
          borderLeftColor: '#ef4444',
        }),
      },
    };
  },

  muiPaginationProps: {
    color: 'primary',
    shape: 'rounded',
    rowsPerPageOptions: [10, 20, 50, 100],
    variant: 'outlined',
  },
    renderTopToolbar: ({ table }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        p: 2,
        flexWrap: 'wrap',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">

        <MRT_GlobalFilterTextField table={table} />

        <MRT_ToggleFiltersButton table={table} />

        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          <Boxes className="mr-2 h-4 w-4" />
          All ({inventory.length})
        </Button>

        <Button
          variant={filter === 'low' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('low')}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Low Stock ({stats.low})
        </Button>

        <Button
          variant={filter === 'out' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('out')}
        >
          <PackageX className="mr-2 h-4 w-4" />
          Out of Stock ({stats.out})
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip title="Refresh Inventory">
          <IconButton
            color="primary"
            onClick={fetchInventory}
          >
            <RefreshCw size={20} />
          </IconButton>
        </Tooltip>
      </div>
    </Box>
  ),
});

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
        quantity: quantity,
        reason: adjustForm.reason,
        is_increase: adjustForm.type === 'add',
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

if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />

        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Loading Inventory
          </h2>

          <p className="text-muted-foreground">
            Fetching inventory items...
          </p>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.show}
      onClose={() => setToast((prev) => ({ ...prev, show: false }))}
    />
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

      {/* Hero */}

      <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white shadow-xl">
        <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-4 flex items-center gap-3">

              <div className="rounded-xl bg-white/20 p-3">
                <Warehouse className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  Inventory Management
                </h1>

                <p className="mt-1 text-emerald-100">
                  Monitor inventory, replenish stock and manage warehouse inventory.
                </p>
              </div>

            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = '/inventory/transactions'}
              className="gap-2"
            >
              <History className="h-5 w-5" />
              View Transactions
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={fetchInventory}
              className="gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh Inventory
            </Button>
          </div>

        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />

            <p className="text-red-700">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

        <Card>
          <CardContent className="flex items-center justify-between py-6">

            <div>
              <p className="text-sm text-muted-foreground">
                Total Items
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {stats.total}
              </h2>
            </div>

            <Package className="h-10 w-10 text-primary" />

          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-6">

            <div>
              <p className="text-sm text-muted-foreground">
                Low Stock
              </p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                {stats.low}
              </h2>
            </div>

            <TrendingDown className="h-10 w-10 text-yellow-600" />

          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-6">

            <div>
              <p className="text-sm text-muted-foreground">
                Out of Stock
              </p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {stats.out}
              </h2>
            </div>

            <PackageX className="h-10 w-10 text-red-600" />

          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-6">

            <div>
              <p className="text-sm text-muted-foreground">
                Reserved Stock
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {stats.reserved}
              </h2>
            </div>

            <Boxes className="h-10 w-10 text-blue-600" />

          </CardContent>
        </Card>

      </div>

      {/* Inventory Table */}

      <Card className="overflow-hidden border-0 shadow-xl">
        <CardHeader>

          <CardTitle>
            Inventory Overview
          </CardTitle>

          <CardDescription>
            Search, sort, filter and manage inventory items.
          </CardDescription>

        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <MaterialReactTable table={table} />
        </CardContent>

      </Card>
            {/* Restock Dialog */}

      <Dialog
        open={isRestockModalOpen}
        onOpenChange={setIsRestockModalOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Restock Inventory
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleRestock}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label>Inventory Item</Label>

              <Input
                value={selectedItem?.name ?? ''}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>
                Quantity to Add
              </Label>

              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={restockForm.quantity}
                onChange={(e) =>
                  setRestockForm({
                    ...restockForm,
                    quantity: e.target.value,
                  })
                }
              />

              <p className="text-xs text-muted-foreground">
                Suggested reorder quantity:{' '}
                {selectedItem?.reorderQuantity}{' '}
                {selectedItem?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>

              <Textarea
                rows={4}
                value={restockForm.notes}
                placeholder="Supplier, invoice, remarks..."
                onChange={(e) =>
                  setRestockForm({
                    ...restockForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
          setIsRestockModalOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Restocking...'
                  : 'Restock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}

      <Dialog
        open={isAdjustModalOpen}
        onOpenChange={setIsAdjustModalOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Adjust Stock
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleAdjust}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label>Inventory Item</Label>

              <Input
                value={selectedItem?.name ?? ''}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>
                Adjustment Type
              </Label>

              <Tabs
                value={adjustForm.type}
                onValueChange={(value) =>
                  setAdjustForm({
                    ...adjustForm,
                    type: value as
                      | 'add'
                      | 'remove',
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add">
                    Add Stock
                  </TabsTrigger>

                  <TabsTrigger value="remove">
                    Remove Stock
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>

              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustForm.quantity}
                onChange={(e) =>
                  setAdjustForm({
                    ...adjustForm,
                    quantity: e.target.value,
                  })
                }
              />

              <p className="text-xs text-muted-foreground">
                Available:
                {' '}
                {selectedItem?.availableQuantity}
                {' '}
                {selectedItem?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>

              <Textarea
                rows={4}
                value={adjustForm.reason}
                placeholder="Reason for stock adjustment..."
                onChange={(e) =>
                  setAdjustForm({
                    ...adjustForm,
                    reason: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
          setIsAdjustModalOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Updating...'
                  : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
  </div>
);
}