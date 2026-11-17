/**
 * Wordmark — the askJun logotype. Always a plain link home; it never clears the chat.
 */
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link
      href="/"
      aria-label="askJun home"
      className={cn("font-mono text-foreground transition-opacity hover:opacity-70", className)}
    >
      ask<span className="text-accent">Jun</span>
    </Link>
  );
}
