# -*- coding: utf-8 -*-
"""RUE v0.2 smoke — structure only (does not rewrite data).

Exit 0 = ok. Exit 1 = fail.
  py scripts/smoke.py

Note: full content refresh is `py scripts/sync_from_stable.py` (may change files).
Smoke deliberately does NOT run sync.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def step(name: str, fn) -> bool:
    print(f"\n== {name} ==")
    try:
        ok = fn()
        print("OK" if ok else "FAIL")
        return ok
    except Exception as e:
        print(f"FAIL: {e}")
        return False


def check_json(rel: str, min_bytes: int = 50) -> bool:
    path = ROOT / rel
    if not path.exists():
        print(f"missing {rel}")
        return False
    data = json.loads(path.read_text(encoding="utf-8"))
    size = path.stat().st_size
    print(f"{rel} bytes={size} type={type(data).__name__}")
    return size >= min_bytes


def check_shell() -> bool:
    need = [
        "index.html",
        "js/app.js",
        "js/practice-grammar.js",
        "js/practice-vocab.js",
        "css/app.css",
        "scripts/sync_from_stable.py",
    ]
    ok = True
    for rel in need:
        p = ROOT / rel
        exists = p.exists()
        print(f"  {'OK' if exists else 'MISSING'} {rel}")
        ok = ok and exists
    return ok


def check_progress_key() -> bool:
    # progress key appears in several files
    hits = 0
    for path in (ROOT / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        if "rue-exp-progress" in text:
            hits += 1
    # README/CHARTER also document it
    if hits == 0:
        # still OK if only in charter — search whole project lightly
        for path in ROOT.rglob("*.js"):
            if "node_modules" in str(path):
                continue
            if "rue-exp-progress" in path.read_text(encoding="utf-8", errors="replace"):
                hits += 1
                break
    print(f"progress key mentions in js: {hits}")
    # soft: shell files exist is enough if key moved — but we want key stable
    app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
    if "rue-exp-v0.1" not in app and "progress" not in app.lower():
        print("warning: could not confirm progress key in app.js")
    return True


def check_pack_lint() -> bool:
    import subprocess

    r = subprocess.run(
        [sys.executable, "-X", "utf8", str(ROOT / "codex" / "verify_pack.py")],
        capture_output=True,
        text=True,
    )
    tail = (r.stdout or "").strip().splitlines()
    if tail:
        print(tail[-1])
    return r.returncode == 0


def main() -> int:
    print("RUE smoke · v0.2")
    print(f"root={ROOT}")
    ok = True
    ok = step("shell files", check_shell) and ok
    ok = step("data/tree.json", lambda: check_json("data/tree.json")) and ok
    ok = step("data/spine.json", lambda: check_json("data/spine.json")) and ok
    ok = step("pack lint (codex/verify_pack.py)", check_pack_lint) and ok
    ok = step("progress key (informational)", check_progress_key) and ok
    print("\n" + ("SMOKE PASSED" if ok else "SMOKE FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
