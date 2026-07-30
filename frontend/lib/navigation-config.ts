import { Role } from './auth-context';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  description?: string;
  group?: string; // optional group name — items with the same group are shown under a dropdown
}

export const navigationItems: NavItem[] = [
  // Admin Navigation
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['admin'],
    description: 'Overview and analytics',
  },
  {
    label: 'Staff',
    href: '/admin/staff',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['admin'],
    description: 'Manage staff members',
  },
  {
    label: 'Menu',
    href: '/admin/menu',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    roles: ['admin'],
    description: 'Manage menu items',
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    roles: ['admin'],
    description: 'Manage inventory',
  },
  {
    label: 'Recipes',
    href: '/admin/recipes',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    roles: ['admin'],
    description: 'Manage recipes',
  },

  {
    label: 'AI Insights',
    href: '/admin/insights',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.476A2 2 0 0115 20H9a2 2 0 01-1.414-.586l-.547-.476z',
    roles: ['admin'],
    description: 'AI-powered operational insights',
    group: 'AI Overview',
  },
  {
    label: 'Demand Forecast',
    href: '/admin/forecast',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['admin'],
    description: '7-day order demand forecast',
    group: 'AI Overview',
  },
  {
    label: 'Inventory Predictions',
    href: '/admin/predictions',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    roles: ['admin'],
    description: 'AI inventory usage predictions',
    group: 'AI Overview',
  },

  // Kitchen Navigation
  {
    label: 'Kitchen',
    href: '/kitchen',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['kitchen'],
    description: 'Active orders',
  },

  // Reception Navigation
  {
    label: 'Reception',
    href: '/reception',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['reception'],
    description: 'Reception dashboard',
  },
  {
    label: 'Reservations',
    href: '/reception/reservations',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    roles: ['reception'],
    description: 'Manage reservations',
  },

  // Inventory Navigation
  {
    label: 'Inventory',
    href: '/inventory',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    roles: ['inventory'],
    description: 'Inventory dashboard',
  },

  // Customer Navigation
  {
    label: 'Menu',
    href: '/customer/menu',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    roles: ['customer'],
    description: 'Browse menu',
  },
  {
    label: 'My Orders',
    href: '/customer/orders',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    roles: ['customer'],
    description: 'View your orders',
  },
  {
    label: 'Track Order',
    href: '/customer/orders/tracking',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['customer'],
    description: 'Track your order',
  },
  {
    label: 'Reservations',
    href: '/customer/reservations',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    roles: ['customer'],
    description: 'Make reservations',
  },
];

/**
 * Get navigation items for a specific role
 */
export function getNavigationForRole(role: Role): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(role));
}

/**
 * Get the home path for a specific role
 */
export function getHomePathForRole(role: Role): string {
  const roleHomePaths: Record<Role, string> = {
    admin: '/admin',
    kitchen: '/kitchen',
    reception: '/reception',
    inventory: '/inventory',
    customer: '/customer/menu',
  };
  return roleHomePaths[role] || '/';
}
