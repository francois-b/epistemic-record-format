---
id: B-24
kind: defect
status: closed
priority: closed
priority_because: "A conforming validator rejects the specification's own example corpus over date precision, and two batch authors already recorded incompatible period semantics, so the field must be pinned while pinning it is still free."
basis: demonstrated
raised: "trial 1 (A-series) and capex batches 1, 3 and 5, 2026-08-25 (S2)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-24 · `as_of_date` has neither a stated format nor stated semantics

Format: trial 1's validator requires a full date; the example corpus carries year-only; two capex batches wrote year-month, five instances. Semantics: two batch authors used different conventions for period-actual figures, period-end date against document date, both defensible under "the date the FACT is true of", and batch 3 found the divergence by reading its predecessors.

## Proposed resolution

Admit reduced precision explicitly, and add one sentence naming the convention for period figures and for forward guidance.

## Resolution

Ruled 2026-08-25. Format: a year, a year and month, or a full date, and
never more precise than the source gave, on the principle `ERF-27` already
applies to a search act's yield. Forcing a full date would have made the
format require the invented precision it forbids elsewhere, and would have
rejected its own example corpus, which carries `2018` on three atoms.

Semantics: a figure true of a period carries that period's end; a statement
about the future carries the date it was made, because an expectation is
not true of the period it forecasts. That ratifies the convention one
authoring batch reached on its own and the divergence a later batch found
by reading it.

Fixture `valid/as-of-date-precisions` carries one atom at each precision.
