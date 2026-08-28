/**
 * Output assertions: run the reference consumer over a real corpus and read
 * what it produced.
 *
 * This category exists because of a defect every other check passed. The
 * narrative-binding grammar was implemented twice, the parser gained
 * `bound-at` and the renderer's copy did not, and six raw HTML comments
 * leaked into the rendered page with zero binding links. Types compiled,
 * lints passed, the site generated. Only reading the output catches it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { homedir } from "node:os";
import { bindingRe, loadCorpus } from "@epistemic-record-format/yaml-markdown";
import { buildCutTree, flattenTree, readCuts } from "../../tools/viewer/cut.ts";
import { DISPOSITIONS, KINDS, LEGEND_LEAD, MARKS } from "../../tools/viewer/vocabulary.ts";
import { REPO, VIEWER } from "../paths.ts";

const CORPUS = join(REPO, "examples", "corpora", "minimal");
const CAPEX = join(REPO, "examples", "corpora", "ai-capex");
/** A real corpus with a cut listing every claim of each section as a root; skipped where the checkout is absent. */
const VENTURE = join(homedir(), "dev", "erf-corpora", "ai-era-consultancy-venture-design");

function build(corpus = CORPUS): string {
  const out = mkdtempSync(join(tmpdir(), "erf-conformance-"));
  execFileSync("npx", ["tsx", "erf-view.ts", corpus, "-o", out], {
    cwd: VIEWER, stdio: "pipe", encoding: "utf8",
  });
  return out;
}

const site = build();
const page = (f: string) => readFileSync(join(site, f), "utf8");
const pages = () => readdirSync(site).filter((f) => f.endsWith(".html"));

test("ERF-33 no narrative binding survives into the rendered prose", () => {
  // A leaked marker is the visible symptom of a dropped binding: the
  // requirement forbids losing one silently, and a raw comment in the page
  // means the renderer did not recognise it.
  for (const f of pages().filter((f) => f.startsWith("narrative-"))) {
    const html = page(f);
    assert.ok(!html.includes("<!-- claims:"), `raw binding marker survived into ${f}`);
    assert.ok(!html.includes("&lt;!-- claims:"), `escaped binding marker survived into ${f}`);
  }
});

test("ERF-31/33 every binding in the source appears in the output", () => {
  const narratives = join(CORPUS, "narratives");
  if (!existsSync(narratives)) return;
  let expected = 0;
  for (const f of readdirSync(narratives).filter((f) => f.endsWith(".md"))) {
    const body = readFileSync(join(narratives, f), "utf8");
    expected += [...body.matchAll(bindingRe())].length;
  }
  const rendered = pages()
    .filter((f) => f.startsWith("narrative-"))
    .reduce((n, f) => n + (page(f).match(/class="bindnote"/g) ?? []).length, 0);
  assert.equal(rendered, expected, "binding count in the output differs from the source");
});

test("ERF-31 every binding anchor is a verbatim substring of its passage", () => {
  // The anchor is REQUIRED and exists so software can find the spot after the
  // prose moves. An anchor that does not occur in the body cannot do that: it
  // degrades silently to a line number, which edits destroy.
  const narratives = join(CORPUS, "narratives");
  if (!existsSync(narratives)) return;
  const missing: string[] = [];
  for (const f of readdirSync(narratives).filter((f) => f.endsWith(".md"))) {
    const body = readFileSync(join(narratives, f), "utf8");
    const prose = body.replace(bindingRe(), "");
    for (const m of body.matchAll(bindingRe())) {
      const anchor = m[2] ?? "";
      if (!anchor || !prose.includes(anchor)) missing.push(`${f}: "${anchor}"`);
    }
  }
  assert.deepEqual(missing, [], `anchors that do not occur in their passage:\n  ${missing.join("\n  ")}`);
});

test("ERF-41 every claim page states a disposition", () => {
  for (const f of pages().filter((f) => f.startsWith("claim-"))) {
    const html = page(f);
    assert.ok(
      /proposal|active|contested|rejected|retired/.test(html),
      `${f} states no disposition`,
    );
  }
});

