#!/usr/bin/env python3
"""
check_lane.py — is the home lane behaving?

Run this on the laptop whenever you want to know what the unattended lane has done.
It fetches, compares `origin/b1/home` against `origin/b1/auto`, and answers the only
question that matters: is it working inside the fence, or has it gone somewhere it
was told not to.

Read-only. Fetches, checks nothing out, changes nothing.

    py -X utf8 codex/check_lane.py
    py -X utf8 codex/check_lane.py --lane b1/home --base b1/auto
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# things the handoff says it must never touch
FORBIDDEN = [
    (re.compile(r"^data/(tree|nodes-[a-z]+)\.json$"), "registry — shared by every level"),
    (re.compile(r"^(js|css)/"), "engine — interactive only"),
    (re.compile(r"^index\.html$"), "engine — interactive only"),
    (re.compile(r"^codex/INSPECTED\.md$"), "only James ticks, from Telegram"),
    (re.compile(r"^data/\w+/blocks/(a1|a2)_"), "A1/A2 are protected"),
    (re.compile(r"^audit/(sequencing|pretaught)-baseline\.json$"),
     "re-baselining needs James's word"),
]


def git(*args, default=None):
    p = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    if p.returncode:
        return default
    return p.stdout.strip()


def baseline(ref, path, key):
    raw = git("show", "%s:%s" % (ref, path), default=None)
    if not raw:
        return None
    try:
        return json.loads(raw).get(key)
    except Exception:
        return None


def main() -> int:
    argv = sys.argv[1:]
    lane, base = "b1/home", "b1/auto"
    for flag, var in (("--lane", "lane"), ("--base", "base")):
        if flag in argv:
            i = argv.index(flag)
            if var == "lane":
                lane = argv[i + 1]
            else:
                base = argv[i + 1]

    print("fetching…")
    git("fetch", "origin", "--quiet")
    L, B = "origin/" + lane, "origin/" + base

    if git("rev-parse", "--verify", "--quiet", L) is None:
        print("\n%s does not exist yet." % L)
        print("Nothing has been pushed. If the lane has been running a while, that is")
        print("itself the signal — it should push its first unit within the hour.")
        return 0

    commits = [c for c in (git("log", "--format=%h %ad %s", "--date=format:%H:%M",
                               "%s..%s" % (B, L), default="") or "").splitlines() if c]
    files = [f for f in (git("diff", "--name-only", B, L, default="") or "").splitlines() if f]

    print("\n%s vs %s — %d commit%s, %d file%s"
          % (L, B, len(commits), "" if len(commits) == 1 else "s",
             len(files), "" if len(files) == 1 else "s"))

    if commits:
        print("\ncommits")
        for c in commits[:14]:
            print("   " + c)
        if len(commits) > 14:
            print("   … and %d more" % (len(commits) - 14))

    # --- the fence -------------------------------------------------------
    breaches = []
    for f in files:
        for pattern, why in FORBIDDEN:
            if pattern.search(f):
                breaches.append((f, why))
                break
    print("\nthe fence")
    if breaches:
        print("   BREACHED — it has touched things it was told not to:")
        for f, why in breaches[:12]:
            print("      %-46s %s" % (f, why))
        if len(breaches) > 12:
            print("      … and %d more" % (len(breaches) - 12))
    else:
        print("   clean — no protected pack, registry, engine file or tick touched")

    # --- what it worked on ----------------------------------------------
    units = sorted({Path(f).stem for f in files if re.match(r"^data/\w+/blocks/", f)})
    if units:
        print("\nunits worked (%d)" % len(units))
        for i in range(0, len(units), 3):
            print("   " + " · ".join(units[i:i + 3]))

    # --- did it move the numbers the right way? --------------------------
    print("\nratchets (lower is better; higher means it made things worse)")
    for path, key, name in (("audit/gloss-baseline.json", "total", "gloss"),
                            ("audit/rules-baseline.json", "live", "rules"),
                            ("audit/sequencing-baseline.json", "total_unknown_types", "audit"),
                            ("audit/pretaught-baseline.json", "total", "pretaught")):
        a, b = baseline(B, path, key), baseline(L, path, key)
        if a is None and b is None:
            continue
        if a == b:
            verdict = "unchanged"
        elif b is None or a is None:
            verdict = "?"
        elif b < a:
            verdict = "TIGHTENED — good"
        else:
            verdict = "ROSE — look at why"
        print("   %-10s %s -> %s   %s" % (name, a, b, verdict))

    # --- the report ------------------------------------------------------
    print("\nits report")
    rep = git("show", "%s:codex/PREFLIGHT-REPORT.md" % L, default=None)
    if not rep:
        print("   codex/PREFLIGHT-REPORT.md not written yet")
    else:
        head = [l for l in rep.splitlines() if l.strip()][:6]
        for l in head:
            print("   " + l[:96])
        print("   (full: git show %s:codex/PREFLIGHT-REPORT.md)" % L)

    # --- questions waiting for him ---------------------------------------
    dec_a = git("show", "%s:codex/DECISIONS.md" % B, default="") or ""
    dec_b = git("show", "%s:codex/DECISIONS.md" % L, default="") or ""
    new_q = len(re.findall(r"^### ", dec_b, re.M)) - len(re.findall(r"^### ", dec_a, re.M))
    if new_q > 0:
        print("\n%d new entr%s in DECISIONS.md waiting for you"
              % (new_q, "y" if new_q == 1 else "ies"))

    print("\nto take the work:  git merge %s" % L)
    return 1 if breaches else 0


if __name__ == "__main__":
    raise SystemExit(main())
