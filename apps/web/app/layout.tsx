import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { WebLayout } from '../components/layout/WebLayout';
import { AuthProvider } from '../components/auth/AuthProvider';
import { QueryProvider } from '../components/providers/QueryProvider';

import { Toaster } from '@/components/ui/sonner';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Asset Rating Platform',
  description: 'AI-Powered Asset Evaluation and Rating Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f172a]`}>
        <QueryProvider>
          <AuthProvider>
            <WebLayout>{children}</WebLayout>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