test("ERF-42 a rendered disposition is styled rather than falling back", () => {
  // A disposition with no stylesheet rule renders unstyled, which reads to a
  // viewer as a broken page rather than as a claim nobody has ruled on.
  const css = readFileSync(join(VIEWER, "render.ts"), "utf8");
  for (const d of ["proposal", "active", "contested", "rejected", "retired"]) {
    assert.ok(css.includes(`d-${d}`), `no stylesheet rule for the ${d} disposition`);
  }
});

test("ERF-50 a capture page never claims a pass it did not compute", () => {
  // Pairs the verdict with its evidence: a page saying the check passed must
  // show the located quote, or the two halves have diverged.
  for (const f of pages().filter((f) => f.startsWith("capture-"))) {
    const html = page(f);
    if (html.includes("Quote check passes")) {
      assert.ok(html.includes("<mark>"), `${f} reports a pass but highlights nothing`);
    }
  }
});

/**
 * The cut page (`docs/patterns/claims-tree.md`): the tree under each root is
 * computed from `decomposes-into` and `assumes` edges, numbered by the
 * traversal, every claim shown once. These read the tree the viewer builds
 * and the page it writes, on the example corpus that ships and on the
 * venture corpus where that checkout is present.
 */
const cutNumbers = (html: string): string[] =>
  [...html.matchAll(/<span class="num">([^<]+)<\/span>/g)].map((m) => m[1]!);

test("claims-tree: every root of every section resolves to a claim, and the tree is numbered by the traversal", () => {
  const c = loadCorpus(CAPEX);
  const cuts = readCuts(CAPEX);
  assert.ok(cuts.length >= 1, "the example corpus ships a cut");
  for (const cut of cuts) {
    const t = buildCutTree(cut, c);
    assert.deepEqual(t.unresolvedRoots, [], `${cut.name}: roots that name no claim`);
    const nodes = flattenTree(t);
    // Numbering: a section's roots are section.n in listed order, a child is
    // parent.n in edge order, depth counts from the root; no number and no
    // claim appears twice.
    const checkNode = (n: typeof nodes[number], number: string, depth: number): void => {
      assert.equal(n.number, number, `${n.id} is numbered by the traversal`);
      assert.equal(n.depth, depth, `${n.id}: depth counts from its root`);
      n.children.forEach((k, i) => checkNode(k, `${number}.${i + 1}`, depth + 1));
    };
    const checkSection = (s: typeof t.sections[number]): void => {
      s.roots.forEach((r, i) => checkNode(r, `${s.number}.${i + 1}`, 0));
      s.sections.forEach((x, i) => assert.equal(x.number, `${s.number}.${s.roots.length + i + 1}`));
      s.sections.forEach(checkSection);
    };
    t.sections.forEach((s, i) => { assert.equal(s.number, String(i + 1)); checkSection(s); });
    assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length, "no claim placed twice");
    assert.equal(new Set(nodes.map((n) => n.number)).size, nodes.length, "no number assigned twice");
    // Every child is reached by a walked edge on its parent.
    for (const n of nodes.filter((x) => x.parent)) {
      const edges = c.claims.get(n.parent!)!.edges;
      assert.ok(edges.some((e) => e.to === n.id && e.relation === n.placedBy), `${n.id} sits under ${n.parent} by a ${n.placedBy} edge`);
    }
  }
});

