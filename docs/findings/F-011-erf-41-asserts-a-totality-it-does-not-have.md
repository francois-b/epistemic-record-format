---
id: F-011
raised:
  by: "Protobuf trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "ERF-41 states that every input has exactly one reading, and supplies no reading for a stance outside the vocabulary that ERF-57 obliges a consumer to load"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — two conforming implementations compute different dispositions for one corpus"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-41, ERF-57"
  claim: >
    ERF-41 enumerates the readings for `for`, `against` and `withdrawn`
    and asserts totality. ERF-57 requires a consumer to preserve and report
    a record it cannot fully interpret rather than refuse it. A standing
    carrying an unrecognised stance is therefore loadable and has no
    defined reading.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
    Confirmed in SPEC.md: ERF-41 reads "Every input has exactly one
    reading" and its enumeration covers three stance values. Nothing states
    what an unrecognised stance contributes to the computation.
outcome: open
---

# F-011 · `ERF-41` asserts a totality it does not have

## The gap

> Otherwise discard every current stance of `withdrawn` [...] nothing
> remaining means `retired`; all `for` means `active`; all `against` means
> `rejected`; both `for` and `against` remaining means `contested`. **Every
> input has exactly one reading.**

Three stance values are enumerated. `ERF-57` obliges a tolerant consumer to
read a record carrying a fourth rather than refuse it. That record has no
reading.

## Why it is an interoperability defect rather than a curiosity

The plausible inventions are all defensible and they disagree:

| Reading | Disposition |
|---|---|
| Treat as `withdrawn` (unknown means exit) | `retired` |
| Discard the entry as malformed | `proposal` |
| Count it as an entry that is not `against` | `active` |

Three conforming implementations, three answers, one corpus. This is the
class of defect `F-003` established that 0.9 must not carry.

## Candidate resolutions, none ruled

1. One sentence: an unrecognised stance is discarded from the computation
   and reported, so the disposition reads as though the entry were absent.
2. An unrecognised stance makes the disposition itself indeterminate, which
   a consumer MUST show rather than resolve.
3. Make the vocabulary closed at the validator and treat the case as
   unreachable, which contradicts `ERF-57`.
