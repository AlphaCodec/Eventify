import React, { createContext, useContext, useState, useEffect } from 'react';

// Three modes:
//   'light'  → always light
//   'dark'   → always dark
//   'system' → follow OS preference (prefers-color-scheme)
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    // Restore saved preference, default to 'system'
    return localStorage.getItem('eventify_theme') || 'system';
  });

  // Derive the actual applied theme ('light' or 'dark') from mode + OS
  const [resolved, setResolved] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (currentMode) => {
      let isDark;
      if (currentMode === 'dark')   isDark = true;
      else if (currentMode === 'light') isDark = false;
      else isDark = mediaQuery.matches; // 'system'

      setResolved(isDark ? 'dark' : 'light');

      if (isDark) document.documentElement.classList.add('dark');
      else        document.documentElement.classList.remove('dark');
    };

    apply(mode);

    // Listen for OS theme changes when in system mode
    const handleOSChange = () => { if (mode === 'system') apply('system'); };
    mediaQuery.addEventListener('change', handleOSChange);
    return () => mediaQuery.removeEventListener('change', handleOSChange);
  }, [mode]);

  const setTheme = (newMode) => {
    setMode(newMode);
    localStorage.setItem('eventify_theme', newMode);
  };

  const isDark = resolved === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, resolved, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
