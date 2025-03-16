'use client';

import React, { useState } from 'react';
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

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // Step 2: Create user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
        })
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // If profile creation fails, we should handle it appropriately
        if (profileError.code === '23505') { // unique_violation
          // Profile already exists, which is fine
          console.log('User profile already exists');
        } else {
          throw profileError;
        }
      }

      // Step 3: Handle post-signup navigation
      if (authData.session) {
        // User is signed in immediately
        router.push('/subjects');
        router.refresh();
      } else {
        // Email confirmation is required
        router.push('/auth/verify-email');
      }
    } catch (error: any) {
      console.error('Error during signup:', error);
      setError(error?.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 ${poppins.className}`}>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-8 text-center`}>
          Create Account
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

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
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 