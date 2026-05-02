/*
 * Analytics utility — dual tracking:
 * 1. Umami (client-side, production only)
 * 2. Server-side tRPC endpoint (stores in DB for admin dashboard)
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

// Generate a session ID for this browser session
const SESSION_ID = (() => {
  let id = sessionStorage.getItem("askjun_session");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("askjun_session", id);
  }
  return id;
})();

// Send to server via fetch (non-blocking, fire-and-forget)
function trackServer(event: string, data?: string) {
  fetch("/api/trpc/track.event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ json: { event, data, sessionId: SESSION_ID } }),
  }).catch(() => {}); // Silent fail
}

export function trackEvent(event: string, data?: string | Record<string, string | number>) {
  // Umami (client-side)
  if (typeof window !== "undefined" && window.umami) {
    const umamiData = typeof data === "string" ? { value: data } : data;
    window.umami.track(event, umamiData);
  }
  // Server-side DB tracking
  const dataStr = typeof data === "string" ? data : data ? JSON.stringify(data) : undefined;
  trackServer(event, dataStr);
}

// Pre-defined event helpers
export const analytics = {
  cvDownload: () => trackEvent("cv_download"),
  chatMessage: (query: string) => trackEvent("chat_message", query.slice(0, 200)),
  chipClick: (chip: string) => trackEvent("chip_click", chip),
  shareConversation: () => trackEvent("share_conversation"),
  browseTraditional: () => trackEvent("browse_traditional"),
  themeToggle: (theme: string) => trackEvent("theme_toggle", theme),
  pageView: (page: string) => trackEvent("page_view", page),
};
