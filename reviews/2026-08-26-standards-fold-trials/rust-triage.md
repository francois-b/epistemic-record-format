---
title: "Cold Rust validator: triage of the ambiguities and fabrications"
generated: 2026-08-26
model: claude-fable-5
status: non-normative
---

# Triage of the cold Rust validator's report

The agent implemented from the `d124820` snapshot (`SPEC-as-tried.md`,
`SCHEMA-as-tried.json`, `BINDING-as-tried.md`) and never saw the reference.
Each item below was checked against HEAD before anything moved. Its own
files: `rust-validator/ambiguities.md` (38), `rust-validator/README.md`
(all 66 ids), `rust-validator/tests/fabrication.rs` (21 attempts).

## The three it ranked most serious

| Item | At HEAD | Action |
|---|---|---|
| A-1 `ERF-51` step 3 collapses the U+2029 step 1 inserts (U+2029 is `White_Space`) | real; the reference exempted it in code and the prose did not say so | step 3 now exempts U+2029 and says a run touching a separator collapses to the separator |
| A-3 `ERF-43`: does vacuity cover an argument reached inside a closure? | real wording gap; the reference and `fixtures/invalid/closure-ends-in-argument-leaf` already take the strict reading | one sentence: vacuity holds for the root alone; an argument leaf inside a closure is a violation |
| A-4 schema `Instant` makes seconds optional; RFC 3339 does not | real | seconds now mandatory in the pattern; description cites `ERF-41` (it cited retired `ERF-19`) |

## The rest that changed something

| Item | At HEAD | Action |
|---|---|---|
| A-10 nothing makes a false digest a violation | real; the reference never hashed a held file | `ERF-71` gains the MUST; loader checks `received.digest` and `normalized_digest`; `fixtures/invalid/digest-mismatch` |
| A-20 "in order, without overlap" never says which occurrence | real; the reference takes the earliest | `ERF-52` says earliest, and why it is complete |
| A-33 the binding has no section 6 | real | sections renumbered |
| schema descriptions cited retired ids (`ERF-3`, `5`, `7`, `19`, `39`, `55`) | real, ten places | repointed to the live requirement or section |

## Stale at HEAD (fixed between the snapshot and now)

A-2 (`ERF-52` duplicated tail), A-16 (held texts reported as unrecognized;
fixed for the Bitter Lesson trial), A-27 (no register of retired ids;
change control lists them), A-38 (case files declared normative and not
supplied; they are instruments now and `ERF-51` no longer says "the case
governs").

## Design observations, not defects

- Fabrication 1 (`[...]` inverting "does not believe") is `F-017`, open.
  Fabrications 2 to 6 pass by design: the quote is of the rendered text
  under the standards the fold cites.
- A-24 (`ERF-60` against `additionalProperties: false`): `ERF-60` resolves
  it by version, and the reference skips the schema under a newer minor.
  The spec says so; the snapshot's wording was less direct.
- A-25 (a narrative has no id): `F-021`.
- A-11, A-12 (`ERF-41`'s inadmissible entry and `ERF-31`'s malformed
  candidate: violation or report?): after option B an inadmissible entry
  cannot be schema-valid, so `ERF-41`'s clause is dead text and sits in
  the rubric follow-up (bucket 3). `ERF-31`'s malformed candidate is a
  reported condition today.
- The 34 requirements the agent named UNPERFORMED are mostly act rules;
  the reference now prints its own `NOT-CHECKED` list, which the Rust
  validator did from the start.

## Purity

One leak, self-reported: an `ls` showed the agent that a rubric and other
reviews exist in the trial folder. It opened none. The boundary held for
everything that mattered.
