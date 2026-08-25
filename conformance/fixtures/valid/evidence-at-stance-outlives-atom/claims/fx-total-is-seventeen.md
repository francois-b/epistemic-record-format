---
id: fx-total-is-seventeen
type: claim
corpus: fixture-evidence-at-stance
title: "The recorded total is seventeen units"
epistemic_kind: observation
created: {timestamp: 2026-08-23, by: "agent/conformance-fixture"}
atoms_against: [fx-replication]
standings:
  - timestamp: 2026-08-23T10:00:00Z
    stance: for
    by: "human:francois"
    why: "The only evidence in front of me was the vendor total, and it
      read seventeen."
    evidence_at_stance:
      atoms_for: [fx-vendor-total]
  - timestamp: 2026-08-24T09:00:00Z
    stance: against
    by: "human:francois"
    why: "The vendor total was withdrawn once its capture could not be
      re-fetched. The replication is what is left, and it says nine."
    evidence_at_stance:
      atoms_against: [fx-replication]
---

The recorded total is seventeen units.

## Working notes

The first standing faced `fx-vendor-total`, an atom this corpus no
longer holds. That reference records a past state: it says what was in
front of the ruler on 2026-08-23, and withdrawing the atom afterwards
was an act the format permits. Per `ERF-35` a validator flags it and
the corpus still conforms, on the same reasoning `ERF-43` applies to a
retired premise. Only the second standing decides the current
disposition, and its evidence resolves.
