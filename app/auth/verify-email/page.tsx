'use client';

import React from 'react';
import Link from 'next/link';
import { Playfair_Display, Poppins } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function VerifyEmail() {
  return (
    <main className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 ${poppins.className}`}>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
          Check Your Email
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              We've sent you an email with a link to verify your account.
              Please check your inbox and click the link to continue.
            </p>

            <p className="text-sm text-gray-500">
              Didn't receive an email?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                Try signing up again
              </Link>
            </p>

            <div className="pt-4">
              <Link
                href="/auth/signin"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 