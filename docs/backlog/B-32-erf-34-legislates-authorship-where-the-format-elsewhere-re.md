---
id: B-32
kind: defect
status: open
priority: P3
priority_because: "The person-authored sentence is section 4.6 guidance, which section 4 says binds nothing; softening it misleads no implementation (Fable)."
basis: reported
raised: "trials 2 and 3's closing author, three independent flags, 2026-08-25 (S10)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-32 · `ERF-34` legislates authorship where the format elsewhere records attribution

The guidance says a narrative is "authored by a person and never generated." Three agents flagged the tension and wrote one anyway, disclosing the authorship. The format's posture everywhere else is to record who did what rather than to restrict who may.

## Proposed resolution

Operator ruling. The recommendation on file is to soften to attribution rather than restriction.

## Consolidation note (2026-08-26)

Still live at HEAD, with one correction to where it points. `ERF-34` was
retired on 2026-08-26 as a shape rule the schema holds; the sentence this
entry is about survives twice, in the section 4.6 preamble ("It is prose,
authored by a person and never generated") and, softened, in the schema's
`Narrative` description ("prose someone wrote"). Both are guidance or
description and bind nothing, so the priority stands. The ruling is now
on a paragraph rather than a requirement, and on whether the schema
description should say "authored by" at all. The three capex narratives
stamped `agent/claude-sonnet-5` remain the demonstration. Related:
`B-67` (attribution of act rules) is the same instinct applied to MUSTs.
