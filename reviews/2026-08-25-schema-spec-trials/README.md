---
title: "Schema-spec trials, 2026-08-25"
purpose: "Trials against the specification after the data model became erf.schema.json: a strict cold validator, and the top-down corpus built on the author's own essay."
status: non-normative
last_updated: 2026-08-25
---

# Schema-spec trials, 2026-08-25

Snapshots `SPEC-as-tried.md`, `SCHEMA-as-tried.json` and `BINDING-as-tried.md`
are the text each trial read, under the purity boundary.

| Trial | What it is | Outcome |
|---|---|---|
| `rust-validator/` | A strict, complete validator built cold from the three snapshots at commit `7907dda`; declares what it does not check; attempts its own fabrications | 46 violation checks, 27 flags, 33 declared unperformed; 18 attacks, 11 blocked; 29 ambiguities, three ruled the same day (`ERF-51` marker runs, `ERF-52` the elision marker is not a boundary, `ERF-35` typed references); `F-017` raised |
| `essay-corpus/` | The top-down authoring trial: the author's essay *Epistemology for Knowledge Work in the LLM Era* (2026-08-19, hash `6ed2f`) decomposed into the claims it rests on and the evidence for and against them, closed-loop with the Rust validator | see its README |

The Rust validator is also the first instrument in the differential test:
run over the three earlier corpora beside the reference, every disagreement
is a reference bug, a Rust bug, or a specification ambiguity, and is
classified in `differential.md`.
