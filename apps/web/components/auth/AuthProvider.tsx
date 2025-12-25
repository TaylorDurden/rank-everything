'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!token && !isPublicPage) {
      router.replace('/login');
    } else if (token && isAuthPage) {
      router.replace('/dashboard');
    } else {
      setIsReady(true);
    }
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
