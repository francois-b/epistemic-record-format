---
id: B-55
kind: capability
status: open
priority: trigger-driven
priority_because: "A capability waiting on its named trigger, deferred deliberately when the normalization sequence was cut to three steps on 2026-08-25."
basis: anticipated
raised: "the normalization pass, 2026-08-25"
verifications:
  - by: "claude-opus-5, raised while cutting ERF-51"
    on: 2026-08-25
    verdict: unverified
    note: "raised by the hand that made the change; needs a check by another"
trigger: "A capture whose hyphenation cannot be repaired by hand at reasonable cost, and a dictionary-backed tool whose output is deterministic enough to name under ERF-70."
---

# B-55 · Dehyphenation at a line break

A hyphen at a line break is either a soft hyphen from justification or a real hyphen in a compound, and no rule tells them apart: `classifi-\ncation` is one word, `Pre-\nmoney` is two. Deciding needs a dictionary, which is expensive and language-bound. `ERF-51` therefore does not guess, and `ERF-70` puts the repair at capture time where a person can see the page.
