---
id: erfx-v5-1c
type: claim
corpus: erfx-v5
title: "No corpus in the deployment's seven registered corpora has yet
  adopted an embargo-dating extension field on its declaration"
epistemic_kind: observation
created: {timestamp: 2026-08-24, by: "agent/claude-fable-5"}
surveys: [granted-flag-uses-2026-08-24]
evidence_audit:
  - auditor: deepseek-v4-pro
    verdict: SUPPORTED
    timestamp: 2026-08-24
    protocol: backing-audit-v1
---
No corpus in the deployment's seven registered corpora has yet adopted
an embargo-dating extension field on its declaration.

## Working notes

`atoms_for` is correctly absent: a survey evidences coverage, not
presence, and per ERF-25 this universal negative is audited as scoped
rather than as proved. `surveys` is non-empty, so the unbacked
flag does not apply even though `atoms_for` is empty. The seven-corpus
universe is closed and fully enumerated, which is the case the
non-normative note under ERF-28 calls conclusive rather than
defeasible.
