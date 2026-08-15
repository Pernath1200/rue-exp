#!/usr/bin/env python3
"""build_student_practice_page.py — one practice page from a student's marked sheets.

Reads every feedback .docx given, pulls the Error / Correction / Note rows,
groups them by the app unit their Topic Reference maps to, ranks the groups by
how often the student has made that mistake, and emits an HTML page plus a
linked PDF.

    py -X utf8 codex/build_student_practice_page.py --name "Martina" \
        --out "C:/Users/ADMIN/Desktop/Martina_Practice.html" <sheet.docx> ...

IMPORTANT — this ASSEMBLES, it does not author. Every error, correction and
note is James's own text, lifted verbatim from sheets he already wrote and
approved. The only things this file adds are the grouping, the ranking, and the
links. No teaching prose is generated here, by policy: student-facing teaching
material is written in the TA project, not in Claude Code.

Rows whose topic has no unit keep their note and get no link — the gaps stay
visible rather than being force-mapped.
"""
from __future__ import annotations

import argparse
import html
import json
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://pernath1200.github.io/rue-exp/"
SOFFICE = Path(r"C:\Program Files\LibreOffice\program\soffice.exe")
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

NO_UNIT = "_nounit"


def student_label(title: str, level: str) -> str:
    """Never produce "Subject-verb agreement (A2) (A2)" — some titles carry it."""
    title = (title or "").strip()
    if level and title.endswith(f"({level})"):
        return title
    return f"{title} ({level})"


def unit_labels() -> dict[str, tuple[str, str]]:
    out: dict[str, tuple[str, str]] = {}
    for domain in ("grammar", "vocab"):
        for p in (ROOT / "data" / domain / "blocks").glob("*.json"):
            d = json.loads(p.read_text(encoding="utf-8"))
            node = d.get("tree_node") or d.get("id")
            out[node] = (
                student_label(d.get("title"), d.get("level")),
                f"{SITE}#{node}",
            )
    return out


def rows_from(path: Path) -> list[tuple[str, str, str, str]]:
    """(error, correction, note, topic_label) for every data row with content."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))

    def text(el) -> str:
        return " ".join(
            "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
            for p in el.iter(f"{W}p")
        ).strip()

    out: list[tuple[str, str, str, str]] = []
    for tbl in root.iter(f"{W}tbl"):
        trs = list(tbl.iter(f"{W}tr"))
        if not trs:
            continue
        header = [text(tc).lower() for tc in trs[0].iter(f"{W}tc")]
        col = {}
        for i, h in enumerate(header):
            for key in ("error", "correction", "note", "explanation", "topic"):
                if key in h and key not in col:
                    col[key] = i
        if "error" not in col or "correction" not in col:
            continue
        note_i = col.get("note", col.get("explanation"))
        for tr in trs[1:]:
            cells = [text(tc) for tc in tr.iter(f"{W}tc")]

            def get(i):
                return cells[i].strip() if i is not None and len(cells) > i else ""

            err, corr = get(col["error"]), get(col["correction"])
            if not err or not corr or err.lower() == "error":
                continue
            out.append((err, corr, get(note_i), get(col.get("topic"))))
    return out


def build_html(name: str, groups: "OrderedDict[str, list]", units: dict, n_sheets: int) -> str:
    total = sum(len(v) for v in groups.values())
    css = """
