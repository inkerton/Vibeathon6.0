'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

import {
  Search,
  ChefHat,
  RefreshCcw,
  Package,
  Plus,
  CookingPot,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';

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

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    quantityRequired: 0,
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
        
        // Backend returns { status: 'success', data: [...] }
        // Extract the actual data array from response.data.data
        const menuData = menuResponse.data?.data || [];
        const inventoryData = inventoryResponse.data?.data || [];
        
        if (Array.isArray(menuData)) {
          setMenuItems(menuData);
        } else {
          console.error('Menu data is not an array:', menuData);
          setMenuItems([]);
        }
        
        if (Array.isArray(inventoryData)) {
          setInventoryItems(inventoryData);
        } else {
          console.error('Inventory data is not an array:', inventoryData);
          setInventoryItems([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch recipes data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
  
    const fetchRecipe = async (menuItemId: string) => {
      try {
        setLoadingRecipe(true);
        const response = await apiClient.get(`/recipes/menu/${menuItemId}`);
        
        // Backend returns { status: 'success', data: { ...menuItem, recipe: [...] } }
        const recipeData = response.data?.data || response.data;
        
        // Transform backend recipe format to frontend format
        const recipeItems = (recipeData?.recipe || []).map((item: any) => ({
          id: item.id,
          inventoryItem: {
            id: item.ingredient?.id || item.ingredient_id,
            name: item.ingredient?.name || '',
            unit: item.ingredient?.unit || item.unit,
            totalStock: item.ingredient?.total_stock || 0,
            availableStock: item.ingredient?.total_stock - item.ingredient?.reserved_stock || 0,
          },
          quantityRequired: item.quantity
        }));
        
        // Calculate max servings based on available stock
        const maxServings = recipeItems.length > 0
          ? Math.min(...recipeItems.map((item: any) => 
              Math.floor(item.inventoryItem.availableStock / item.quantityRequired)
            ))
          : 0;
        
        const normalizedRecipe = {
          menuItemId,
          items: recipeItems,
          maxServings
        };
        
        setRecipe(normalizedRecipe);
      } catch (err: any) {
        console.error('Error fetching recipe:', err);
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
          ingredient_id: newIngredient.inventoryItemId,
          quantity: newIngredient.quantityRequired
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
          quantity: newQuantity
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
  

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ||
      item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'all',
    ...Array.from(new Set(menuItems.map((i) => i.category))),
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
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

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            Recipe Management
          </h1>

          <p className="text-muted-foreground mt-2">
            Manage recipes, ingredients and inventory usage.
          </p>
        </div>

        <Button onClick={fetchData}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* STATS */}

      <div className="grid gap-4 md:grid-cols-3">

        <Card>

          <CardContent className="flex items-center justify-between p-6">

            <div>

              <p className="text-sm text-muted-foreground">
                Menu Items
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {menuItems.length}
              </h2>

            </div>

            <CookingPot className="h-10 w-10 text-primary" />

          </CardContent>

        </Card>

        <Card>

          <CardContent className="flex items-center justify-between p-6">

            <div>

              <p className="text-sm text-muted-foreground">
                Inventory Items
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {inventoryItems.length}
              </h2>

            </div>

            <Package className="h-10 w-10 text-primary" />

          </CardContent>

        </Card>

        <Card>

          <CardContent className="flex items-center justify-between p-6">

            <div>

              <p className="text-sm text-muted-foreground">
                Ingredients
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {recipe?.items?.length ?? 0}
              </h2>

            </div>

            <ChefHat className="h-10 w-10 text-primary" />

          </CardContent>

        </Card>

      </div>

      {/* MAIN GRID */}

      <div className="grid lg:grid-cols-12 gap-6">

        {/* LEFT PANEL */}

        <Card className="lg:col-span-4 h-fit">

          <CardHeader>

            <CardTitle>
              Menu Items
            </CardTitle>

          </CardHeader>

          <CardContent>

            {/* SEARCH */}

            <div className="relative">

              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search menu item..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
              />

            </div>

            {/* CATEGORY */}

            <div className="mt-4">

              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >

                <SelectTrigger>

                  <SelectValue placeholder="Category" />

                </SelectTrigger>

                <SelectContent>

                  {categories.map((category) => (

                    <SelectItem
                      key={category}
                      value={category}
                    >
                      {category.replace('_', ' ')}
                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

            {/* MENU LIST */}

            <ScrollArea className="h-[650px] mt-6 pr-3">

              <div className="space-y-3">

                {filteredMenuItems.map((item) => (

                  <Card
                    key={item.id}
                    onClick={() =>
                      setSelectedMenuItem(item)
                    }
                    className={`cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md ${
                      selectedMenuItem?.id === item.id
                        ? 'border-primary bg-primary/5'
                        : ''
                    }`}
                  >

                    <CardContent className="p-4">

                      <div className="flex justify-between">

                        <div>

                          <h3 className="font-semibold text-base">
                            {item.name}
                          </h3>

                          <div className="flex items-center gap-2 mt-2">

                            <Badge variant="secondary">
                              {item.category.replace('_', ' ')}
                            </Badge>

                            <span className="font-semibold text-primary">
                              ₹{Number(item.price).toFixed(2)}
                            </span>

                          </div>

                        </div>

                        <Badge
                          variant={
                            item.isAvailable
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {item.isAvailable
                            ? 'Available'
                            : 'Unavailable'}
                        </Badge>

                      </div>

                    </CardContent>

                  </Card>

                ))}

              </div>

            </ScrollArea>

          </CardContent>

        </Card>

        {/* ---------- RIGHT PANEL STARTS HERE ---------- */}
        {/* ===================== RIGHT PANEL ===================== */}

<Card className="lg:col-span-8">

  <CardHeader className="flex flex-row items-center justify-between">

    <div>

      <CardTitle className="text-2xl">
        {selectedMenuItem
          ? selectedMenuItem.name
          : "Recipe Details"}
      </CardTitle>

      <p className="text-sm text-muted-foreground mt-1">
        {selectedMenuItem
          ? "Manage ingredients required for one serving."
          : "Select a menu item from the left."}
      </p>

    </div>

    {selectedMenuItem && (

      <Button onClick={() => setShowAddModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Ingredient
      </Button>

    )}

  </CardHeader>

  <CardContent>

    {!selectedMenuItem ? (

      <div className="h-[600px] flex flex-col items-center justify-center text-center">

        <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />

        <h3 className="text-xl font-semibold">
          Select a Menu Item
        </h3>

        <p className="text-muted-foreground mt-2 max-w-sm">
          Choose any menu item from the left panel to manage its recipe,
          ingredients and serving capacity.
        </p>

      </div>

    ) : loadingRecipe ? (

      <div className="space-y-5">

        <Skeleton className="h-32 rounded-xl" />

        <Skeleton className="h-28 rounded-xl" />

        <Skeleton className="h-28 rounded-xl" />

        <Skeleton className="h-28 rounded-xl" />

      </div>

    ) : (

      <div className="space-y-6">

        {/* MAX SERVINGS */}

        <Card className="border-primary/20 bg-primary/5">

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-muted-foreground">
                  Maximum Servings
                </p>

                <h2 className="text-5xl font-bold mt-2">
                  {recipe?.maxServings ?? 0}
                </h2>

                <p className="text-sm text-muted-foreground mt-2">
                  Calculated from current inventory.
                </p>

              </div>

              <ChefHat className="h-16 w-16 text-primary" />

            </div>

          </CardContent>

        </Card>

        {/* INGREDIENTS */}

        <div>

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xl font-semibold">
              Ingredients
            </h2>

            <Badge variant="secondary">
              {recipe?.items?.length ?? 0} Ingredients
            </Badge>

          </div>

          {recipe &&
          recipe.items &&
          recipe.items.length > 0 ? (

            <div className="space-y-4">

              {recipe.items.map((item) => (

                <Card
                  key={item.id}
                  className="transition-shadow hover:shadow-md"
                >

                  <CardContent className="p-5">

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="font-semibold text-lg">
                          {item.inventoryItem.name}
                        </h3>

                        <p className="text-sm text-muted-foreground mt-1">
                          Available Stock
                        </p>

                        <Badge
                          variant="outline"
                          className="mt-2"
                        >
                          {item.inventoryItem.availableStock}{" "}
                          {item.inventoryItem.unit}
                        </Badge>

                      </div>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          handleRemoveIngredient(item.id)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7L5 7M10 11v6m4-6v6M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                          />
                        </svg>
                      </Button>

                    </div>

                    <div className="mt-6 flex items-center gap-4">

                      <div className="w-48">

                        <label className="text-sm font-medium mb-2 block">
                          Quantity / Serving
                        </label>

                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantityRequired}
                          onChange={(e) => {

                            const value = parseFloat(
                              e.target.value
                            );

                            if (!isNaN(value)) {
                              handleUpdateQuantity(
                                item.id,
                                value
                              );
                            }
                          }}
                        />

                      </div>

                      <Badge variant="secondary">
                        {item.inventoryItem.unit}
                      </Badge>

                    </div>

                  </CardContent>

                </Card>

              ))}

            </div>

          ) : (

            <Card className="border-dashed">

              <CardContent className="flex flex-col items-center justify-center py-20">

                <Package className="h-16 w-16 text-muted-foreground mb-6" />

                <h3 className="text-xl font-semibold">
                  No Ingredients Added
                </h3>

                <p className="text-muted-foreground mt-2 max-w-md text-center">
                  This recipe doesn't have any ingredients yet.
                  Start building the recipe by adding ingredients
                  from your inventory.
                </p>

                <Button
                  className="mt-8"
                  onClick={() =>
                    setShowAddModal(true)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Ingredient
                </Button>

              </CardContent>

            </Card>

          )}

        </div>

      </div>

    )}

  </CardContent>

</Card>

</div>

{/* ===================== MODAL STARTS HERE ===================== */}
{/* ===================== ADD INGREDIENT MODAL ===================== */}

<Modal
  isOpen={showAddModal}
  onClose={() => {
    setShowAddModal(false);
    setNewIngredient({
      inventoryItemId: "",
      quantityRequired: 0,
    });
  }}
  title="Add Ingredient"
>

  <div className="space-y-6">

    {/* Ingredient */}

    <div>

      <label className="block text-sm font-medium mb-2">
        Ingredient
      </label>

      <Select
        value={newIngredient.inventoryItemId}
        onValueChange={(value) =>
          setNewIngredient({
            ...newIngredient,
            inventoryItemId: value,
          })
        }
      >

        <SelectTrigger>

          <SelectValue placeholder="Choose Ingredient" />

        </SelectTrigger>

        <SelectContent>

          {getAvailableInventoryItems().map((item) => (

            <SelectItem
              key={item.id}
              value={item.id}
            >
              {item.name} • {item.availableStock} {item.unit}
            </SelectItem>

          ))}

        </SelectContent>

      </Select>

    </div>

    {/* Quantity */}

    <div>

      <label className="block text-sm font-medium mb-2">
        Quantity Required Per Serving
      </label>

      <Input
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.50"
        value={
          newIngredient.quantityRequired || ""
        }
        onChange={(e) =>
          setNewIngredient({
            ...newIngredient,
            quantityRequired:
              parseFloat(e.target.value) || 0,
          })
        }
      />

      {newIngredient.inventoryItemId && (

        <p className="text-xs text-muted-foreground mt-2">

          Unit:&nbsp;

          {
            inventoryItems.find(
              (i) =>
                i.id ===
                newIngredient.inventoryItemId
            )?.unit
          }

        </p>

      )}

    </div>

    {/* Preview */}

    {newIngredient.inventoryItemId && (

      <Card className="bg-muted/40">

        <CardContent className="p-4 space-y-2">

          <h4 className="font-semibold">
            Ingredient Summary
          </h4>

          {(() => {

            const ingredient =
              inventoryItems.find(
                (i) =>
                  i.id ===
                  newIngredient.inventoryItemId
              );

            if (!ingredient) return null;

            return (

              <div className="space-y-1 text-sm">

                <div className="flex justify-between">

                  <span>Name</span>

                  <span className="font-medium">
                    {ingredient.name}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span>Available</span>

                  <span className="font-medium">
                    {ingredient.availableStock}{" "}
                    {ingredient.unit}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span>Required</span>

                  <span className="font-medium">
                    {newIngredient.quantityRequired || 0}{" "}
                    {ingredient.unit}
                  </span>

                </div>

              </div>

            );

          })()}

        </CardContent>

      </Card>

    )}

    {/* Footer */}

    <div className="flex justify-end gap-3 pt-2">

      <Button
        variant="outline"
        disabled={saving}
        onClick={() => {
          setShowAddModal(false);

          setNewIngredient({
            inventoryItemId: "",
            quantityRequired: 0,
          });
        }}
      >
        Cancel
      </Button>

      <Button
        disabled={
          saving ||
          !newIngredient.inventoryItemId ||
          newIngredient.quantityRequired <= 0
        }
        onClick={handleAddIngredient}
      >
        {saving ? (
          <>
            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Ingredient
          </>
        )}
      </Button>

    </div>

  </div>

</Modal>

</div>
);
}