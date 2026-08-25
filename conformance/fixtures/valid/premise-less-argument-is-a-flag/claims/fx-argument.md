---
id: fx-argument
type: claim
corpus: fixture-premise-less-argument
title: "The recorded total cannot be reconciled with the ledger"
epistemic_kind: argument
created: {timestamp: 2026-08-25, by: "agent/conformance-fixture"}
standings:
  - timestamp: 2026-08-25T09:00:00Z
    stance: for
    by: "human:conformance-fixture"
    why: "Stood on before the premises were written down, which is the
      ordinary way an argument starts."
---

The recorded total cannot be reconciled with the ledger.

## Working notes

This argument has no premises: no outgoing `assumes` edge, and no claim
supports it. Its premise closure is therefore empty and `ERF-43` is
satisfied vacuously, because the root is not its own leaf. What is wrong
with it is that nothing backs it, which is `ERF-49`'s flag. A flag is not a
violation (section 2), so this corpus conforms.
