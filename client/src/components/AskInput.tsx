/**
 * AskInput — the question box: textarea, voice input and send.
 * "hero" is the large box on the first screen; "docked" is the single-row
 * follow-up box under a conversation.
 */
import type { Dispatch, KeyboardEvent, Ref, SetStateAction } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { cn } from "@/lib/utils";

interface AskInputProps {
  ref?: Ref<HTMLTextAreaElement>;
  variant: "hero" | "docked";
  value: string;
  placeholder: string;
  /** True while an answer is streaming; sending is blocked */
  isBusy: boolean;
  onChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
}

const BOX_CLASSES = "rounded-xl border-[1.5px] border-foreground bg-background transition-shadow focus-within:ring-4 focus-within:ring-muted";
// 16px text keeps iOS from zooming the page when the field is focused
const TEXTAREA_CLASSES = "w-full min-w-0 resize-none bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground";

export function AskInput({ ref, variant, value, placeholder, isBusy, onChange, onSubmit }: AskInputProps) {
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    onResult: (transcript) => onChange((prev) => (prev ? `${prev} ${transcript}` : transcript)),
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const buttons = (
    <div className="flex shrink-0 items-center gap-1.5">
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-90",
            isListening
              ? "animate-pulse bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic size={16} aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || isBusy}
        aria-label="Send message"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:opacity-80 active:scale-90 disabled:opacity-30"
      >
        <ArrowUp size={16} aria-hidden />
      </button>
    </div>
  );

  if (variant === "docked") {
    return (
      <div className={cn(BOX_CLASSES, "flex items-end gap-2 py-2 pl-4 pr-2")}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Ask a follow-up question"
          rows={1}
          className={cn(TEXTAREA_CLASSES, "max-h-32 flex-1 py-1.5")}
        />
        {buttons}
      </div>
    );
  }

  return (
    <div className={cn(BOX_CLASSES, "relative")}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Ask a question about Jun"
        rows={2}
        className={cn(TEXTAREA_CLASSES, "block px-4 pb-14 pt-4 lg:min-h-[132px]")}
      />
      <div className="absolute bottom-2.5 right-2.5">{buttons}</div>
    </div>
  );
}
