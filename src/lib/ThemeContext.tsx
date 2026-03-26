import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isSyndicate: boolean;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setSyndicateMode: (active: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [isSyndicateMode, setIsSyndicateMode] = useState(false);

  const isSyndicate = isSyndicateMode;
  const isDark = theme === 'dark' && !isSyndicate;
  const isLight = theme === 'light' && !isSyndicate;

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (isSyndicateMode) return;
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setSyndicateMode = (active: boolean) => {
    setIsSyndicateMode(active);
  };

  return (
    <ThemeContext.Provider value={{
      theme: isSyndicate ? 'syndicate' as any : theme,
      isSyndicate,
      isDark,
      isLight,
      toggleTheme,
      setSyndicateMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
