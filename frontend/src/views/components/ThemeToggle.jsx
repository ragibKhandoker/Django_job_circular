import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../controllers/ThemeController.jsx';

/** Sun/moon button that switches between day and night mode. */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to day mode' : 'Switch to night mode';

  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
