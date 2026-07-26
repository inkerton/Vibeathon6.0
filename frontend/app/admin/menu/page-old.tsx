'use client';

import { useEffect, useState, useMemo, useCallback, useOptimistic } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';
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

// Cache configuration
const CACHE_KEY = 'menu_items_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const setCachedData = (data: MenuItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    menuItems,
    (state, optimisticValue: { action: 'add' | 'update' | 'delete' | 'toggle'; item?: MenuItem; id?: string }) => {
      switch (optimisticValue.action) {
        case 'add':
          return optimisticValue.item ? [...state, optimisticValue.item] : state;
        case 'update':
          return optimisticValue.item 
            ? state.map(item => item.id === optimisticValue.item!.id ? optimisticValue.item! : item)
            : state;
        case 'delete':
          return state.filter(item => item.id !== optimisticValue.id);
        case 'toggle':
          return state.map(item =>
            item.id === optimisticValue.id
              ? { ...item, isAvailable: !item.isAvailable }
              : item
          );
        default:
          return state;
      }
    }
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  // const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchMenuItems = useCallback(async (forceRefresh = false) => {
    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = getCachedData();
        if (cached && Array.isArray(cached)) {
          console.log('Using cached menu items:', cached.length);
          setMenuItems(cached);
          setLoading(false);
          
          // Fetch in background to update cache
          apiClient.get('/menu?includeUnavailable=true')
            .then(response => {
              let items = [];
              if (response.data?.data && Array.isArray(response.data.data)) {
                items = response.data.data;
              } else if (Array.isArray(response.data)) {
                items = response.data;
              }
              if (items.length > 0) {
                setCachedData(items);
                setMenuItems(items);
              }
            })
            .catch(err => console.error('Background fetch error:', err));
          
          return;
        }
      }
      
      setLoading(true);
      setError('');
      
      // Include unavailable items so we can show enable/disable buttons
      const response = await apiClient.get('/menu?includeUnavailable=true');
      
      // Handle backend response structure: { status: 'success', data: [...] }
      let items = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }
      
      console.log('Fetched menu items:', items.length);
      setMenuItems(items);
      setCachedData(items);
    } catch (err: any) {
      console.error('Failed to fetch menu items:', err);
      setError(err.message || 'Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

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
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl || null,
        preparationTime: parseInt(formData.preparationTime),
      };

      if (editingItem) {
        // Optimistic update
        const updatedItem = { 
          ...editingItem, 
          ...payload, 
          price: parseFloat(formData.price), 
          preparationTime: parseInt(formData.preparationTime) 
        };
        setOptimisticItems({ action: 'update', item: updatedItem });
        
        await apiClient.patch(`/menu/${editingItem.id}`, payload);
        
        // Update cache with optimistic data
        const currentItems = menuItems.map(item => 
          item.id === editingItem.id ? updatedItem : item
        );
        setMenuItems(currentItems);
        setCachedData(currentItems);
        
        setToast({ show: true, message: 'Menu item updated successfully', type: 'success' });
      } else {
        // Optimistic add with temporary ID
        const tempItem: MenuItem = {
          id: `temp-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          imageUrl: formData.imageUrl || null,
          isAvailable: true,
          preparationTime: parseInt(formData.preparationTime),
          createdAt: new Date().toISOString()
        };
        
        setOptimisticItems({ action: 'add', item: tempItem });
        
        const response = await apiClient.post('/menu', payload);
        
        // Replace temp item with real item from server
        const newItem = response.data?.data || response.data;
        const currentItems = [...menuItems, newItem];
        setMenuItems(currentItems);
        setCachedData(currentItems);
        
        setToast({ show: true, message: 'Menu item created successfully', type: 'success' });
      }

      setIsModalOpen(false);
      // No need to refetch - we already have the updated data
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to save menu item', type: 'error' });
      // Only refetch on error to revert optimistic update
      await fetchMenuItems(true);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, formData, fetchMenuItems, menuItems]);

  const handleDelete = useCallback(async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      // Optimistic delete
      setOptimisticItems({ action: 'delete', id: itemId });
      
      await apiClient.delete(`/menu/${itemId}`);
      
      // Update cache with deleted item removed
      const currentItems = menuItems.filter(item => item.id !== itemId);
      setMenuItems(currentItems);
      setCachedData(currentItems);
      
      setToast({ show: true, message: 'Menu item deleted successfully', type: 'success' });
      // No need to refetch - we already have the updated data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete menu item';
      setToast({ show: true, message: errorMessage, type: 'error' });
      // Only refetch on error to revert optimistic update
      await fetchMenuItems(true);
    }
  }, [fetchMenuItems, menuItems]);

  const handleToggleAvailability = useCallback(async (itemId: string, currentStatus: boolean) => {
    try {
      // Optimistic toggle
      setOptimisticItems({ action: 'toggle', id: itemId });
      
      await apiClient.patch(`/menu/${itemId}/availability`, {
        isAvailable: !currentStatus,
      });
      
      // Update cache with toggled availability
      const currentItems = menuItems.map(item =>
        item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
      );
      setMenuItems(currentItems);
      setCachedData(currentItems);
      
      setToast({ 
        show: true, 
        message: `Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 
        type: 'success' 
      });
      // No need to refetch - we already have the updated data
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update availability', type: 'error' });
      // Only refetch on error to revert optimistic update
      await fetchMenuItems(true);
    }
  }, [fetchMenuItems, menuItems]);

  const getCategoryBadgeVariant = useCallback((category: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      appetizer: 'info',
      main_course: 'success',
      dessert: 'warning',
      beverage: 'info',
      special: 'danger',
    };
    return variants[category] || 'gray';
  }, []);

  // const filteredItems = filterCategory === 'all' 
  //   ? menuItems 
  //   : menuItems.filter(item => item.category === filterCategory);

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
          <Badge
            variant={
              row.original.isAvailable
                ? "success"
                : "gray"
            }
          >
            {row.original.isAvailable
              ? "Available"
              : "Unavailable"}
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
              variant={
                row.original.isAvailable
                  ? "danger"
                  : "success"
              }
              onClick={() =>
                handleToggleAvailability(
                  row.original.id,
                  row.original.isAvailable
                )
              }
            >
              {row.original.isAvailable
                ? "Disable"
                : "Enable"}
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                handleDelete(row.original.id)
              }
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [
      handleDelete,
      handleOpenModal,
      handleToggleAvailability,
      getCategoryBadgeVariant,
    ]
  );

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
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Menu Item
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Category Filter */}
      {/* <Card>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterCategory === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                filterCategory === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </Card> */}

      <Card>
        {menuItems.length === 0 && !loading && !error ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-sm mt-2">Create your first menu item to get started</p>
          </div>
        ) : (
          <MaterialReactTable
            columns={columns}
            data={optimisticItems}
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
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
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
