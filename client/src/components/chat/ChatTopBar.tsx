/**
 * ChatTopBar — the slim bar above the chat pane.
 * Below 1024px it also carries the identity, because the dossier pane is desktop-only.
 */
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { PROFILE } from "@/data/portfolio";
import { DownloadCVLink } from "@/components/DownloadCVLink";
import FontScaleToggle from "@/components/FontScaleToggle";
import { JunAvatar } from "@/components/JunAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";

interface ChatTopBarProps {
  hasMessages: boolean;
  onNewChat: () => void;
}

export function ChatTopBar({ hasMessages, onNewChat }: ChatTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 lg:px-10">
      <div className="flex min-w-0 items-center gap-2.5">
        {hasMessages ? (
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <JunAvatar size={32} className="rounded-full border border-border" />
            {/* The narrowest phones have room for the avatar only */}
            <span className="hidden truncate font-display text-base font-bold text-foreground min-[420px]:inline">
              {PROFILE.name}
            </span>
          </div>
        ) : (
          <Wordmark className="text-xl lg:hidden" />
        )}
        {hasMessages && (
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 font-mono text-[13px] text-foreground transition-colors hover:border-foreground active:scale-[0.98]"
          >
            <Plus size={14} aria-hidden />
            New chat
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:gap-4">
        {/* Before a conversation, small screens get Portfolio from the bottom bar instead */}
        <Link
          href="/portfolio"
          className={cn(
            "hidden font-mono text-[13px] text-foreground underline-offset-4 hover:underline lg:inline",
            hasMessages && "sm:inline"
          )}
        >
          Portfolio
        </Link>
        {/* On small screens the CV bar is hidden during a conversation, so keep a CV button here */}
        {hasMessages && <DownloadCVLink variant="icon" className="lg:hidden" />}
        {hasMessages && <FontScaleToggle />}
        <ThemeToggle />
      </div>
    </header>
  );
}
