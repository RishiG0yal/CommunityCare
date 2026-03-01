import { create } from 'zustand';
import { User } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const updateStorage = (updates: Partial<{ user: User | null; token: string | null }>) => {
  if (typeof window === 'undefined') return;
  const current = JSON.parse(localStorage.getItem('user-storage') || '{}');
  localStorage.setItem('user-storage', JSON.stringify({ ...current, ...updates }));
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => {
    set({ user });
    updateStorage({ user });
  },
  setToken: (token) => {
    set({ token });
    updateStorage({ token });
  },
  logout: () => {
    set({ user: null, token: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-storage');
    }
  },
}));

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('user-storage');
  if (stored) {
    const { user, token } = JSON.parse(stored);
    useUserStore.setState({ user, token });
  }
}
