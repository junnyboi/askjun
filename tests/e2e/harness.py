"""
askJun end-to-end test harness.

Runs browser tests with Playwright against a base URL. Two safety rules are built in,
because the project's database is shared with the live site:

1. Analytics calls (/api/trpc/track.event) are answered inside the page and never
   reach a server, so test traffic writes no analytics rows. The payloads are kept
   so tests can assert on them.
2. Chat UI tests use a scripted in-page reply for /api/chat/stream, so they cost no
   model calls. Tests that need the real backend say so with `real=True`.

Usage: see run.py.
"""

import json
import os
import signal
import subprocess
import time
import traceback
import urllib.request
from dataclasses import dataclass, field

from playwright.sync_api import sync_playwright

CACHE_DIR = os.environ.get("E2E_CACHE", "/tmp/e2e")
AXE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js"
SYSTEM_CHROMIUM = "/usr/bin/chromium"

VIEWPORTS = {
    "desktop": {"width": 1280, "height": 800},
    "laptop": {"width": 1024, "height": 768},
    "tablet": {"width": 800, "height": 1000},
    "phone": {"width": 375, "height": 812},
    "small-phone": {"width": 320, "height": 640},
}

# Installed before any page script runs.
INIT_SCRIPT = r"""
(() => {
  const realFetch = window.fetch.bind(window);
  const mock = { chat: null, calls: [], track: [], clipboard: [], realClipboard: false };
  window.__mock = mock;

  const abortError = () => new DOMException('The operation was aborted.', 'AbortError');

  function sseResponse(spec, signal) {
    const enc = new TextEncoder();
    const events = spec.sse;
    const delay = spec.delayMs ?? 4;
    let i = 0, timer = null;
    const stream = new ReadableStream({
      start(controller) {
        const abort = () => { clearTimeout(timer); try { controller.error(abortError()); } catch (e) {} };
        if (signal) { if (signal.aborted) return abort(); signal.addEventListener('abort', abort); }
        const push = () => {
          if (i >= events.length) { if (!spec.hangAtEnd) { try { controller.close(); } catch (e) {} } return; }
          controller.enqueue(enc.encode('data: ' + JSON.stringify(events[i++]) + '\n\n'));
          timer = setTimeout(push, delay);
        };
        timer = setTimeout(push, spec.firstDelayMs ?? delay);
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/trpc/track.event')) {
      try { mock.track.push(JSON.parse(init.body).json); } catch (e) {}
      return new Response(JSON.stringify({ result: { data: { json: { success: true } } } }),
        { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('/api/chat/stream') && mock.chat) {
      let body = null;
      try { body = JSON.parse(init.body); } catch (e) {}
      mock.calls.push(body);
      const queue = Array.isArray(mock.chat) ? mock.chat : [mock.chat];
      const spec = queue.length > 1 ? queue.shift() : queue[0];
      if (spec.networkError) throw new TypeError('Failed to fetch');
      if (spec.hang) {
        return new Promise((_, reject) => {
          if (init.signal) init.signal.addEventListener('abort', () => reject(abortError()));
        });
      }
      if (spec.sse) return sseResponse(spec, init.signal);
      if (spec.raw) return new Response(spec.raw.body, { status: spec.raw.status ?? 200, headers: { 'content-type': spec.raw.contentType ?? 'text/html' } });
      return new Response(JSON.stringify(spec.json), {
        status: spec.status ?? 200, headers: { 'content-type': 'application/json' },
      });
    }
    return realFetch(input, init);
  };

  // Record clipboard writes; the real clipboard needs per-browser permissions.
  const install = () => {
    if (mock.realClipboard) return;
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (t) => { mock.clipboard.push(String(t)); } },
      });
    } catch (e) {}
  };
  install();
})();
"""

MSGS_JS = """() => [...document.querySelectorAll('[data-msg-id]')].map(el => {
  const id = el.getAttribute('data-msg-id');
  return { id, role: id.startsWith('user') ? 'user' : 'assistant', text: el.innerText };
})"""

