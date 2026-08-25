---
id: B-35
kind: defect
status: open
priority: P1
priority_because: "The narrative-binding grammar cannot represent an anchor containing a quote character, and a wire grammar is the cheapest thing to change before publication and the most expensive after."
basis: reported
raised: "trial 3's closing author, 2026-08-25 (S20)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
    basis_corrected: "both broken anchors were repaired before commit, so nothing is re-runnable"
---

# B-35 · The binding grammar has no escape for a quote character in an anchor

Two anchors broke silently when the passage's own prose used scare-quotes: the file still parses, the binding simply stops matching, and only a validation script noticed.

## Proposed resolution

Either the grammar gains an escape, or the guidance forbids the character and a validator SHOULD flag an anchor that no longer occurs in its passage.
