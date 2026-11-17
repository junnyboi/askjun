/**
 * JunAvatar — the single studio portrait used across the site.
 * Served from /avatar as small WebP files; the browser picks the size it needs.
 */
import { cn } from "@/lib/utils";

interface JunAvatarProps {
  /** Rendered width and height in CSS pixels */
  size: number;
  className?: string;
}

export function JunAvatar({ size, className }: JunAvatarProps) {
  return (
    <img
      src="/avatar/jun-320.webp"
      srcSet="/avatar/jun-96.webp 96w, /avatar/jun-320.webp 320w, /avatar/jun-640.webp 640w"
      sizes={`${size}px`}
      width={size}
      height={size}
      alt="Jun Boh"
      decoding="async"
      className={cn("shrink-0 bg-muted object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
