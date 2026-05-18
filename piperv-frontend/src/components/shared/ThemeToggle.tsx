import React from 'react';
import { useUiStore } from '../../store/uiStore';
import { Moon, Sun, Contrast } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useUiStore();

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('high-contrast');
    else setTheme('dark');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
      title={`Current theme: ${theme}`}
    >
      {theme === 'dark' && <Moon size={18} />}
      {theme === 'light' && <Sun size={18} />}
      {theme === 'high-contrast' && <Contrast size={18} />}
    </button>
  );
};
