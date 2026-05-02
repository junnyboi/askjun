/*
 * Analytics utility — wraps Umami's track() for custom events.
 * Events are only sent if Umami is loaded (production).
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

export function trackEvent(event: string, data?: Record<string, string | number>) {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(event, data);
  }
}

// Pre-defined event helpers
export const analytics = {
  cvDownload: () => trackEvent("cv_download"),
  chatMessage: (query: string) => trackEvent("chat_message", { query: query.slice(0, 100) }),
  chipClick: (chip: string) => trackEvent("chip_click", { chip }),
  shareConversation: () => trackEvent("share_conversation"),
  browseTraditional: () => trackEvent("browse_traditional"),
  themeToggle: (theme: string) => trackEvent("theme_toggle", { theme }),
};
