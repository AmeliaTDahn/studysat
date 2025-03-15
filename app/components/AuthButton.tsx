'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);
    };

    getUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (!email) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">{email}</span>
      <button
        onClick={handleSignOut}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Sign Out
      </button>
    </div>
  );
} 