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


def check_cache_buster() -> bool:
    """Shell changed but index.html's ?v= didn't → browsers keep the old JS.

    Caught nothing on 2026-08-12: the deep-link feature was correct, gated and
    smoked green, and did nothing in the browser because `?v=` still read
    `2026-08-10-flag-restore`. No gate can see that — they read the repo, not
    the cache. So: fingerprint the shell, record it beside the version, and
    fail if the fingerprint moves while the version stands still.

    Self-maintaining: bump `?v=` and the next run re-records automatically.
    """
    import hashlib
    import re

    files = sorted((ROOT / "js").glob("*.js")) + sorted((ROOT / "css").glob("*.css"))
    h = hashlib.sha256()
    for p in files:
        h.update(p.name.encode("utf-8"))
        h.update(p.read_bytes())
    fingerprint = h.hexdigest()[:16]

    html = (ROOT / "index.html").read_text(encoding="utf-8", errors="replace")
    # BOTH cache-busters, or a CSS-only change ships invisible (found the same
    # day the guard was written: app.css had its own, older, ?v=).
    versions = []
    for asset in ("app.js", "app.css"):
        m = re.search(re.escape(asset) + r"\?v=([A-Za-z0-9._-]+)", html)
        if not m:
            print(f"no ?v= cache-buster on {asset} in index.html")
            return False
        versions.append(f"{asset}={m.group(1)}")
    version = " ".join(versions)
    print(f"shell: {len(files)} file(s) · fingerprint {fingerprint} · ?v={version}")

    record = ROOT / "scripts" / "shell-version.json"
    prev = {}
    if record.exists():
        try:
            prev = json.loads(record.read_text(encoding="utf-8"))
        except Exception:
            prev = {}

    if prev.get("version") == version and prev.get("fingerprint") not in (
        None,
        fingerprint,
    ):
        print(
            f"  FAIL: js/ or css/ changed but ?v= is still '{version}'.\n"
            f"  Bump it in index.html or returning browsers keep the old code."
        )
        return False

    if prev.get("version") != version or prev.get("fingerprint") != fingerprint:
        record.write_text(
            json.dumps({"version": version, "fingerprint": fingerprint}, indent=2)
            + "\n",
            encoding="utf-8",
        )
        print(f"  recorded {version} → {fingerprint}")
    return True


def check_js_loads() -> bool:
    """Every js/ module must actually PARSE.

    2026-08-12: a broken regex literal (a real newline inside a character
    class) shipped to main and left the app stuck on "Loading...". Nothing
    caught it — verify_pack, check_playable, audit and smoke all read data,
    never the code. `node --check` does catch it; smoke simply was not asking.

    Skipped with a note if node is absent, so this never blocks a machine
    without it.
    """
    import shutil
    import subprocess

    node = shutil.which("node")
    if not node:
        print("  node not found — JS parse check skipped")
        return True
    bad = []
    files = sorted((ROOT / "js").glob("*.js"))
    for f in files:
        # MUST be parsed as a MODULE. Plain `node --check file.js` reads it as
        # a script, where /.../ is division — the broken regex that caused this
        # check to exist passes that way (verified). Piping with
        # --input-type=module is what actually catches it.
        r = subprocess.run(
            [node, "--input-type=module", "--check"],
            input=f.read_text(encoding="utf-8"),
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            first = (r.stderr or "").strip().splitlines()
            msg = next((l for l in first if "Error" in l), first[-1] if first else "?")
            bad.append(f"{f.name}: {msg.strip()}")
    print(f"  {len(files) - len(bad)}/{len(files)} js modules parse")
    for b in bad:
        print(f"  FAIL {b}")
    return not bad


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


def run_gate(script: str) -> bool:
    import subprocess

    r = subprocess.run(
        [sys.executable, "-X", "utf8", str(ROOT / "codex" / script)],
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
    ok = step("pack lint", lambda: run_gate("verify_pack.py")) and ok
    ok = step("playable ladders", lambda: run_gate("check_playable.py")) and ok
    ok = step("feature taught before needed",
              lambda: run_gate("check_pretaught.py")) and ok
    ok = step("js modules parse", check_js_loads) and ok
    ok = step("cache-buster vs shell", check_cache_buster) and ok
    ok = step("progress key (informational)", check_progress_key) and ok
    print("\n" + ("SMOKE PASSED" if ok else "SMOKE FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