OVERFLOW_JS = """() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' && cs.pointerEvents === 'none') continue;
    if (el.closest('.no-scrollbar')) continue;           // horizontal chip row scrolls by design
    if (el.closest('[data-streamdown], table')) continue; // tables scroll inside their own box
    if (r.right > vw + 1 || r.left < -1) offenders.push((el.tagName + '.' + String(el.className).slice(0, 50) + ' right=' + Math.round(r.right)));
  }
  return { page: document.documentElement.scrollWidth - vw, offenders: offenders.slice(0, 5) };
}"""

SMALL_TEXT_JS = """() => [...document.querySelectorAll('body *')].filter(el => {
  if (!el.getClientRects().length) return false;
  if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
  return parseFloat(getComputedStyle(el).fontSize) < 12;
}).map(el => el.textContent.trim().slice(0, 40) + ' @' + getComputedStyle(el).fontSize).slice(0, 8)"""


def sse(text, chunks=10, retrieval="semantic", done=True):
    """Scripted server-sent events for one answer."""
    size = max(1, len(text) // chunks)
    events = [{"type": "meta", "retrievalType": retrieval}]
    events += [{"type": "token", "content": text[i:i + size]} for i in range(0, len(text), size)]
    if done:
        events.append({"type": "done", "fullContent": text})
    return events


def structured(text, status=200):
    return {"json": {"type": "structured", "content": text, "retrievalType": "keyword"}, "status": status}


class CheckFailed(AssertionError):
    pass


def check(cond, message):
    if not cond:
        raise CheckFailed(message)


def poll(fn, timeout=8.0, interval=0.08, message="condition not met in time"):
    end = time.time() + timeout
    last = None
    while time.time() < end:
        try:
            last = fn()
            if last:
                return last
        except Exception as exc:  # page may be mid-navigation
            last = exc
        time.sleep(interval)
    raise CheckFailed(f"{message} (last value: {str(last)[:200]})")


class Server:
    """A local production server started from a built checkout, with no database."""

    def __init__(self, cwd, port, env=None):
        self.cwd, self.port, self.proc, self.extra_env = cwd, port, None, env or {}
        self.log_path = os.path.join(CACHE_DIR, f"server-{port}.log")

    @property
    def base(self):
        return f"http://localhost:{self.port}"

    def start(self):
        env = dict(os.environ)
        env.update({"NODE_ENV": "production", "PORT": str(self.port), "DATABASE_URL": "", "SUPABASE_DATABASE_URL": ""})
        env.pop("ADMIN_PASSWORD", None)
        env.update(self.extra_env)
        self.log_offset = os.path.getsize(self.log_path) if os.path.exists(self.log_path) else 0
        log = open(self.log_path, "a")
        self.proc = subprocess.Popen(["node", "dist/index.js"], cwd=self.cwd, env=env, stdout=log,
                                     stderr=subprocess.STDOUT, start_new_session=True)
        for _ in range(60):
            if self.proc.poll() is not None:
                raise RuntimeError(f"server exited early, see {self.log_path}")
            try:
                with urllib.request.urlopen(self.base + "/", timeout=2) as r:
                    if r.status == 200:
                        return self
            except Exception:
                time.sleep(0.25)
        raise RuntimeError("server did not become ready")

    def alive(self):
        return self.proc is not None and self.proc.poll() is None

    def stop(self):
        if self.proc and self.proc.poll() is None:
            os.killpg(os.getpgid(self.proc.pid), signal.SIGTERM)
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(self.proc.pid), signal.SIGKILL)
        self.proc = None

    def restart(self):
        """Fresh process: clears the in-memory rate limiter."""
        self.stop()
        time.sleep(0.3)
        return self.start()

    def log(self):
        """Output of the current server process only (the file also holds earlier runs)."""
        try:
            with open(self.log_path) as fh:
                fh.seek(getattr(self, "log_offset", 0))
                return fh.read()
        except OSError:
            return ""


