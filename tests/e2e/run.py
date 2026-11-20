"""
Run the askJun end-to-end suite.

  python3 tests/e2e/run.py --managed . --port 3200          # build in ., start it, test it
  python3 tests/e2e/run.py --base http://localhost:3000     # test a server that is already running
  python3 tests/e2e/run.py --managed . --only C --browsers chromium

--managed starts `node dist/index.js` from a built checkout with no database, so nothing
is written to the shared production database. Never point --base at the live site with
the "api" group: those tests send malformed and high-volume requests.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import harness  # noqa: E402
import specs  # noqa: E402,F401  (registers the tests)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--managed", help="built checkout to start a local production server from")
    ap.add_argument("--port", type=int, default=3200)
    ap.add_argument("--browsers", default="chromium")
    ap.add_argument("--groups", default="ui,api,static")
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default=os.path.join(harness.CACHE_DIR, "results.json"))
    ap.add_argument("--label", default="")
    args = ap.parse_args()

    os.makedirs(harness.CACHE_DIR, exist_ok=True)
    server = None
    if args.managed:
        server = harness.Server(os.path.abspath(args.managed), args.port, env={"ADMIN_PASSWORD": "e2e-admin-password"}).start()
        base = server.base
    else:
        base = args.base.rstrip("/")
    try:
        results = harness.run(base, [b for b in args.browsers.split(",") if b], set(args.groups.split(",")),
                              only=[o for o in args.only.split(",") if o], server=server)
    finally:
        if server:
            server.stop()
    harness.save(results, args.out, meta={"base": base, "label": args.label, "browsers": args.browsers, "groups": args.groups})
    summary = harness.summarize(results)
    print(f"\n{args.label or base}: " + ", ".join(f"{v} {k}" for k, v in sorted(summary.items())) + f"  -> {args.out}")
    return 1 if summary.get("failed") else 0


if __name__ == "__main__":
    sys.exit(main())
