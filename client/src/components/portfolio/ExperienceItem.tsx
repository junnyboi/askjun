/**
 * ExperienceItem — one role on the Portfolio page.
 * Shows the first two bullets; the rest sit behind "Show all" so the page scans quickly.
 */
import { useState } from "react";
import type { Experience } from "@/data/portfolio";

interface ExperienceItemProps {
  experience: Experience;
}

const PREVIEW_BULLETS = 2;

export function ExperienceItem({ experience }: ExperienceItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { company, role, location, period, bullets } = experience;
  const hiddenCount = bullets.length - PREVIEW_BULLETS;
  const visibleBullets = isExpanded ? bullets : bullets.slice(0, PREVIEW_BULLETS);

  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="scaled-heading font-semibold text-foreground">{company}</h3>
        <span className="scaled-xs whitespace-nowrap font-mono text-muted-foreground">{period}</span>
      </div>
      <p className="scaled-sm mt-0.5 text-muted-foreground">{role} · {location}</p>
      <ul className="mt-3 space-y-2">
        {visibleBullets.map((bullet) => (
          <li
            key={bullet}
            className="scaled-body relative pl-4 text-foreground before:absolute before:left-0 before:text-accent before:content-['·']"
          >
            {bullet}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="scaled-xs mt-3 font-mono text-foreground underline underline-offset-4 hover:text-accent"
        >
          {isExpanded ? "Show less" : `Show all ${bullets.length}`}
        </button>
      )}
    </div>
  );
}
