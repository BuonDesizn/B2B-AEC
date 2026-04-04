import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { ErrorBoundary } from '@/components/error-boundary';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BuonDesizn',
  description: 'B2B Construction & Architecture Marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
