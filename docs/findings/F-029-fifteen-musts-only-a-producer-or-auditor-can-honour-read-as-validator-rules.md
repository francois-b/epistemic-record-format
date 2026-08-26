---
id: F-029
raised:
  by: "the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
  on: 2026-08-26
  observation: "all four readers marked fifteen requirements as MUSTs no validator can decide; Pro says downgrade to SHOULD, the others say rewrite; the rules do not name whose duty they are"
basis: reported
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-2, ERF-6, ERF-8, ERF-9, ERF-10, ERF-14, ERF-18, ERF-23, ERF-24, ERF-25, ERF-27, ERF-28, ERF-69, ERF-70 (ERF-48 left the list on 2026-08-26 under F-030)"
  claim: >
    Fourteen requirements state a MUST that only a producer or an auditor
    can honour and do not name the conformance class they bind, so a
    validator reading them cannot tell an undecidable rule from its own
    omission; the fix is attribution, not downgrade.
verifications: []
outcome: promoted
promoted_to: "B-67"
---

# F-029 · Fifteen MUSTs only a producer or auditor can honour read as validator rules

The rubric's question 5 asked whether a validator can decide the rule from
the corpus alone. Fifteen requirements failed it for all four readers.
Gemini 3.1 Pro's verdict is downgrade to SHOULD on every one; Opus, Flash
and Sol say rewrite. The readers' question conflated two things: a rule no
machine can decide, and a rule a person can still be bound by. A producer
who regenerates a quote instead of copying it (`ERF-6`) has broken a real
MUST even though no validator will see it.

The finding is that the rules do not say whose duty they are. Section 1
defines conformance classes (Producer, Validator, Consumer, Corpus) and
the requirements do not open with the class they bind.

## Candidate resolutions, none ruled

- Attribute, do not downgrade: each of the fifteen opens with its party
  ("A producer MUST", "An auditor MUST") and `coverage.yaml` marks it as
  an act rule, which is the split Sol asked for on `ERF-69` and `ERF-70`.
- Downgrade the two that are advice rather than duty: `ERF-8`'s "carries
  everything the string shows" and `ERF-27`'s "no precision the instrument
  did not give" become SHOULDs.
- Move the grading guidance (`ERF-9`, `ERF-10`, `ERF-24`, `ERF-25`) next
  to the vocabulary it grades in section 5, which Flash and Sol both
  proposed, keeping any MUST that remains attributed.
