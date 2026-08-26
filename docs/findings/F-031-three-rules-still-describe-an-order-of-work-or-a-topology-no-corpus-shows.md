---
id: F-031
raised:
  by: "the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
  on: 2026-08-26
  observation: "after ERF-1 and ERF-50 lost their workflow gates, three rules still prescribe when a tool acts or how a deployment is arranged, which no corpus state can exhibit"
basis: reported
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-60, ERF-62 (ERF-50's gate wording is gone at HEAD)"
  claim: >
    ERF-60 prescribes that a validator reads spec_version before anything
    else, an order it cannot follow under content-based discovery, and
    ERF-62 describes a deployment's arrangement that no exchanged corpus
    can exhibit; neither sentence constrains corpus state.
verifications: []
outcome: promoted
promoted_to: "B-68"
---

# F-031 · Three rules still describe an order of work or a topology no corpus shows

The rubric's question 3 asked whether a rule constrains corpus state or a
sequence of acts. Three survivors still fail it.

- `ERF-50`: "run as a gate at minting" and "after any transform". Whether
  a gate ran is not visible in the result; what is visible is that the
  quote occurs. Pro, Flash and Sol all name this.
- `ERF-60`: "a validator therefore reads `spec_version` before anything
  else" prescribes parser order, and one it cannot follow, since finding
  the declaration means reading files. The behaviour it wants is
  version-aware strictness, already stated in the same rule.
- `ERF-62`: "exactly one authoritative home" and "an index is never
  consulted as truth" describe a deployment's arrangement and an
  intention. No fact in an exchanged corpus distinguishes one home from
  two. All four readers marked it; it may have no state-visible content at
  all.

## Candidate resolutions, none ruled

Restate `ERF-50` as the invariant only (the check is re-runnable and its
result is never stored); drop `ERF-60`'s ordering sentence; either retire
`ERF-62` or move it to section 7 as guidance.
