'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import Button from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center text-white px-4">
        <h1 className="text-6xl font-bold mb-4">Community Care</h1>
        <p className="text-2xl mb-8">Connecting communities through care and support</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/register')}
            className="px-6 py-3 text-lg rounded-lg font-medium bg-white text-primary-600 hover:bg-gray-100"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 text-lg rounded-lg font-medium bg-white text-gray-900 hover:bg-gray-100"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
