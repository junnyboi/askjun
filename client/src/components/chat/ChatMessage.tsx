/**
 * ChatMessage — one turn of the conversation.
 * User turns are a bubble on the right. askJun's answers are plain reading text
 * with any answer cards under them and one row of labelled actions.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";
import { BookOpen, Check, Copy, RotateCw, Share, Square } from "lucide-react";
import type { Message } from "@/hooks/useChatEngine";
import { copyText } from "@/lib/clipboard";
import { ChatActionButton } from "@/components/chat/ChatActionButton";
import { DownloadCVLink } from "@/components/DownloadCVLink";
import { ChatEducationTimeline, ChatMetricsCard, ChatSkillsChart, ChatTimeline } from "@/components/generative";

interface ChatMessageProps {
  message: Message;
  /** True for the newest message, the one that may still be streaming */
  isLast: boolean;
  isTyping: boolean;
  onRegenerate: (messageId: string) => void;
  onStop: () => void;
  onShare: () => void;
}

const ANSWER_TEXT_CLASSES =
  "chat-text text-foreground [&_strong]:font-semibold [&_strong]:text-accent [&_li]:ml-4 [&_li]:list-disc [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-opacity [&_a]:hover:opacity-70";

export function ChatMessage({ message, isLast, isTyping, onRegenerate, onStop, onShare }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (message.role === "user") {
    return (
      <div data-msg-id={message.id} className="flex justify-end">
        <div className="chat-text max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const isStreaming = isTyping && isLast;
  const hasContent = message.content.length > 0;

  const handleCopy = () => {
    copyText(message.content);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-msg-id={message.id}>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-[3px] bg-accent" aria-hidden />
        <span className="font-mono text-[13px] text-foreground">askJun</span>
      </div>

      {message.toolUse && message.toolUse.status && (
        <div className="mb-3 space-y-2">
          <p className="font-mono text-xs text-accent">✓ {message.toolUse.status}</p>
          <DownloadCVLink variant="outline" />
        </div>
      )}
      {message.toolUse && !message.toolUse.status && (
        <p className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-spin rounded-full border border-accent border-t-transparent" />
          {message.toolUse.action}
        </p>
      )}

      {hasContent && (
        <div className={ANSWER_TEXT_CLASSES}>
          <div className="animate-in fade-in duration-150">
            <Streamdown>{message.content}</Streamdown>
          </div>
          {isStreaming && <span className="ml-0.5 inline-block h-4 w-0.5 animate-blink bg-accent align-middle" />}
        </div>
      )}

      {!hasContent && isStreaming && !message.toolUse && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-4 items-end gap-[3px]" aria-hidden>
            {[0, 150, 300, 450].map((delay) => (
              <span
                key={delay}
                className="typing-bar h-full w-[3px] rounded-sm bg-accent"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <span className="animate-shimmer font-mono text-xs">thinking...</span>
        </div>
      )}

      {/* Answer cards and inline actions appear once the answer has finished */}
      {hasContent && !isTyping && (
        <>
          {message.showProfileImage && (
            <div className="mt-3 max-w-[280px] overflow-hidden rounded-lg border border-border">
              <img src="/profile-full.webp" alt="Jun Boh at Meta" className="h-auto w-full" />
            </div>
          )}
          {message.generativeUI === "timeline" && <ChatTimeline />}
          {message.generativeUI === "skills" && <ChatSkillsChart />}
          {message.generativeUI === "metrics" && <ChatMetricsCard />}
          {message.generativeUI === "education" && <ChatEducationTimeline />}
          {(message.showDownloadCV || message.showPortfolioLink) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.showDownloadCV && <DownloadCVLink variant="outline" />}
              {message.showPortfolioLink && (
                <Link
                  href="/portfolio"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 font-mono text-[13px] text-foreground transition-all hover:border-foreground active:scale-[0.98]"
                >
                  <BookOpen size={14} aria-hidden />
                  Portfolio
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 pl-2">
        {isStreaming && (
          <ChatActionButton
            icon={<Square size={13} fill="currentColor" aria-hidden />}
            label="Stop"
            tooltip="Stop generating"
            tone="accent"
            onClick={onStop}
          />
        )}
        {!isTyping && hasContent && (
          <ChatActionButton
            icon={copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            label={copied ? "Copied" : "Copy"}
            tooltip="Copy response to clipboard"
            onClick={handleCopy}
          />
        )}
        {!isTyping && (
          <ChatActionButton
            icon={<RotateCw size={15} aria-hidden />}
            label="Regenerate"
            tooltip="Regenerate response"
            onClick={() => onRegenerate(message.id)}
          />
        )}
        {!isTyping && hasContent && isLast && (
          <ChatActionButton
            icon={<Share size={15} aria-hidden />}
            label="Share"
            tooltip="Copy the whole conversation"
            onClick={onShare}
          />
        )}
      </div>
    </div>
  );
}
