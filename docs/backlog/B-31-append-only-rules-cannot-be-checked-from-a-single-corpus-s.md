---
id: B-31
kind: defect
status: open
priority: P2
priority_because: "The fix is a clarifying note that binds no shape and changes no verdict, and the entry itself asks to wait for the SQL trial's wording."
basis: reported
raised: "trial 4 undecidable 5, 2026-08-25 (S8)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-31 · Append-only rules cannot be checked from a single corpus snapshot

`ERF-40` and `ERF-48`'s append-only exemption constrain a transition between two states, not any one state. No fixture in this format can exercise them.

## Proposed resolution

A note in section 6 that these bind the substrate's history, which `ERF-63` already implies. **Hold:** the SQL trial is testing exactly this distinction and should inform the wording.
