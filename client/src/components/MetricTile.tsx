/**
 * MetricTile — one headline number with its label.
 * With onAsk it is a button that asks about the metric; without it, a static tile.
 */
import { ArrowUpRight } from "lucide-react";

interface MetricTileProps {
  metric: string;
  label: string;
  onAsk?: () => void;
}

const TILE_CLASSES = "relative flex w-full flex-col rounded-lg border border-border bg-background px-4 py-3 text-left";

export function MetricTile({ metric, label, onAsk }: MetricTileProps) {
  const content = (
    <>
      <span className="scaled-metric font-mono font-bold text-foreground">{metric}</span>
      <span className="scaled-xs mt-1 text-muted-foreground">{label}</span>
    </>
  );

  if (!onAsk) {
    return <div className={TILE_CLASSES}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onAsk}
      aria-label={`${metric}, ${label}. Ask about this`}
      className={`${TILE_CLASSES} group transition-colors hover:border-foreground active:scale-[0.99]`}
    >
      {content}
      <ArrowUpRight
        size={14}
        aria-hidden
        className="absolute right-2.5 top-2.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </button>
  );
}
