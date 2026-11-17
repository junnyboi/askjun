/**
 * DossierPane — the permanent left pane on desktop (Direction B, Split Dossier).
 * Proof and the CV button stay on screen while the conversation runs on the right.
 * Metric tiles and employer rows ask their question when clicked.
 */
import { HEADLINE_HIGHLIGHTS, PROFILE } from "@/data/portfolio";
import { DownloadCVLink } from "@/components/DownloadCVLink";
import { EmployerTimeline } from "@/components/EmployerTimeline";
import { JunAvatar } from "@/components/JunAvatar";
import { MetricTile } from "@/components/MetricTile";
import { Wordmark } from "@/components/Wordmark";

interface DossierPaneProps {
  onAsk: (prompt: string) => void;
  onZoomPortrait: () => void;
}

const CONTACT_LINK_CLASSES = "font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground";

export function DossierPane({ onAsk, onZoomPortrait }: DossierPaneProps) {
  return (
    <aside className="relative z-10 hidden w-[380px] shrink-0 flex-col border-r border-border bg-card lg:flex xl:w-[440px]">
      <div className="flex-1 space-y-5 overflow-y-auto px-7 pb-5 pt-5">
        <Wordmark className="inline-block text-xl" />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onZoomPortrait}
            aria-label="Enlarge portrait"
            className="shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-border transition-opacity hover:opacity-90"
          >
            <JunAvatar size={104} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight text-foreground">{PROFILE.name}</h1>
            <p className="mt-1 font-mono text-[13px] leading-snug text-foreground">{PROFILE.title}</p>
            <p className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" aria-hidden />
              Available for hire · {PROFILE.location}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {HEADLINE_HIGHLIGHTS.map((h) => (
            <MetricTile key={h.metric} metric={h.metric} label={h.label} onAsk={() => onAsk(h.prompt)} />
          ))}
        </div>

        <div className="-mx-2">
          <EmployerTimeline onAsk={onAsk} />
        </div>
      </div>

      {/* Pinned, so the CV button is on screen at every moment */}
      <div className="shrink-0 space-y-3 border-t border-border px-7 pb-5 pt-4">
        <DownloadCVLink variant="primary" className="w-full" />
        <div className="flex items-center justify-center gap-6">
          <a href={`mailto:${PROFILE.email}`} className={CONTACT_LINK_CLASSES}>Email</a>
          <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>LinkedIn</a>
          <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>GitHub</a>
        </div>
      </div>
    </aside>
  );
}
