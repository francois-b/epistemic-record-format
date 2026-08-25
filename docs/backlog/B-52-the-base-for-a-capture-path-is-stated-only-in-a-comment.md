---
id: B-52
kind: defect
status: open
priority: P1
priority_because: "Two implementations that resolve the base differently cannot load the same corpus, and the rule currently lives in a code comment."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
---

# B-52 · The base for a capture `path` is stated only in a comment

`Source.path` is documented as "the capture, relative to the list" in section 3's inline mirror and in `types/erf.ts`. No numbered requirement says what it is relative to. Trial 5 recorded the guess in its friction log and resolved against the directory holding the source list.

## Proposed resolution

Say in a requirement what the path is relative to.
