---
id: B-69
kind: defect
status: open
priority: P3
priority_because: "Editorial: stating a definition once and citing it changes no verdict and no shape. It can wait, and it is here so that the next reader who trips on ERF-24's premise definition appearing three times finds the decision on record rather than raising it a fourth time."
basis: reported
raised: "F-032, the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-032; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-69 · Definitions stated two or three times, and a lifecycle nobody is bound by

Each item checked at HEAD and still present:

- The premise definition (`assumes` out, `supports` in) appears in
  `ERF-24`, again in `ERF-43` ("followed transitively through its outgoing
  `assumes` edges and the incoming `supports` edges of other claims"), and
  a third time in section 5's `argument` bullet.
- `ERF-10` is the second half of `ERF-9`'s grading definition under its
  own number, and section 5 sends the reader to both as "their one home".
- `ERF-28` (a survey is immutable) restates `ERF-47` ("Staleness of a
  claim's survey backing is computed from `conducted` timestamps, never
  stored") and `ERF-48` ("any such edit stamps `last_modified`"). The
  staleness sentence is also `B-45`'s: it asserts a computation `ERF-47`
  does not define. One ruling on that sentence settles both.
- `ERF-72` (extension fields) carries "graduates by entering a later
  version bare, after which the prefixed form is a distinct extension
  field", a lifecycle that binds no producer, validator or consumer. It is
  advice to a future editor of the specification, which is what change
  control is for.
- `ERF-57` (preserve and report the unknown) restates the Consumer
  conformance class of section 1, which already says a consumer "MUST NOT
  reject a corpus over unknown fields, unknown types, or records it cannot
  interpret" and "preserves the rest as opaque data, reporting what it did
  not recognize". Opus alone marked this.

Separately, Opus applied the sentence test to the section prose and found
34 paragraphs that assert without a subject, a MUST, or a definition. That
is a prose pass rather than a rule change and is recorded here so it is not
lost; it is not part of this entry's claim.

## Proposed resolution

State each definition once and cite it; merge `ERF-10` into `ERF-9`; cut
`ERF-28` to what is its own (with `B-45`); move `ERF-72`'s lifecycle
sentence to change control; decide whether `ERF-57` says anything the
class does not, and if not, retire it into the class.
