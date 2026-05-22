/**
 * useFontScale — Manages font size scaling for accessibility.
 * Cycles through Default → Large → Extra Large.
 * Persists preference in localStorage and applies class to <html>.
 */

import { useState, useEffect, useCallback } from "react";

export type FontScale = "default" | "large" | "xlarge";

const SCALE_KEY = "askjun_font_scale";

export function useFontScale() {
  const [scale, setScale] = useState<FontScale>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem(SCALE_KEY) as FontScale) || "default";
  });

  useEffect(() => {
    document.documentElement.classList.remove("font-large", "font-xlarge");
    if (scale === "large") document.documentElement.classList.add("font-large");
    if (scale === "xlarge") document.documentElement.classList.add("font-xlarge");
    localStorage.setItem(SCALE_KEY, scale);
  }, [scale]);

  const cycleScale = useCallback(() => {
    setScale((prev) =>
      prev === "default" ? "large" : prev === "large" ? "xlarge" : "default"
    );
  }, []);

  return { scale, cycleScale };
}
