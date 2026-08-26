---
id: B-42
kind: defect
status: contested
priority: P3
contested_because: >
  Verified duplicate of B-01 on 2026-08-25 and carrying merge_into since
  then; the status never followed the verdict. Marked so the index shows
  it where a duplicate belongs.
priority_because: "Fable: the definitions already state the scope is implicit, and a store needing a key is a substrate concern ERF-63 leaves to the substrate. Candidate for merge into B-01."
basis: demonstrated
raised: "trial 6 (SQL), 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: duplicate
    note: "duplicate of B-01: the Definitions already make the scope implicit and ERF-37 rules the store-key case the substrate's. Residue folded into B-01."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: duplicate
    note: >
      Confirms the 2026-08-25 verdict: the entry folds into B-01, whose text
      already carries the residue ("the part the specification already leans
      on is carried by B-42"). Nothing at HEAD changes that.
---

# B-42 · The deployment has no identity

Every uniqueness and resolution rule scopes to "the deployment" (`ERF-35` through `ERF-38`), which has no id, no declaration, and no file. A corpus travelling as a directory carries no statement of the scope its ids were unique in, so a receiving deployment cannot tell whether an id collision is a conflict or a coincidence. Trial 6 had to invent a deployment key to build a schema at all.

## Proposed resolution

Either give the deployment an identity, or state that the scope is implicit and what a recipient should assume.

## Consolidation note (2026-08-26)

Status set to `contested` to match the `duplicate` verdict already on
record and the `merge_into: B-01` the entry has carried since the
2026-08-25 prune. The index had listed it under Unverified because a
later self-note verdict of `unverified` split the list; the reasoning
stays here for B-01 to reach.
