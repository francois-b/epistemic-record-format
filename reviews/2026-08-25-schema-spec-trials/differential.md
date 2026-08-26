---
title: "Differential validation, 2026-08-25"
purpose: "The Rust validator and the reference implementation run over the same three corpora; every disagreement classified as a reference bug, a Rust bug, or a specification ambiguity."
status: non-normative
last_updated: 2026-08-25
---

# Differential validation, 2026-08-25

Two validators built from the same specification by different hands, run
over `examples/corpora/minimal` (9 atoms), the Buffon corpus (9) and the
capex corpus (151). The point is not that either is right; it is that a
disagreement is always one of three things, and each one is named.

## Where they agree

Every quote-check verdict: 3 failures in Buffon, 3 in capex, none in the
example, the same atoms on both sides. The disposition of every claim. The
anchors of all 26 bindings.

## Reference bugs, fixed the same day

**`excerpt.'on'` in 136 source entries.** Both authored corpora carried a
key the `ERF-58` rename should have retired, written quoted because PyYAML
knows `on` is a boolean word, which is why a bare-spelling regex missed
it. The reference loaded it clean because the loader checked a hand-kept
field roster and never applied the schema; the schema ran only over the
conformance fixtures. Every file now validates against `erf.schema.json`
as it is read. This is the class of defect a differential run exists to
find: the reference could not see it because the reference had written
it.

**`ERF-70` never checked.** A PDF source with no `extraction` named loaded
clean. The reference now judges "another format" by the raw file's
extension and reports the missing tool.

**`ERF-2` never flagged.** A `received.url` with no `received.timestamp`
is a page whose read version nothing records. Adopted as a flag.

## Rust-only output, all flags on SHOULDs or heuristics

| Rust reports | Class | Reference position |
|---|---|---|
| `ERF-65` ×26: unquoted timestamps SHOULD be quoted | SHOULD | not reported; a SHOULD, and the binding's |
| `ERF-18` ×7: body does not open with the title verbatim | SHOULD | not reported |
| `ERF-71` ×18, `ERF-68` ×13: no digest, no licence | SHOULD | not reported |
| `ERF-9` ×3: medium or low grade with no `limitations` | guidance | not reported |
| `ERF-7` ×6: `citation_text` carries a bare domain | heuristic beyond the rule | not reported; the rule is `://` |
| `ERF-70` ×16: `extraction` named on an HTML source "that arrived as text" | **Rust reading doubtful** | HTML is another format than markdown; naming the tool is correct |
| `ERF-6` ×1: a bare `…` in a quote | informative | not reported |

None of these is a violation on either side, so none moves conformance. The
`ERF-70` flag on HTML is the one place the Rust reading is wrong, and it is
harmless as a flag.

## Specification ambiguities

None new from the run itself. The three the Rust build reported were ruled
before the run (`ERF-51` marker runs, `ERF-52` the elision marker is not a
boundary, `ERF-35` typed references).

## What the run says

Two independent validators agree on every violation over 169 atoms and 64
claims, after the differential exposed two things the reference could not
have found by itself. The instrument is cheap and it should run whenever a
new validator exists.
