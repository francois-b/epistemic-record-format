---
id: every-entry-is-made-twice
type: claim
corpus: ledger-discipline
title: "Pacioli's 1494 treatise states the double-entry rule explicitly:
  every ledger entry is made twice, once as a debit and once as a credit."
epistemic_kind: observation
short_name: "double entry, stated"
families: [prior-art]
semantic_query: "double entry bookkeeping origin Pacioli debit credit rule"
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [led-001, led-002]
edges:
  - {to: ledger-parity-detects-error, relation: decomposes-into}
standings:
  - timestamp: "2026-08-21T09:14:00-05:00"
    stance: for
    by: "human:fb"
    why: "Two atoms quote the treatise directly and both audits came back
      SUPPORTED under the same protocol. The claim is about what the text
      says, which is exactly what a quote settles."
    evidence_at_stance: {atoms_for: [led-001, led-002]}
evidence_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: "2026-08-22",
     protocol: backing-audit-v1}
---
Pacioli's 1494 treatise states the double-entry rule explicitly: every ledger entry is made twice, once as a debit and once as a credit.

## Working notes

The claim is deliberately about the text and not about practice. Whether
Venetian merchants actually kept books this way in 1494 is a different claim
and would need different evidence.
