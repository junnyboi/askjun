/**
 * FeaturedProjectCard — a project with a thumbnail, tags, description and tech list.
 * It links to the live site, or else the public repository; with neither it is not a link.
 */
import type { ReactNode } from "react";
import { Github, Lock } from "lucide-react";
import type { FeaturedProject } from "@/data/projects";
import { cn } from "@/lib/utils";

interface FeaturedProjectCardProps {
  project: FeaturedProject;
}

const THUMBNAIL_CLASSES = "relative block aspect-video overflow-hidden bg-muted";

export function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  const { title, description, tags, tech, image, demoUrl, repoUrl, isPrivate } = project;
  const primaryUrl = demoUrl ?? repoUrl;

  const thumbnail: ReactNode = (
    <>
      {/* Skeleton shown until the thumbnail loads */}
      <div className="absolute inset-0 animate-pulse bg-muted" />
      <img
        src={image}
        alt={title}
        loading="lazy"
        className={cn("relative z-10 h-full w-full object-cover", primaryUrl && "transition-all duration-500 ease-out group-hover:scale-105")}
        onLoad={(e) => (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add("hidden")}
      />
      {demoUrl && (
        <span className="absolute right-2 top-2 z-20 rounded bg-foreground px-2 py-0.5 font-mono text-xs text-background">
          Live demo
        </span>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-lg border border-border",
        primaryUrl && "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-foreground hover:shadow-lg"
      )}
    >
      {primaryUrl ? (
        <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className={THUMBNAIL_CLASSES}>
          {thumbnail}
        </a>
      ) : (
        <div className={THUMBNAIL_CLASSES}>{thumbnail}</div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="scaled-heading font-semibold text-foreground">
            {primaryUrl ? (
              <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">
                {title}
              </a>
            ) : (
              title
            )}
          </h3>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${title} on GitHub`}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github size={16} aria-hidden />
            </a>
          )}
          {isPrivate && (
            <span className="scaled-xs inline-flex shrink-0 items-center gap-1 font-mono text-muted-foreground">
              <Lock size={12} aria-hidden />
              Private repo
            </span>
          )}
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
