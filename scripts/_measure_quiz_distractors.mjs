/* Read-only measurement: how many live quiz items get a FABRICATED distractor —
 * one borrowed from another item's answer — rather than an authored option set
 * or a real form-confusable. Written 2026-08-24 for the §3 decision.
 * Run: node scripts/_measure_quiz_distractors.mjs
 */
import fs from 'fs';
import path from 'path';
const M = await import('../js/pack-adapt.js');

const tree = JSON.parse(fs.readFileSync('data/tree.json', 'utf8'));
const ng = JSON.parse(fs.readFileSync('data/nodes-grammar.json', 'utf8'));
const live = new Set(tree.path_order);
for (const k of Object.keys(ng)) if (k.startsWith('path_order_')) ng[k].forEach(x => live.add(x));
const nodes = Array.isArray(ng.nodes) ? ng.nodes : Object.values(ng.nodes);
const st = Object.fromEntries(nodes.map(n => [n.id, n.status]));

let tot = 0, authored = 0, good = 0, borrowed = 0, none = 0;
const perUnit = [];
for (const f of fs.readdirSync('data/grammar/blocks')) {
  const uid = f.replace(/\.json$/, '');
  if (!live.has(uid) || st[uid] !== 'live') continue;
  const pack = JSON.parse(fs.readFileSync(path.join('data/grammar/blocks', f), 'utf8'));
  const items = M._flatItems(pack);
  let sib = 0, n = 0;
  for (const it of items) {
    if (!it.gap_answer) continue;
    tot++; n++;
    if (Array.isArray(it.quiz_options) && it.quiz_options.length >= 2) { authored++; continue; }
    const siblings = items.filter(s => s !== it);
    const opts = M._choicesFor(it, siblings, pack);
    if (!opts) { none++; continue; }
    const sibAnswers = new Set(siblings.map(s => M._normKey(String(s.gap_answer || ''))));
    const isBorrowed = opts.slice(1).some(o => sibAnswers.has(M._normKey(String(o))));
    if (isBorrowed) { borrowed++; sib++; } else { good++; }
  }
  if (sib) perUnit.push([sib, n, uid]);
}
console.log('gap items            ', tot);
console.log('authored quiz_options', authored);
console.log('generated, real      ', good, '(verb forms / auxiliaries — legitimate)');
console.log('generated, BORROWED  ', borrowed, '<-- tests nothing');
console.log('no options at all    ', none);
perUnit.sort((a, b) => b[0] - a[0]);
console.log('\nworst units (borrowed / gap items):');
for (const [s, n, u] of perUnit.slice(0, 20)) console.log(`  ${String(s).padStart(3)} / ${String(n).padEnd(3)}  ${u}`);
console.log('\nunits with any borrowing:', perUnit.length);
