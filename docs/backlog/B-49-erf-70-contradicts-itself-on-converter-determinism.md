---
id: B-49
kind: defect
status: open
priority: P1
priority_because: "A normative requirement that forbids and permits the same thing is the clearest case the P1 definition names, and it is in the requirement that governs every converted capture."
basis: demonstrated
raised: "GPT-5.5 backlog review, 2026-08-25, via finding F-001"
verifications:
  - by: "claude-opus-5, read the artifact directly"
    on: 2026-08-25
    verdict: accurate
---

# B-49 · `ERF-70` contradicts itself on converter determinism

`ERF-70` states that the converting tool "MUST be deterministic" and, four lines later, that "a non-deterministic converter ... MAY be used, and the source MUST then say so". The same tool is simultaneously required and permitted. Verified by reading the requirement directly.

## Proposed resolution

Choose one contract. The likely shape: converter metadata is mandatory whenever a conversion happened; a deterministic converter is what makes the check reproducible; a non-deterministic one is permitted only when declared, and the requirement says so once rather than twice in opposite directions.
