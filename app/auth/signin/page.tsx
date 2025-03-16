'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
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

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_ATTEMPTS = 3; // Maximum attempts per window

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setAttempts(0);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastAttemptTime > RATE_LIMIT_WINDOW) {
      // Reset if window has passed
      setAttempts(1);
      setLastAttemptTime(now);
      return true;
    }

    if (attempts >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastAttemptTime)) / 1000);
      setTimeRemaining(remainingTime);
      setError(`Too many sign in attempts. Please wait ${remainingTime} seconds before trying again.`);
      return false;
    }

    setAttempts((prev) => prev + 1);
    setLastAttemptTime(now);
    return true;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (signInData?.user) {
        router.push('/subjects');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error during sign in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 ${poppins.className}`}>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
          Sign In
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                disabled={timeRemaining > 0}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={timeRemaining > 0}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {timeRemaining > 0 && (
              <div className="text-center text-sm text-gray-600">
                Please wait {timeRemaining} seconds before trying again
              </div>
            )}

            <button
              type="submit"
              disabled={loading || timeRemaining > 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 