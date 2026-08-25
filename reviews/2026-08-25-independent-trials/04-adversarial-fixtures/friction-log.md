# Friction log

Every point where the prose left a fixture's expected outcome
underdetermined, in the order encountered while building the set.

## undecidable-1 — ERF-69's excerpt-context standard has no acceptance test

`fixtures/spirit/s1-excerpt-is-only-the-quote`. ERF-69's second
sentence is MUST-worded: "It MUST contain the quoted passage together
with enough adjacent text for the passage's place in the source to be
legible." By RFC 2119 letter, a capture that is only the quote violates
a MUST, which argues for filing this under `fixtures/invalid`. But "the
data model" (ERF-69 is a Record-class requirement per the conformance
classes in section 1) and "the invariants" (section 6, which is what a
Validator class actually binds per the same section) are different
things, and nowhere does the spec define "enough" or "legible" in a way
a program can evaluate — no minimum length, no minimum sentence count,
no ratio. Compare ERF-52, three requirements later, which is also
about capture adequacy but gives an exact, executable definition
("every non-empty span MUST occur... in order and without overlap").
ERF-69 gives none. I read "a correct validator" (per the task
instructions) as a machine, not an oracle fluent in English, and filed
this under `spirit` on that basis: the fixture *passes* a correct
validator not because it's fine, but because no validator implementing
only what the spec makes computable can fail it. **This is the single
most load-bearing judgment call in the whole set** — an implementer
reading the same prose could reasonably build a length-heuristic
rejection into their validator and call `s1` non-conformant. If that's
the intended reading, ERF-69 needs either a numeric floor or an
explicit "advisory, not machine-checkable" note like the ones ERF-18
and ERF-9 get elsewhere in the document.

## undecidable-2 — does "empty lists MUST be omitted" reach into nested objects?

