/**
 * useChatEngine — Encapsulates all chat logic:
 * - Message state management
 * - tRPC API calls with client-side fallback
 * - Simulated streaming with typing variation
 * - Appearance query detection (Easter egg)
 * - Used chips tracking
 * - Share conversation
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
  showProfileImage?: boolean;
  retrievalType?: "keyword" | "semantic" | "fallback";
}

const APPEARANCE_KEYWORDS = [
  "handsome", "good looking", "good-looking", "attractive", "cute",
  "hot", "gorgeous", "pretty", "beautiful", "appearance",
  "look like", "looks like", "what does he look",
];

export function useChatEngine() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());

  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const chatMutation = trpc.chat.send.useMutation();
  const chatStats = trpc.chat.stats.useQuery(undefined, { refetchInterval: 30000 });

  // Cleanup streaming timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
    };
  }, []);

  // Typing variation: variable speed with pauses at punctuation
  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, toolUse?: { action: string; status: string }, showProfileImage?: boolean) => {
      let charIndex = 0;
      const baseSpeed = 8;

      const tick = () => {
        const char = fullText[charIndex] || "";
        const isPunctuation = ".!?,;:".includes(char);
        const variation = Math.floor(Math.random() * 4) + 2;
        charIndex += variation;

        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText, toolUse, showProfileImage } : m));
          setIsTyping(false);
          return;
        }

        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText.slice(0, charIndex) } : m));

        const delay = isPunctuation ? baseSpeed * 6 : baseSpeed + Math.random() * 6 - 3;
        streamingTimeoutRef.current = setTimeout(tick, delay);
      };

      streamingTimeoutRef.current = setTimeout(tick, baseSpeed);
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;
      analytics.chatMessage(query);
      setUsedChips((prev) => new Set(prev).add(query));

      const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: query };
      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      // Detect appearance/handsome queries
      const lowerQuery = query.toLowerCase();
      const isAppearanceQuery = APPEARANCE_KEYWORDS.some(kw => lowerQuery.includes(kw));

      try {
        const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
        const result = await chatMutation.mutateAsync({ messages: apiMessages });
        const retrievalType = (result as any).retrievalType as "keyword" | "semantic" | undefined;
        const isToolUse = shouldSimulateToolUse(query);
        if (isToolUse) {
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, toolUse: { action: "Retrieving document...", status: "" }, retrievalType: retrievalType || "semantic" } : m));
          setTimeout(() => simulateStreaming(result.content, assistantMsgId, { action: "Retrieving document...", status: "Done" }), 1000);
        } else {
          // Set retrievalType on the message immediately, then stream content
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, retrievalType: retrievalType || "semantic" } : m));
          simulateStreaming(result.content, assistantMsgId, undefined, isAppearanceQuery || undefined);
        }
      } catch {
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);
        setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, retrievalType: "fallback" } : m));
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined, isAppearanceQuery || response.showProfileImage);
      }
    },
    [input, isTyping, chatMutation, simulateStreaming]
  );

  const handleShare = useCallback(() => {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "You" : "askJun"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(transcript);
    analytics.shareConversation();
    toast.success("Conversation copied to clipboard!");
  }, [messages]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setUsedChips(new Set());
  }, []);

  return {
    messages,
    input,
    setInput,
    isTyping,
    usedChips,
    chatStats,
    hasMessages: messages.length > 0,
    handleSend,
    handleShare,
    resetConversation,
  };
}
