/**
 * useChatEngine — Encapsulates all chat logic:
 * - Message state management
 * - SSE streaming for semantic (LLM) responses
 * - Simulated streaming for keyword (instant) and fallback responses
 * - Appearance query detection (Easter egg)
 * - Used chips tracking
 * - Share conversation
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";
import { detectGenerativeUI, type GenerativeUIType } from "@/components/generative";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
  showProfileImage?: boolean;
  showDownloadCV?: boolean;
  showPortfolioLink?: boolean;
  retrievalType?: "keyword" | "semantic" | "fallback";
  generativeUI?: GenerativeUIType;
}

const APPEARANCE_KEYWORDS = [
  "handsome", "good looking", "good-looking", "attractive", "cute",
  "hot", "gorgeous", "pretty", "beautiful", "appearance",
  "look like", "looks like", "what does he look",
  "how does jun look", "how does he look", "jun look", "does he look like",
];

function fallbackCopyToClipboard(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try { document.execCommand("copy"); } catch { /* silent */ }
  document.body.removeChild(textarea);
}

export function useChatEngine() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());

  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Simulated streaming for keyword/fallback responses (no real LLM stream)
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

  // Real SSE streaming from the server
  const streamFromServer = useCallback(
    async (apiMessages: Array<{ role: string; content: string }>, msgId: string, isAppearanceQuery: boolean) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortController.signal,
        });

        // If the response is JSON (keyword/error), handle it directly
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (data.type === "structured") {
            setMessages((prev) => prev.map((m) => m.id === msgId ? {
              ...m,
              content: data.content,
              retrievalType: "keyword",
              showProfileImage: isAppearanceQuery || undefined,
            } : m));
            setIsTyping(false);
            return;
          }
          // Error response
          setMessages((prev) => prev.map((m) => m.id === msgId ? {
            ...m,
            content: data.content || "Something went wrong.",
            retrievalType: "semantic",
          } : m));
          setIsTyping(false);
          return;
        }

        // SSE stream — parse token by token
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "meta") {
                // Set retrieval type
                setMessages((prev) => prev.map((m) => m.id === msgId ? {
                  ...m,
                  retrievalType: parsed.retrievalType || "semantic",
                  showProfileImage: isAppearanceQuery || undefined,
                } : m));
              } else if (parsed.type === "token") {
                // Append token to content
                fullContent += parsed.content;
                setMessages((prev) => prev.map((m) => m.id === msgId ? {
                  ...m,
                  content: fullContent,
                } : m));
              } else if (parsed.type === "replace") {
                // Output validation triggered — replace entire content
                fullContent = parsed.content;
                setMessages((prev) => prev.map((m) => m.id === msgId ? {
                  ...m,
                  content: fullContent,
                } : m));
              } else if (parsed.type === "done") {
                // Stream complete
                setMessages((prev) => prev.map((m) => m.id === msgId ? {
                  ...m,
                  content: fullContent || parsed.fullContent,
                } : m));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        setIsTyping(false);
      } catch (err: any) {
        if (err?.name === "AbortError") return; // User navigated away
        throw err; // Let the caller handle with fallback
      }
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

      // Detect appearance/handsome queries and generative UI
      const lowerQuery = query.toLowerCase();
      const isAppearanceQuery = APPEARANCE_KEYWORDS.some(kw => lowerQuery.includes(kw));
      const generativeUIType = detectGenerativeUI(query);

      // Detect if we should show action buttons
      const CV_KEYWORDS = ["resume", "cv", "download cv", "pdf", "download his", "give me his cv"];
      const PORTFOLIO_KEYWORDS = ["portfolio", "experience", "projects", "what is askjun", "about this site", "about askjun", "what are you", "who are you"];
      const showDownloadCV = CV_KEYWORDS.some(kw => lowerQuery.includes(kw));
      const showPortfolioLink = PORTFOLIO_KEYWORDS.some(kw => lowerQuery.includes(kw));

      // Set generativeUI type and action buttons on the message immediately
      if (generativeUIType || showDownloadCV || showPortfolioLink) {
        setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? {
          ...m,
          ...(generativeUIType ? { generativeUI: generativeUIType } : {}),
          ...(showDownloadCV ? { showDownloadCV: true } : {}),
          ...(showPortfolioLink ? { showPortfolioLink: true } : {}),
        } : m));
      }

      try {
        // Use SSE streaming endpoint
        const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
        await streamFromServer(apiMessages, assistantMsgId, isAppearanceQuery);
      } catch {
        // Fallback to client-side engine if SSE fails
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);
        setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, retrievalType: "fallback" } : m));
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined, isAppearanceQuery || response.showProfileImage);
      }
    },
    [input, isTyping, streamFromServer, simulateStreaming]
  );

  const handleShare = useCallback(() => {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "You" : "askJun"}: ${m.content}`)
      .join("\n\n");
    // Clipboard with fallback for insecure contexts
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(transcript).catch(() => {
        fallbackCopyToClipboard(transcript);
      });
    } else {
      fallbackCopyToClipboard(transcript);
    }
    analytics.shareConversation();
    toast.success("Conversation copied to clipboard!");
  }, [messages]);

  const handleStopGenerating = useCallback(() => {
    // Abort the active SSE stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear any simulated streaming timeout
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    setIsTyping(false);
  }, []);

  const handleRegenerate = useCallback(
    async (assistantMsgId: string) => {
      if (isTyping) return;

      // Find the user message that preceded this assistant message
      const msgIndex = messagesRef.current.findIndex(m => m.id === assistantMsgId);
      if (msgIndex <= 0) return;
      const userMsg = messagesRef.current[msgIndex - 1];
      if (!userMsg || userMsg.role !== "user") return;

      // Remove the old assistant response and replace with a new empty placeholder
      const newAssistantId = `assistant-${Date.now()}`;
      const messagesWithoutOld = messagesRef.current.filter(m => m.id !== assistantMsgId);
      setMessages([...messagesWithoutOld, { id: newAssistantId, role: "assistant", content: "" }]);
      setIsTyping(true);

      // Detect appearance/generative UI for the original query
      const lowerQuery = userMsg.content.toLowerCase();
      const isAppearanceQuery = APPEARANCE_KEYWORDS.some(kw => lowerQuery.includes(kw));
      const generativeUIType = detectGenerativeUI(userMsg.content);
      if (generativeUIType) {
        setMessages((prev) => prev.map((m) => m.id === newAssistantId ? { ...m, generativeUI: generativeUIType } : m));
      }

      try {
        // Re-send with all messages up to (but not including) the old assistant response
        const apiMessages = messagesWithoutOld.map((m) => ({ role: m.role, content: m.content }));
        await streamFromServer(apiMessages, newAssistantId, isAppearanceQuery);
      } catch {
        const isToolUse = shouldSimulateToolUse(userMsg.content);
        const response = isToolUse ? getToolUseResponse() : getResponse(userMsg.content);
        setMessages((prev) => prev.map((m) => m.id === newAssistantId ? { ...m, retrievalType: "fallback" } : m));
        simulateStreaming(response.text, newAssistantId, isToolUse ? response.toolUse : undefined, isAppearanceQuery || response.showProfileImage);
      }
    },
    [isTyping, streamFromServer, simulateStreaming]
  );

  const resetConversation = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setMessages([]);
    setUsedChips(new Set());
  }, []);

  return {
    messages,
    input,
    setInput,
    isTyping,
    usedChips,
    hasMessages: messages.length > 0,
    handleSend,
    handleStopGenerating,
    handleRegenerate,
    handleShare,
    resetConversation,
  };
}
