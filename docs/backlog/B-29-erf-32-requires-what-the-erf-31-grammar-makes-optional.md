---
id: B-29
kind: defect
status: closed
priority: closed
priority_because: "The specification contradicts itself, `bound-at` being a MUST in `ERF-32` and optional in the grammar beside it, so the same narrative binding is both conforming and not."
basis: reported
raised: "trial 1 ambiguity A1, 2026-08-25 (S4)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-29 · `ERF-32` requires what the `ERF-31` grammar makes optional

`bound-at` is a MUST in `ERF-32`, is optional in `ERF-31`'s stated grammar, and `ERF-32` then defines the handling of its own violation state (staleness `indeterminate`).

## Proposed resolution

Reconcile, or say plainly that the grammar admits what `ERF-32` then reports.

## Resolution

Ruled 2026-08-25, against the recommendation put to the operator, who was
right. The recommendation was to keep the grammar permissive and reconcile
by naming the conformance class each half binds: the MUST on the producer,
the optional branch as the consumer's parsing surface. The operator asked
why a date written mechanically should ever be optional, and the answer is
that it should not. A conforming producer always knows the date, so the
optional branch only ever spelled a mistake, and the format does not give
mistakes a legal spelling.

`bound-at` is now required in the grammar. The contradiction is gone by
deletion rather than by explanation.

**What making it required exposed.** A binding is an HTML comment in prose.
A comment that fails the grammar is not a malformed binding, it is not a
binding at all, so a consumer skips it and the claims it named vanish from
the narrative in silence. A required part would have made bindings
*invisible* rather than invalid. That hole was not created here: the anchor
has been required since the grammar was written, so a binding missing its
anchor has always disappeared quietly.

`ERF-31` therefore gains the recognition rule the grammar never had. A
comment opening `<!--` then `claims:` IS a narrative binding; recognizing
one and validating one are separate acts performed in that order; a
candidate failing the grammar MUST be reported and MUST NOT be skipped.
This is `ERF-33`'s reasoning moved down to the parse layer, and it gets
`ERF-33`'s answer.

`ERF-32` loses its restatement of the MUST and keeps `indeterminate`, which
is no longer the staleness of a legal record but what a consumer displays
for a passage whose binding it has just reported broken. The two go
together: one says the record is wrong, the other says what the reader sees
meanwhile.

Implemented as recognize-then-validate in the loader and in the renderer,
which previously replaced on the strict grammar alone and would have left a
broken binding in the page as an HTML comment, which is to say invisible.
Fixture `invalid/binding-without-bound-at` asserts the report rather than
the omission. All 26 bindings across the three live corpora already carry a
date; nothing migrated. Trial 5's Rust implementation has a unit test
asserting that a dateless binding parses successfully, which this ruling
settles against it.