test("claims-tree: the rendered cut page carries the numbering, the cards, and the passages bound", () => {
  const out = build(CAPEX);
  const cuts = readCuts(CAPEX);
  const html = readFileSync(join(out, `cut-${cuts[0]!.name}.html`), "utf8");
  const c = loadCorpus(CAPEX);
  const t = buildCutTree(cuts[0]!, c);
  assert.deepEqual(cutNumbers(html), flattenTree(t).map((n) => n.number), "the page numbers the nodes as the traversal does");
  // The first root is an argument resting on observations: its premises are
  // its children, each with its evidence cards, quote first, finding after.
  const root = t.sections[0]!.roots[0]!;
  assert.ok(root.children.length >= 2, "the first root has premises under it");
  const child = root.children.find((n) => (n.claim?.atoms_for.length ?? 0) > 0)!;
  const cardsAt = html.indexOf(`<details class="ev" id="ev-${child.id}">`);
  assert.ok(cardsAt > 0, `${child.id} carries evidence cards`);
  const block = html.slice(cardsAt, html.indexOf("</details>", cardsAt));
  const cards = [...block.matchAll(/<article class="pvatom[^"]*" data-side="(for|against)">/g)];
  assert.equal(cards.length, child.claim!.atoms_for.length + child.claim!.atoms_against.length, "one card per atom, for and against");
  for (const id of child.claim!.atoms_for) {
    const a = c.atoms.get(id)!;
    const at = block.indexOf(`href="atom-${id}.html"`);
    assert.ok(at > 0, `card names ${id}`);
    const quote = block.indexOf(a.quote.split("[...]")[0]!.trim().split("\n")[0]!.slice(0, 40).replace(/&/g, "&amp;").replace(/"/g, "&quot;"), at);
    const finding = block.indexOf(a.finding.slice(0, 40).replace(/&/g, "&amp;").replace(/"/g, "&quot;"), at);
    assert.ok(quote > at && finding > quote, `${id}: quote first, finding after`);
    assert.ok(block.includes(`href="capture-${id}.html"`) || block.includes(`href="sources.html#${a.source}"`), `${id}: the citation links to the capture or the source`);
  }
  // A claim bound in a narrative links to the passage, at an anchor the narrative page carries.
  const bound = flattenTree(t).find((n) => c.narratives.some((nr) => nr.bindings.some((b) => b.claims.includes(n.id))))!;
  const m = new RegExp(`href="narrative-([^"#]+)\\.html#bind-(\\d+)"`).exec(html.slice(html.indexOf(`id="k-${bound.id}"`)));
  assert.ok(m, `${bound.id} links to the narrative passage resting on it`);
  assert.ok(readFileSync(join(out, `narrative-${m![1]}.html`), "utf8").includes(`id="bind-${m![2]}"`), "the narrative page carries the anchor");
  // The placing edge is named on every non-root node, in words.
  for (const n of flattenTree(t).filter((x) => x.parent)) {
    const at = html.indexOf(`id="k-${n.id}"`);
    const line = html.slice(at, html.indexOf("</div></div>", at));
    assert.ok(line.includes(n.placedBy === "assumes" ? "premise of" : "part of"), `${n.id} names its placing edge`);
  }
});

const escHtml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

test("claims-tree: the legend is generated from the vocabulary table, kinds uncoloured, dispositions coloured, no [given]", () => {
  const out = build(CAPEX);
  const cuts = readCuts(CAPEX);
  const html = readFileSync(join(out, `cut-${cuts[0]!.name}.html`), "utf8");
  const at = html.indexOf('<div class="legend">');
  assert.ok(at > 0, "the cut page carries a legend");
  const legend = html.slice(at, html.indexOf("<h2", at));
  assert.ok(legend.includes(escHtml(LEGEND_LEAD)), "the lead says how a claim line reads and where a click goes");
  // The vocabulary is the specification's: the four kinds of section 5, the five dispositions of ERF-41.
  assert.deepEqual(KINDS.map((k) => k.term).sort(), ["argument", "bet", "commitment", "observation"]);
  assert.deepEqual(DISPOSITIONS.map((d) => d.term).sort(), ["active", "contested", "proposal", "rejected", "retired"]);
  // Each term is glossed with the table's words, in the table's order; a
  // kind is set plain, a disposition in its colour class.
  let last = -1;
  for (const k of KINDS) {
    const i = legend.indexOf(`<span class="t">${k.term}</span></dt><dd>${escHtml(k.gloss)}</dd>`);
    assert.ok(i > last, `${k.term}: glossed, uncoloured, in table order`); last = i;
  }
  for (const d of DISPOSITIONS) {
    const i = legend.indexOf(`<span class="t d-${d.term}">${d.term}</span></dt><dd>${escHtml(d.gloss)}</dd>`);
    assert.ok(i > last, `${d.term}: glossed, in its colour, in table order`); last = i;
  }
  for (const m of MARKS) {
    const i = legend.indexOf(`</dt><dd>${escHtml(m.gloss)}</dd>`);
    assert.ok(i > last, `${m.term}: glossed in table order`);
    assert.ok(legend.slice(last < 0 ? 0 : last, i).includes(escHtml(m.term)), `${m.term} is the term before its gloss`); last = i;
  }
  assert.ok(!legend.includes("given"), "the format has no [given] mark, so the legend lists none");
});

test("claims-tree: a node's relations line reads in both directions", () => {
  const out = build(CAPEX);
  const c = loadCorpus(CAPEX);
  const cuts = readCuts(CAPEX);
  const t = buildCutTree(cuts[0]!, c);
  const html = readFileSync(join(out, `cut-${cuts[0]!.name}.html`), "utf8");
  const nodeHtml = (id: string): string => {
    const at = html.indexOf(`id="k-${id}"`);
    assert.ok(at > 0, `${id} is placed`);
    const ends = ['<div class="node"', "<h2", "<h3", "</main>"].map((m) => html.indexOf(m, at + 1)).filter((i) => i > 0);
    return html.slice(at, Math.min(...ends));
  };
  const placedNum = (id: string) => `<a href="#k-${id}"><span class="rnum">${t.placed.get(id)}</span>`;
  // A supports edge reads on both ends, each linking the other by its number.
  const edge = [...c.claims.values()].flatMap((cl) => cl.edges
    .filter((e) => e.relation === "supports" && t.placed.has(cl.id) && t.placed.has(e.to))
    .map((e) => ({ from: cl.id, to: e.to })))[0];
  assert.ok(edge, "the example cut places both ends of a supports edge");
  assert.ok(nodeHtml(edge!.from).includes(`supports ${placedNum(edge!.to)}`), `${edge!.from} says it supports ${edge!.to}`);
  assert.ok(nodeHtml(edge!.to).includes(`supported by ${placedNum(edge!.from)}`), `${edge!.to} says it is supported by ${edge!.from}`);
  // An assumes edge from a claim other than the parent reads on its target
  // as "premise of", the same words the placing edge uses.
  const parentOf = new Map(flattenTree(t).map((n) => [n.id, n.parent]));
  const inb = [...c.claims.values()].flatMap((cl) => cl.edges
    .filter((e) => e.relation === "assumes" && t.placed.has(e.to) && parentOf.get(e.to) !== cl.id)
    .map((e) => ({ from: cl.id, to: e.to })))[0];
  assert.ok(inb, "the example cut has a premise assumed by a claim other than its parent");
  const link = t.placed.has(inb!.from) ? placedNum(inb!.from) : `<a href="claim-${inb!.from}.html">`;
  assert.ok(nodeHtml(inb!.to).includes(`premise of ${link}`), `${inb!.to} names ${inb!.from} as what it is a premise of`);
  // A claim the cut does not place is linked to its own page.
  const outside = [...c.claims.values()].flatMap((cl) => cl.edges
    .filter((e) => e.relation === "supports" && !t.placed.has(cl.id) && t.placed.has(e.to))
    .map((e) => ({ from: cl.id, to: e.to })))[0];
  assert.ok(outside, "the example corpus has a supporter outside the cut");
  assert.ok(nodeHtml(outside!.to).includes(`supported by <a href="claim-${outside!.from}.html">`), `${outside!.to} links the unplaced ${outside!.from} to its page`);
});

test("claims-tree: the index lists every cut", () => {
  const out = build(CAPEX);
  const index = readFileSync(join(out, "index.html"), "utf8");
  for (const cut of readCuts(CAPEX)) assert.ok(index.includes(`href="cut-${cut.name}.html"`), `${cut.name} is listed`);
});

test("claims-tree: a cut whose roots list every claim of a section shows each claim once", { skip: !existsSync(VENTURE) && "the venture corpus checkout is not present" }, () => {
  const c = loadCorpus(VENTURE);
  const cuts = readCuts(VENTURE);
  assert.equal(cuts.length, 1);
  const t = buildCutTree(cuts[0]!, c);
  assert.deepEqual(t.unresolvedRoots, [], "every root resolves to a claim");
  const nodes = flattenTree(t);
  assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length, "no claim placed twice");
  // The cut's own order: the roots of "The technology" are 1.1.1 to 1.1.6 in
  // the listed order, and every claim the section lists is placed.
  const tech = t.sections[0]!.sections[0]!;
  assert.equal(tech.title, "The technology");
  assert.deepEqual(tech.roots.map((r) => r.number), ["1.1.1", "1.1.2", "1.1.3", "1.1.4", "1.1.5", "1.1.6"]);
  assert.deepEqual(tech.roots.map((r) => r.id), cuts[0]!.sections[0]!.sections[0]!.roots);
  // A later root reached from an earlier subtree is a reference, not a copy,
  // and keeps its own place: `value-concentrates-where-models-cant` assumes
  // `traditional-value-diminished`, listed before it in the same section.
  const later = nodes.find((n) => n.id === "value-concentrates-where-models-cant")!;
  assert.equal(later.number, "1.2.2");
  assert.ok(later.refs.some((r) => r.id === "traditional-value-diminished" && r.number === "1.2.1"), "the earlier root is referred to by its number");
  assert.ok(!later.children.some((n) => n.id === "traditional-value-diminished"), "and not expanded again");
  // A node's atoms: 1.1.1 rests on ten atoms for and none against, all resolvable.
  const first = tech.roots[0]!;
  assert.equal(first.id, "models-carry-generic-expertise");
  assert.equal(first.claim!.atoms_for.length, 10);
  assert.equal(first.claim!.atoms_against.length, 0);
  for (const id of first.claim!.atoms_for) assert.ok(c.atoms.has(id), `${id} is held`);
  const out = build(VENTURE);
  const html = readFileSync(join(out, `cut-${cuts[0]!.name}.html`), "utf8");
  assert.deepEqual(cutNumbers(html), nodes.map((n) => n.number));
  assert.ok(html.includes(`<details class="ev" id="ev-${first.id}">`), "1.1.1 carries its cards");
  assert.equal((html.match(/data-side="for"/g) ?? []).length + (html.match(/data-side="against"/g) ?? []).length,
    nodes.reduce((n, x) => n + (x.claim?.atoms_for.length ?? 0) + (x.claim?.atoms_against.length ?? 0), 0), "one card per atom across the page");
  assert.ok(html.includes('<p class="preamble">'), "the preamble is shown");
});

/**
 * The narrative page: each bound passage opens the evidence behind its
 * claims, the same card block the cut page uses, one per claim, under one
 * disclosure the note and the highlighted words both point at. What a
 * narrative is does not change: the bindings, their staleness and their
 * breakage are marked as before.
 */
test("narrative: every bound passage opens its claims' evidence cards, and the note points at them", () => {
  const out = build(CAPEX);
  const c = loadCorpus(CAPEX);
  for (const n of c.narratives) {
    const html = readFileSync(join(out, `narrative-${n.slug}.html`), "utf8");
    n.bindings.forEach((b, i) => {
      const k = i + 1;
      const note = html.indexOf(`<span class="bindnote" id="bind-${k}" data-ev="ev-bind-${k}">`);
      assert.ok(note > 0, `${n.slug}: binding ${k} carries a note pointing at its cards`);
      const claims = b.claims.map((id) => c.claims.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
      const atoms = claims.reduce((t, cl) => t + cl.atoms_for.length + cl.atoms_against.length, 0);
      const at = html.indexOf(`<details class="ev passage" id="ev-bind-${k}">`);
      if (!atoms) { assert.equal(at, -1, `${n.slug}: binding ${k} has nothing to open`); return; }
      assert.ok(at > note, `${n.slug}: the cards for binding ${k} sit under its note`);
      const block = html.slice(at, html.indexOf("</details>", at));
      assert.equal((block.match(/<article class="pvatom/g) ?? []).length, atoms, `${n.slug}: binding ${k} shows one card per atom of each bound claim`);
      for (const cl of claims) assert.ok(block.includes(`href="claim-${cl.id}.html"`), `${n.slug}: the cards name ${cl.id}`);
      // The highlighted words open the same disclosure.
      assert.ok(html.includes(`<span class="bind" data-ev="ev-bind-${k}">`), `${n.slug}: the anchor of binding ${k} points at its cards`);
    });
    // The narrative's own notes are still there, one per binding, with the
    // staleness reading where it is not current.
    assert.equal((html.match(/class="bindnote"/g) ?? []).length, n.bindings.length);
  }
});
