/*
 * ============================================================================
 * askJun Home — Split Dossier (Direction B)
 * Left (1024px and up): a permanent dossier with proof and the CV button.
 * Right: the chat. Below 1024px the dossier folds into the chat's first screen.
 * This file owns layout, scrolling and keyboard shortcuts; chat state lives in
 * useChatEngine.
 * ============================================================================
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowDown } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useChatEngine } from "@/hooks/useChatEngine";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AskInput } from "@/components/AskInput";
import { DossierPane } from "@/components/DossierPane";
import { DownloadCVLink } from "@/components/DownloadCVLink";
import { NewChatDialog } from "@/components/NewChatDialog";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatFollowUps } from "@/components/chat/ChatFollowUps";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatTopBar } from "@/components/chat/ChatTopBar";

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;
const DESKTOP_MIN_WIDTH = 1024;
// Gap kept above an answer when it is scrolled to the top of the pane, and the column's bottom padding
const ANSWER_TOP_GAP = 16;
const COLUMN_BOTTOM_PADDING = 40;

export default function Home() {
  const {
    messages, input, setInput, isTyping, streamingId, latestAnswerId, usedChips,
    hasMessages, handleSend, handleStopGenerating, handleRegenerate, handleShare, resetConversation,
  } = useChatEngine();
  usePageTitle("askJun — AI Portfolio");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showProfileZoom, setShowProfileZoom] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [paneHeight, setPaneHeight] = useState(0);

  // Read inside the window key handler, which is registered once
  const keyStateRef = useRef({ hasMessages, showProfileZoom, isNewChatDialogOpen });
  keyStateRef.current = { hasMessages, showProfileZoom, isNewChatDialogOpen };

  const lastMessage = messages[messages.length - 1];
  const canShowFollowUps =
    !isTyping && messages.length >= 2 && lastMessage?.role === "assistant" && lastMessage.content.length > 0;

  // From the second exchange on, the newest answer is given enough room below it to be
  // scrolled to the top of the pane even while it is still short.
  const latestMinHeight =
    messages.length > 2 ? Math.max(0, paneHeight - ANSWER_TOP_GAP - COLUMN_BOTTOM_PADDING) : undefined;

  const ask = (prompt: string) => {
    if (isTyping) return; // one answer at a time; an ignored click is not a question asked
    analytics.chipClick(prompt);
    handleSend(prompt);
  };

  const confirmNewChat = () => {
    resetConversation();
    setInput("");
    setIsNewChatDialogOpen(false);
  };

  // Track the height of the conversation pane
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setPaneHeight(container.clientHeight));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Track whether the reader is away from the bottom of the conversation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleContainerScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom && hasMessages);
    };
    container.addEventListener("scroll", handleContainerScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleContainerScroll);
  }, [hasMessages]);

  // Re-check when content grows during streaming
  useEffect(() => {
    if (!scrollRef.current || !hasMessages) return;
    const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isAtBottom);
  }, [messages, hasMessages]);

  // Focus the input on desktop, on load and whenever the hero and docked inputs swap.
  // Skipped on small screens so the on-screen keyboard doesn't open unasked.
  useEffect(() => {
    if (window.innerWidth >= DESKTOP_MIN_WIDTH) inputRef.current?.focus();
  }, [hasMessages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = keyStateRef.current;
      const activeTag = document.activeElement?.tagName;

      // Cmd/Ctrl+K → focus input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      // "/" → focus input (only if not already typing somewhere)
      if (e.key === "/" && activeTag !== "TEXTAREA" && activeTag !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      // Escape → close the portrait first; otherwise ask before clearing the chat.
      // An open dialog or tooltip handles Escape itself and marks the event as
      // handled; skipping those keeps this from reopening the dialog it just closed.
      if (e.key === "Escape") {
        if (e.defaultPrevented) return;
        if (state.showProfileZoom) {
          setShowProfileZoom(false);
        } else if (!state.isNewChatDialogOpen && state.hasMessages) {
          setIsNewChatDialogOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Scroll once so the newest answer starts at the top of the pane, then hold while it streams
  const scrolledAnswerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const answer = messages.find(m => m.id === latestAnswerId);
    // Wait for the first word
    if (!container || !answer || !answer.content || scrolledAnswerIdRef.current === answer.id) return;
    scrolledAnswerIdRef.current = answer.id;

    // Double rAF so the content has painted before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const answerEl = container.querySelector(`[data-msg-id="${answer.id}"]`);
        if (!answerEl) return;
        const offset = answerEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTo({ top: container.scrollTop + offset - ANSWER_TOP_GAP, behavior: "smooth" });
      });
    });
  }, [messages, latestAnswerId]);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Subtle background grain texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]"
        style={{ backgroundImage: GRAIN_TEXTURE }}
      />

      <DossierPane onAsk={ask} onZoomPortrait={() => setShowProfileZoom(true)} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <ChatTopBar hasMessages={hasMessages} onNewChat={() => setIsNewChatDialogOpen(true)} />

        <main className="relative flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {hasMessages ? (
              <div className="px-4 lg:px-10">
                <div className="mx-auto w-full max-w-[720px] space-y-8 pb-10 pt-4">
                  {messages.map((msg) => {
                    const isLatestAnswer = msg === lastMessage && msg.role === "assistant";
                    return (
                      <div key={msg.id} className="space-y-8" style={isLatestAnswer ? { minHeight: latestMinHeight } : undefined}>
                        <ChatMessage
                          message={msg}
                          isLast={msg === lastMessage}
                          isStreaming={msg.id === streamingId}
                          isTyping={isTyping}
                          onRegenerate={handleRegenerate}
                          onStop={handleStopGenerating}
                          onShare={handleShare}
                        />
                        {isLatestAnswer && canShowFollowUps && (
                          <ChatFollowUps messages={messages} usedChips={usedChips} onAsk={ask} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <ChatEmptyState
                inputRef={inputRef}
                input={input}
                isTyping={isTyping}
                onInputChange={setInput}
                onSubmit={() => handleSend()}
                onAsk={ask}
                onZoomPortrait={() => setShowProfileZoom(true)}
              />
            )}
          </div>

          {/* Floating scroll-to-bottom button */}
          <AnimatePresence>
            {showScrollToBottom && hasMessages && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                }}
                className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 font-mono text-xs text-background shadow-lg transition-opacity hover:opacity-80 active:scale-95"
              >
                <ArrowDown size={13} aria-hidden />
                Scroll to bottom
              </motion.button>
            )}
          </AnimatePresence>

          {/* Docked follow-up input */}
          {hasMessages && (
            <div className="shrink-0 px-4 pb-4 pt-2 lg:px-10 lg:pb-6">
              <div className="mx-auto w-full max-w-[720px]">
                <AskInput
                  ref={inputRef}
                  variant="docked"
                  value={input}
                  placeholder="Ask a follow-up..."
                  isBusy={isTyping}
                  onChange={setInput}
                  onSubmit={() => handleSend()}
                />
              </div>
            </div>
          )}
        </main>

        {/* Small screens: the CV stays one tap away before a conversation starts */}
        {!hasMessages && (
          <div className="flex shrink-0 gap-3 border-t border-border bg-background px-4 py-3 lg:hidden">
            <DownloadCVLink variant="primary" className="flex-1" />
            <Link
              href="/portfolio"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-foreground px-5 font-mono text-sm text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
            >
              Portfolio
            </Link>
          </div>
        )}
      </div>

      <NewChatDialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen} onConfirm={confirmNewChat} />

      {/* Portrait zoom */}
      <AnimatePresence>
        {showProfileZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowProfileZoom(false)}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              src="/avatar/jun-960.webp"
              alt="Jun Boh"
              className="max-h-[80vh] max-w-[80vw] rounded-xl object-cover shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
