/**
 * FontScaleToggle — "Aa" button that cycles font size: Default → Large → XL
 * Includes tooltip on hover showing current scale level.
 */

import { useFontScale } from "@/hooks/useFontScale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function FontScaleToggle() {
  const { scale, cycleScale } = useFontScale();

  const label = scale === "default" ? "Aa" : scale === "large" ? "Aa+" : "Aa++";
  const tooltipText = scale === "default"
    ? "Font size: Default"
    : scale === "large"
    ? "Font size: Large"
    : "Font size: Extra Large";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={cycleScale}
          aria-label={`${tooltipText} — click to change`}
          className={`px-2 py-1 text-[11px] font-mono border rounded-md transition-all active:scale-90 ${
            scale === "default"
              ? "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              : "border-accent text-accent"
          }`}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-mono">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
