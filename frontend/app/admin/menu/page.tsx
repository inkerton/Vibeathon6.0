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

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/menu');
      setMenuItems(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: MenuItem) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        await apiClient.patch(`/menu/${editingItem.id}`, payload);
        setToast({ show: true, message: 'Menu item updated successfully', type: 'success' });
      } else {
        await apiClient.post('/menu', payload);
        setToast({ show: true, message: 'Menu item created successfully', type: 'success' });
      }

      setIsModalOpen(false);
      fetchMenuItems();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to save menu item', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await apiClient.delete(`/menu/${itemId}`);
      setToast({ show: true, message: 'Menu item deleted successfully', type: 'success' });
      fetchMenuItems();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to delete menu item', type: 'error' });
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/menu/${itemId}/availability`, {
        isAvailable: !currentStatus,
      });
      setToast({ 
        show: true, 
        message: `Menu item ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 
        type: 'success' 
      });
      fetchMenuItems();
    } catch (err: any) {
      setToast({ show: true, message: err.message || 'Failed to update availability', type: 'error' });
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      appetizer: 'info',
      main_course: 'success',
      dessert: 'warning',
      beverage: 'info',
      special: 'danger',
    };
    return variants[category] || 'gray';
  };

  const filteredItems = filterCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === filterCategory);

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
      <Card>
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
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No menu items found. Create your first menu item.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="font-medium">₹{item.price.toFixed(2)}</td>
                    <td>{item.preparationTime} min</td>
                    <td>
                      <Badge variant={item.isAvailable ? 'success' : 'gray'}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenModal(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={item.isAvailable ? 'danger' : 'success'}
                          onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                        >
                          {item.isAvailable ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
