---
id: B-43
kind: defect
status: closed
priority: closed
contested_because: >
  Verified inaccurate on 2026-08-25 and folded into B-24 (closed); at HEAD
  the schema states which precision is legal where, so the residual is
  gone too. Marked so the index shows it where a disputed entry belongs.
priority_because: "Fable: ERF-19 already says a bare date is correct where nothing is ordered; the residual is the type comment. Fold into B-24."
basis: reported
raised: "trial 5 (Rust), 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: inaccurate
    note: >
      the entry is wrong: types/erf.ts says "RFC 3339", not "instant",
      and ERF-19 states a bare date is correct where nothing is ordered.
      Both trials read it the same way; the divergence was on
      as_of_date, which is B-24.
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      The residual the 2026-08-25 verifier left ("the type comment") is
      answered by the schema: DateOrInstant on every stamp, Instant on a
      standing, AsOfDate on an atom's as_of_date.
---

# B-43 · Timestamps: the type says instant, every example writes a bare date

The data model comments `ActorStamp.timestamp` as RFC 3339, and every example in the specification writes a bare date. `ERF-19`'s carve-out (standings alone require a full instant) and `ERF-47`'s mixed-precision rule are both dead prose under the strict reading, and live prose under the loose one. Trial 5 accepted both precisions and demanded the instant only in standings; trial 1 made a different call.

## Proposed resolution

State which precisions are legal where, once.

## Consolidation note (2026-08-26)

Status set to `contested` to match the `inaccurate` verdict already on
record. At HEAD the question "which precisions are legal where" is the
schema's, stated on the definitions: `DateOrInstant` ("A date where
nothing is ordered, an instant where something is"), `StandingEntry.timestamp`
typed `Instant` ("a full instant with time and offset, never a bare date,
because this is the format's only ordered ledger"), and `AsOfDate` ("A
year, a year and month, or a full date"). Nothing is left to fold into
`B-24`, which is closed.

## Resolution

Closed 2026-08-26, ruled by the operator on the consolidation pass's verdict: the schema's `Instant`, `Date`, `DateOrInstant` and `AsOfDate` type each timestamp field; `Instant` requires seconds since 2026-08-26.
