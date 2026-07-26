'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else {
        // Redirect based on role
        switch (user.role) {
          case 'customer':
            router.push('/customer/menu');
            break;
          case 'reception':
            router.push('/reception');
            break;
          case 'kitchen':
            router.push('/kitchen');
            break;
          case 'inventory':
            router.push('/inventory');
            break;
          case 'admin':
            router.push('/admin');
            break;
          default:
            router.push('/customer/menu');
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}