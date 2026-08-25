---
id: B-28
kind: defect
status: open
priority: P1
priority_because: "The unstated scope lets two validators legally disagree about whether the same corpus conforms, and closing the list retroactively invalidates corpora, which is free only before anyone holds one."
basis: reported
raised: "trial 1 ambiguity A2, 2026-08-25 (S3)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-28 · `ERF-35`'s scope is ambiguous

"Every reference MUST resolve" against an enumerated four fields. Whether `prior_survey`, `notable_results[].atoms` and `evidence_at_stance` ids may dangle is unstated, and two validators may legally differ.

## Proposed resolution

One sentence naming the closed list, or making it open.
