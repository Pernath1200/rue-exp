/**
 * Calendar intro diagrams: week_strip / year_grid (a1_time_3).
 * Run: node scripts/_test_calendar_intro.js
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { introDiagram, DIAGRAM_KEYS } = await import(
  pathToFileURL(join(ROOT, "js/intro-visuals.js")).href
);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

const count = (html, cls) => (html.match(new RegExp(cls, "g")) || []).length;

assert(DIAGRAM_KEYS.includes("week_strip"), "week_strip is a pack-usable diagram");
assert(DIAGRAM_KEYS.includes("year_grid"), "year_grid is a pack-usable diagram");
assert(introDiagram("no_such_diagram", []) === "", "unknown diagram renders nothing");

const block = JSON.parse(
  readFileSync(join(ROOT, "data/vocab/blocks/a1_time_3.json"), "utf8"),
);
const [days, months] = block.intro;

assert(days.diagram === "week_strip" && !days.table, "intro page 1 is the week strip");
assert(months.diagram === "year_grid" && !months.table, "intro page 2 is the year grid");

const week = introDiagram(days.diagram, days.labels);
assert(count(week, "cal-cell") === 7, `week strip draws 7 days (${count(week, "cal-cell")})`);
assert(count(week, "is-weekend") === 2, "week strip shades Saturday and Sunday");
assert(count(week, "is-today") === 1, "exactly one day is tagged today");
assert(count(week, "is-tomorrow") === 1, "exactly one day is tagged tomorrow");

const year = introDiagram(months.diagram, months.labels);
assert(count(year, "cal-cell") === 12, `year grid draws 12 months (${count(year, "cal-cell")})`);
assert(count(year, "is-now") === 1, "exactly one month is ringed as now");
["winter", "spring", "summer", "autumn"].forEach((s) => {
  assert(count(year, `season-${s}`) >= 3, `${s} shades its months and its legend key`);
});

// Both languages of every label must survive into the render — a calendar that
// silently drops a month is worse than the table it replaced.
for (const [name, html, sec] of [["week", week, days], ["year", year, months]]) {
  const text = html.replace(/<[^>]+>/g, " ");
  const missing = sec.labels
    .flatMap((l) => l.split(" · "))
    .filter((w) => !text.includes(w));
  assert(missing.length === 0, `${name}: every label word renders (missing: ${missing.join(", ")})`);
}

// Forks share this file — no target-language text may be hard-coded in it.
const src = readFileSync(join(ROOT, "js/intro-visuals.js"), "utf8");
const fnSrc = src.slice(src.indexOf("function week_strip"), src.indexOf("const HTML_SCHEMATICS"));
assert(
  !/[ěščřžýáíéúůňťď]/i.test(fnSrc),
  "calendar renderers carry no Czech — every word comes from pack labels",
);

// Degrade rather than throw on a short or absent label set.
assert(introDiagram("week_strip", []) === "", "week strip with no labels renders nothing");
assert(introDiagram("year_grid", ["January · leden"]) === "", "year grid needs all 12 months");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ALL PASS (calendar intro diagrams)");
