'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    const user = db.users.findByEmail(email);
    if (!user) {
      setError('User not found');
      return;
    }
    const newOtp = auth.generateOTP();
    setGeneratedOtp(newOtp);
    auth.storeOTP(email, newOtp);
    alert(`Your OTP is: ${newOtp}`);
    setStep(2);
    setError('');
  };

  const handleVerifyOtp = () => {
    if (auth.verifyOTP(email, otp)) {
      setStep(3);
      setError('');
    } else {
      setError('Invalid or expired OTP');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const user = db.users.findByEmail(email);
    if (user) {
      const passwordHash = await auth.hashPassword(newPassword);
      db.users.update(user.id, { passwordHash });
      alert('Password reset successful!');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Reset Password</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <Button onClick={handleSendOtp} className="w-full">
              Send OTP
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Enter the OTP sent to {email}
            </p>
            <Input
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
            <Button onClick={handleVerifyOtp} className="w-full">
              Verify OTP
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button onClick={handleResetPassword} className="w-full">
              Reset Password
            </Button>
          </div>
        )}

        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          <button onClick={() => router.push('/login')} className="text-primary-600 hover:underline">
            Back to Login
          </button>
        </p>
      </Card>
    </div>
  );
}
