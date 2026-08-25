---
id: B-26
kind: defect
status: open
basis: demonstrated
raised: "trial 2 and capex batch 5, 2026-08-25 (S12)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-26 · Three normalization edge cases from real captures

A hyphen-space-newline that step 7's literal wording does not cover; a spurious OCR line-leading hyphen that steps 10 and 11 fuse into an unrelated word; a hyphenated compound or em dash sitting exactly at a capture's line-wrap, which step 7's join silently mangles against a hand-typed quote. Every one was found by running an implementation against real captures.

## Proposed resolution

Add as conformance cases; decide per case whether the prose or the case is wrong.
