import React from 'react';
import { Sidebar } from './Sidebar';

export function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="relative flex-1 focus:outline-none">
          <div className="py-6 h-full font-geist-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
