---
id: B-37
kind: defect
status: open
basis: demonstrated
raised: "capex corpus, 151 records across five authors, 2026-08-25 (S16)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-37 · The actor grammar cannot distinguish two authors of the same model

`<producer>/<version>` resolves to the same string for every agent of one model, so all 151 capex atoms carry an identical `created.by`. A five-author corpus is unattributable per author from its own records, which is the multi-writer provenance the format exists to keep.

## Proposed resolution

Either the Actor grammar admits an instance discriminator, or the guidance says a deployment running same-model writers SHOULD distinguish them.
