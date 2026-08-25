---
id: B-39
kind: defect
status: contested
priority: unassessed
basis: demonstrated
raised: "trial 1's validator against the example corpus, 2026-08-25 (S9)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: duplicate
  note: "same root cause as B-36; B-36 is the better statement"
---

# B-39 · The example corpus's narrative carries an undefined field

The narrative frontmatter carries `type: narrative`, which the data model does not define; `ERF-34` names title, corpus and created.

## Proposed resolution

Drop the field from the example, or admit it. Related to B-37.
