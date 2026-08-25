---
id: fx-claim
type: claim
corpus: fixture-faced-nothing
title: "The recorded total is seventeen units"
epistemic_kind: observation
created: {timestamp: 2026-08-25, by: "agent/conformance-fixture"}
standings:
  - timestamp: 2026-08-25T09:00:00Z
    stance: for
    by: "human:first-ruler"
    why: "Stood on the figure before any evidence was attached, and stamped
      that this is what I faced: nothing."
    evidence_at_stance: {}
  - timestamp: 2026-08-25T11:00:00Z
    stance: for
    by: "human:second-ruler"
    why: "Stood on the same figure. My producer does not stamp evidence, so
      nothing here says what I faced."
---

The recorded total is seventeen units.

## Working notes

Two standings that look alike and are not. The first carries
`evidence_at_stance: {}`, which asserts existence per section 3: the ruler
stamped, and faced no evidence. The second omits the field: nothing was
ever stamped, and what that ruler faced is unrecoverable.

`ERF-55` governs empty lists. A producer that generalized it to mappings
would write both of these the same way and destroy the distinction, which
`ERF-20` calls the one fact about a ruling's context that cannot be
recovered later.
