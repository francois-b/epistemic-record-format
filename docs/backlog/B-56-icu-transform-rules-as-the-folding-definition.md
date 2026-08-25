---
id: B-56
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
trigger: "A third implementation diverging on one of the three steps, or an ICU binding light enough that naming it costs an implementer nothing."
---

# B-56 · ICU transform rules as the folding definition

The three surviving normalization steps are stated in prose plus normative case files. ICU transform rules express exactly this class of transformation as a declarative, portable, testable rule string, which would be a standard rather than a list this format owns. The cost is a dependency every implementation would need: PyICU is heavy, JavaScript's Intl covers only part, and icu4x is young.
