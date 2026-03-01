'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { useUserStore } from '@/store/userStore';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!validateEmail(email)) {
        setError('Invalid email format');
        return;
      }

      const user = db.users.findByEmail(email);
      if (!user) {
        setError('User not found');
        return;
      }

      const isValid = await auth.comparePassword(password, user.passwordHash);
      if (!isValid) {
        setError('Invalid password');
        return;
      }

      const token = auth.generateToken(user.id);
      setUser(user);
      setToken(token);
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Logging in..." />
        ) : (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              Login
            </Button>
          </div>
        )}

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={() => router.push('/reset-password')}
            className="text-primary-600 hover:underline block w-full"
            disabled={loading}
          >
            Forgot Password?
          </button>
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button onClick={() => router.push('/register')} className="text-primary-600 hover:underline" disabled={loading}>
              Register
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
