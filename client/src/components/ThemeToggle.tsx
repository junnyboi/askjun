/*
 * ThemeToggle — Nothing Design
 * Minimal ●/○ toggle for light/dark mode.
 * Filled circle = dark mode, outline circle = light mode.
 */

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity"
    >
      {theme === "dark" ? (
        // Filled circle = dark mode active
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="6" />
        </svg>
      ) : (
        // Outline circle = light mode active
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
        </svg>
      )}
    </button>
  );
}
