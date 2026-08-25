---
id: B-43
kind: defect
status: open
priority: P1
priority_because: "The data model says instant, every example writes a bare date, two trials made different calls, and a strict reading makes a conforming validator reject the specification's own examples; provisional pending verification by someone other than the raiser."
basis: reported
raised: "trial 5 (Rust), 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-43 · Timestamps: the type says instant, every example writes a bare date

The data model comments `ActorStamp.timestamp` as RFC 3339, and every example in the specification writes a bare date. `ERF-19`'s carve-out (standings alone require a full instant) and `ERF-47`'s mixed-precision rule are both dead prose under the strict reading, and live prose under the loose one. Trial 5 accepted both precisions and demanded the instant only in standings; trial 1 made a different call.

## Proposed resolution

State which precisions are legal where, once.
