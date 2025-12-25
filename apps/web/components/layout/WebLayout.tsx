'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function WebLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isLandingPage || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto w-full">
        <main className="relative flex-1 focus:outline-none">
          <div className="py-6 h-full">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
