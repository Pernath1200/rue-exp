#!/usr/bin/env python3
"""
verify_pack.py — HARD lint for every pack in data/*/blocks/.

Exit 1 on any ERROR (routine must not commit). Warnings are informational.

Checks:
  - valid JSON, required top-level fields, unique pack ids
  - default_direction == "cz_to_en" (the app's locked direction)
  - NO `pl` keys anywhere (RUPL leftovers are forbidden by AGENTS.md)
  - every item: en + cz non-empty strings
  - gap items: gap contains a blank (___), gap_answer non-empty,
    gap_answer's words appear in en (frame must reconstruct)
  - accepts / gap_accepts / quiz_options are lists of non-empty strings
  - tree cross-check: every live tree node's content file exists;
    every pack's tree_node exists in tree.json (warning if not)

Usage:  py -X utf8 codex/verify_pack.py            # lint everything
        py -X utf8 codex/verify_pack.py <pack.json> [...]   # specific packs
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
BLANK_RE = re.compile(r"_{2,}")
WORD_RE = re.compile(r"[a-zA-Z']+")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def find_pl_keys(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "pl" or k.endswith("_pl"):
                yield f"{path}.{k}"
            yield from find_pl_keys(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from find_pl_keys(v, f"{path}[{i}]")


def norm_words(s: str) -> list[str]:
    return [w.lower() for w in WORD_RE.findall(s)]


def check_str_list(pack_id, where, name, val):
    if val is None:
        return
    if not isinstance(val, list) or any(
        not isinstance(x, str) or not x.strip() for x in val
    ):
        err(f"{pack_id} {where}: {name} must be a list of non-empty strings")


C9_WORD_CAP = 15
C9_BASELINE = ROOT / "codex" / "c9-baseline.json"
c9_hits: list[tuple[str, str]] = []  # (pack_id, what)

# C10 — every intro card has a table and/or a diagram (James, 2026-08-28).
C10_BASELINE = ROOT / "codex" / "c10-baseline.json"
c10_hits: list[tuple[str, str]] = []


def c9_words(s: str) -> int:
    """Words in a student-facing string, ignoring markdown emphasis marks."""
    return len(re.findall(r"[A-Za-zÀ-ÿěščřžůďťňĚŠČŘŽŮĎŤŇ']+", str(s)))


def frame_gaps(lemma: str, en: str) -> bool:
    """Mirror of the engine's sentenceToFrame match (practice-vocab.js):
    lemmaBare (parens stripped, spaces squeezed) bound by the letter class,
    not \\b — é is not \\w. A frame with no matching lemma yields NO gap,
    so the word silently has no Quiz and no Type item (James, 2026-09-05)."""
    form = re.sub(r"\s*\([^)]*\)\s*", " ", str(lemma or ""))
    form = re.sub(r"\s+", " ", form).strip()
    if not form:
        return False
    return bool(re.search(
        r"(^|[^A-Za-zÀ-ž])(%s)(?![A-Za-zÀ-ž])" % re.escape(form),
        str(en or ""), re.I))


def intro_lint_scope(path: Path, d: dict) -> bool:
    """C9/C10 are enforced on A1–B1 grammar only (James, 2026-08-28).
    Vocab page-1 prose is a different product. B2+ intros are paused."""
    if d.get("level") not in ("A1", "A2", "B1"):
        return False
    return "grammar" in path.parts


def check_intro_density(pid: str, d: dict, path: Path | None = None) -> None:
    """Rule C9 — no walltext in intro cards.

    Intro cards teach with tables, diagrams, bullets and example pairs.
    `body`/`body_cz` are not teaching surfaces, and no single element runs
    past C9_WORD_CAP words. The `why` lives in the item's explanation /
    explanation_cz, which js/explain.js shows beside the answer feedback —
    at the moment the student gets it wrong, which is when it is read.

    Enforced for A1–B1 grammar. Ratcheted: the baseline may only fall.
    Once it reaches 0 every in-scope violation is an error.
    """
    if path is not None and not intro_lint_scope(path, d):
        return
    intro = d.get("intro")
    cards = intro.get("cards") if isinstance(intro, dict) else intro
    if not isinstance(cards, list):
        return
    for i, c in enumerate(cards):
        if not isinstance(c, dict):
            continue
        where = f"intro card {i}"
        for f in ("body", "body_cz", "body_pl"):
            if str(c.get(f) or "").strip():
                c9_hits.append((pid, f"{where}: `{f}` set ({c9_words(c[f])}w)"))
        for j, p in enumerate(c.get("points") or []):
            if c9_words(p) > C9_WORD_CAP:
                c9_hits.append((pid, f"{where}: points[{j}] {c9_words(p)}w"))
        for j, ex in enumerate(c.get("examples") or []):
            if isinstance(ex, dict):
                n = c9_words(f"{ex.get('cz', '')} {ex.get('en', '')}")
                if n > C9_WORD_CAP:
                    c9_hits.append((pid, f"{where}: examples[{j}] {n}w"))
        extra = c.get("tables") if isinstance(c.get("tables"), list) else []
        for ti, tbl in enumerate(
            [c.get("table"), *extra] if isinstance(c.get("table"), dict) else extra
        ):
            if not isinstance(tbl, dict):
                continue
            tag = "table" if ti == 0 and isinstance(c.get("table"), dict) else f"tables[{ti}]"
            for r, row in enumerate(tbl.get("rows") or []):
                for k, cell in enumerate(row or []):
                    if c9_words(cell) > C9_WORD_CAP:
                        c9_hits.append(
                            (pid, f"{where}: {tag}[{r}][{k}] {c9_words(cell)}w")
                        )


def report_c9() -> None:
    """Print the C9 tally and enforce the ratchet. Never writes on its own."""
    n = len(c9_hits)
    try:
        base = json.loads(C9_BASELINE.read_text(encoding="utf-8"))["count"]
    except Exception:  # noqa: BLE001
        base = None

    packs = sorted({p for p, _ in c9_hits})
    worst = sorted(
        ((sum(1 for p, _ in c9_hits if p == pk), pk) for pk in packs), reverse=True
    )
    if n:
        print(f"\nC9 walltext: {n} violations across {len(packs)} packs")
        for cnt, pk in worst[:8]:
            print(f"  {cnt:4}  {pk}")
        if len(worst) > 8:
            print(f"  ... and {len(worst) - 8} more packs")

    if base is None:
        print(f"C9: no baseline yet — write {{\"count\": {n}}} to {C9_BASELINE.name}")
        return
    if n > base:
        err(f"C9 walltext regressed: {n} violations vs baseline {base}")
    elif n < base:
        print(f"C9: baseline can tighten {base} → {n} (run with --tighten to write it)")
    if base == 0 and n:
        err(f"C9 walltext: {n} violations and the baseline is 0")


def check_intro_visual(pid: str, d: dict, path: Path | None = None) -> None:
    """Rule C10 — every intro card has a table and/or a diagram.

    Accepted visuals: table.rows, diagram (intro-visuals.js key), diagrams[]
    (several small scenes on one card), or inline svg.
    Points and examples[] may accompany a visual; they do not replace it.
    Enforced for A1–B1 grammar. Ratcheted like C9.
    """
    if path is not None and not intro_lint_scope(path, d):
        return
    intro = d.get("intro")
    cards = intro.get("cards") if isinstance(intro, dict) else intro
    if not isinstance(cards, list):
        return
    for i, c in enumerate(cards):
        if not isinstance(c, dict):
            continue
        tbl = c.get("table")
        has_table = isinstance(tbl, dict) and bool(tbl.get("rows"))
        has_diagram = bool(str(c.get("diagram") or "").strip())
        diagrams = c.get("diagrams")
        has_diagrams = isinstance(diagrams, list) and any(
            (isinstance(d, str) and d.strip())
            or (isinstance(d, dict) and str(d.get("diagram") or "").strip())
            for d in diagrams
        )
        has_svg = bool(str(c.get("svg") or "").strip())
        has_pics = isinstance(c.get("pictures"), list) and bool(c.get("pictures"))
        if has_table or has_diagram or has_diagrams or has_svg or has_pics:
            continue
        title = str(c.get("title") or "").strip() or "(untitled)"
        c10_hits.append((pid, f"intro card {i}: no table/diagram ({title})"))


def report_c10() -> None:
    n = len(c10_hits)
    try:
        base = json.loads(C10_BASELINE.read_text(encoding="utf-8"))["count"]
    except Exception:  # noqa: BLE001
        base = None

    packs = sorted({p for p, _ in c10_hits})
    worst = sorted(
        ((sum(1 for p, _ in c10_hits if p == pk), pk) for pk in packs), reverse=True
    )
    if n:
        print(f"\nC10 no visual: {n} cards across {len(packs)} packs")
        for cnt, pk in worst[:8]:
            print(f"  {cnt:4}  {pk}")
        if len(worst) > 8:
            print(f"  ... and {len(worst) - 8} more packs")

    if base is None:
        print(f"C10: no baseline yet — write {{\"count\": {n}}} to {C10_BASELINE.name}")
        return
    if n > base:
        err(f"C10 intro visual regressed: {n} cards vs baseline {base}")
    elif n < base:
        print(f"C10: baseline can tighten {base} → {n} (run with --tighten to write it)")
    if base == 0 and n:
        err(f"C10 intro visual: {n} cards missing a table/diagram and the baseline is 0")


def lint_pack(path: Path) -> None:
    rel = path.relative_to(ROOT).as_posix()
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f"{rel}: invalid JSON — {e}")
        return

    pid = d.get("id") or rel
    for field in ("id", "title", "level", "tree_node", "blocks"):
        if not d.get(field):
            err(f"{rel}: missing top-level `{field}`")
    if d.get("level") not in LEVELS:
        err(f"{pid}: bad level {d.get('level')!r}")
    if d.get("default_direction") not in ("cz_to_en", "en_gap"):
        err(f"{pid}: default_direction must be 'cz_to_en' (or 'en_gap' for gap-only packs)")

    for hit in find_pl_keys(d):
        err(f"{pid}: forbidden `pl` field at {hit}")

    check_intro_density(pid, d, path)
    check_intro_visual(pid, d, path)

    # Word-formation packs (FCE/CAE Part 3, 2026-08-18): EN-only by James's
    # ruling — the capitalised root cue carries the item, so `cz` is not
    # required. Everything the mode depends on is checked per item below.
    wf = d.get("kind") == "word_formation"

    n_items = 0
    for bi, b in enumerate(d.get("blocks") or []):
        where = f"blocks[{bi}]"
        if not isinstance(b, dict) or not isinstance(b.get("items"), list):
            err(f"{pid} {where}: block must have items[]")
            continue
        for ii, it in enumerate(b["items"]):
            w = f"{where}.items[{ii}]"
            n_items += 1
            if not isinstance(it, dict):
                err(f"{pid} {w}: item is not an object")
                continue
            # Sort rows carry `bin`: the learner drops an English chip into a
            # bucket, so there is no Czech side to render and no gloss to
            # write. Same exemption as word_formation above (James,
            # 2026-08-31 — 27 of 31 "missing cz" errors were sort rows).
            sortable = isinstance(it.get("bin"), str) and it["bin"].strip()
            for f in ("en",) if (wf or sortable) else ("en", "cz"):
                if not isinstance(it.get(f), str) or not it[f].strip():
                    err(f"{pid} {w}: `{f}` missing or empty")
            if wf:
                has_gap = isinstance(it.get("gap"), str) and BLANK_RE.search(
                    it.get("gap") or ""
                )
                # Match / open-Use rows are not clozes — no root cue, no chips.
                # Root + quiz_options stay mandatory on every gap (Quiz/Type).
                if has_gap:
                    root = it.get("root")
                    if not isinstance(root, str) or not root.strip():
                        err(f"{pid} {w}: word_formation item needs a `root` cue")
                    else:
                        if root != root.upper():
                            err(f"{pid} {w}: root {root!r} must be CAPITALISED")
                        if str(it.get("gap_answer") or "").strip().lower() == root.strip().lower():
                            err(
                                f"{pid} {w}: gap_answer equals the root — "
                                f"nothing is derived"
                            )
                    block_seq = b.get("check", {}).get("sequence") if isinstance(b, dict) else None
                    pack_seq = d.get("check", {}).get("sequence")
                    pack_wants_quiz = pack_seq is None or (
                        isinstance(pack_seq, list) and "quiz" in pack_seq
                    )
                    wants_quiz = (
                        pack_wants_quiz
                        if not isinstance(block_seq, list)
                        else ("quiz" in block_seq)
                    )
                    if wants_quiz:
                        # Distractors must be wrong derivations of the SAME root;
                        # sibling-borrowed options would be other roots' words and
                        # transparently wrong, so authored quiz_options are required.
                        if not isinstance(it.get("quiz_options"), list) or len(
                            it.get("quiz_options") or []
                        ) < 2:
                            err(f"{pid} {w}: word_formation item needs quiz_options")
                        # House style (James, 2026-08-18, after smoking b1_suffixes):
                        # 4 options — answer + class trap + two by-ear misspellings
                        # (acter, visiter). Spelling is what the exam grades.
                        elif len(it["quiz_options"]) < 4:
                            warn(f"{pid} {w}: only {len(it['quiz_options'])} quiz options "
                                 f"(house style is 4: answer + trap + 2 misspellings)")
                    if not (it.get("explanation") or "").strip():
                        warn(f"{pid} {w}: no explanation (wrong answers show none)")
            gap, ga = it.get("gap"), it.get("gap_answer")
            if gap is not None or ga is not None:
                if not (isinstance(gap, str) and BLANK_RE.search(gap)):
                    err(f"{pid} {w}: gap must contain a ___ blank")
                # zero_article items teach "no word here" — empty answer is the point
                if not (isinstance(ga, str) and ga.strip()) and not it.get("zero_article"):
                    err(f"{pid} {w}: gap_answer missing/empty")
                elif isinstance(it.get("en"), str):
                    en_words = set(norm_words(it["en"]))
                    missing = [
                        x for x in norm_words(ga) if x not in en_words
                    ]
                    if missing:
                        warn(
                            f"{pid} {w}: gap_answer words {missing} not in en "
                            f"(frame may not reconstruct)"
                        )
            for name in ("accepts", "gap_accepts", "quiz_options"):
                check_str_list(pid, w, name, it.get(name))
    if (
        n_items == 0
        and d.get("status") != "stub"
        and d.get("practice")
        not in (
            "match_sprint",
            "type_sprint",
            "grammar_match_sprint",
            "grammar_type_sprint",
            "use_sprint",
        )
    ):
        warn(f"{pid}: pack has zero items")

    # Use-stage sentence bank (leaf vocab packs). Prompt is cz, answer is en.
    sents = d.get("sentences")
    if sents is not None:
        if not isinstance(sents, list):
            err(f"{pid}: `sentences` must be a list")
        else:
            item_lemmas = {
                " ".join(norm_words(it["en"]))
                for b in d.get("blocks") or []
                for it in (b.get("items") or [])
                if isinstance(it, dict) and isinstance(it.get("en"), str)
            }
            for si, s in enumerate(sents):
                w = f"sentences[{si}]"
                if not isinstance(s, dict):
                    err(f"{pid} {w}: not an object")
                    continue
                for f in ("en", "cz"):
                    if not isinstance(s.get(f), str) or not s[f].strip():
                        err(f"{pid} {w}: `{f}` missing or empty")
                check_str_list(pid, w, "accepts", s.get("accepts"))
                check_str_list(pid, w, "lemmas", s.get("lemmas"))
                # lemmas drive guaranteed exposure — they must be words this
                # pack actually teaches, or Use demands an untaught word.
                for lem in s.get("lemmas") or []:
                    if item_lemmas and " ".join(norm_words(lem)) not in item_lemmas:
                        warn(
                            f"{pid} {w}: lemma {lem!r} is not an item in this pack"
                        )
                # Same family of fault as the warning above: an inflected or
                # split lemma ("threw away" for "throw away") never matches
                # its own en, so sentence_gap silently drops that word's
                # Quiz/Type item with every check green.
                lems = s.get("lemmas") or []
                if lems and isinstance(s.get("en"), str) and \
                        not any(frame_gaps(lem, s["en"]) for lem in lems
                                if isinstance(lem, str)):
                    warn(
                        f"{pid} {w}: no lemma gaps in its own `en` — "
                        f"sentence_gap yields no Quiz/Type item for this frame"
                    )


def cross_check_tree(pack_ids_by_file: dict[str, str]) -> None:
    tree_path = DATA / "tree.json"
    if not tree_path.is_file():
        err("data/tree.json missing")
        return
    tree = json.loads(tree_path.read_text(encoding="utf-8"))
    node_ids = {n["id"] for n in tree.get("nodes") or []}
    for n in tree.get("nodes") or []:
        c = n.get("content")
        if n.get("status") == "live" and c and not (DATA / c).is_file():
            err(f"tree: live node {n['id']} content missing on disk: {c}")
    # path integrity: every id on every path resolves to a node
    for key in ("path_order", "path_order_a2", "path_order_b1",
                "path_order_b2", "path_order_c1"):
        for nid in tree.get(key) or []:
            if nid not in node_ids:
                err(f"tree: {key} references unknown node {nid}")
    # every pack's tree_node should exist
    for rel, tn in pack_ids_by_file.items():
        if tn and tn not in node_ids:
            warn(f"{rel}: tree_node {tn!r} not present in tree.json")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    files = (
        [Path(a) for a in args]
        if args
        else sorted(DATA.glob("*/blocks/*.json"))
    )
    seen_ids: dict[str, str] = {}
    pack_tree_nodes: dict[str, str] = {}
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            pid = d.get("id", "")
            if pid in seen_ids:
                err(f"duplicate pack id {pid!r}: {rel} and {seen_ids[pid]}")
            elif pid:
                seen_ids[pid] = rel
            pack_tree_nodes[rel] = d.get("tree_node", "")
        except Exception:  # noqa: BLE001
            pass  # lint_pack reports the JSON error
        lint_pack(f)
    if not args:
        cross_check_tree(pack_tree_nodes)

    report_c9()
    report_c10()
    if "--tighten" in sys.argv:
        # Only on a full-corpus run — a subset would write a false baseline.
        if args:
            print("C9/C10: --tighten ignored (needs a full run, no file arguments)")
        else:
            C9_BASELINE.write_text(
                json.dumps({"count": len(c9_hits)}, indent=2) + "\n", encoding="utf-8"
            )
            print(f"C9: baseline written — {len(c9_hits)}")
            C10_BASELINE.write_text(
                json.dumps({"count": len(c10_hits)}, indent=2) + "\n", encoding="utf-8"
            )
            print(f"C10: baseline written — {len(c10_hits)}")

    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(
        f"\nverify_pack: {len(files)} packs · "
        f"{len(errors)} errors · {len(warnings)} warnings"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