@page { size: A4; margin: 14mm 14mm 12mm 14mm; }
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",Calibri,system-ui,sans-serif;font-size:10pt;line-height:1.4;color:#1a1a1a;background:#fff}
h1{font-size:18pt;margin:0 0 2mm}
.who{color:#555;margin:0 0 4mm;padding-bottom:3mm;border-bottom:2px solid #1f4e79}
.lead{margin:0 0 5mm}
h2{font-size:12pt;color:#1f4e79;margin:6mm 0 1mm;padding-top:2.5mm;border-top:1px solid #d8d8d8;page-break-after:avoid}
section{page-break-inside:avoid}
.practise{margin:0 0 2mm;font-size:10pt}
.count{color:#666;font-weight:400;font-size:10pt}
table{width:100%;border-collapse:collapse;margin:1mm 0 2mm;font-size:9.5pt}
th{text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:.06em;color:#666;font-weight:600;padding:0 3mm 1.2mm 0;border-bottom:1px solid #c9c9c9}
td{padding:1.1mm 3mm 1.1mm 0;border-bottom:1px solid #ececec;vertical-align:top}
td.said{color:#8a3535;width:27%}
td.right{color:#17492c;width:27%}
td.note{color:#444;font-size:9pt}
a{color:#1f4e79;border-bottom:1px solid #b9cbdd;text-decoration:none}
.nolink{color:#666;font-style:italic}
.links{margin-top:6mm;padding-top:2.5mm;border-top:1px solid #d8d8d8;font-size:8.5pt;color:#555}
.links h3{font-size:8.5pt;text-transform:uppercase;letter-spacing:.06em;margin:0 0 2mm}
.links td{border:none;padding:.7mm 4mm .7mm 0}
code{font-family:Consolas,monospace;font-size:8pt}
"""
    esc = html.escape
    parts = [
        "<!doctype html><html lang='en'><head><meta charset='utf-8'>",
        f"<title>{esc(name)} — your English so far</title><style>{css}</style></head><body>",
        "<h1>Your English so far</h1>",
        f"<p class='who'><strong>{esc(name)}</strong> · every correction from "
        f"{n_sheets} pieces of writing</p>",
        f"<p class='lead'>{total} corrections, grouped by what to practise and "
        "ordered by how often each one has come up. The most frequent is first.</p>",
    ]

    used: list[tuple[str, str]] = []
    n = 0
    for node, rows in groups.items():
        n += 1
        if node == NO_UNIT:
            head = "Not an exercise — read these and re-check when you write"
            practise = ""
        else:
            label, url = units[node]
            used.append((label, url))
            head = esc(label)
            practise = f"<p class='practise'>Practise: <a href='{url}'>{esc(label)}</a></p>"
        parts.append(
            f"<section><h2>{n} · {head} "
            f"<span class='count'>· {len(rows)} correction"
            f"{'s' if len(rows) != 1 else ''}</span></h2>{practise}"
        )
        parts.append("<table><tr><th>You wrote</th><th>English</th><th>Why</th></tr>")
        for err, corr, note, _ in rows:
            parts.append(
                f"<tr><td class='said'>{esc(err)}</td>"
                f"<td class='right'>{esc(corr)}</td>"
                f"<td class='note'>{esc(note)}</td></tr>"
            )
        parts.append("</table></section>")

    if used:
        parts.append("<div class='links'><h3>If a link does not open, type the address</h3><table>")
        for label, url in used:
            parts.append(
                f"<tr><td>{esc(label)}</td>"
                f"<td><code>{esc(url.replace('https://', ''))}</code></td></tr>"
            )
        parts.append("</table></div>")

    parts.append("</body></html>")
    return "\n".join(parts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("sheets", nargs="+")
    a = ap.parse_args()

    mapping = json.loads(
        (ROOT / "codex" / "marking_topic_map.json").read_text(encoding="utf-8")
    )["map"]
    units = unit_labels()

    buckets: dict[str, list] = {}
    seen_rows: set[tuple[str, str]] = set()
    n_sheets = 0
    for s in a.sheets:
        p = Path(s)
        if not p.exists():
            print(f"  !! missing {p}")
            continue
        n_sheets += 1
        for err, corr, note, label in rows_from(p):
            key = (err.lower(), corr.lower())
            if key in seen_rows:        # Kobe / 28-May are the same sheet twice
                continue
            seen_rows.add(key)
            node = mapping.get(label) if label else None
            if node not in units:
                node = None
            buckets.setdefault(node or NO_UNIT, []).append((err, corr, note, label))

    ordered = OrderedDict(
        sorted(
            ((k, v) for k, v in buckets.items() if k != NO_UNIT),
            key=lambda kv: -len(kv[1]),
        )
    )
    if NO_UNIT in buckets:
        ordered[NO_UNIT] = buckets[NO_UNIT]

    out = Path(a.out)
    out.write_text(build_html(a.name, ordered, units, n_sheets), encoding="utf-8")
    print(f"wrote {out}")
    for k, v in ordered.items():
        name = "— no unit —" if k == NO_UNIT else units[k][0]
        print(f"  {len(v):>3}  {name}")

    if EDGE.exists():
        pdf = out.with_suffix(".pdf")
        subprocess.run(
            [str(EDGE), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
             f"--print-to-pdf={pdf}", out.resolve().as_uri()],
            capture_output=True, text=True, timeout=180,
        )
        if pdf.exists():
            print(f"wrote {pdf}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
