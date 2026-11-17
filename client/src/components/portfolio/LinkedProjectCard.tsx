/**
 * LinkedProjectCard — a compact project row that links out (game dev and side projects).
 * The marker shows a live demo (dot), a private repository (lock) or an external link (arrow).
 */
import { ArrowUpRight, Lock } from "lucide-react";
import type { LinkedProject } from "@/data/projects";

interface LinkedProjectCardProps {
  project: LinkedProject;
}

export function LinkedProjectCard({ project }: LinkedProjectCardProps) {
  const { title, description, tags, link, visibility, liveDemo } = project;

  let marker = <ArrowUpRight size={14} aria-hidden />;
  if (liveDemo) {
    marker = <span className="block h-2 w-2 rounded-full bg-green-600" aria-label="Live demo" />;
  } else if (visibility === "private") {
    marker = <Lock size={13} aria-label="Private repository" />;
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground"
    >
      <span className="mt-1.5 flex w-3.5 shrink-0 justify-center text-muted-foreground">{marker}</span>
      <div className="min-w-0">
        <h3 className="scaled-sm font-semibold text-foreground transition-colors group-hover:text-accent">{title}</h3>
        <p className="scaled-sm mt-0.5 text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="scaled-xs rounded border border-border px-1.5 py-0.5 font-mono text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>
    </a>
  );
}
