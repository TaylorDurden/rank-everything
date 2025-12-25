'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  LogOut,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Settings,
  BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Database },
  { name: 'Evaluations', href: '/evaluations', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900/50 backdrop-blur-xl border-r border-white/5 shrink-0">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Ranker
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-2 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pb-4 pt-4 border-t border-white/5">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl bg-white/5 border border-white/5">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">{user.name}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 border border-transparent"
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0 text-slate-500 group-hover:text-red-400" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
