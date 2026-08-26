---
id: B-68
kind: defect
status: open
priority: P3
priority_because: "Neither sentence changes what conforms: ERF-60's ordering clause cannot be followed literally and its real content (version-aware strictness) is in the same rule, and ERF-62 has no state a corpus exhibits. Dead text can wait; it is here so the rubric's remainder is fully filed."
basis: reported
raised: "F-031, the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-031 with its ERF-50 item dropped as resolved at HEAD; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-68 · `ERF-60` prescribes a parser order, and `ERF-62` a topology

The rubric's question 3 asked whether a rule constrains corpus state or a
sequence of acts. The finding named three survivors; one has since been
resolved and two stand.

- `ERF-50` (the quote check is re-runnable) is resolved at HEAD. It no
  longer says "run as a gate at minting" or "after any transform"; it
  reads "When it runs is nobody's business but the producer's; that it
  can run, at any time, by anyone, is the format's."
- `ERF-60` (version handling) still says "A validator therefore reads
  `spec_version` before anything else and sets its strictness by it".
  That prescribes parser order, and one a validator cannot follow, since
  finding the declaration means reading files (`ERF-54` discovers by
  content). The behaviour wanted, version-aware strictness, is stated in
  the rest of the same rule.
- `ERF-62` (one authoritative home) still says "exactly one authoritative
  home" and "never consulted as truth". Both describe a deployment's
  arrangement and an intention. No fact in an exchanged corpus
  distinguishes one home from two; all four readers marked it, and it may
  have no state-visible content at all.

## Proposed resolution

Drop `ERF-60`'s ordering sentence, keeping the strictness rule. Either
retire `ERF-62` or move it to section 8 as guidance beside `ERF-63`, which
`B-66` also lists as a move candidate.
