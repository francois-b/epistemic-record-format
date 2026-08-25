---
id: records-need-a-check-that-runs
type: claim
corpus: knowledge-work-governance
title: "A body of recorded assertions is only as trustworthy as the check that actually
  runs over it"
epistemic_kind: argument
created: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
last_modified: {timestamp: "2026-08-24T09:15:00Z", by: "human:fbouet"}
short_name: "checks that run"
semantic_query: "continuous verification of knowledge bases, staleness detection,
  assertion-level checking"
edges:
  - {to: double-entry-is-the-oldest-continuous-check, relation: assumes}
standings:
  - timestamp: "2026-08-24T09:20:00Z"
    stance: for
    by: "human:fbouet"
    why: "Every system I have watched decay decayed in the gap between what it asserted and
      what anyone re-checked."
evidence_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-08-24T11:00:00Z",
     protocol: evidence-audit-v1}
---
A body of recorded assertions is only as trustworthy as the check that actually runs over
it.

## Working notes

Granting the premise that double-entry is the oldest such check, the interesting question
is what makes a check run at all: an act someone must perform, or a gate something else
depends on.
