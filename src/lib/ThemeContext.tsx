import React, { createContext, useContext, ReactNode } from 'react';

type Theme = 'clean' | 'syndicate';

interface ThemeContextType {
  theme: Theme;
  isSyndicate: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ theme, children }: { theme: Theme, children: ReactNode }) {
  const isSyndicate = theme === 'syndicate';
  
  return (
    <ThemeContext.Provider value={{ theme, isSyndicate }}>
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
