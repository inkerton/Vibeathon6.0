'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'kitchen')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'kitchen') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={handleLogout} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
