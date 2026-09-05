#!/usr/bin/env python3
"""
test_checks.py — prove every check still complains about a real fault.

On 2026-09-05 `check_rewrite.py`'s new F9 check reported **clean** across the whole
corpus while six leaves breached it. The cause was a mangled `\\b` that made the
regex match nothing, so the check was searching for something impossible and
finding, correctly, nothing. It looked exactly like success.

A check that has never been seen to fire proves nothing. This runs each one against
a pack that genuinely carries the fault — the real unit, frozen in
`codex/regressions/` as it was before it was fixed, so the examples are true and do
not rot as the project moves on (James's call, 2026-09-05).

Each fixture is copied into the live pack folder under a `zz_reg_` name, the check
is run against it exactly as it is really run, and the copy is removed again.

    py -X utf8 codex/test_checks.py
    py -X utf8 codex/test_checks.py --check     # non-zero exit if any check is silent
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODEX = ROOT / "codex"
REG = CODEX / "regressions"
FOLDER = {"grammar": ROOT / "data/grammar/blocks", "vocab": ROOT / "data/vocab/blocks"}
PY = [sys.executable, "-X", "utf8"]

# every check that is expected to have a fixture; anything here without one is reported
KNOWN_CHECKS = ["check_rewrite.py", "check_gloss.py", "check_rules.py", "lint.py"]


def run_against(fixture: Path, kind: str, script: str) -> str:
    """Copy the frozen pack in beside the real ones, run the check, take it out again."""
    name = "zz_reg_" + fixture.stem
    dest = FOLDER[kind] / (name + ".json")
    d = json.loads(fixture.read_text(encoding="utf-8"))
    d["id"] = name
    try:
        dest.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        p = subprocess.run(PY + [str(CODEX / script), name], capture_output=True,
                           text=True, encoding="utf-8", errors="replace", timeout=240)
        return (p.stdout or "") + (p.stderr or "")
    finally:
        if dest.exists():
            dest.unlink()


def main() -> int:
    manifest = json.loads((REG / "manifest.json").read_text(encoding="utf-8"))
    print("PROVING EACH CHECK STILL COMPLAINS\n")
    silent, ok, skipped = [], 0, 0
    for case in manifest:
        # A fixture can stop proving its check for a reason that is not the check
        # breaking: the check was pulled from the runner (B25, C14), or it was
        # narrowed and this pack turned out never to have been in breach (C19).
        # Those say so in `skip`, and the reason is the record. Anything without
        # `skip` must still fire, or it is broken.
        if case.get("skip"):
            skipped += 1
            print("  %-16s %-5s skipped" % (
                case["script"].replace(".py", ""), case["rule"]))
            print("      %s" % case["skip"])
            continue
        out = run_against(REG / case["file"], case["kind"], case["script"])
        fired = case["rule"] in out
        print("  %-16s %-5s %s" % (case["script"].replace(".py", ""), case["rule"],
                                   "complained" if fired else "SILENT — the check is broken"))
        print("      %s" % case["from"])
        if fired:
            ok += 1
        else:
            silent.append("%s %s" % (case["script"], case["rule"]))

    covered = {c["script"] for c in manifest}
    untested = [s for s in KNOWN_CHECKS if s not in covered]
    for s in untested:
        print("  %-16s %-5s no fixture yet — untested" % (s.replace(".py", ""), "—"))

    print("\ntest_checks: %d proved · %d silent · %d untested · %d skipped"
          % (ok, len(silent), len(untested), skipped))
    if silent:
        print("BROKEN: " + ", ".join(silent))
        return 1 if "--check" in sys.argv else 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
