/**
 * Home glance + smoke-host split (jsdom-free source check).
 * Run: node scripts/_test_home_glance.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else console.log("ok:", msg);
}

assert(
  /id="home-progress-line"/.test(html),
  "home has the quiet A2 · 12/42 line",
);
assert(
  /id="backup-details"/.test(html),
  "Backup is its own More block",
);
assert(
  /id="progress-details"[\s\S]*id="backup-details"/.test(html),
  "Progress block comes before Backup",
);
const progressChunk = html.slice(
  html.indexOf('id="progress-details"'),
  html.indexOf('id="backup-details"'),
);
assert(
  !/id="progress-transfer"/.test(progressChunk),
  "Download / Import is not inside Progress",
);
assert(
  /id="progress-transfer"/.test(html),
  "Download / Import still exists under Backup",
);

assert(
  !/Learned = finished once/.test(app),
  "meters legend paragraph is gone",
);
assert(
  /home-progress-line/.test(app) &&
    /\$\{STATE\.level\} · \$\{stats\.learned\}\/\$\{stats\.total\}/.test(app),
  "home glance is level · learned/total",
);
assert(
  /meter-pct[\s\S]*meter-frac/.test(app),
  "meter rows still show % and n/t",
);

assert(
  !/SMOKE_SESSION_KEY/.test(app),
  "localhost smoke no longer uses ?smoke= session flag",
);
assert(
  !/get\("smoke"\)/.test(app),
  "localhost smoke no longer reads ?smoke=",
);
assert(
  /IS_DEV_HOST/.test(app) && /Pages \/ class: never/.test(app),
  "smoke chrome still gated on localhost vs Pages",
);
const hostRe = /^(localhost|127\.0\.0\.1|\[::1\]|$)/;
assert(hostRe.test("localhost"), "localhost is the build host");
assert(hostRe.test("127.0.0.1"), "loopback is the build host");
assert(!hostRe.test("github.io"), "Pages hostname is not the build host");
assert(!hostRe.test("foo.github.io"), "project Pages is not the build host");
assert(
  /bar\.hidden = false/.test(app) &&
    /live\.hidden = false/.test(app),
  "localhost smoke turns Flag and EN answers on together",
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall ok");
