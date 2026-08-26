---
title: "Bitter Lesson trial: triage of the friction log"
generated: 2026-08-26
model: claude-fable-5
status: non-normative
---

# Triage of the Bitter Lesson friction log

Each entry of `bitter-lesson-corpus/friction-log.md`, checked against the
reference implementation and the spec at HEAD before anything was ruled.

| Entry | Verdict | Where it went |
|---|---|---|
| F-01 status vocabulary | real, design | `docs/findings/F-024` |
| F-02 one contiguous excerpt | real, already open | evidence appended to `F-019` |
| F-05 elision around footnote markers | real, craft or guidance | `docs/findings/F-026` |
| F-06 held texts listed as unrecognized | reference defect | fixed in `viewer/corpus.ts` |
| F-07 `conflicts-with` unused | observation | `docs/findings/F-027` |
| F-09 proponent's assertion grades high | real, design | `docs/findings/F-025` |
| F-11 validator cites `ERF-73`, spec stops at 72 | timing: the agent read the `d124820` snapshot while the validator ran HEAD | none |
| F-12 validator's `AtomId` stricter than the snapshot schema | same timing artifact; HEAD's schema carries the pattern | none |
| F-13 one bad `standings.by` yields 62 violations through `oneOf` | reference reporting quality | to-do in the viewer, not a spec matter |
| F-14 binding staleness never printed; nothing named as unchecked | reference defect, confirmed by probe | fixed in `viewer/erf-check.ts` |
| F-16 wanted to read `examples/` and `erf-check.ts` | purity boundary held | none |

The `ERF-52` failures in run 2 (`Moore` inside `Moore's`) are the rule
working: UAX #29 keeps a possessive in its word, and
`conformance/cases/quote-check.txt` already carries the case
(`The board` against `The board's`).
