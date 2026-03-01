'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { useUserStore } from '@/store/userStore';
import { generateId } from '@/lib/utils';
import { AgeGroup, AccountType } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ageGroup: 'adult' as AgeGroup,
    accountType: 'individual' as AccountType,
    isVolunteer: false,
    familyCode: '',
  });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    if (!formData.email || !formData.phone || !formData.name) {
      setError('Please fill all fields');
      return;
    }
    const newOtp = auth.generateOTP();
    setGeneratedOtp(newOtp);
    auth.storeOTP(formData.email, newOtp);
    alert(`Your OTP is: ${newOtp}`);
    setStep(2);
    setError('');
  };

  const handleVerifyOtp = () => {
    if (auth.verifyOTP(formData.email, otp)) {
      setStep(3);
      setError('');
    } else {
      setError('Invalid or expired OTP');
    }
  };

  const handleRegister = async () => {
    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const passwordHash = await auth.hashPassword(password);
      
      const location = {
        lat: 28.6139 + (Math.random() - 0.5) * 0.05,
        lng: 77.2090 + (Math.random() - 0.5) * 0.05,
      };
      
      let familyId: string | undefined;
      
      if (formData.accountType === 'family') {
        if (formData.familyCode) {
          const existingFamily = db.users.getAll().find(u => u.familyId === formData.familyCode);
          if (existingFamily) {
            familyId = formData.familyCode;
          } else {
            setError('Invalid family code');
            return;
          }
        } else {
          familyId = generateId();
          alert(`Your family code: ${familyId}\nShare this with family members to join.`);
        }
      }
      
      const user = {
        id: generateId(),
        ...formData,
        passwordHash,
        safetyScore: 0,
        points: 0,
        badges: [],
        familyId,
        isAvailable: formData.isVolunteer,
        location,
        createdAt: new Date(),
      };

      db.users.create(user);
      const token = auth.generateToken(user.id);
      setUser(user);
      setToken(token);
      router.push('/questionnaire');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone"
            />
            <Select
              label="Age Group"
              value={formData.ageGroup}
              onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
              options={[
                { value: 'youth', label: 'Youth (Under 25)' },
                { value: 'adult', label: 'Adult (25-60)' },
                { value: 'elderly', label: 'Elderly (60+)' },
              ]}
            />
            <Select
              label="Account Type"
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'family', label: 'Family' },
              ]}
            />
            {formData.accountType === 'family' && (
              <Input
                label="Family Code (Optional)"
                value={formData.familyCode}
                onChange={(e) => setFormData({ ...formData, familyCode: e.target.value })}
                placeholder="Enter code to join existing family"
              />
            )}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isVolunteer}
                onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
                className="w-5 h-5"
              />
              <span>I want to volunteer</span>
            </label>
            <Button onClick={handleSendOtp} className="w-full">
              Send OTP
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Enter the OTP sent to {formData.email}
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
            <Button onClick={() => setStep(1)} variant="secondary" className="w-full">
              Back
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
            <Button onClick={handleRegister} className="w-full">
              Complete Registration
            </Button>
          </div>
        )}

        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-primary-600 hover:underline">
            Login
          </button>
        </p>
      </Card>
    </div>
  );
}
