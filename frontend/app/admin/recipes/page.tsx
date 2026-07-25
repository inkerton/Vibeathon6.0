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
  category: string;
  price: number;
  isAvailable: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  totalStock: number;
  availableStock: number;
}

interface RecipeItem {
  id: string;
  inventoryItem: InventoryItem;
  quantityRequired: number;
}

interface Recipe {
  menuItemId: string;
  items: RecipeItem[];
  maxServings: number;
}

export default function RecipesPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    quantityRequired: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMenuItem) {
      fetchRecipe(selectedMenuItem.id);
    }
  }, [selectedMenuItem]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [menuResponse, inventoryResponse] = await Promise.all([
        apiClient.get('/menu'),
        apiClient.get('/inventory')
      ]);
      setMenuItems(menuResponse.data || []);
      setInventoryItems(inventoryResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipe = async (menuItemId: string) => {
    try {
      setLoadingRecipe(true);
      const response = await apiClient.get(`/recipes/menu/${menuItemId}`);
      setRecipe(response.data || { menuItemId, items: [], maxServings: 0 });
    } catch (err: any) {
      // If no recipe exists, initialize empty
      setRecipe({ menuItemId, items: [], maxServings: 0 });
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedMenuItem || !newIngredient.inventoryItemId || newIngredient.quantityRequired <= 0) {
      setToast({ show: true, message: 'Please select an ingredient and enter quantity', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await apiClient.post(`/recipes/menu/${selectedMenuItem.id}/ingredients`, {
        inventoryItemId: newIngredient.inventoryItemId,
        quantityRequired: newIngredient.quantityRequired
      });
      
      setToast({ show: true, message: 'Ingredient added successfully', type: 'success' });
      setShowAddModal(false);
      setNewIngredient({ inventoryItemId: '', quantityRequired: 0 });
      fetchRecipe(selectedMenuItem.id);
    } catch (err: any) {
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to add ingredient', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuantity = async (recipeItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setToast({ show: true, message: 'Quantity must be greater than 0', type: 'error' });
      return;
    }

    try {
      await apiClient.patch(`/recipes/items/${recipeItemId}`, {
        quantityRequired: newQuantity
      });
      
      setToast({ show: true, message: 'Quantity updated successfully', type: 'success' });
      if (selectedMenuItem) {
        fetchRecipe(selectedMenuItem.id);
      }
    } catch (err: any) {
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to update quantity', 
        type: 'error' 
      });
    }
  };

  const handleRemoveIngredient = async (recipeItemId: string) => {
    if (!confirm('Are you sure you want to remove this ingredient?')) {
      return;
    }

    try {
      await apiClient.delete(`/recipes/items/${recipeItemId}`);
      setToast({ show: true, message: 'Ingredient removed successfully', type: 'success' });
      if (selectedMenuItem) {
        fetchRecipe(selectedMenuItem.id);
      }
    } catch (err: any) {
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Failed to remove ingredient', 
        type: 'error' 
      });
    }
  };

  const getAvailableInventoryItems = () => {
    if (!recipe) return inventoryItems;
    const usedIds = recipe.items.map(item => item.inventoryItem.id);
    return inventoryItems.filter(item => !usedIds.includes(item.id));
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
          <p className="text-sm text-gray-600">Link menu items with inventory ingredients</p>
        </div>
        <Button onClick={fetchData}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Items List */}
        <Card title="Menu Items">
          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap capitalize ${
                    categoryFilter === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedMenuItem(item)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedMenuItem?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="info" className="text-xs">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">₹{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  {!item.isAvailable && (
                    <Badge variant="danger" className="text-xs">Unavailable</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Recipe Editor */}
        <Card 
          title={selectedMenuItem ? `Recipe: ${selectedMenuItem.name}` : 'Select a Menu Item'}
          actions={
            selectedMenuItem && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Ingredient
              </Button>
            )
          }
        >
          {!selectedMenuItem ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Select a menu item to view or edit its recipe</p>
            </div>
          ) : loadingRecipe ? (
            <LoadingSpinner size="md" className="py-12" />
          ) : (
            <div className="space-y-4">
              {/* Max Servings Info */}
              {recipe && recipe.items.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Maximum Servings Available</p>
                      <p className="text-xs text-blue-700 mt-1">Based on current inventory levels</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {recipe.maxServings}
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients List */}
              {recipe && recipe.items.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Ingredients Required</h3>
                  {recipe.items.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.inventoryItem.name}</h4>
                          <p className="text-sm text-gray-600">
                            Available: {item.inventoryItem.availableStock} {item.inventoryItem.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveIngredient(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Quantity per serving:</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantityRequired}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              handleUpdateQuantity(item.id, value);
                            }
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">{item.inventoryItem.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>No ingredients added yet</p>
                  <p className="text-sm mt-1">Click "Add Ingredient" to start building the recipe</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Add Ingredient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewIngredient({ inventoryItemId: '', quantityRequired: 0 });
        }}
        title="Add Ingredient"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ingredient *
            </label>
            <select
              value={newIngredient.inventoryItemId}
              onChange={(e) => setNewIngredient({ ...newIngredient, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an ingredient...</option>
              {getAvailableInventoryItems().map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.availableStock} {item.unit} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Required (per serving) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={newIngredient.quantityRequired || ''}
              onChange={(e) => setNewIngredient({ 
                ...newIngredient, 
                quantityRequired: parseFloat(e.target.value) || 0 
              })}
              placeholder="e.g., 0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {newIngredient.inventoryItemId && (
              <p className="text-xs text-gray-500 mt-1">
                Unit: {inventoryItems.find(i => i.id === newIngredient.inventoryItemId)?.unit}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                setNewIngredient({ inventoryItemId: '', quantityRequired: 0 });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddIngredient}
              disabled={saving || !newIngredient.inventoryItemId || newIngredient.quantityRequired <= 0}
            >
              {saving ? 'Adding...' : 'Add Ingredient'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
