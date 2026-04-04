'use client';

import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl font-bold font-playfair text-red-600">Critical System Error</h1>
            <p className="text-gray-600 font-inter">
              A high-level error occurred. We've been notified.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Try again
            </button>
            <div className="mt-8 text-xs text-gray-400 font-mono overflow-auto max-h-40 p-2 border border-dotted border-gray-300">
              {error.message}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
