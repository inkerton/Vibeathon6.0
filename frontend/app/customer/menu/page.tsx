'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
  preparation_time: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
}

interface CartItem {
  menu_item_id: string;
  quantity: number;
  special_instructions: string;
  item: MenuItem;
}

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchMenu();
  }, [category]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchMenu = async () => {
    try {
      const params = category !== 'all' ? `?category=${category}&available=true` : '?available=true';
      const response = await apiClient.get(`/menu${params}`);
      setMenuItems(response.data?.data || []);
    } catch (err: any) {
      setToast({ show: true, message: 'Failed to load menu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menu_item_id === item.id);
    let newCart;
    if (existing) {
      newCart = cart.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
    } else {
      newCart = [...cart, { menu_item_id: item.id, quantity: 1, special_instructions: '', item }];
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    setToast({ show: true, message: `${item.name} added to cart`, type: 'success' });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    const newCart = cart.map(c => {
      if (c.menu_item_id === menuItemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Menu</h1>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'appetizer', 'main_course', 'dessert', 'beverage'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${category === cat ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              {cat.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="md:col-span-2 grid gap-4">
            {menuItems.map(item => (
              <Card key={item.id}>
                <div className="flex gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <span className="font-bold text-blue-600">₹{item.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex gap-2 mb-2">
                      {item.is_vegetarian && <Badge variant="success">VEG</Badge>}
                      {item.is_vegan && <Badge variant="info">VEGAN</Badge>}
                      <Badge variant="info">{item.preparation_time} min</Badge>
                    </div>
                    <Button size="sm" onClick={() => addToCart(item)}>Add to Cart</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Cart */}
          <div className="md:col-span-1">
            <Card title="Your Cart" className="sticky top-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map(c => (
                      <div key={c.menu_item_id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{c.item.name}</p>
                          <p className="text-sm text-gray-600">₹{c.item.price} × {c.quantity}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateQuantity(c.menu_item_id, -1)} className="w-8 h-8 bg-gray-200 rounded">-</button>
                          <button onClick={() => updateQuantity(c.menu_item_id, 1)} className="w-8 h-8 bg-gray-200 rounded">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg mb-4">
                      <span>Total</span>
              <span>₹{Number(cartTotal).toFixed(2)}</span>
                    </div>
                    <Button className="w-full" onClick={() => window.location.href = '/customer/checkout'}>
                      Proceed to Checkout
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
