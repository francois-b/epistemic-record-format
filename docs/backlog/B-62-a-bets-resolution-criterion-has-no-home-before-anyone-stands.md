---
id: B-62
kind: defect
status: open
priority: P3
priority_because: "Section 4.3's guidance binds nothing, so the gap misleads no implementation; the fix is either one sentence of guidance (the criterion goes in the body, under a stated heading) or two optional fields, a MINOR addition. B-14 was disposed on the ground that section 4.3 already answers where a bet's decision goes; this is the narrower point that it answers for the decision and not for the criterion."
basis: demonstrated
raised: "F-022, the top-down essay corpus trial, 2026-08-25: four bets, each criterion written into working notes where no requirement makes anyone look"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-022; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-62 · A bet's resolution criterion has no home before anyone stands

Section 4.3 says where a bet's decision and outcome go: "record the
decision it licenses in the `why` of the `for` entry that backs it, and
the outcome in the `why` of the `withdrawn` entry that ends it". Both are
standings. The schema's `StandingEntry` types `by` as a `HumanActor`, so a
corpus an LLM builds for a person to rule on has no standings and,
therefore, no slot at all for what would settle the bet.

A bet is the one kind whose value is its resolution criterion: "the world
will settle it" (section 5) only if someone wrote down what settling looks
like. The essay's four bets carried their criteria in working notes, which
`ERF-18` names as the body's content and which nothing reads.

`B-14` (structured bet settlement) was disposed on 2026-08-25 because
section 4.3 already says where a decision and an outcome go, and because
calibration is the degrees-of-belief ground `purpose.md` refuses. Neither
reason reaches this: the criterion is not calibration, and section 4.3
names a home only for the decision, which comes after the criterion and
from a different hand.

## Proposed resolution

Either guidance (a bet's body states what would settle it and by when,
under a heading a reader can find) or fields written at minting,
`settles_by` (a date) and `settled_when` (prose), so the criterion exists
before anyone stands. The first costs nothing and binds nothing; the
second is what the trial asked for.
