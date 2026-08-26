---
id: B-67
kind: defect
status: closed
priority: closed
priority_because: "Attributing a MUST to its party changes no verdict, so it does not block; it is P2 rather than P3 because a reader implementing a validator today reads fourteen MUSTs it cannot decide and has to guess whether that is its failure or the rule's, and the guess is what the rubric's four readers made four different ways. Rewording numbered requirements is cheapest before the ids are published."
basis: reported
raised: "F-029, the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session: all four marked the same fifteen as MUSTs no validator can decide"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-029; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-67 · Fourteen act MUSTs do not name the party they bind

The rubric's question 5 asked whether a validator can decide the rule from
the corpus alone. Fifteen requirements failed it for all four readers.
Gemini 3.1 Pro's verdict was downgrade to SHOULD on every one; Opus, Flash
and Sol said rewrite. The readers' question conflated two things: a rule no
machine can decide, and a rule a person is still bound by. A producer who
regenerates a quote instead of copying it (`ERF-6`) has broken a real MUST
that no validator will see.

The defect is that the rules do not say whose duty they are. Section 1
defines the classes (Producer, Validator, Consumer, Corpus, Record) and
the requirements do not open with the class they bind. `coverage.yaml`
already marks these `untestable-by-design`; the specification itself does
not.

Checked at HEAD: `ERF-48` left the list on 2026-08-26 (it now says what a
validator decides and what a producer SHOULD do). `ERF-6` and `ERF-69`
gained an attributed clause each ("A producer MUST take a quote ... by
copying"; fidelity "MUST be checked by anyone holding the raw file") and
keep an unattributed one. Fourteen remain, in whole or in part: `ERF-2`,
`ERF-6`, `ERF-8`, `ERF-9`, `ERF-10`, `ERF-14`, `ERF-18`, `ERF-23`,
`ERF-24`, `ERF-25`, `ERF-27`, `ERF-28`, `ERF-69`, `ERF-70`.

## Proposed resolution

One ruling with three parts, any of which may be declined:

- Attribute, do not downgrade: each opens with its party ("A producer
  MUST", "An auditor MUST"), which is the split Sol asked for on `ERF-69`
  and `ERF-70`.
- Downgrade the two that are advice rather than duty: `ERF-8`'s "carries
  everything the string shows" and `ERF-27`'s "no precision the instrument
  did not give" become SHOULDs.
- Move the grading guidance (`ERF-9`, `ERF-10`, `ERF-24`, `ERF-25`) next
  to the vocabulary it grades in section 5, as Flash and Sol proposed,
  keeping any MUST that remains attributed. `B-69` (definitions repeated)
  touches the same four.

## Resolution

Ruled by the operator 2026-08-26, ahead of 0.9.0: attributed, not downgraded: each of the fourteen opens with its party (a producer, an author, an auditor). `ERF-8`'s "carries everything the string shows" and `ERF-27`'s precision clause are SHOULDs.
