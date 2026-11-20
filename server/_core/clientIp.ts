/**
 * The visitor's address.
 *
 * The app runs behind the hosting proxies, so the socket address (and Express's
 * req.ip) is the proxy's, the same for every visitor. The proxies pass the real
 * address in headers. These headers can be forged by a caller, so the value is
 * only used for per-visitor rate limiting and analytics; the chat endpoint keeps
 * a site-wide ceiling that does not depend on it.
 */

import net from "net";
import type { IncomingHttpHeaders } from "http";

interface RequestLike {
  headers: IncomingHttpHeaders;
  socket?: { remoteAddress?: string };
}

function firstValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").split(",")[0].trim();
}

export function getClientIp(req: RequestLike): string {
  const candidates = [firstValue(req.headers["cf-connecting-ip"]), firstValue(req.headers["x-forwarded-for"])];
  const forwarded = candidates.find(value => net.isIP(value) !== 0);
  return forwarded ?? req.socket?.remoteAddress ?? "unknown";
}
