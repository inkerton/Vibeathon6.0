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
  role: 'kitchen' | 'reception' | 'inventory' | 'admin';
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateStaffForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'kitchen',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/staff');
      
      // Handle consistent response structure - data is array directly
      const staffData = Array.isArray(response.data) ? response.data : [];
      setStaff(staffData.map(transformStaffResponse));
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

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
      setFormData({ name: '', email: '', phone: '', password: '', role: 'kitchen' });
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

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
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
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      admin: 'danger',
      kitchen: 'warning',
      reception: 'info',
      inventory: 'success',
    };
    return variants[role] || 'gray';
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
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff Member
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No staff members found. Create your first staff member.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={member.isActive ? 'success' : 'gray'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={member.isActive ? 'danger' : 'success'}
                        onClick={() => handleToggleActive(member.id, member.isActive)}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
