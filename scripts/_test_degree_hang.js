/** Confirm Degree lights Sentence, not Forms. node scripts/_test_degree_hang.js */
const tree = JSON.parse(
  await (await import("node:fs/promises")).readFile(
    new URL("../data/tree.json", import.meta.url),
    "utf8",
  ),
);
const { renderTreePortrait } = await import("../js/tree-portrait.js");
const node = tree.nodes.find((n) => n.id === "b1_degree_adverbs");
if (node.root !== "sentence_syntax" || node.codex_unit !== "G_SS-B1B2-01") {
  console.error("FAIL hang fields", node.root, node.codex_unit);
  process.exit(1);
}
const host = { innerHTML: "", querySelectorAll() { return []; } };
const painted = renderTreePortrait(host, {
  level: "B1",
  nodes: [node],
  isFruit: (id) => id === "b1_degree_adverbs",
  progressState: (id) => (id === "b1_degree_adverbs" ? "fruit" : "none"),
});
const sent = painted.laterals.find((L) => L.tree_part === "sentence_syntax");
const forms = painted.laterals.find((L) => L.tree_part === "noun_phrase");
if (!sent.fruited.length) {
  console.error("FAIL Sentence not fruited");
  process.exit(1);
}
if (forms.fruited.length) {
  console.error("FAIL Forms still fruited");
  process.exit(1);
}
console.log("ok: Degree fruit lights Sentence, not Forms");
