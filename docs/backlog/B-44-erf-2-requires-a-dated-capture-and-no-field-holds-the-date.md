---
id: B-44
kind: defect
status: open
priority: unassessed
basis: reported
raised: "backlog verification pass, 2026-08-25"
verified:
  by: "raised by the verification pass itself"
  on: 2026-08-25
  verdict: unverified
  note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-44 · `ERF-2` requires a dated capture and no field holds the date

"A web page is mutable: its capture MUST be dated." The `Source` shape has no date field, and neither does `Fetched`. The example corpus satisfies the requirement in the capture file's own prose header, which is unstructured and uncheckable. Two conforming producers will date captures in two incompatible places. `coverage.yaml` marks `ERF-2` untestable-by-design, which answers whether a tool can check it, not where a producer writes it.

## Proposed resolution

Add the field, or state where the date lives.
