import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'syndicate';

interface ThemeContextType {
  theme: Theme;
  isSyndicate: boolean;
  isDark: boolean;
  isLight: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'dark';
  });

  const isSyndicate = theme === 'syndicate';
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isSyndicate, isDark, isLight, setTheme }}>
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