@dataclass
class TestCase:
    id: str
    title: str
    fn: object
    group: str = "ui"            # ui | real | api | static
    viewport: str = "desktop"
    browsers: tuple = ("chromium", "webkit", "firefox")
    fresh_server: bool = False   # needs a clean rate limiter (managed server only)
    allow_console: tuple = ()    # substrings of console errors this test expects


TESTS = []


def test(id, title, **kw):
    def deco(fn):
        TESTS.append(TestCase(id=id, title=title, fn=fn, **kw))
        return fn
    return deco


@dataclass
class T:
    """What a test function receives."""
    base: str
    browser_name: str
    case: TestCase
    page: object = None
    context: object = None
    server: Server = None
    console_errors: list = field(default_factory=list)
    page_errors: list = field(default_factory=list)
    bad_responses: list = field(default_factory=list)
    notes: list = field(default_factory=list)

    @property
    def is_small(self):
        return VIEWPORTS[self.case.viewport]["width"] < 1024

    def note(self, text):
        self.notes.append(text)

    def wait(self, seconds):
        """Wait while letting the browser deliver events (time.sleep would not)."""
        if self.page is not None:
            self.page.wait_for_timeout(seconds * 1000)
        else:
            time.sleep(seconds)

    def goto(self, path="/"):
        self.page.goto(self.base + path, wait_until="domcontentloaded", timeout=30000)
        self.page.wait_for_selector("#root > *", state="attached", timeout=20000)
        return self

    def home(self):
        self.goto("/")
        self.page.wait_for_selector("textarea", timeout=20000)
        return self

    def mock(self, spec):
        self.page.evaluate("s => { window.__mock.chat = s; }", spec)

    def js(self, expr, arg=None):
        return self.page.evaluate(expr, arg)

    def msgs(self):
        return self.js(MSGS_JS)

    def input(self):
        return self.page.locator("textarea:visible").first

    def ask(self, text, wait_answer=True, timeout=10.0):
        before = len(self.msgs())
        box = self.input()
        box.fill(text)
        box.press("Enter")
        poll(lambda: len(self.msgs()) >= before + 2, timeout=timeout, message=f"question not sent: {text[:40]}")
        if wait_answer:
            self.wait_idle(timeout)
        return self.msgs()

    def wait_idle(self, timeout=10.0):
        """Answer finished: the action row of the newest answer shows Regenerate."""
        poll(lambda: self.js("""() => {
          const all = [...document.querySelectorAll('[data-msg-id^="assistant"]')];
          const last = all[all.length - 1];
          return !!last && [...last.querySelectorAll('button')].some(b => b.innerText.trim() === 'Regenerate');
        }"""), timeout=timeout, message="answer did not finish")

    def button(self, name, scope=None):
        root = scope or self.page
        return root.get_by_role("button", name=name, exact=True)

    def last_answer(self):
        return self.page.locator('[data-msg-id^="assistant"]').last

    def track(self):
        return self.js("() => window.__mock.track")

    def calls(self):
        return self.js("() => window.__mock.calls")

    def overflow(self):
        return self.js(OVERFLOW_JS)

    def axe(self, context_selector=None):
        path = os.path.join(CACHE_DIR, "axe.min.js")
        if not os.path.exists(path):
            os.makedirs(CACHE_DIR, exist_ok=True)
            urllib.request.urlretrieve(AXE_URL, path)
        self.page.add_script_tag(path=path)
        result = self.page.evaluate(
            """async (sel) => {
              const r = await axe.run(sel || document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
              });
              return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
                sample: v.nodes.slice(0, 3).map(n => (n.target.join(' ') + ' :: ' + (n.any[0]?.message || n.failureSummary || '')).slice(0, 220)) }));
            }""", context_selector)
        return result


