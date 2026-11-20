/**
 * LinkedProjectCard — a compact project row (game dev and side projects).
 * It links to the live site, or else the public repository; with neither it is not a link.
 * The marker shows a live demo (dot), a private repository (lock) or an external link (arrow).
 */
import type { ReactNode } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import type { LinkedProject } from "@/data/projects";
import { cn } from "@/lib/utils";

interface LinkedProjectCardProps {
  project: LinkedProject;
}

const CARD_CLASSES = "group flex items-start gap-3 rounded-lg border border-border p-4";

export function LinkedProjectCard({ project }: LinkedProjectCardProps) {
  const { title, description, tags, demoUrl, repoUrl, isPrivate } = project;
  const url = demoUrl ?? repoUrl;

  let marker: ReactNode = null;
  if (demoUrl) {
    marker = <span className="block h-2 w-2 rounded-full bg-green-600" role="img" aria-label="Live demo" />;
  } else if (repoUrl) {
    marker = <ArrowUpRight size={14} aria-hidden />;
  } else if (isPrivate) {
    marker = <Lock size={13} role="img" aria-label="Private repository" />;
  }

  const body = (
    <>
      <span className="mt-1.5 flex w-3.5 shrink-0 justify-center text-muted-foreground">{marker}</span>
      <div className="min-w-0">
        <h3 className={cn("scaled-sm font-semibold text-foreground", url && "transition-colors group-hover:text-accent")}>{title}</h3>
        <p className="scaled-sm mt-0.5 text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="scaled-xs rounded border border-border px-1.5 py-0.5 font-mono text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>
    </>
  );

  if (!url) return <div className={CARD_CLASSES}>{body}</div>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(CARD_CLASSES, "transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground")}
    >
      {body}
    </a>
  );
}
