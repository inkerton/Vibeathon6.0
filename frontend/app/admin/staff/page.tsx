"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// Backend response type
interface StaffResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'reception' | 'kitchen' | 'inventory' | 'admin';
  is_active: boolean;
  auth_provider: string;
  created_at: string;
  updated_at: string;
}

// Frontend display type
interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Transform backend response to frontend format
function transformStaffResponse(data: StaffResponse): Staff {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: data.role,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
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
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/staff');
      
      // Backend returns { status: 'success', data: [...] }
      // Extract the actual data array from response.data.data
      const staffData = response.data?.data || [];
      
      if (Array.isArray(staffData)) {
        setStaff(staffData.map(transformStaffResponse));
      } else {
        console.error('Staff data is not an array:', staffData);
        setStaff([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
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
      const response = await apiClient.post('/staff', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });
      
      // Response.data now contains the staff object directly
      setToast({ 
        show: true, 
        message: 'Staff member created successfully', 
        type: 'success' 
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
      console.error('Failed to create staff:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Request payload:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      });
      setToast({ 
        show: true, 
        message: err.response?.data?.message || err.message || 'Failed to create staff', 
        type: 'error' 
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
      const response = await apiClient.patch(`/staff/${staffId}/status`);
      
      // Response.data now contains the staff object directly
      setToast({ 
        show: true, 
        message: `Staff ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
        type: 'success' 
      });

      fetchStaff();
    } catch (err: any) {
      console.error('Failed to toggle staff status:', err);
      setToast({ 
        show: true, 
        message: err.response?.data?.message || err.message || 'Failed to update staff status', 
        type: 'error' 
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

    return variants[role] || "secondary";
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
                      <Badge variant={member.isActive ? 'success' : 'gray'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={member.isActive ? 'danger' : 'success'}
                        onClick={() => handleToggleActive(member.id, member.isActive)}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Create Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Staff Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStaff} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
            />
            {formData.password && formData.password.length < 8 && (
              <p className="text-sm text-red-600 mt-1">
                Password must be at least 8 characters (currently {formData.password.length})
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              required
            >
              <option value="kitchen">Kitchen</option>
              <option value="reception">Reception</option>
              <option value="inventory">Inventory</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}