'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import BubbleUp from '@/components/ui/bubble-up';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/Badge';

import {
  UtensilsCrossed,
  Receipt,
  MapPin,
  CreditCard,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

export default function Checkout() {
  const router = useRouter();

  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] =
    useState('');

  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const placeOrder = async () => {
    const cartData = localStorage.getItem('cart');

    if (!cartData) {
      setToast({
        show: true,
        message: 'Cart is empty',
        type: 'error',
      });

      return;
    }

    const cart = JSON.parse(cartData);

    if (!tableNumber.trim()) {
      setToast({
        show: true,
        message: 'Please enter your table number',
        type: 'error',
      });

      return;
    }

    const tableNum = Number(tableNumber);

    if (Number.isNaN(tableNum) || tableNum <= 0) {
      setToast({
        show: true,
        message: 'Please enter a valid table number',
        type: 'error',
      });

      return;
    }

    try {
      setLoading(true);

      await apiClient.post('/orders', {
        table_number: tableNum,

        items: cart.map((item: any) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions:
            specialInstructions ||
            item.special_instructions ||
            '',
        })),

        payment_method: 'pay_at_table',
      });

      localStorage.removeItem('cart');

      setToast({
        show: true,
        message: 'Order placed successfully!',
        type: 'success',
      });

      setTimeout(() => {
        router.push('/customer/orders');
      }, 1800);
    } catch (err: any) {
      console.error(err);

      setToast({
        show: true,
        message:
          err.response?.data?.message ||
          'Failed to place order',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Floating Background */}
      <div className="absolute inset-0 opacity-70">
        <BubbleUp
          mode="text"
          text="🍕🍔🍟🌮🍜🍣🥗🧋☕🍩🍰"
          amount={35}
          minSize={20}
          maxSize={52}
          minSpeed={18}
          maxSpeed={25}
          minShake={8}
          maxShake={24}
          direction="top"
        />
      </div>

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl">
              <UtensilsCrossed className="h-10 w-10" />
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-slate-900">
              Checkout
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              You're just one step away from enjoying your meal.
            </p>
          </div>

          {/* Checkout Card */}
          <Card className="relative overflow-hidden rounded-3xl border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">

            <Badge className="absolute right-6 top-6 bg-blue-600 px-3 py-1 text-white">
              <Sparkles className="mr-1 h-3 w-3" />
              Secure Checkout
            </Badge>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Receipt className="h-6 w-6 text-blue-600" />
                Order Details
              </CardTitle>

              <CardDescription>
                Confirm your table information before placing your order.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Table Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Table Number
                </label>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    type="number"
                    placeholder="Enter your table number"
                    value={tableNumber}
                    onChange={(e) =>
                      setTableNumber(e.target.value)
                    }
                    className="h-12 rounded-xl border-slate-200 pl-11 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Special Instructions
                </label>

                <Textarea
                  rows={4}
                  value={specialInstructions}
                  onChange={(e) =>
                    setSpecialInstructions(
                      e.target.value
                    )
                  }
                  placeholder="No onions, extra spicy, less oil..."
                  className="resize-none rounded-xl focus-visible:ring-blue-500"
                />
              </div>

              {/* Payment */}
              <div className="rounded-2xl border bg-blue-50/60 p-5">
                <div className="flex items-center justify-between">

                  <div>
                    <p className="font-semibold">
                      Payment Method
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Pay conveniently after your meal.
                    </p>
                  </div>

                  <Badge className="bg-green-600 px-3 py-1 text-white">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Pay at Table
                  </Badge>

                </div>
              </div>

              {/* Place Order */}
              <Button
                onClick={placeOrder}
                disabled={loading}
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Place Order
                  </>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}