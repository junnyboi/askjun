/**
 * FontScaleToggle — "Aa" button that cycles font size: Default → Large → XL
 * Matches the ThemeToggle visual style.
 */

import { useFontScale } from "@/hooks/useFontScale";

export default function FontScaleToggle() {
  const { scale, cycleScale } = useFontScale();

  const label = scale === "default" ? "Aa" : scale === "large" ? "Aa+" : "Aa++";
  const title = scale === "default"
    ? "Font size: Default (click for larger)"
    : scale === "large"
    ? "Font size: Large (click for extra large)"
    : "Font size: Extra Large (click for default)";

  return (
    <button
      onClick={cycleScale}
      title={title}
      aria-label={title}
      className={`px-2 py-1 text-[11px] font-mono border rounded-md transition-all active:scale-90 ${
        scale === "default"
          ? "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          : "border-accent text-accent"
      }`}
    >
      {label}
    </button>
  );
}
