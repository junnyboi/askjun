/**
 * DownloadCVLink — the one CV download control. Every instance goes through
 * downloadCV(), which checks the PDF is reachable before downloading.
 */
import { Download } from "lucide-react";
import { CV_FILENAME, CV_URL, downloadCV } from "@/lib/downloadCV";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  primary: "h-11 gap-2 rounded-lg bg-foreground px-4 text-sm text-background hover:opacity-85",
  outline: "h-9 gap-1.5 rounded-full border border-border px-3.5 text-[13px] text-foreground hover:border-foreground",
  icon: "h-9 w-9 rounded-full border border-border text-foreground hover:border-foreground",
};

interface DownloadCVLinkProps {
  variant: keyof typeof VARIANT_CLASSES;
  className?: string;
}

export function DownloadCVLink({ variant, className }: DownloadCVLinkProps) {
  return (
    <a
      href={CV_URL}
      download={CV_FILENAME}
      onClick={downloadCV}
      aria-label={variant === "icon" ? "Download CV" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-mono transition-all active:scale-[0.98]",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <Download size={14} aria-hidden />
      {variant !== "icon" && "Download CV"}
    </a>
  );
}
