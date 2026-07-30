"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNavigationForRole, NavItem } from "@/lib/navigation-config";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { MobileMenu } from "./MobileMenu";

interface NavbarProps {
  onLogout: () => void;
}

// ─── Dropdown for a grouped set of nav items ────────────────────────────────
function NavDropdown({
  groupName,
  items,
  isGroupActive,
}: {
  groupName: string;
  items: NavItem[];
  isGroupActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pathname = usePathname();

  // Sparkles icon path for AI
  const sparklesPath =
    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.476A2 2 0 0115 20H9a2 2 0 01-1.414-.586l-.547-.476z";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors select-none ${
          isGroupActive || open
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {/* Icon */}
        <svg
          className={`w-4 h-4 ${isGroupActive || open ? "text-blue-600" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={sparklesPath}
          />
        </svg>
        <span>{groupName}</span>
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isGroupActive || open ? "text-blue-600" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50">
          {/* Group label */}
          <div className="px-3 pb-1 pt-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              AI Overview
            </p>
          </div>
          <div className="h-px bg-gray-100 mx-2 mb-1" />

          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                  )}
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────
export function Navbar({ onLogout }: NavbarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const allItems = getNavigationForRole(user.role);

  // Split items into ungrouped and grouped
  const ungrouped = allItems.filter((item) => !item.group);

  // Build a map of group → items (preserving first-seen order)
  const groupMap = new Map<string, NavItem[]>();
  allItems
    .filter((item) => item.group)
    .forEach((item) => {
      const key = item.group!;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(item);
    });

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-3 shrink-0 mr-8 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="hidden md:block shrink-0">
                <h1 className="text-lg font-bold whitespace-nowrap text-gray-900 group-hover:text-blue-600 transition-colors">
                  Smart Restaurant
                </h1>
                <p className="text-xs whitespace-nowrap text-gray-500 -mt-0.5">
                  Management System
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0">
              {/* Ungrouped items */}
              {ungrouped.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={item.description}
                  >
                    <svg
                      className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Grouped dropdowns */}
              {Array.from(groupMap.entries()).map(([groupName, items]) => {
                const isGroupActive = items.some(
                  (i) => pathname === i.href || pathname.startsWith(i.href + "/")
                );
                return (
                  <NavDropdown
                    key={groupName}
                    groupName={groupName}
                    items={items}
                    isGroupActive={isGroupActive}
                  />
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
              navigationItems={allItems}
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
