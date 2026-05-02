/*
 * ============================================================================
 * Admin Dashboard — Password-protected analytics panel
 * Shows metrics, visitor table, top questions, and event log.
 * ============================================================================
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const verifyMutation = trpc.admin.verify.useMutation();
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: authenticated });
  const visitorsQuery = trpc.admin.visitors.useQuery(undefined, { enabled: authenticated });
  const topQuestions = trpc.admin.topQuestions.useQuery(undefined, { enabled: authenticated });
  const recentEvents = trpc.admin.recentEvents.useQuery(undefined, { enabled: authenticated });

  const handleLogin = async () => {
    const result = await verifyMutation.mutateAsync({ password });
    if (result.valid) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm px-6">
          <h1 className="text-lg font-bold text-foreground mb-1 font-mono">askJun Admin</h1>
          <p className="text-xs text-muted-foreground mb-6">Enter password to access the dashboard.</p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent"
              autoFocus
            />
            {error && <p className="text-xs text-accent">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full px-3 py-2 text-sm font-mono bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity active:scale-95"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 h-12 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground">ask<span className="text-accent">Jun</span></span>
          <span className="text-xs font-mono text-muted-foreground">/ Admin</span>
        </div>
        <a href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">← Back to site</a>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Events", value: stats.data?.totalEvents || 0 },
            { label: "Unique Visitors", value: stats.data?.totalVisitors || 0 },
            { label: "CV Downloads", value: stats.data?.cvDownloads || 0 },
            { label: "Chat Messages", value: stats.data?.chatMessages || 0 },
            { label: "Chip Clicks", value: stats.data?.chipClicks || 0 },
          ].map((metric, i) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-card">
              <span className="text-2xl font-mono font-bold text-foreground">{metric.value}</span>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Questions */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-bold text-foreground mb-3">Top Questions Asked</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topQuestions.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">No data yet</p>
              )}
              {topQuestions.data?.map((q, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-[11px] text-foreground truncate max-w-[80%]">{q.data || "(empty)"}</span>
                  <span className="text-[10px] font-mono text-accent">{q.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Heatmap / Breakdown */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-bold text-foreground mb-3">Event Breakdown</h2>
            <div className="space-y-2">
              {stats.data && (() => {
                const events = [
                  { name: "Chat Messages", count: stats.data.chatMessages, color: "bg-accent" },
                  { name: "Chip Clicks", count: stats.data.chipClicks, color: "bg-foreground" },
                  { name: "CV Downloads", count: stats.data.cvDownloads, color: "bg-muted-foreground" },
                ];
                const max = Math.max(...events.map(e => e.count), 1);
                return events.map((e, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{e.name}</span>
                      <span className="font-mono text-foreground">{e.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${e.color} rounded-full transition-all`} style={{ width: `${(e.count / max) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="mt-6 border border-border rounded-lg p-4 bg-card">
          <h2 className="text-sm font-bold text-foreground mb-3">Recent Visitors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">IP</th>
                  <th className="pb-2 pr-4">Country</th>
                  <th className="pb-2 pr-4">Visits</th>
                  <th className="pb-2 pr-4">First Visit</th>
                  <th className="pb-2">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {visitorsQuery.data?.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-muted-foreground text-center">No visitors yet</td></tr>
                )}
                {visitorsQuery.data?.map((v, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="py-2 pr-4 text-foreground">{v.ip}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{v.country || "—"}</td>
                    <td className="py-2 pr-4 text-accent">{v.visitCount}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(v.firstVisit).toLocaleDateString()}</td>
                    <td className="py-2 text-muted-foreground">{new Date(v.lastVisit).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Events Log */}
        <div className="mt-6 border border-border rounded-lg p-4 bg-card">
          <h2 className="text-sm font-bold text-foreground mb-3">Recent Events (last 100)</h2>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-[11px] font-mono">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Event</th>
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">IP</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.data?.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-muted-foreground text-center">No events yet</td></tr>
                )}
                {recentEvents.data?.map((e, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="py-1.5 pr-4">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        e.event === "chat_message" ? "bg-accent/10 text-accent" :
                        e.event === "cv_download" ? "bg-green-500/10 text-green-600" :
                        "bg-muted text-muted-foreground"
                      }`}>{e.event}</span>
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground truncate max-w-[200px]">{e.data || "—"}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{e.ip}</td>
                    <td className="py-1.5 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
