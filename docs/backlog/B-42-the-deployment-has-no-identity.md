---
id: B-42
kind: defect
status: open
priority: P1
priority_because: "Every uniqueness and resolution rule scopes to a deployment that has no id, declaration, or file, so a travelling corpus cannot state the scope its ids were unique in and a recipient cannot tell a collision from a coincidence; provisional pending verification by someone other than the raiser."
basis: demonstrated
raised: "trial 6 (SQL), 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-42 · The deployment has no identity

Every uniqueness and resolution rule scopes to "the deployment" (`ERF-35` through `ERF-38`), which has no id, no declaration, and no file. A corpus travelling as a directory carries no statement of the scope its ids were unique in, so a receiving deployment cannot tell whether an id collision is a conflict or a coincidence. Trial 6 had to invent a deployment key to build a schema at all.

## Proposed resolution

Either give the deployment an identity, or state that the scope is implicit and what a recipient should assume.
