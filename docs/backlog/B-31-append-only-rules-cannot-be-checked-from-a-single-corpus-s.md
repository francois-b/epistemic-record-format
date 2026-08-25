---
id: B-31
kind: defect
status: open
priority: P3
priority_because: "ERF-40 already says the check runs against the substrate history and ERF-63 requires that history; no fixture exercising it is a suite limitation (Fable)."
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
