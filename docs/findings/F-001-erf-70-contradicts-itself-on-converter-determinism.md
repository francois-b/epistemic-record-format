---
id: F-001
raised:
  by: "GPT-5.5, backlog review"
  on: 2026-08-25
  observation: "ERF-70 requires a deterministic converter and then permits a non-deterministic one"
basis: demonstrated
specified:
  by: "GPT-5.5, in the same pass"
  on: 2026-08-25
  requirement: "ERF-70"
  claim: "ERF-70 states that the converting tool MUST be deterministic and, four lines later, that a non-deterministic converter MAY be used if declared, so the same tool is simultaneously required and permitted"
verifications:
  - by: "claude-opus-5, read the requirement directly"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed verbatim in SPEC.md: 'that tool MUST be deterministic' and 'a non-deterministic converter ... MAY be used'"
outcome: promoted
promoted_to: "B-49"
---

# F-001 · ERF-70 states that the converting tool MUST be deterministic and, four lines later, that a non-deterministic converter MAY be used if declared, so the same tool is simultaneously required and permitted
