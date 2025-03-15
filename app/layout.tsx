import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import AuthButton from './components/AuthButton';
import Link from 'next/link';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAT Tutor',
  description: 'Practice SAT questions with AI-powered explanations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    SAT Tutor
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <AuthButton />
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
