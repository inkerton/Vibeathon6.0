'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getNavigationForRole } from '@/lib/navigation-config';
import { UserProfileDropdown } from './UserProfileDropdown';
import { MobileMenu } from './MobileMenu';

interface NavbarProps {
  onLogout: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navigationItems = getNavigationForRole(user.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Smart Restaurant
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">Management System</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <svg
                      className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side - User Profile & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop User Profile Dropdown */}
            <div className="hidden md:block">
              <UserProfileDropdown onLogout={onLogout} />
            </div>

            {/* Mobile Menu */}
            <MobileMenu
              navigationItems={navigationItems}
              onLogout={onLogout}
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
