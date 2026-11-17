/**
 * ChatActionButton — one labelled action under an answer (Copy, Regenerate, Share, Stop).
 */
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatActionButtonProps {
  icon: ReactNode;
  label: string;
  tooltip: string;
  /** "accent" marks the one action that interrupts (Stop) */
  tone?: "accent";
  onClick: () => void;
}

export function ChatActionButton({ icon, label, tooltip, tone, onClick }: ChatActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "-mx-2 inline-flex h-9 items-center gap-2 rounded-md px-2 font-mono text-[13px] transition-colors",
            tone === "accent"
              ? "text-accent hover:underline hover:underline-offset-4"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {icon}
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
