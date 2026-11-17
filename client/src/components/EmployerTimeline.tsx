/**
 * EmployerTimeline — Jun's six employers, newest first. Each row asks about that role.
 */
import { EXPERIENCES } from "@/data/portfolio";
import { cn } from "@/lib/utils";

interface EmployerTimelineProps {
  onAsk: (prompt: string) => void;
}

export function EmployerTimeline({ onAsk }: EmployerTimelineProps) {
  const lastIndex = EXPERIENCES.length - 1;

  return (
    <ol>
      {EXPERIENCES.map((exp, i) => (
        <li key={exp.company}>
          <button
            type="button"
            onClick={() => onAsk(exp.askPrompt)}
            aria-label={`${exp.company}, ${exp.period}. Ask about this role`}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted lg:py-1.5"
          >
            {/* Dot and connecting line; the line runs through the row padding so it reads as one rail */}
            <span className="relative -my-2.5 flex w-2 shrink-0 items-center justify-center self-stretch lg:-my-1.5">
              <span
                className={cn(
                  "absolute w-px bg-foreground",
                  i === 0 ? "top-1/2" : "top-0",
                  i === lastIndex ? "bottom-1/2" : "bottom-0"
                )}
              />
              <span className={cn("relative h-2 w-2 rounded-full", i === 0 ? "bg-accent" : "bg-foreground")} />
            </span>
            <span className="scaled-sm min-w-0 flex-1 truncate font-medium text-foreground">{exp.company}</span>
            <span className="scaled-xs shrink-0 font-mono text-muted-foreground">{exp.period}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
