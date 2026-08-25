---
id: B-38
kind: defect
status: open
priority: P2
priority_because: "Multi-writer work is already deferred in `purpose.md`, the `supports` workaround conforms, and letting a child declare its parent would be an additive field rather than a break."
basis: reported
raised: "capex claims batch B, 2026-08-25 (S18)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-38 · `decomposes-into` blocks a second author from structuring an existing corpus

The edge is stored on the parent, so an author barred from editing existing claims cannot decompose them. Every other relation can be added from the new side. The batch used `supports` instead and lost the part-whole meaning.

## Proposed resolution

Either bless the workaround in guidance, or let a child declare its parent, compiled to the same edge.
