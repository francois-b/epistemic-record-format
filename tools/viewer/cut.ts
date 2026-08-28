/**
 * A cut: one tree-shaped traversal of the claim graph chosen for reading
 * (`docs/patterns/claims-tree.md`). The file names roots and headings; the
 * tree under each root is computed here by walking `decomposes-into` and
 * `assumes` edges, and the numbering is assigned by the traversal, so it is
 * stable only within one rendering. A claim is cited by its id, never by
 * its number.
 *
 * Reading the file and building the tree are kept apart from the HTML so a
 * test can assert the numbering without parsing a page.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Claim, LoadedCorpus } from "@epistemic-record-format/yaml-markdown";
import { parseYaml } from "@epistemic-record-format/yaml-markdown";

export interface CutSection { title: string; roots: string[]; sections: CutSection[] }
export interface Cut {
  /** The file's basename without its extension: the page is `cut-<name>.html`. */
  name: string;
  title: string;
  /** Not in the pattern's shape; read as an opening paragraph when present. */
  preamble?: string;
  sections: CutSection[];
}

/** The relation that placed a node under its parent, as the pattern walks it. */
export type PlacingEdge = "decomposes-into" | "assumes";

export interface TreeNode {
  id: string;
  number: string;
  depth: number;
  claim: Claim | null;
  /** The edge on the parent that reached this claim; absent on a root. */
  placedBy?: PlacingEdge;
  parent?: string;
  children: TreeNode[];
  /**
   * Claims this node's walked edges reach that are already placed elsewhere
   * in the rendering (an earlier root, an earlier subtree, or a later root
   * the cut names). Shown as a reference to their number, never expanded
   * again: the venture cut lists every claim of a section as a root, so a
   * naive walk would print most of the document twice.
   */
  refs: { id: string; relation: PlacingEdge; number: string | null }[];
}

export interface NumberedSection {
  title: string;
  number: string;
  depth: number;
  roots: TreeNode[];
  sections: NumberedSection[];
}

export interface CutTree {
  cut: Cut;
  sections: NumberedSection[];
  /** Every placed claim id to its number, in document order. */
  placed: Map<string, string>;
  /** Roots that name no claim in this corpus. Reported, never dropped. */
  unresolvedRoots: string[];
}

const WALKED: readonly PlacingEdge[] = ["decomposes-into", "assumes"];

function asSection(raw: unknown, where: string): CutSection {
  const s = (raw ?? {}) as Record<string, unknown>;
  const title = String(s["title"] ?? "").trim();
  if (!title) throw new Error(`${where}: a section carries no title`);
  const roots = Array.isArray(s["roots"]) ? s["roots"].map((r) => String(r)) : [];
  const sections = Array.isArray(s["sections"]) ? s["sections"].map((x) => asSection(x, where)) : [];
  return { title, roots, sections };
}

/** Parse one cut file. Throws on a file that is not a cut. */
export function parseCut(text: string, name: string): Cut {
  const doc = (parseYaml(text) ?? {}) as Record<string, unknown>;
  const title = String(doc["title"] ?? "").trim();
  if (!title) throw new Error(`${name}: a cut carries a title`);
  if (!Array.isArray(doc["sections"])) throw new Error(`${name}: a cut carries a list of sections`);
  const cut: Cut = { name, title, sections: doc["sections"].map((s) => asSection(s, name)) };
  if (typeof doc["preamble"] === "string" && doc["preamble"].trim()) cut.preamble = doc["preamble"].trim();
  return cut;
}

/** Every `cuts/*.yaml` in a corpus, in name order. A corpus with none renders as before. */
export function readCuts(corpusDir: string): Cut[] {
  const dir = join(corpusDir, "cuts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()
    .map((f) => parseCut(readFileSync(join(dir, f), "utf8"), basename(f).replace(/\.ya?ml$/, "")));
}

/**
 * Number the sections and compute the tree under each root.
 *
 * Placement is first-come in document order, with one exception: a claim the
 * cut names as a root anywhere keeps its own place, so a subtree that reaches
 * it renders a reference forward rather than swallowing it. Numbers are
 * assigned in the same pass, so a reference to a later root has no number yet
 * and is filled in once the whole tree is built.
 */
export function buildCutTree(cut: Cut, c: LoadedCorpus): CutTree {
  const placed = new Map<string, string>();
  const unresolvedRoots: string[] = [];
  const allRoots = new Set<string>();
  const collect = (s: CutSection): void => { s.roots.forEach((r) => allRoots.add(r)); s.sections.forEach(collect); };
  cut.sections.forEach(collect);
  const pending: { id: string; ref: { number: string | null } }[] = [];

  const walk = (id: string, number: string, depth: number, placedBy?: PlacingEdge, parent?: string): TreeNode => {
    const claim = c.claims.get(id) ?? null;
    placed.set(id, number);
    const node: TreeNode = { id, number, depth, claim, children: [], refs: [] };
    if (placedBy) node.placedBy = placedBy;
    if (parent) node.parent = parent;
    // A node's direct children are placed before any of them is walked, so a
    // claim this node reaches by its own edge sits under it rather than
    // wherever the first child's subtree happened to reach it first.
    let n = 0;
    const own: { id: string; number: string; rel: PlacingEdge }[] = [];
    for (const e of claim?.edges ?? []) {
      if (!WALKED.includes(e.relation as PlacingEdge)) continue;
      const rel = e.relation as PlacingEdge;
      if (placed.has(e.to) || allRoots.has(e.to) || own.some((o) => o.id === e.to)) {
        const ref = { id: e.to, relation: rel, number: placed.get(e.to) ?? null };
        node.refs.push(ref);
        if (ref.number === null) pending.push({ id: e.to, ref });
        continue;
      }
      const child = { id: e.to, number: `${number}.${++n}`, rel };
      own.push(child);
      placed.set(child.id, child.number);
    }
    for (const o of own) node.children.push(walk(o.id, o.number, depth + 1, o.rel, id));
    return node;
  };

  const section = (s: CutSection, number: string, depth: number): NumberedSection => {
    const roots: TreeNode[] = [];
    let n = 0;
    for (const r of s.roots) {
      if (!c.claims.has(r)) unresolvedRoots.push(r);
      // A root listed twice is placed once; the second listing is dropped
      // here and the first keeps the place.
      if (placed.has(r)) continue;
      // A node's depth is its depth in the tree, root at zero, whatever the
      // section nesting: the heading carries the section's level.
      roots.push(walk(r, `${number}.${++n}`, 0));
    }
    const sections = s.sections.map((x, i) => section(x, `${number}.${roots.length + i + 1}`, depth + 1));
    return { title: s.title, number, depth, roots, sections };
  };

  const sections = cut.sections.map((s, i) => section(s, String(i + 1), 0));
  for (const p of pending) p.ref.number = placed.get(p.id) ?? null;
  return { cut, sections, placed, unresolvedRoots };
}

/** Every node of a tree in document order, sections flattened. */
export function flattenTree(t: CutTree): TreeNode[] {
  const out: TreeNode[] = [];
  const nodes = (n: TreeNode): void => { out.push(n); n.children.forEach(nodes); };
  const sec = (s: NumberedSection): void => { s.roots.forEach(nodes); s.sections.forEach(sec); };
  t.sections.forEach(sec);
  return out;
}
