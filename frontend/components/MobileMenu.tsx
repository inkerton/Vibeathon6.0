'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/lib/navigation-config';

interface MobileMenuProps {
  navigationItems: NavItem[];
  onLogout: () => void;
  userName: string;
  userEmail: string;
  userRole: string;
}

export function MobileMenu({ navigationItems, onLogout, userName, userEmail, userRole }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Auto-expand any group that contains the active route
  useEffect(() => {
    const active = navigationItems
      .filter((i) => i.group && (pathname === i.href || pathname.startsWith(i.href + '/')))
      .map((i) => i.group!);
    if (active.length) setOpenGroups(new Set(active));
  }, [pathname, navigationItems]);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      kitchen: 'bg-orange-100 text-orange-800',
      reception: 'bg-blue-100 text-blue-800',
      inventory: 'bg-green-100 text-green-800',
      customer: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Split into ungrouped and grouped
  const ungrouped = navigationItems.filter((i) => !i.group);
  const groupMap = new Map<string, NavItem[]>();
  navigationItems
    .filter((i) => i.group)
    .forEach((i) => {
      const key = i.group!;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(i);
    });

  const sparklesPath =
    'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.476A2 2 0 0115 20H9a2 2 0 01-1.414-.586l-.547-.476z';

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 md:hidden overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                  {getInitials(userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(userRole)}`}>
                    {userRole.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="px-4 py-4 pb-24">
              <div className="space-y-1">

                {/* Ungrouped items */}
                {ungrouped.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      {isActive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </Link>
                  );
                })}

                {/* Grouped sections */}
                {Array.from(groupMap.entries()).map(([groupName, items]) => {
                  const isGroupActive = items.some(
                    (i) => pathname === i.href || pathname.startsWith(i.href + '/')
                  );
                  const isExpanded = openGroups.has(groupName);

                  return (
                    <div key={groupName} className="mt-1">
                      {/* Group header button */}
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isGroupActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? 'text-blue-600' : 'text-gray-400'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sparklesPath} />
                        </svg>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{groupName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {items.length} AI features
                          </p>
                        </div>
                        {/* Chevron */}
                        <svg
                          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isGroupActive ? 'text-blue-600' : 'text-gray-400'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Collapsible sub-items */}
                      {isExpanded && (
                        <div className="mt-1 ml-4 pl-3 border-l-2 border-blue-100 space-y-1">
                          {items.map((item) => {
                            const isActive =
                              pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <svg
                                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.label}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                {isActive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </nav>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