def _launch(pw, name):
    if name == "chromium":
        return pw.chromium.launch(executable_path=SYSTEM_CHROMIUM)
    return getattr(pw, name).launch()


def run(base, browsers, groups, only=None, server=None, retries=1, shots_dir=None):
    shots_dir = shots_dir or os.path.join(CACHE_DIR, "shots")
    os.makedirs(shots_dir, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        for bname in browsers:
            browser = _launch(pw, bname)
            for case in TESTS:
                if case.group not in groups or bname not in case.browsers:
                    continue
                if only and not any(case.id.startswith(o) for o in only):
                    continue
                if case.group in ("api", "static") and bname != browsers[0]:
                    continue  # not browser-dependent: run once
                if case.fresh_server and not server:
                    results.append({"id": case.id, "title": case.title, "browser": bname, "status": "skipped",
                                    "detail": "needs a managed local server"})
                    continue
                outcome = None
                for attempt in range(retries + 1):
                    outcome = _run_one(browser, bname, base, case, server, shots_dir, attempt)
                    if outcome["status"] == "passed":
                        if attempt > 0:
                            outcome["flaky"] = True
                        break
                results.append(outcome)
                mark = {"passed": "ok  ", "failed": "FAIL", "skipped": "skip"}[outcome["status"]]
                flaky = " (passed on retry)" if outcome.get("flaky") else ""
                print(f"[{bname:8}] {mark} {case.id:5} {case.title}{flaky}", flush=True)
                if outcome["status"] == "failed":
                    print("           -> " + outcome["detail"].splitlines()[0][:230], flush=True)
            browser.close()
    return results


def _run_one(browser, bname, base, case, server, shots_dir, attempt):
    if case.fresh_server and server:
        server.restart()
    if server and not server.alive():
        server.start()
    t = T(base=base, browser_name=bname, case=case, server=server)
    out = {"id": case.id, "title": case.title, "browser": bname, "group": case.group, "viewport": case.viewport}
    context = None
    try:
        if case.group in ("api", "static"):
            case.fn(t)
        else:
            context = browser.new_context(viewport=VIEWPORTS[case.viewport], accept_downloads=True)
            context.add_init_script(INIT_SCRIPT)
            page = context.new_page()
            page.set_default_timeout(10000)
            page.on("console", lambda m: t.console_errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: t.page_errors.append(str(e)))
            page.on("response", lambda r: t.bad_responses.append(f"{r.status} {r.url}")
                    if r.status >= 400 and base in r.url else None)
            t.page, t.context = page, context
            case.fn(t)
            unexpected = [e for e in t.console_errors if not any(a in e for a in case.allow_console)
                          and "Failed to load resource" not in e
                          # Firefox logs a font download cancelled by navigating away (NS_BINDING_ABORTED)
                          and "status=2152398850" not in e]
            check(not t.page_errors, f"uncaught page error: {t.page_errors[:2]}")
            check(not unexpected, f"console error: {unexpected[:2]}")
        out["status"] = "passed"
    except Exception as exc:
        out["status"] = "failed"
        out["detail"] = (str(exc) if isinstance(exc, CheckFailed) else traceback.format_exc(limit=3)).strip()
        if t.page is not None:
            try:
                shot = os.path.join(shots_dir, f"{case.id}-{bname}-{attempt}.png")
                t.page.screenshot(path=shot)
                out["screenshot"] = shot
            except Exception:
                pass
        if server and not server.alive():
            out["detail"] += "\n[server process exited during this test]"
    finally:
        if context is not None:
            context.close()
    if t.notes:
        out["notes"] = t.notes
    return out


def summarize(results):
    by = {}
    for r in results:
        by.setdefault(r["status"], 0)
        by[r["status"]] += 1
    return by


def save(results, path, meta=None):
    with open(path, "w") as fh:
        json.dump({"meta": meta or {}, "summary": summarize(results), "results": results}, fh, indent=1)
