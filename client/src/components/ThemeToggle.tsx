/*
 * ThemeToggle — Nothing Design
 * Minimal toggle switch for light/dark mode with sun/moon icons.
 */

import { useTheme } from "@/contexts/ThemeContext";
import { analytics } from "@/lib/analytics";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => { toggleTheme?.(); analytics.themeToggle(isDark ? 'light' : 'dark'); }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative w-12 h-6 rounded-full border border-border bg-muted transition-colors hover:border-muted-foreground"
    >
      {/* Track indicator */}
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-all duration-200 ease-out flex items-center justify-center ${
          isDark ? "left-[calc(100%-22px)]" : "left-0.5"
        }`}
      >
        {isDark ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-background">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-background">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
    </button>
  );
}
