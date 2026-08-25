---
id: B-28
kind: defect
status: closed
priority: closed
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

## Resolution

Ruled 2026-08-25. The scope is stated as a principle rather than a longer
list, because a list closes and the next id-bearing field reopens the same
question. A reference asserting a *current* relationship MUST resolve:
`atoms_for`, `atoms_against`, `edges.to`, `surveys`, `prior_survey`, and
each `notable_results` entry's `atoms`. A reference recording a *past
state* MUST NOT be a violation when it fails to resolve, and a validator
MUST flag it instead.

`evidence_at_stance` falls on the historical side, and that is the whole
point of the split. `ERF-20` has it record the one fact about a ruling's
context that cannot be recovered later. Making it a hard resolution
requirement would mean that once atom lifecycle lands (`B-06`), withdrawing
a single atom retroactively breaks every standing that ever faced it, which
is exactly the failure `ERF-43` reasons about for a retired premise and
`ERF-33` handles the same way for a narrative binding. The test asks
whether the reference says something *now* or records something *then*.

Fixtures: `invalid/prior-survey-dangling` (current, so a violation) and
`valid/evidence-at-stance-outlives-atom` (historical, so a flag, asserted
both to load clean and to actually raise the flag). Every valid fixture is
now asserted free of dangling references, and `danglingRefs` returns
findings rather than strings so a validator reports a broken reference the
way it reports any other violation.
