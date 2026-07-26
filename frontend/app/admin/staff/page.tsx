"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Toast } from "@/components/Toast";
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
import { visuallyHidden } from "@mui/utils";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateStaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "kitchen" | "reception" | "inventory" | "admin";
}

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof Staff | "actions";
  label: string;
}

const headCells: readonly HeadCell[] = [
  {
    id: "name",
    label: "Name",
  },
  {
    id: "email",
    label: "Email",
  },
  {
    id: "phone",
    label: "Phone",
  },
  {
    id: "role",
    label: "Role",
  },
  {
    id: "isActive",
    label: "Status",
  },
  {
    id: "createdAt",
    label: "Created",
  },
  {
    id: "actions",
    label: "Actions",
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
  a: { [key in Key]: string | boolean },
  b: { [key in Key]: string | boolean },
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface EnhancedTableHeadProps {
  order: Order;
  orderBy: keyof Staff;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Staff,
  ) => void;
}

function EnhancedTableHead({
  order,
  orderBy,
  onRequestSort,
}: EnhancedTableHeadProps) {
  const createSortHandler =
    (property: keyof Staff) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id}>
            {headCell.id === "actions" ? (
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}

                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
const [roleFilter, setRoleFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreateStaffForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "kitchen",
  });

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // MUI Table State
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof Staff>("name");

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchStaff();
  }, []);

  // const fetchStaff = async () => {
  //   try {
  //     setLoading(true);
  //     setError("");

  //     const response = await apiClient.get(
  //       "/auth/staff"
  //     );

  //     setStaff(response.data || []);
  //   } catch (err: any) {
  //     setError(
  //       err.message || "Failed to load staff"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchStaff = async () => {
    setLoading(true);

    setTimeout(() => {
      setStaff([
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "+91 9876543210",
          role: "admin",
          isActive: true,
          createdAt: "2025-01-15T10:30:00Z",
        },
        {
          id: "2",
          name: "Sarah Wilson",
          email: "sarah@example.com",
          phone: "+91 9876543211",
          role: "kitchen",
          isActive: true,
          createdAt: "2025-02-01T09:15:00Z",
        },
        {
          id: "3",
          name: "Rahul Sharma",
          email: "rahul@example.com",
          phone: "+91 9876543212",
          role: "reception",
          isActive: false,
          createdAt: "2025-02-20T14:45:00Z",
        },
        {
          id: "4",
          name: "Emily Davis",
          email: "emily@example.com",
          phone: "+91 9876543213",
          role: "inventory",
          isActive: true,
          createdAt: "2025-03-05T12:00:00Z",
        },
        {
          id: "5",
          name: "Michael Brown",
          email: "michael@example.com",
          phone: "+91 9876543214",
          role: "kitchen",
          isActive: true,
          createdAt: "2025-03-18T08:20:00Z",
        },
        {
          id: "6",
          name: "Priya Singh",
          email: "priya@example.com",
          phone: "+91 9876543215",
          role: "reception",
          isActive: false,
          createdAt: "2025-04-01T16:10:00Z",
        },
        {
          id: "7",
          name: "David Lee",
          email: "david@example.com",
          phone: "+91 9876543216",
          role: "inventory",
          isActive: true,
          createdAt: "2025-04-15T11:00:00Z",
        },
        {
          id: "8",
          name: "Aisha Khan",
          email: "aisha@example.com",
          phone: "+91 9876543217",
          role: "admin",
          isActive: true,
          createdAt: "2025-05-10T09:45:00Z",
        },
      ]);

      setLoading(false);
    }, 500);
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Staff,
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

 const filteredStaff = staff.filter((member) => {
  const matchesSearch =
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesRole =
    roleFilter === "all" || member.role === roleFilter;

  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "active" && member.isActive) ||
    (statusFilter === "inactive" && !member.isActive);

  return matchesSearch && matchesRole && matchesStatus;
});

const visibleRows = [...filteredStaff]
  .sort(getComparator(order, orderBy))
  .slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      await apiClient.post("/auth/register", {
        ...formData,
        isStaff: true,
      });

      setToast({
        show: true,
        message: "Staff member created successfully",
        type: "success",
      });

      setIsModalOpen(false);

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "kitchen",
      });

      fetchStaff();
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || "Failed to create staff",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (
    staffId: string,
    currentStatus: boolean,
  ) => {
    try {
      await apiClient.patch(`/auth/staff/${staffId}/status`, {
        isActive: !currentStatus,
      });

      setToast({
        show: true,
        message: `Staff ${
          !currentStatus ? "activated" : "deactivated"
        } successfully`,
        type: "success",
      });

      fetchStaff();
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || "Failed to update staff status",
        type: "error",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "success" | "warning" | "danger" | "info"> =
      {
        admin: "danger",
        kitchen: "warning",
        reception: "info",
        inventory: "success",
      };

    return variants[role] || "gray";
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() =>
          setToast({
            ...toast,
            show: false,
          })
        }
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staff Management</h2>

        <Button onClick={() => setIsModalOpen(true)}>Add Staff Member</Button>
      </div>

      {error && <ErrorMessage message={error} />}
        <Box
  sx={{
    display: "grid",
    gridTemplateColumns: "6fr 2fr 2fr",
    gap: 2,
    mb: 3,
    alignItems: "center",
  }}
>
  {/* Search */}
  <TextField
    fullWidth
    placeholder="Search by name or email..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setPage(0);
    }}
    size="small"
  />

  {/* Role */}
  <FormControl fullWidth size="small">
    <InputLabel>Role</InputLabel>
    <Select
      value={roleFilter}
      label="Role"
      onChange={(e) => {
        setRoleFilter(e.target.value);
        setPage(0);
      }}
    >
      <MenuItem value="all">All Roles</MenuItem>
      <MenuItem value="admin">Admin</MenuItem>
      <MenuItem value="kitchen">Kitchen</MenuItem>
      <MenuItem value="reception">Reception</MenuItem>
      <MenuItem value="inventory">Inventory</MenuItem>
    </Select>
  </FormControl>

  {/* Status */}
  <FormControl fullWidth size="small">
    <InputLabel>Status</InputLabel>
    <Select
      value={statusFilter}
      label="Status"
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(0);
      }}
    >
      <MenuItem value="all">All Status</MenuItem>
      <MenuItem value="active">Active</MenuItem>
      <MenuItem value="inactive">Inactive</MenuItem>
    </Select>
  </FormControl>
</Box>

      <Card>
        <Paper elevation={0}>
          <TableContainer>
            <Table>
              <EnhancedTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
              />

              <TableBody>
                {visibleRows.map((member) => (
                  <TableRow hover key={member.id}>
                    <TableCell>{member.name}</TableCell>

                    <TableCell>{member.email}</TableCell>

                    <TableCell>{member.phone}</TableCell>

                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={member.isActive ? "success" : "gray"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant={member.isActive ? "danger" : "success"}
                        onClick={() =>
                          handleToggleActive(member.id, member.isActive)
                        }
                      >
                        {member.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {visibleRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No staff members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredStaff.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Card>

      {/* Keep your existing Modal exactly as it was */}
      {/* Don't change the modal code */}
    </div>
  );
}
