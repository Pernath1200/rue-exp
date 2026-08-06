# BUILD DIGEST — one entry per run, newest at top

Format per entry: date/time UTC · lane (cloud/local) · what landed (counts +
node ids) · gate results (lint errors, audit total vs baseline) · judgment
calls & forks for James · anything to smoke-check.

---

## 2026-08-06 · local (setup)

Gates built and calibrated: verify_pack (hard, 0 errors on 154 packs),
make_pool (position-aware), audit ratchet (baseline **756** unknown types
across 71/113 live units — partner-pair pooling + GLUE incl. names/days).
Node registry localised (labs frozen, snapshot in data/nodes-*.json).
Repair queue seeded with 3 items from first lint pass.
