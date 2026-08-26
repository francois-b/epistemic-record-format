---
id: B-66
kind: defect
status: open
priority: P2
priority_because: "Retiring dead text changes nothing that conforms, so it does not block; but the fourteen retirements of option B landed before the push so that the published numbering would be the one meant to last, and these seven are the same decision left half-taken. Rule by rule, before the push, is cheaper than a changelog line per rule after it."
basis: reported
raised: "F-028, the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-028; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-66 · Seven rules the rubric marked retire survived as trims

Option B retired the fourteen rules that three or four readers marked
retire. Seven more were marked retire by two readers and rewrite or move
by the others; they were trimmed rather than retired. Each is listed with
what survives at HEAD, so the ruling can go row by row. All seven exist
at HEAD; none has been retired since the finding was raised.

| Rule | Readers | What survives at HEAD | Nearest home if retired |
|---|---|---|---|
| `ERF-4` | Pro, Flash retire; Opus merge | every atom names a source in the source list (a cross-document resolution rule), plus the reason the schema's status conditional exists | `ERF-35`, which is where the other resolution rules live |
| `ERF-13` | Pro, Flash retire | an atom's id is never renamed and never reused (an act rule the schema cannot hold) | one sentence under `ERF-36`, or `ERF-17` |
| `ERF-15` | Pro retire; Opus, Sol: undecidable | "MUST NOT encode location"; the schema's `Id` now excludes `/` and cites `ERF-15` for it, so the testable half is the schema's | `ERF-17`; the schema description already carries the reason |
| `ERF-26` | Pro retire | "a category is not an instrument"; the shape is `SearchAct`'s | a producer SHOULD under `ERF-27`, or section 5 |
| `ERF-61` | Pro, Flash retire; Opus move | the format's gloss on what MAJOR and MINOR mean; SemVer is the schema's | change control, no number |
| `ERF-63` | Pro, Flash, Sol move | one precondition: a substrate keeps history enough for `ERF-40` | section 8 prose, the precondition into `ERF-40` |
| `ERF-68` | Pro, Flash retire | the short-quotation judgment, and an SPDX SHOULD | keep the SHOULD; the judgment is `B-64`'s |

## Proposed resolution

A ruling per row: retire into the named home, or keep and say what the
number still binds. `ERF-68`'s row waits on `B-64`; `ERF-63`'s touches
`B-68` (`ERF-62` describes a topology).
