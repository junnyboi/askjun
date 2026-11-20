/**
 * Rate limits for the chat endpoints (the streaming endpoint and tRPC chat.send share them).
 *
 * - Per visitor: 30 questions an hour.
 * - Site-wide: a ceiling on questions that reach the model. The visitor's address comes
 *   from forwarded headers, which a caller can forge to get a fresh per-visitor allowance;
 *   the ceiling bounds model use regardless.
 */

const WINDOW_MS = 60 * 60 * 1000;
const VISITOR_LIMIT = 30;
const SITE_MODEL_LIMIT = 300;

const visitorWindows = new Map<string, { count: number; resetAt: number }>();
let siteWindow = { count: 0, resetAt: 0 };

// Periodic eviction — prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  visitorWindows.forEach((window, ip) => {
    if (window.resetAt <= now) visitorWindows.delete(ip);
  });
}, 10 * 60 * 1000).unref();

/** Counts one question for this visitor. False once they are over the hourly limit. */
export function allowVisitorQuestion(ip: string, now = Date.now()): boolean {
  const window = visitorWindows.get(ip);
  if (!window || window.resetAt <= now) {
    visitorWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (window.count >= VISITOR_LIMIT) return false;
  window.count++;
  return true;
}

/** Counts one model call for the whole site. False once the hourly ceiling is reached. */
export function allowModelCall(now = Date.now()): boolean {
  if (siteWindow.resetAt <= now) siteWindow = { count: 0, resetAt: now + WINDOW_MS };
  if (siteWindow.count >= SITE_MODEL_LIMIT) return false;
  siteWindow.count++;
  return true;
}

export const RATE_LIMIT_MESSAGE =
  "I've reached the message limit for this hour. Please try again later, or reach Jun directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).";
