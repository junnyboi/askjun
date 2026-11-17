/**
 * FeaturedProjectCard — a project with a thumbnail, tags, description and tech list.
 */
import { Github } from "lucide-react";
import type { FeaturedProject } from "@/data/projects";
import { cn } from "@/lib/utils";

interface FeaturedProjectCardProps {
  project: FeaturedProject;
}

export function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  const { title, description, tags, tech, image, link, github, liveDemo } = project;

  return (
    <div className="group overflow-hidden rounded-lg border border-border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-foreground hover:shadow-lg">
      <a
        href={liveDemo ? link : github || link}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video overflow-hidden bg-muted"
      >
        {/* Skeleton shown until the thumbnail loads */}
        <div className="absolute inset-0 animate-pulse bg-muted" />
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="relative z-10 h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
          onLoad={(e) => (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add("hidden")}
        />
        {liveDemo && (
          <span className="absolute right-2 top-2 z-20 rounded bg-foreground px-2 py-0.5 font-mono text-xs text-background">
            Live demo
          </span>
        )}
      </a>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <h3 className="scaled-heading font-semibold text-foreground transition-colors hover:text-accent">{title}</h3>
          </a>
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} on GitHub`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github size={16} aria-hidden />
          </a>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "scaled-xs rounded border px-1.5 py-0.5 font-mono",
                tag === "AI" ? "border-accent text-accent" : "border-border text-muted-foreground"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="scaled-body text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tech.map((t) => (
            <span key={t} className="scaled-xs rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
