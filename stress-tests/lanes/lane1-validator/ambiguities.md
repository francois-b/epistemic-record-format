---
generated: 2026-08-25
model: claude-fable-5
---

# Genuine spec defects found by cold implementation

The subset of the friction log where two careful implementers would build
different validators. For each: the requirement id, the two (or more)
readings, which this build chose, and why. Ordered by judged severity.

## A1. ERF-32 vs the ERF-31 grammar: is a missing `bound-at` a violation?

ERF-32 opens "A narrative binding MUST record `bound-at`". The ERF-31
grammar marks it optional (`[ws+ "bound-at=" date]`), and ERF-32 itself
then defines the required handling of its absence ("MUST be reported as
staleness `indeterminate`, never as current"), which only makes sense if
such bindings are expected to exist and parse.

- Reading 1: absence is a MUST violation, and the indeterminate report is
  the additional consumer-facing duty.
- Reading 2: the grammar governs; absence is legal (legacy or foreign
  bindings), and indeterminate reporting is the whole story; ERF-32's
  MUST binds only new producers.

Chose Reading 1 (VIOLATION whose message carries the indeterminate
reading), because a validator binds every machine-checkable MUST and the
MUST is unqualified. A conforming validator built on Reading 2 accepts
corpora this one rejects. The spec should either mark `bound-at`
REQUIRED in the grammar or scope ERF-32's MUST to producers.

## A2. ERF-35: "every reference" vs the enumerated four fields

ERF-35: "Every reference MUST resolve within the deployment ...:
`atoms_for`, `atoms_against`, `edges.to`, and `surveys` name existing
records." But the data model contains three more reference-bearing
fields: `prior_survey` (SurveyId), `notable_results[].atoms` (AtomId[]),
and `evidence_at_stance` (AtomId[] twice).

- Reading 1: the list is exhaustive; the other fields may dangle legally.
- Reading 2: "every reference" is the rule and the list is exemplary;
  all seven resolve or the corpus is non-conforming.

Chose a split: violations for the enumerated four, FLAGs for the other
three, because the enumeration reads deliberate (evidence_at_stance in
particular records history and arguably should survive a deleted...
except atoms are never deleted per ERF-13, which cuts the other way).
Two implementers will genuinely differ here; the spec should either say
"including" or "namely".

## A3. ERF-43 termination vs ERF-49: the premise-less argument

ERF-43: an argument's premise closure "MUST terminate in non-argument
leaves" (violation). ERF-49: an argument with no premises that someone
stands on is flagged unbacked (flag, explicitly not a violation). An
argument B with no premises, cited as a premise by argument A, is
simultaneously: a leaf of A's closure that is an argument (ERF-43
violation) and merely unbacked under ERF-49 (flag, and only if stood on).
Whether the closure includes its own root is also unstated: if it does,
every premise-less argument violates ERF-43 on its own, making ERF-49's
flag unreachable.

Chose: the closure excludes the root; an argument leaf reached through
another argument's closure is an ERF-43 violation on the citing
argument; a standalone premise-less argument draws only the ERF-49 flag.
This reconciles the two rules but the reconciliation is mine, not the
spec's. The spec should state whether the closure includes the root and
which rule owns the premise-less-argument case.

## A4. Declaration and source list: no location, no name, no anchoring

ERF-59 requires a corpus to "carry" a declaration and ERF-3 a source
list, and section 7 gives their interchange form, but nothing says where
either lives in the "directory or archive" a corpus travels as, what the
file is called, or how a source list is tied to its corpus (the Source
shape has no `corpus` field, and the source-list document has no defined
wrapper beyond the informal `sources:` key seen in one example).

- Reading 1: fixed well-known filenames (each implementer inventing
  their own: `corpus.yaml`, `declaration.yaml`, `erf.yaml`...).
- Reading 2: content-based discovery over all YAML in the tree.

Chose Reading 2 (any YAML doc with `spec_version` is a declaration; any
with a top-level `sources` mapping is a source list; nearest-ancestor
association). Two validators here disagree about what the corpus even
IS before checking a single record; that is the strongest
interoperability gap found. Compounding it: `ERF-54` says "no meaning
lives in a path" for records, yet `path` on a source is defined
"relative to the list", so the list's location silently carries meaning.

## A5. ERF-49: what "someone stands on" means

The flag fires for "an observation someone stands on with empty
`atoms_for` and empty `surveys`". Candidate readings of "stands on":
any standing entry ever; any current (newest-per-person) stance; a
current `for` stance; a computed disposition of `active` or `contested`.
These produce different flag sets: a claim whose only current stance is
`against` is unbacked under reading 2 but not under reading 3.

Chose: at least one person's current stance is `for` (standing on a
claim is standing behind it; opposing it is not). Defensible, not
forced. One clause ("a current `for` stance exists") would settle it.

## A6. ERF-24: audits recorded on kinds that owe no backing

"`bet` and `commitment` owe no backing, so they have nothing to audit."
Is an `evidence_audit` entry recorded on a bet a violation (the audit
asked no question the kind sets), a flag, or silently legal data?
The rule's MUST binds the audit's question, not the record's fields, so
the shape is legal while the act was senseless. Chose FLAG. A validator
choosing VIOLATION is equally defensible from "MUST ask the question the
kind sets".

## A7. ERF-55: how deep does empty-list omission reach?

"Empty lists MUST be omitted" plainly governs record serialization. But
ERF-20's own shape shows `evidence_at_stance: {atoms_for: [ids],
atoms_against: [ids]}`; a ruling with no atoms_against must then either
write `atoms_against: []` (violating a recursive ERF-55 reading) or omit
the key (violating a strict reading of the ERF-20 shape, which marks
neither key optional). Chose: ERF-55 applies to the record's own
list-typed fields; nested empties are tolerated and omitted nested keys
are read as empty. The clean-corpus fixture deliberately writes
`atoms_against: []` to pin this choice.

## A8. ERF-51 unwrap step f: "a space" before punctuation

"A space before `,` `.` `;` `:` `!` `?` is removed, an artifact of
document export." Singular "a space" vs a run of spaces vs any
whitespace including a line break. Because step f runs before step 11
(whitespace collapse), the readings reach different final strings:
capture `word .` with two spaces normalizes to `word.` under a
run-reading and to `word .` under a literal single-space reading,
flipping a quote-check verdict. Chose: any whitespace run. This is
exactly the class of divergence the (absent) conformance case files
exist to close; with the prose alone, two conforming tools can disagree
on a verdict, which is the outcome ERF-51 exists to prevent.

## A9. ERF-41: "each person's newest entry" with no tie-break

Disposition reads each person's newest standing entry, and ERF-19 forces
full instants precisely so entries order. But two entries by the same
person can carry the same instant (imports, batch tooling), and the spec
supplies no tie-break for "newest" (its no-tie-break sentence is about
stances across people, not entries within one person). Chose:
later-in-file wins, leaning on append-only order. A validator ordering
by timestamp alone would compute a different disposition on such a
ledger, and disposition feeds ERF-43's retired-leaf flag, so the
divergence propagates.

## A10. ERF-17: does corpus-must-be-declared bind atoms?

ERF-17 states the rule for claims ("`corpus` MUST be written on every
claim and MUST name a declared corpus"); the field-reference table
extends it to surveys; the atom's `corpus` maps only to ERF-54, which
requires the field's presence, not that it name a declared corpus. So an
atom carrying `corpus: nowhere` is arguably conforming. Chose: violation
for claims and surveys, FLAG for atoms. Probably an oversight rather
than a design; one row in the atom field table would fix it.
