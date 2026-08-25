---
id: B-28
kind: defect
status: open
basis: reported
raised: "trial 1 ambiguity A2, 2026-08-25 (S3)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-28 · `ERF-35`'s scope is ambiguous

"Every reference MUST resolve" against an enumerated four fields. Whether `prior_survey`, `notable_results[].atoms` and `evidence_at_stance` ids may dangle is unstated, and two validators may legally differ.

## Proposed resolution

One sentence naming the closed list, or making it open.
