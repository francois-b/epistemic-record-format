---
title: "Pattern: the claims tree"
purpose: "One ordered, numbered view of an argument, cut from the claim graph rather than maintained by hand; the top-down companion to a narrative."
status: non-normative
last_updated: 2026-08-28
---

# Pattern: the claims tree

## The problem

An argument of any size has dozens of claims joined by `assumes`, `decomposes-into`, `supports` and `conflicts-with` edges. A reader wants one ordered view: this rests on that, numbered, with each node's kind, disposition and backing visible. The author wants to design an argument top-down (thesis, then what it needs, then what backs that) before the prose exists, and to keep that view current as evidence lands. Maintaining such a document by hand drifts from the records within a week.

## The records it uses

Claims with their edges and families (section 4.3, section 5), atoms and surveys as their backing, standings for the dispositions. Nothing else. The tree is a **reading** of the graph: a traversal computed from edges, never a record. The specification declined to make a companion document a requirement (`docs/non-goals.md`, 2026-08-23) for that reason; this pattern is where the practice lives.

## Three layers

1. **Substrate**: the claim records themselves. The source of truth.
2. **Skeleton**: the structure a document imposes on them, chosen per document: which claims are roots, in what order, under what section headings. A venture design uses a diagnosis, guiding policy, coherent actions skeleton; a position paper uses its own. Choosing a skeleton is a document decision, not a change to any record.
3. **Narrative**: the author's prose, anchored to claims, kept out of the tree. In this format that is the narrative record with its bindings (section 4.6); the tree renders the claims and points at the passages that rest on them.

## A cut

A **cut** is one tree-shaped traversal chosen for reading: roots, order, headings. Several cuts can be taken from one graph (a kernel of the whole argument; a one-page cut for a counterparty; the order a narrative follows). A cut is a small document that names roots and headings; everything below a root is computed by walking `decomposes-into` and `assumes` edges from it.

A cut file is producer machinery. This repository's shape for it:

```yaml
# a cut: roots and headings; the tree below each root is computed
title: "Venture design: audit-first fund administration"
sections:
  - title: Diagnosis
    roots: [ai-compressed-fund-software, judgment-not-compressible]
  - title: Guiding policy
    roots: [audit-first]
```

A cut may also carry a `preamble`, one paragraph shown before the first section (a scope note, a reading instruction); it is the document's, not any claim's. Sections nest (`sections` inside a section) where the skeleton has levels.

Numbering (1, 1.1, 1.1.2) is assigned by the traversal at render time and is stable only within a rendering; a claim is cited by its id, never by its number. A claim is shown once: where a walk reaches a claim already placed, or one the cut names as a root elsewhere, the line refers to its number instead of expanding it again, so a cut that lists every claim of a section as a root (the port of a hand-kept document does) reads as that document did rather than repeating each subtree under each root.

## What a rendered tree shows per node

The claim's title (or a short name), its kind, its computed disposition, whether it is backed (atoms for, atoms against, a survey) or unbacked, the edge that placed it under its parent, and any `conflicts-with` in either direction. Unbacked leaves and stood-on-but-unbacked claims are marked, since those are where the argument is thin. A passage of the narrative bound to the node is linked.

Two grades of rendering: **plain**, the tree alone, which ships; **annotated**, the same tree with working notes and review marks in place, which never ships.

A rendered tree opens with a legend, and the legend is generated from the vocabulary rather than written beside the tree: how a claim line reads (number, title, kind, disposition), each kind with what would settle it (section 5), each disposition with a plain gloss (`ERF-41`), and the marks the lines carry (`[unbacked]`, `part of`, the `↳` that opens every other relationship, counter-evidence). The format has no `[given]` mark. A personal-position corpus may add one as producer machinery later, for a claim whose backing is withheld on purpose and whose burden of proof sits with the challenger; a legend that names it names its own addition, not the format's.

## Conventions this pattern adds

- Edges are written on the claim that assumes, decomposes, or supports, pointing at the other; a tree is walked from roots along `decomposes-into` and `assumes`.
- A claim's body opens with its title (`ERF-18`) and everything else sits under working notes, so a tree can render the first paragraph as the node's description without reading further.
- `short_name` on a claim is the compact title a tree line renders; the record carries it, the document reads it.
- `families` name the reusable groupings a document or a later pass pulls (diagnosis, prior-art, risk); they are for retrieval, not for structure.

## Tooling in this repository

The reference viewer renders every `cuts/*.yaml` in a corpus as a cut page (`cut-<name>.html`, listed on the index): the sections, the numbered tree under each root, each node with its kind, disposition, backing marks, placing edge, conflicts, the passages bound to it, and its evidence cards (`tools/viewer/README.md`). The MCP server's `decompose-claim` prompt is the top-down twin of `decompose-passage`: what would have to be true for this claim to hold, each answer a child with a `decomposes-into` edge.

## Origin

Extracted from a working practice's claims-tree document class (2026-08-06 to 2026-08-21), where the compiled document was generated from claim files by a script and reviewed in a markdown viewer with claim spacing and review marks. The parts that were that practice's alone (a numbered-bullet prose standard, a commentary companion file, an argument-graph app) are not carried here; the parts that any corpus needs are.
