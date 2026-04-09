'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse"></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative flex items-center justify-center p-2 rounded-full overflow-hidden transition-all bg-white/5 border border-white/10 text-gray-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 dark:bg-black/20 dark:border-white/10 dark:hover:bg-rose-500/20"
      aria-label="Alternar Tema"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