`ERF-55`/`ERF-56` are stated about "a field" generally ("Lists are
total in the type and MAY be empty; empty lists are omitted in
serialization"), and the worked example given (ERF-56) is a top-level
record field (`finding_audit`). `evidence_at_stance` is a nested object
with two required (non-optional) array fields, `atoms_for` and
`atoms_against`. I chose to omit `atoms_against` when empty inside
`evidence_at_stance` in `v4-contested-disposition`, on the reading that
the omission rule is about list-typed fields wherever they occur, not
specifically about record-frontmatter top-level keys. The alternative
reading — that `evidence_at_stance`'s two fields are required precisely
*because* they're inside a sub-object the type marks both fields
non-optional, so both should always be written even when empty — is
defensible from the TypeScript shape alone (`atoms_for: AtomId[];
atoms_against: AtomId[]` with no `?`). I did not build a dedicated
invalid fixture for the reverse call (explicit `atoms_against: []`
inside `evidence_at_stance`) because I could not settle which reading
a "correct" validator should enforce here — recording this as
undecidable rather than guessing.

## undecidable-3 — self-edge ban: all four relations, or two?

`fixtures/invalid/i03-self-edge`. ERF-43 reads: "Self-edges MUST NOT
exist; `assumes` and `decomposes-into` MUST admit no cycles." The
semicolon separates two clauses; the first names no relation, the
second names exactly two. I read the first clause as unscoped — a
self-edge is barred on any of the four relations, including `supports`
and `conflicts-with` — and built `i03` on a `supports` self-edge
specifically to test that broader reading (an implementation that only
checks self-edges on `assumes`/`decomposes-into`, by analogy with the
cycle clause right next to it, would pass this fixture when it
shouldn't). The narrower reading is available from the same sentence:
if self-edges only actually manifest as vacuous cases of the two
cycle-barred relations in practice, an implementer could scope the
check the same way. I could not find text elsewhere in section 6 that
settles it either way.

## undecidable-4 — do the "flag, not violation" clauses count toward "zero findings"?

ERF-43 says explicitly: "A validator MUST flag a closure that
terminates in a leaf whose disposition is `retired`: a flag rather
than a violation... an act the format permits cannot retroactively
make a corpus non-conformant." ERF-49 similarly: "A validator MUST
flag as unbacked an observation someone stands on with empty
`atoms_for` and empty `surveys`... The computed warning a render
shows." Both are MUST-worded requirements *on the validator's output*,
distinct from a MUST the corpus itself can violate. I read "zero
findings" (per the task's definition of `fixtures/valid`) as meaning
"zero conformance violations," with flags/warnings a separate,
non-fatal output channel a validator may still emit on an otherwise-
conformant corpus. Under that reading, a corpus that trips ERF-49's
flag (a stood-on observation with no atoms and no surveys) is not
`invalid` — but it's also not silently `valid` in the sense of "nothing
to see here," since a correct validator *will* say something about it.
I did not build a dedicated fixture for this exact shape (structurally
legal, standings present, atoms_for/surveys both empty/absent) because
neither `valid` nor `invalid` cleanly describes it under the task's own
two-way split; `spirit` doesn't fit either, since spirit fixtures are
defined as passing *silently* against evident intent, and this one is
defined by the spec to trigger a flag rather than pass silently. If a
three-way `flagged/` category existed, it belongs there. Recording this
gap rather than forcing it into one of the three directories.

## undecidable-5 — is an empty/absent source list legal for a zero-atom corpus?

`fixtures/valid/v1-minimal-commitment-claim`. ERF-3: "A corpus MUST
keep a source list." The `v1` fixture has no atoms at all (a
`commitment` claim owes no backing per ERF-24), so there is nothing to
list, and I omitted `sources.yaml` entirely rather than shipping an
empty one. This follows the same omission logic as ERF-55 (an empty
list is omitted, not written empty) extended one level up, from "a
list field is empty" to "the source list document itself is empty" —
but ERF-3 doesn't call the source list a "list field" in the same
sense; it's corpus structure, not a record field, and section 7 never
states whether a corpus with genuinely zero sources may skip the
document. I chose omission as the more consistent reading; an
implementer requiring an empty `sources: {}` (or a zero-byte
`sources.yaml`) as proof the producer didn't simply forget the file
would also be defensible.

## undecidable-6 — ERF-40 and the append-only half of ERF-48 are not testable from a static snapshot

Both `ERF-40` ("Standings MUST be append-only... verified against the
substrate's history") and half of `ERF-48` (the exception clause:
"appending to an append-only list MUST NOT advance [`last_modified`]")
describe a constraint on a *transition* between two states of a record,
not on any single state. A fixture, as specified for this task, is one
static corpus. Nothing in a lone snapshot can distinguish "this
standing entry was always here" from "this standing entry replaced an
edited-out one" (ERF-40), or "this `last_modified` bump reflects a
real edit that happened to coincide with an appended standing" from
"this `last_modified` bump was incorrectly caused by the append alone"
(ERF-48's exception). I did not build invalid fixtures for either,
because I could not construct one that a validator could actually
convict on the evidence available in a single corpus directory — doing
so would have meant writing an `expect.yaml` whose claimed violation
isn't verifiable by the very validator class the fixture targets. This
feels like the second most useful finding in the set: **any fixture
suite limited to static corpus snapshots structurally cannot exercise
ERF-40, or the exception clause of ERF-48, at all** — those need a
before/after pair (or real git history) as the fixture unit, which is
a different fixture shape than the rest of this task calls for.

## Minor calls, recorded for completeness

- **ERF-22 vs ERF-55 overlap (`i02`).** The only way to violate "a
  claim MUST NOT store a state field" is to write a field the schema
  doesn't define, which is simultaneously an ERF-55 violation (unknown
  field, not `x_`-prefixed). Named ERF-22 as the primary/intended
  violation since it's the more specific rule and the field name
  chosen (`disposition`) makes the intent unambiguous, but the overlap
  is structural, not a fixture-authoring accident — there is no way to
  test ERF-22 in isolation.
- **ERF-11's storage prohibition** ("the [mechanical check] result...
  MUST NOT be stored") has the identical problem one level further:
  there is no field in the schema that could hold a stored check
  result in the first place, so ERF-55 already forecloses it before
  ERF-11 is ever reached. No dedicated fixture built; would be
  redundant with `i02`'s finding.
- **ERF-65's JSON-schema-resolution requirement** binds a validator's
  *parsing* behavior ("Frontmatter MUST parse under YAML 1.2 using the
  JSON schema"), not producer content — an unquoted RFC 3339 timestamp
  in a file is not itself a violation of anything (quoting is only a
  producer SHOULD). I could not construct a clean single-requirement
  `invalid` fixture for it; instead several `valid` fixtures (e.g.
  `v1`, `v4`) leave `timestamp` values unquoted deliberately, so a
  validator using a YAML-1.1-flavored default schema (which would
  silently turn a bare `2026-08-02` into a date object) and a validator
  correctly using the JSON schema would disagree about whether those
  fixtures are clean. That disagreement *is* the test; there's no
  separate `invalid` case to add.
- **Cross-fixture id uniqueness.** ERF-36 is scoped to "the
  deployment," and each fixture directory here is written as if it were
  its own deployment. Running a validator across the whole
  `fixtures/invalid/` tree at once (rather than fixture-by-fixture)
  would spuriously flag every repeated corpus-id-prefix pattern (e.g.
  every fixture using `human:francois` as an actor id is fine, actor
  ids aren't record ids — but note this only holds because I checked
  it; see the id-collision script run during construction) as if they
  were one deployment. Confirmed by script that no unintended id
  collisions exist across directories; the one detected collision
  (`erfx-shared-7` in `i07`) is the fixture's intended violation.
