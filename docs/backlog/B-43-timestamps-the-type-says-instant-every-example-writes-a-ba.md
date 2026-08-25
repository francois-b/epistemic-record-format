---
id: B-43
kind: defect
status: open
priority: P3
priority_because: "Fable: ERF-19 already says a bare date is correct where nothing is ordered; the residual is the type comment. Fold into B-24."
basis: reported
raised: "trial 5 (Rust), 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: inaccurate
    note: "the entry is wrong: types/erf.ts says "RFC 3339", not "instant", and ERF-19 states a bare date is correct where nothing is ordered. Both trials read it the same way; the divergence was on as_of_date, which is B-24."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-43 · Timestamps: the type says instant, every example writes a bare date

The data model comments `ActorStamp.timestamp` as RFC 3339, and every example in the specification writes a bare date. `ERF-19`'s carve-out (standings alone require a full instant) and `ERF-47`'s mixed-precision rule are both dead prose under the strict reading, and live prose under the loose one. Trial 5 accepted both precisions and demanded the instant only in standings; trial 1 made a different call.

## Proposed resolution

State which precisions are legal where, once.
