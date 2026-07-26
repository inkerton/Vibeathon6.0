'use client';

import { useMemo, useCallback, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
}

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  preparationTime: string;
}

const CATEGORIES = ['appetizer', 'main_course', 'dessert', 'beverage', 'special'];

// Query key
const MENU_QUERY_KEY = ['menuItems'];

// API functions
const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const response = await apiClient.get('/menu?includeUnavailable=true');
  
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  } else if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

const createMenuItem = async (data: any): Promise<MenuItem> => {
  const response = await apiClient.post('/menu', data);
  return response.data?.data || response.data;
};

const updateMenuItem = async ({ id, data }: { id: string; data: any }): Promise<MenuItem> => {
  const response = await apiClient.patch(`/menu/${id}`, data);
  return response.data?.data || response.data;
};

const deleteMenuItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/menu/${id}`);
};

const toggleAvailability = async ({ id, isAvailable }: { id: string; isAvailable: boolean }): Promise<MenuItem> => {
  const response = await apiClient.patch(`/menu/${id}/availability`, { isAvailable });
  return response.data?.data || response.data;
};

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    category: 'main_course',
    imageUrl: '',
    preparationTime: '15',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Fetch menu items with React Query
  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: MENU_QUERY_KEY,
    queryFn: fetchMenuItems,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: MENU_QUERY_KEY });
      
      // Snapshot previous value
      const previousItems = queryClient.getQueryData<MenuItem[]>(MENU_QUERY_KEY);
      
      // Optimistically update with temporary item
      const tempItem: MenuItem = {
        id: `temp-${Date.now()}`,
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        category: newItem.category,
        imageUrl: newItem.imageUrl,
        isAvailable: true,
        preparationTime: newItem.preparationTime,
        createdAt: new Date().toISOString()
      };
      
      queryClient.setQueryData<MenuItem[]>(MENU_QUERY_KEY, (old = []) => [...old, tempItem]);
      
      return { previousItems };
    },
    onError: (err: any, newItem, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(MENU_QUERY_KEY, context.previousItems);
      }
      setToast({ show: true, message: err.message || 'Failed to create menu item', type: 'error' });
    },
    onSuccess: (data) => {
      setToast({ show: true, message: 'Menu item created successfully', type: 'success' });
      setIsModalOpen(false);
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateMenuItem,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: MENU_QUERY_KEY });
      
      const previousItems = queryClient.getQueryData<MenuItem[]>(MENU_QUERY_KEY);
      
      // Optimistically update
      queryClient.setQueryData<MenuItem[]>(MENU_QUERY_KEY, (old = []) =>
        old.map(item => item.id === id ? { ...item, ...data } : item)
      );
      
      return { previousItems };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(MENU_QUERY_KEY, context.previousItems);
      }
      setToast({ show: true, message: err.message || 'Failed to update menu item', type: 'error' });
    },
    onSuccess: () => {
      setToast({ show: true, message: 'Menu item updated successfully', type: 'success' });
      setIsModalOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MENU_QUERY_KEY });
      
      const previousItems = queryClient.getQueryData<MenuItem[]>(MENU_QUERY_KEY);
      
      // Optimistically remove
      queryClient.setQueryData<MenuItem[]>(MENU_QUERY_KEY, (old = []) =>
        old.filter(item => item.id !== id)
      );
      
      return { previousItems };
    },
    onError: (err: any, id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(MENU_QUERY_KEY, context.previousItems);
      }
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete menu item';
      setToast({ show: true, message: errorMessage, type: 'error' });
    },
    onSuccess: () => {
      setToast({ show: true, message: 'Menu item deleted successfully', type: 'success' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY });
    },
  });

  // Toggle availability mutation
  const toggleMutation = useMutation({
    mutationFn: toggleAvailability,
    onMutate: async ({ id, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: MENU_QUERY_KEY });
      
      const previousItems = queryClient.getQueryData<MenuItem[]>(MENU_QUERY_KEY);
      
      // Optimistically toggle
      queryClient.setQueryData<MenuItem[]>(MENU_QUERY_KEY, (old = []) =>
        old.map(item => item.id === id ? { ...item, isAvailable } : item)
      );
      
      return { previousItems };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(MENU_QUERY_KEY, context.previousItems);
      }
      setToast({ show: true, message: err.message || 'Failed to update availability', type: 'error' });
    },
    onSuccess: (data, variables) => {
      setToast({ 
        show: true, 
        message: `Menu item ${variables.isAvailable ? 'enabled' : 'disabled'} successfully`, 
        type: 'success' 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY });
    },
  });

  const handleOpenModal = useCallback((item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        imageUrl: item.imageUrl || '',
        preparationTime: item.preparationTime.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'main_course',
        imageUrl: '',
        preparationTime: '15',
      });
    }
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      imageUrl: formData.imageUrl || null,
      preparationTime: parseInt(formData.preparationTime),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }, [editingItem, formData, createMutation, updateMutation]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    deleteMutation.mutate(itemId);
  }, [deleteMutation]);

  const handleToggleAvailability = useCallback(async (itemId: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id: itemId, isAvailable: !currentStatus });
  }, [toggleMutation]);

  const getCategoryBadgeVariant = useCallback((category: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      appetizer: 'info',
      main_course: 'success',
      dessert: 'warning',
      beverage: 'info',
      special: 'danger',
    };
    return variants[category] || 'info';
  }, []);

  const columns = useMemo<MRT_ColumnDef<MenuItem>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: "Image",
        enableSorting: false,
        Cell: ({ row }) =>
          row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={row.original.name}
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-200 rounded" />
          ),
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "category",
        header: "Category",
        Cell: ({ row }) => (
          <Badge variant={getCategoryBadgeVariant(row.original.category)}>
            {row.original.category.replace("_", " ").toUpperCase()}
          </Badge>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        Cell: ({ cell }) => `₹${Number(cell.getValue<number>()).toFixed(2)}`,
      },
      {
        accessorKey: "preparationTime",
        header: "Prep Time",
        Cell: ({ cell }) => `${cell.getValue<number>()} min`,
      },
      {
        accessorKey: "isAvailable",
        header: "Status",
        Cell: ({ row }) => (
          <Badge variant={row.original.isAvailable ? "success" : "gray"}>
            {row.original.isAvailable ? "Available" : "Unavailable"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenModal(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={row.original.isAvailable ? "danger" : "success"}
              onClick={() =>
                handleToggleAvailability(row.original.id, row.original.isAvailable)
              }
            >
              {row.original.isAvailable ? "Disable" : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleDelete, handleOpenModal, handleToggleAvailability, getCategoryBadgeVariant]
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
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
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Menu Item
        </Button>
      </div>

      {error && <ErrorMessage message={(error as Error).message || 'Failed to load menu items'} />}

      <Card>
        {menuItems.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-sm mt-2">Create your first menu item to get started</p>
          </div>
        ) : (
          <MaterialReactTable
            columns={columns}
            data={menuItems}
            enableColumnOrdering
            enableColumnPinning
            enableSorting
            enablePagination
            enableGlobalFilter
            enableColumnFilters
            enableDensityToggle
            enableFullScreenToggle
            enableHiding
            positionGlobalFilter="left"
            initialState={{
              showGlobalFilter: true,
              density: "comfortable",
              pagination: {
                pageSize: 10,
              },
            }}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Prep Time (min)</label>
              <input
                type="number"
                className="form-input"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Image URL (optional)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter a direct URL to an image (e.g., from Unsplash, Imgur, etc.)
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
