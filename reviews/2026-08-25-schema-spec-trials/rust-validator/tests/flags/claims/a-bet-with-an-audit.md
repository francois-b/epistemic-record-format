---
id: a-bet-with-an-audit
type: claim
corpus: flagged
title: "A bet that someone audited anyway."
epistemic_kind: bet
created: {timestamp: 2026-08-20, by: "human:fb"}
evidence_audit:
  - {auditor: gemini-3.5-flash, verdict: PARTIAL, timestamp: "2026-08-21",
     protocol: backing-audit-v1}
---
A bet that someone audited anyway.

## Working notes

`created.timestamp` is an unquoted date, which this schema leaves a string
and a legacy YAML 1.1 reader turns into a date object.
