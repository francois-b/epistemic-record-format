---
id: B-24
kind: defect
status: open
priority: unassessed
basis: demonstrated
raised: "trial 1 (A-series) and capex batches 1, 3 and 5, 2026-08-25 (S2)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-24 · `as_of_date` has neither a stated format nor stated semantics

Format: trial 1's validator requires a full date; the example corpus carries year-only; two capex batches wrote year-month, five instances. Semantics: two batch authors used different conventions for period-actual figures, period-end date against document date, both defensible under "the date the FACT is true of", and batch 3 found the divergence by reading its predecessors.

## Proposed resolution

Admit reduced precision explicitly, and add one sentence naming the convention for period figures and for forward guidance.
