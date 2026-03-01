'use client';

import { useEffect, useState } from 'react';
import { AgeGroup } from '@/types';
import { useUserStore } from '@/store/userStore';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const user = useUserStore((state) => state.user);
  const ageGroup = user?.ageGroup || 'adult';
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const themeClasses = {
    elderly: 'text-xl font-medium',
    adult: 'text-base',
    youth: 'text-base',
  };
  
  if (!mounted) {
    return <div className="min-h-screen text-base">{children}</div>;
  }
  
  return (
    <div className={`min-h-screen ${themeClasses[ageGroup]}`} data-theme={ageGroup}>
      {children}
    </div>
  );
}
