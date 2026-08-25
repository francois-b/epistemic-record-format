---
id: B-36
kind: defect
status: open
priority: P1
priority_because: "One author writes the narrative's `created` as a bare date while another implementation's validator demands an actor stamp, and typing the three fields is a shape decision that is free only now."
basis: demonstrated
raised: "trial 3's closing author against trial 1's validator, 2026-08-25 (S21)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-36 · The narrative's frontmatter fields are named but untyped

`ERF-34` requires title, corpus and created, and having ruled that a narrative has no interface in the data model, types none of them. The closing author wrote `created` as a bare date; trial 1's validator expects an actor stamp. Both defensible, and they disagree.

## Proposed resolution

Type the three fields in one sentence.
