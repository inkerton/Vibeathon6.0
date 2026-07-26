'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, ShoppingCart, Clock, Leaf, Vegan } from 'lucide-react';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchMenu();
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []); // Fetch once on mount

  const fetchMenu = async () => {
    setLoading(true);

    try {
      // Fetch all available items once
      const response = await apiClient.get('/menu?available=true');

      console.log('Menu API Response:', response.data);

      const items = (response.data?.data || []).map((item: any) => ({
        ...item,

        image_url: item.image_url ?? item.imageUrl ?? '',

        is_available:
          item.is_available ??
          item.isAvailable ??
          true,

        preparation_time:
          item.preparation_time ??
          item.preparationTime ??
          15,

        is_vegetarian:
          item.is_vegetarian ??
          item.isVegetarian ??
          false,

        is_vegan:
          item.is_vegan ??
          item.isVegan ??
          false,
      }));

      console.log('Normalized Menu:', items);

      setMenuItems(items);
    } catch (err) {
      console.error(err);

      setToast({
        show: true,
        message: 'Failed to load menu',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) {
      return '/placeholder-food.jpg';
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `${API_URL}${url}`;
  };

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(
      (c) => c.menu_item_id === item.id
    );

    let newCart: CartItem[];

    if (existing) {
      newCart = cart.map((c) =>
        c.menu_item_id === item.id
          ? {
              ...c,
              quantity: c.quantity + 1,
            }
          : c
      );
    } else {
      newCart = [
        ...cart,
        {
          menu_item_id: item.id,
          quantity: 1,
          special_instructions: '',
          item,
        },
      ];
    }

    setCart(newCart);
    localStorage.setItem(
      'cart',
      JSON.stringify(newCart)
    );

    setToast({
      show: true,
      message: `${item.name} added to cart`,
      type: 'success',
    });
  };

  const updateQuantity = (
    menuItemId: string,
    delta: number
  ) => {
    const newCart = cart
      .map((c) => {
        if (c.menu_item_id === menuItemId) {
          const qty = c.quantity + delta;

          return qty > 0
            ? {
                ...c,
                quantity: qty,
              }
            : c;
        }

        return c;
      })
      .filter((c) => c.quantity > 0);

    setCart(newCart);
    localStorage.setItem(
      'cart',
      JSON.stringify(newCart)
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + item.item.price * item.quantity,
    0
  );

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      const matchesCategory = category === 'all' || item.category === category;
      
      // Search filter
      if (!searchQuery) {
        return matchesCategory;
      }
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchQuery, category]); // Add category to dependencies

  const categories = [
    'all',
    'appetizers',
    'main_course',
    'desserts',
    'beverages',
  ];

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        className="py-24"
      />
    );
  }
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            show: false,
          }))
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-8 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <Badge className="mb-4 bg-white/20 text-white border-white/20">
              🍽 Freshly Prepared
            </Badge>

            <h1 className="text-4xl font-bold md:text-5xl">
              Discover Delicious Food
            </h1>

            <p className="mt-3 max-w-2xl text-blue-50 text-lg">
              Fresh ingredients, amazing flavors and quick delivery.
              Find your favorite meal and order in seconds.
            </p>

            <div className="mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search burgers, pizza, desserts..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-slate-900 shadow-lg outline-none ring-0 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200
              ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-300'
                  : 'bg-white text-slate-600 shadow hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {cat.replaceAll('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">

          {/* Food Section */}
          <div className="lg:col-span-2">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Popular Dishes
                </h2>

                <p className="mt-1 text-slate-500">
                  {filteredMenu.length} item
                  {filteredMenu.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            {filteredMenu.length === 0 ? (
              <Card className="flex h-72 items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="mb-4 text-6xl">
                    🍽️
                  </div>

                  <h3 className="text-xl font-semibold">
                    No dishes found
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Try another search or category.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredMenu.map((item) => (
                  <Card
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute left-3 top-3 flex gap-2">
                        {item.is_vegetarian && (
                          <Badge className="bg-green-600 text-white">
                            <Leaf className="mr-1 h-3 w-3" />
                            Veg
                          </Badge>
                        )}

                        {item.is_vegan && (
                          <Badge className="bg-emerald-600 text-white">
                            <Vegan className="mr-1 h-3 w-3" />
                            Vegan
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 p-5">

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm capitalize text-slate-500">
                            {item.category.replaceAll('_', ' ')}
                          </p>
                        </div>

                        <span className="text-xl font-bold text-blue-600">
                          ₹{item.price}
                        </span>
                      </div>

                      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />

                        <span>
                          {item.preparation_time} min
                        </span>
                      </div>

                      <Button
                        className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => addToCart(item)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
                    {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="overflow-hidden rounded-2xl border-0 shadow-xl">
                <div className="border-b bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-bold">Your Order</h2>
                      <p className="text-sm text-blue-100">
                        {cart.length} item{cart.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <ShoppingCart className="mb-4 h-16 w-16 text-slate-300" />

                    <h3 className="text-lg font-semibold text-slate-700">
                      Your cart is empty
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Add some delicious food to get started.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[500px] space-y-5 overflow-y-auto p-5">
                      {cart.map((cartItem) => (
                        <div
                          key={cartItem.menu_item_id}
                          className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">
                                {cartItem.item.name}
                              </h4>

                              <p className="mt-1 text-sm text-slate-500">
                                ₹{cartItem.item.price} each
                              </p>
                            </div>

                            <span className="font-bold text-blue-600">
                              ₹
                              {(
                                cartItem.item.price *
                                cartItem.quantity
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    cartItem.menu_item_id,
                                    -1
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center bg-slate-50 text-lg font-semibold transition hover:bg-blue-100"
                              >
                                −
                              </button>

                              <span className="flex h-9 min-w-[42px] items-center justify-center font-semibold">
                                {cartItem.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    cartItem.menu_item_id,
                                    1
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center bg-slate-50 text-lg font-semibold transition hover:bg-blue-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t bg-slate-50 p-5">
                      <div className="space-y-3">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                          <span>Delivery</span>
                          <span className="text-green-600">FREE</span>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between text-xl font-bold">
                            <span>Total</span>

                            <span className="text-blue-600">
                              ₹{cartTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-base hover:bg-blue-700"
                        onClick={() =>
                          (window.location.href =
                            '/customer/checkout')
                        }
                      >
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
    </div>
  );
}