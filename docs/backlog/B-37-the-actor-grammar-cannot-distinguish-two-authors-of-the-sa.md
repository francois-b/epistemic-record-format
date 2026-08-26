---
id: B-37
kind: defect
status: open
priority: P2
priority_because: "Both reviewers: claude-fable-5/batch-3 already fits the actor grammar, so the demonstrated loss is a practice failure and the fix is guidance, not a shape change."
basis: demonstrated
raised: "capex corpus, 151 records across five authors, 2026-08-25 (S16)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-37 · The actor grammar cannot distinguish two authors of the same model

`<producer>/<version>` resolves to the same string for every agent of one model, so all 151 capex atoms carry an identical `created.by`. A five-author corpus is unattributable per author from its own records, which is the multi-writer provenance the format exists to keep.

## Proposed resolution

Either the Actor grammar admits an instance discriminator, or the guidance says a deployment running several writers on one LLM SHOULD distinguish them.

## Consolidation note (2026-08-26)

Still live at HEAD. The schema's `AgentActor` pattern is
`^[^\s"/<>:]+/[^\s"/<>]+$`: the part after the slash admits any
non-space characters, so `claude-fable-5/batch-3` already fits, which is
what both 2026-08-25 reviewers said. The ruling is the guidance sentence
(a deployment running several writers on one LLM SHOULD distinguish them in the
version part), and nothing in the 2026-08-26 changes touched it.
