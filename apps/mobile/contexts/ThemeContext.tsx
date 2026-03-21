import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_THEME, LIGHT_THEME } from '@farm/game-core';

type AnyTheme = typeof DARK_THEME | typeof LIGHT_THEME;

interface ThemeCtx {
  theme: AnyTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: DARK_THEME,
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('farm_theme').then(v => {
      if (v === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem('farm_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK_THEME : LIGHT_THEME, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
