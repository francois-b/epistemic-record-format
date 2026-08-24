---
id: fx-claim-001
type: claim
corpus: fixture-minimal
title: "The recorded total is seventeen units"
epistemic_kind: observation
created: {timestamp: 2026-08-23, by: "agent/conformance-fixture"}
atoms_for: [fx-001]
standings:
  - {timestamp: 2026-08-23, stance: for, by: "human:fixture",
     why: "A bare date, which ERF-19 forbids on a standing."}
---

The recorded total is seventeen units.

## Working notes

The standing above carries a bare date rather than a full RFC 3339 instant.
Everything else in this fixture is valid, so a validator that rejects it must
reject it for ERF-19 and nothing else.
