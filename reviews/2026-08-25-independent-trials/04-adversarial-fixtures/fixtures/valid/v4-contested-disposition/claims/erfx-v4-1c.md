---
id: erfx-v4-1c
type: claim
corpus: erfx-v4
title: "Vendor X's citation resolution engine performs at its
  advertised 94% accuracy in independent hands"
epistemic_kind: observation
created: {timestamp: 2026-08-19, by: "agent/claude-fable-5"}
atoms_for: [erfx-v4-1]
atoms_against: [erfx-v4-2]
standings:
  - timestamp: 2026-08-19T16:04:00Z
    stance: for
    by: "human:francois"
    why: "Taking the vendor's own published number at face value for
      the purpose of a first pass; will revisit once the replication
      is itself audited."
    evidence_at_stance:
      atoms_for: [erfx-v4-1]
  - timestamp: 2026-08-21T09:30:00Z
    stance: against
    by: "human:jordan-lee"
    why: "The independent replication is the more accountable
      measurement here; a 23-point gap on the vendor's own claimed
      metric is not noise."
---
Vendor X's citation resolution engine performs at its advertised 94%
accuracy in independent hands.

## Working notes

francois's `for` stance predates the replication atom's minting; note
its `evidence_at_stance` correctly lists only what existed at that
moment (`erfx-v4-1`), not `erfx-v4-2`, which did not yet exist. jordan's
`against` stance omits `evidence_at_stance` entirely, which is legal:
the field is a producer SHOULD (ERF-20), not a MUST. The computed
disposition (ERF-41) is `contested`: one current `for`, one current
`against`, neither discarded as `withdrawn`.
