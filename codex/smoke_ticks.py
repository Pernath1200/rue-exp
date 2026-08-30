"""Telegram done-log is the inspect tick.

James messages the bot `<unit_id> tested` (or `approved` / `untested`).
The bot appends a line to the vault log. That line IS the tick.

`codex/INSPECTED.md` is generated from this log. Do not hand-tick the
first box. Last verdict for a unit wins.

    tested    → inspected
    approved  → inspected + approved
    untested  → clear both (undo a premature tick)
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAULT_TA = Path.home() / "Documents" / "original" / "TA"
DONE_LOG = VAULT_TA / "smoke-done-log.md"
ORDER_JSON = VAULT_TA / "smoke-order.json"

# Live id after a move. Telegram may still send the parked id.
# 2026-08-29: James smoked a2_used_to and messaged `b1_used_to tested`.
ALIASES = {
    "b1_used_to": "a2_used_to",
}


def vocab_pack_aliases(tree: dict | None = None) -> dict[str, str]:
    """Pack filename stem → tree node id when they differ.

    Vocab ticks use the tree id (`leaf_home_family`). Pack files are often
    named `a1_home_family.json`. Either form on Telegram should land on
    the tree id.
    """
    if tree is None:
        path = ROOT / "data" / "tree.json"
        if not path.exists():
            return {}
        tree = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, str] = {}
    for n in tree.get("nodes") or []:
        if n.get("domain") != "vocab":
            continue
        uid = str(n.get("id") or "").strip()
        stem = Path(str(n.get("content") or "")).stem
        if uid and stem and stem != uid:
            out[stem] = uid
    return out


def load_aliases(tree: dict | None = None) -> dict[str, str]:
    """Parked ids + vocab pack stems. Vault json is a fallback on the bot."""
    aliases = dict(ALIASES)
    aliases.update(vocab_pack_aliases(tree))
    if ORDER_JSON.exists():
        try:
            data = json.loads(ORDER_JSON.read_text(encoding="utf-8"))
            aliases.update(data.get("aliases") or {})
        except (OSError, json.JSONDecodeError):
            pass
    return aliases

# "2026-08-26 13:56 · a2_countable · tested"
# Struck history and " — note" suffixes are ignored for matching.
LOG_RE = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?\s*·\s*"
    r"(?P<unit>[a-z0-9_]+)\s*·\s*(?P<verdict>tested|approved|untested)\b"
)


def ticks_from_done_log(path: Path | None = None) -> dict[str, tuple[bool, bool]]:
    """unit_id → (inspected, approved). Last matching line wins."""
    log = path or DONE_LOG
    out: dict[str, tuple[bool, bool]] = {}
    if not log.exists():
        return out
    aliases = load_aliases()
    for ln in log.read_text(encoding="utf-8").splitlines():
        m = LOG_RE.search(ln.replace("~~", ""))
        if not m:
            continue
        unit = aliases.get(m.group("unit"), m.group("unit"))
        v = m.group("verdict")
        if v == "approved":
            out[unit] = (True, True)
        elif v == "tested":
            out[unit] = (True, False)
        else:
            out[unit] = (False, False)
    return out


def merge_ticks(
    prev: dict[str, tuple[bool, bool]],
    log: dict[str, tuple[bool, bool]],
) -> dict[str, tuple[bool, bool]]:
    """Log wins for any unit it mentions. Units never logged keep prev."""
    merged = dict(prev)
    merged.update(log)
    return merged
