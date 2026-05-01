/*
 * ChatPanel — Nothing Design
 * Flat, bordered, no message bubbles. Left-border accent for assistant messages.
 * Borderless input with bottom-line. Mechanical typing indicator.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { CHAT_SUGGESTIONS } from "@/data/portfolio";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello. I'm Jun's AI assistant. Ask me anything about his experience, skills, or career.\n\nI can tell you about his work at **Meta**, **HoYoverse**, **TikTok**, or **Bank of Singapore**.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = trpc.chat.send.useMutation();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, toolUse?: { action: string; status: string }) => {
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex += Math.floor(Math.random() * 4) + 2;
        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          clearInterval(interval);
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText, toolUse } : m));
          setIsTyping(false);
        } else {
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText.slice(0, charIndex) } : m));
        }
      }, 8);
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;

      const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: query };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      try {
        const apiMessages = updatedMessages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }));
        const result = await chatMutation.mutateAsync({ messages: apiMessages });
        const isToolUse = shouldSimulateToolUse(query);
        if (isToolUse) {
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, toolUse: { action: "Retrieving document...", status: "" } } : m));
          setTimeout(() => simulateStreaming(result.content, assistantMsgId, { action: "Retrieving document...", status: "Done" }), 1000);
        } else {
          simulateStreaming(result.content, assistantMsgId);
        }
      } catch {
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined);
      }
    },
    [input, isTyping, messages, chatMutation, simulateStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 h-[85vh] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto sm:w-[440px] sm:h-[680px] sm:max-h-[85vh]"
          >
            <div className="h-full flex flex-col bg-background border border-border">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">askJun AI</h3>
                  <p className="text-xs font-mono text-muted-foreground">
                    {isTyping ? "processing..." : "powered by deepseek"}
                  </p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity" aria-label="Close chat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                    <div className={`inline-block text-left max-w-[90%] ${
                      msg.role === "assistant" ? "border-l-2 border-accent pl-4" : ""
                    }`}>
                      {msg.toolUse && msg.toolUse.status && (
                        <div className="text-xs font-mono text-accent mb-2">✓ {msg.toolUse.status}</div>
                      )}
                      {msg.toolUse && !msg.toolUse.status && (
                        <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 border border-accent border-t-transparent rounded-full animate-spin" />
                          {msg.toolUse.action}
                        </div>
                      )}
                      <div className="text-sm leading-relaxed text-foreground [&_strong]:text-accent [&_strong]:font-semibold">
                        {msg.content ? (
                          <>
                            <Streamdown>{msg.content}</Streamdown>
                            {isTyping && msg === messages[messages.length - 1] && msg.role === "assistant" && msg.content.length > 0 && (
                              <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-blink align-middle" />
                            )}
                          </>
                        ) : (
                          isTyping && msg.role === "assistant" && !msg.toolUse && (
                            <div className="flex gap-1.5 py-1">
                              <span className="w-1 h-1 bg-muted-foreground" style={{ animation: "blink 1s step-end infinite" }} />
                              <span className="w-1 h-1 bg-muted-foreground" style={{ animation: "blink 1s step-end infinite 0.2s" }} />
                              <span className="w-1 h-1 bg-muted-foreground" style={{ animation: "blink 1s step-end infinite 0.4s" }} />
                            </div>
                          )
                        )}
                      </div>
                      {msg.role === "user" && (
                        <span className="text-[10px] font-mono text-muted-foreground mt-1 block">you</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {messages.length <= 2 && (
                <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                  {CHAT_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} className="text-xs font-mono px-2.5 py-1 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-5 pb-5 pt-3 border-t border-border">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Jun..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none border-b border-border focus:border-accent transition-colors pb-1 max-h-20"
                    style={{ minHeight: "24px" }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="shrink-0 w-8 h-8 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-opacity active:scale-95"
                    aria-label="Send message"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4z" /><path d="m22 2-11 11" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-3 font-mono">
                  powered by deepseek · responses based on professional profile
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
