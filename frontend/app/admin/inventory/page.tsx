"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { apiClient } from "@/lib/api-client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
}

interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof InventoryItem | "status";
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "name",
    label: "Item Name",
    numeric: false,
  },
  {
    id: "unit",
    label: "Unit",
    numeric: false,
  },
  {
    id: "totalQuantity",
    label: "Total",
    numeric: true,
  },
  {
    id: "reservedQuantity",
    label: "Reserved",
    numeric: true,
  },
  {
    id: "availableQuantity",
    label: "Available",
    numeric: true,
  },
  {
    id: "reorderLevel",
    label: "Reorder Level",
    numeric: true,
  },
  {
    id: "status",
    label: "Status",
    numeric: false,
  },
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }

  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface EnhancedTableHeadProps {
  order: Order;
  orderBy: keyof InventoryItem;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof InventoryItem,
  ) => void;
}

function EnhancedTableHead({
  order,
  orderBy,
  onRequestSort,
}: EnhancedTableHeadProps) {
  const createSortHandler =
    (property: keyof InventoryItem) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.id === "status" ? (
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id as keyof InventoryItem)}
              >
                {headCell.label}

                {orderBy === headCell.id && (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                )}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar() {
  return (
    <Toolbar
      sx={{
        px: 2,
      }}
    >
      <Typography variant="h6" component="div" sx={{ flex: 1 }}>
        Current Stock Levels
      </Typography>
    </Toolbar>
  );
}

export default function AdminInventoryOverview() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof InventoryItem>("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError("");

      const [inventoryRes, lowStockRes] = await Promise.all([
        apiClient.get("/inventory"),
        apiClient.get("/inventory/low-stock"),
      ]);

      const items = Array.isArray(inventoryRes.data?.data)
        ? inventoryRes.data.data
        : Array.isArray(inventoryRes.data)
          ? inventoryRes.data
          : [];

      const lowStock = Array.isArray(lowStockRes.data?.data)
        ? lowStockRes.data.data
        : Array.isArray(lowStockRes.data)
          ? lowStockRes.data
          : [];

      const transformedItems: InventoryItem[] = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        totalQuantity: item.total_stock || 0,
        reservedQuantity: item.reserved_stock || 0,
        availableQuantity: (item.total_stock || 0) - (item.reserved_stock || 0),
        reorderLevel: item.reorder_threshold || 0,
        reorderQuantity: item.reorder_quantity || 0,
      }));

      setInventory(transformedItems);

      const outOfStock = transformedItems.filter(
        (item) => item.availableQuantity === 0,
      );

      setSummary({
        totalItems: transformedItems.length,
        lowStockItems: lowStock.length,
        outOfStockItems: outOfStock.length,
        totalValue: 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof InventoryItem,
  ) => {
    const isAsc = orderBy === property && order === "asc";

    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(
    () =>
      [...inventory]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [inventory, order, orderBy, page, rowsPerPage],
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return {
        label: "Out of Stock",
        variant: "danger" as const,
      };
    }

    if (item.availableQuantity <= item.reorderLevel) {
      return {
        label: "Low Stock",
        variant: "warning" as const,
      };
    }

    return {
      label: "In Stock",
      variant: "success" as const,
    };
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mt-10">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>

        <Link href="/inventory">
          <Button>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Full Inventory Management
          </Button>
        </Link>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary.totalItems}
                </p>
              </div>

              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Low Stock Items
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {summary.lowStockItems}
                </p>
              </div>

              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Out of Stock
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {summary.outOfStockItems}
                </p>
              </div>

              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Stock</p>

                <p className="text-3xl font-bold text-green-600 mt-2">
                  {summary.totalItems - summary.outOfStockItems}
                </p>
              </div>

              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card>
        <Box sx={{ width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <EnhancedTableToolbar />

            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <EnhancedTableHead
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />

                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        No inventory items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((item) => {
                      const status = getStockStatus(item);

                      return (
                        <TableRow hover key={item.id}>
                          <TableCell>
                            <strong>{item.name}</strong>
                          </TableCell>

                          <TableCell>{item.unit}</TableCell>

                          <TableCell align="right">
                            {item.totalQuantity}
                          </TableCell>

                          <TableCell align="right" sx={{ color: "#ea580c" }}>
                            {item.reservedQuantity}
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {item.availableQuantity}
                          </TableCell>

                          <TableCell align="right">
                            {item.reorderLevel}
                          </TableCell>

                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 25]}
              count={inventory.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </Card>
      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/inventory">
            <button className="w-full btn btn-primary">
              Manage Full Inventory
            </button>
          </Link>

          <Link href="/inventory/transactions">
            <button className="w-full btn btn-secondary">
              View Transactions
            </button>
          </Link>

          <Link href="/admin/recipes">
            <button className="w-full btn btn-secondary">Manage Recipes</button>
          </Link>
        </div>
      </Card>
    </div>
  );
}