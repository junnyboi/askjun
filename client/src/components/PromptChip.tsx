/**
 * PromptChip — a pill that asks its label as a question.
 * A leading "✦" (generative UI prompts) is drawn in the accent colour.
 * Long labels wrap; a scrolling row can force single-line chips from its container.
 */
interface PromptChipProps {
  label: string;
  onClick: () => void;
}

const SPARK = "✦ ";

export function PromptChip({ label, onClick }: PromptChipProps) {
  const hasSpark = label.startsWith(SPARK);

  return (
    <button
      type="button"
      onClick={onClick}
      className="max-w-full rounded-[18px] border border-border bg-background px-3.5 py-2 text-left font-mono text-[13px] text-foreground transition-colors hover:border-foreground active:scale-[0.98]"
    >
      {hasSpark && <span className="text-accent">{SPARK}</span>}
      {hasSpark ? label.slice(SPARK.length) : label}
    </button>
  );
}
