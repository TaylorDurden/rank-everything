import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { WebLayout } from '../components/layout/WebLayout';

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebLayout>{children}</WebLayout>
      </body>
    </html>
  );
}
