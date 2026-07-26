'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function Checkout() {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const placeOrder = async () => {
    const cartData = localStorage.getItem('cart');
    if (!cartData) {
      setToast({ show: true, message: 'Cart is empty', type: 'error' });
      return;
    }

    const cart = JSON.parse(cartData);
    if (!tableNumber) {
      setToast({ show: true, message: 'Please enter table number', type: 'error' });
      return;
    }

    const tableNum = parseInt(tableNumber, 10);
    if (isNaN(tableNum) || tableNum <= 0) {
      setToast({ show: true, message: 'Please enter a valid table number', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/orders', {
        table_number: tableNum,
        items: cart.map((c: any) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          special_instructions: c.special_instructions || ''
        })),
        payment_method: 'pay_at_table'
      });

      localStorage.removeItem('cart');
      setToast({ show: true, message: 'Order placed successfully!', type: 'success' });
      setTimeout(() => router.push('/customer/orders'), 2000);
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || 'Failed to place order', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Table Number *</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="input w-full"
                placeholder="Enter your table number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Any special requests?"
              />
            </div>

            <Button 
              onClick={placeOrder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Place Order'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}