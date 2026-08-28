#!/usr/bin/env python
"""Regenerate codex/INSPECTED.md — what James has actually looked at.

Two boxes per unit. The first box is the Telegram done-log. James ticks
by messaging the bot `<unit_id> tested`. This file is generated from that.
Do not hand-tick the first box.

    - [ ][ ]   nobody has looked at it. NOT SAFE TO SHOW ANYONE.
    - [x][ ]   INSPECTED — James has played it end to end.
    - [x][x]   APPROVED  — James is happy for a student to use it.

**Unless a unit has at least one tick it is not safe to put in front of anyone.**
That is the rule the file exists to enforce. A green audit is not a tick. A clean
check_playable is not a tick. An agent reporting that it went fine is not a tick.
Those check structure; they say nothing about whether the teaching is any good.

Legacy in-session ticks stay until the log mentions that unit. Last log
verdict wins (`tested` / `approved` / `untested`).

    python codex/build_inspected_register.py
    python codex/reconcile_inspected.py   # register + Top 5

Why it exists: on 2026-08-24, 36 live units (1,701 items — all of B2 and C1) turned
out to have been written by the August cloud routine and never read by anyone.
Every gate was green the whole time. This file is the record that was missing.
"""
import json
import glob
import os
import re
from pathlib import Path

from smoke_ticks import merge_ticks, ticks_from_done_log

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "codex" / "INSPECTED.md"

ROW_RE = re.compile(r"^- \[(x| )\]\[(x| )\]\s+`([a-z0-9_]+)`", re.I)


def read_existing():
    """Preserve James's ticks across regeneration — the whole point of the file."""
    state = {}
    if not OUT.exists():
        return state
    for line in OUT.read_text(encoding="utf-8").splitlines():
        m = ROW_RE.match(line.strip())
        if m:
            insp = m.group(1).lower() == "x"
            appr = m.group(2).lower() == "x"
            state[m.group(3)] = (insp, appr)
    return state


def load_live():
    tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
    ng = json.loads((ROOT / "data/nodes-grammar.json").read_text(encoding="utf-8"))
    live = set(tree["path_order"])
    for k, v in ng.items():
        if k.startswith("path_order_"):
            live |= set(v)
    nodes = ng["nodes"]
    nodes = nodes if isinstance(nodes, list) else list(nodes.values())
    return live, {n.get("id"): n.get("status") for n in nodes}


def inspected_units():
    """Units with at least one tick — the only ones safe to show anyone.

    Imported by build_patrik_errors_page.py so a student-facing page cannot link
    into unreviewed material even by accident.
    """
    ticks = merge_ticks(read_existing(), ticks_from_done_log())
    return {uid for uid, (insp, appr) in ticks.items() if insp or appr}


def main():
    live, status = load_live()
    prev = merge_ticks(read_existing(), ticks_from_done_log())

    rows = []
    for p in sorted(glob.glob(str(ROOT / "data/grammar/blocks/*.json"))):
        uid = os.path.basename(p)[:-5]
        if uid not in live or status.get(uid) != "live":
            continue
        d = json.loads(Path(p).read_text(encoding="utf-8"))
        note = str(d.get("note") or "")
        insp, appr = prev.get(uid, (False, False))
        rows.append({
            "id": uid,
            "level": d.get("level") or "?",
            "title": d.get("title") or uid,
            "items": sum(len(b.get("items", [])) for b in d.get("blocks", [])),
            "cloud": bool(re.search(r"cloud run|cloud routine|routine", note, re.I)),
            # a pack note mentioning a James smoke is EVIDENCE, never an auto-tick
            "evidence": bool(re.search(r"James[^.]{0,40}(smok|smoke)", note, re.I)),
            "insp": insp,
            "appr": appr,
        })

    order = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4}
    rows.sort(key=lambda r: (order.get(r["level"], 9), not r["cloud"], r["id"]))

    bad = [r["id"] for r in rows if r["appr"] and not r["insp"]]
    n = len(rows)
    insp = sum(1 for r in rows if r["insp"])
    appr = sum(1 for r in rows if r["appr"])
    unseen = [r for r in rows if not (r["insp"] or r["appr"])]
    cloud = [r for r in rows if r["cloud"]]

    o = []
    o.append("# Inspected — what James has actually looked at\n")
    o.append("| | means |")
    o.append("|---|---|")
    o.append("| `- [ ][ ]` | nobody has looked at it. **Not safe to show anyone.** |")
    o.append("| `- [x][ ]` | **inspected** — played end to end |")
    o.append("| `- [x][x]` | **approved** — fit to put in front of a student |\n")
    o.append("**Unless a unit has at least one tick it does not go in front of anyone.**\n")
    o.append("James ticks on Telegram (`<unit_id> tested`). That appends "
             "`TA/smoke-done-log.md`; this file is generated from that log. "
             "Do not hand-tick the first box. A green audit is not a tick; "
             "a clean `check_playable` is not a tick; an agent's report is not "
             "a tick.\n")
    o.append("Sync: `python codex/reconcile_inspected.py` "
             "(register + Top 5). Undo a premature tick with "
             "`<unit_id> untested` on Telegram.\n")
    o.append("---\n")
    o.append(f"**{insp} inspected · {appr} approved · {len(unseen)} unseen** of {n} live units\n")
    o.append(f"Of the {len(cloud)} cloud-authored units, "
             f"**{sum(1 for r in cloud if r['insp'] or r['appr'])} have any tick**.\n")
    o.append("`cloud` = written by the August auto-build, never read by anyone. "
             "`seen?` = the pack note mentions a James smoke, so it may be part-inspected "
             "— evidence, not a tick.\n")

    cur = None
    for r in rows:
        if r["level"] != cur:
            cur = r["level"]
            lv = [x for x in rows if x["level"] == cur]
            o.append(f"\n## {cur} — {sum(1 for x in lv if x['insp'])} inspected / "
                     f"{sum(1 for x in lv if x['appr'])} approved / {len(lv)} units\n")
        flags = []
        if r["cloud"]:
            flags.append("**cloud**")
        if r["evidence"]:
            flags.append("seen?")
        tag = (" · " + " · ".join(flags)) if flags else ""
        o.append(f"- [{'x' if r['insp'] else ' '}][{'x' if r['appr'] else ' '}] "
                 f"`{r['id']}` — {r['title']} · {r['items']} items{tag}")

    OUT.write_text("\n".join(o) + "\n", encoding="utf-8")
    print(f"written {OUT}")
    print(f"{n} live units | {insp} inspected | {appr} approved | {len(unseen)} unseen")
    print(f"cloud-authored: {len(cloud)}, of which "
          f"{sum(1 for r in cloud if r['insp'] or r['appr'])} have any tick")
    if bad:
        print("\nERROR — approved without being inspected (fix by hand):")
        for b in bad:
            print("  -", b)


if __name__ == "__main__":
    main()
