import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => {
    const newTheme = !state.isDark;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
    }
    return { isDark: newTheme };
  }),
  initTheme: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      const isDark = stored === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      set({ isDark });
    }
  },
}));

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
    useThemeStore.setState({ isDark: true });
  }
}
