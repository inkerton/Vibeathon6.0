'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
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
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customInstructions: string;
  allergyInfo: string;
}

const CATEGORIES = ['all', 'appetizer', 'main_course', 'dessert', 'beverage', 'special'];

export default function CustomerMenu() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/menu');
      setMenuItems(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { menuItem: item, quantity: 1, customInstructions: '', allergyInfo: '' }]);
    }
    setToast({ show: true, message: `${item.name} added to cart`, type: 'success' });
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item.menuItem.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
              <p className="text-sm text-gray-600">Browse and order your favorites</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage message={error} className="mb-6" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            {filteredItems.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  No items found. Try a different category or search term.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map(item => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                          <Badge variant="info" className="mt-1">
                            {item.category.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xl font-bold text-blue-600">₹{item.price.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.preparationTime} mins
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addToCart(item)}
                        disabled={!item.isAvailable}
                      >
                        {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h2>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-1">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                          <p className="text-sm text-gray-600">₹{item.menuItem.price.toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </button>
                        <span className="ml-auto font-bold text-gray-900">
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => {
                        localStorage.setItem('cart', JSON.stringify(cart));
                        router.push('/customer/checkout');
                      }}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}