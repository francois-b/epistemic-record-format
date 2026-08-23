# Changelog

Newest first. Requirement ids are stable once published: insertions use
letter suffixes (`ERF-4.8a`), retired ids are never reused, and every
change lands here with a date.

## v1.0.5 (2026-08-23)

`ERF-6.5` was not a total function. A claim whose current stances are all
`against` matched none of its four branches, so the format's central
computed state was undefined for a legal input and two validators could
legitimately disagree about it. Found by a cross-vendor adversarial review.

The rule now discards withdrawn stances before computing, because
withdrawal is exit rather than opposition, and reads what remains: nothing
is `retired`, all `for` is `active`, all `against` is `rejected`, a mix is
`contested`. No standings at all remains `proposal`. Every input has exactly
one reading, and there is still no tie-break.

`rejected` is a fifth disposition, and `ERF-6.5a` forbids conflating it with
`retired`: a rejected claim is one every current holder judges false, a
retired one is one every current holder has left. The vocabulary grew
because a function was partial, not because a state was wanted, and it grew
without a forcing instance because totality is a property of a rule rather
than a feature.

The earlier rule also read one `for` and one `withdrawn` as disagreement,
reporting a contest that was not happening. That is fixed by the same
discard.

## v1.0.4 (2026-08-23)

Six areas the reference consumer could not implement from the text alone.
Every one was found by building `erf-view` against the specification rather
than against the existing tooling, which is what a reference consumer is
for.

**Omitted lists are not missing fields** (`ERF-7.4a`). The data model types
list fields as required and the serialization omits them when empty, and
until now nothing said what a reader does with the gap. A reader
materializes an omitted list as an empty one, and an omitted list means
none rather than unknown. This covers `finding_audit`, so an atom nobody
has audited is a complete record with an empty audit list. The model
describes a record in memory; the serialization rules describe the file;
the two differ on purpose. The viewer reported 28 divergences from this
alone, and reports none now.

**Quote normalization is defined** (`ERF-6.12a`, `ERF-6.12b`), as a ten-step
ordered sequence applied identically to quote and capture, taken from the
working implementation rather than invented. Case is explicitly NOT folded,
because case is part of a verbatim quote and folding it lets a mis-cased
quote pass a check whose whole job is fidelity. Elision markers are
wildcards, spans must occur in order, and a quote that is nothing but
elisions fails rather than trivially passing.

**Binding syntax has a grammar** (`ERF-4.25`). Ids are whitespace-separated,
never comma-separated, and the anchor is required, because it is how
software finds the passage after edits. A binding whose id resolves to
nothing MUST be reported and MUST NOT be dropped silently (`ERF-4.26a`):
hiding a broken citation turns it into a confident sentence.

**The manifest has a schema** (`ERF-7.7`): `id`, `title`, `spec_version`,
and `classification` required, a `policy` block and an `owner` optional. A
consumer MUST refuse a corpus whose `spec_version` it does not support
(`ERF-7.7a`), because reading one under the wrong version fails silently.

**The capture mapping has a shape, and absence is explicit** (`ERF-4.4a`,
`ERF-4.4b`). Every atom has an entry, giving either a path or a recorded
absence with a reason from a closed set: `not-redistributable` and
`licence-unverified`. A missing entry is a defect rather than a signal,
because `ERF-6.8a` cannot otherwise tell "no capture exists" from "nobody
wrote it down".

**A narrative is a document, not a record** (`ERF-4.26b`). It has no
evidence, no standings, and no disposition, which is exactly why it stays
out of the data model: nothing about it is adjudicated, and a reader
disputes the claims it binds to rather than the prose.

## v1.0.3 (2026-08-23)

A fifth relation, `bears-on`, admitted on a forcing instance rather than on
symmetry. It records that a claim bears on a question, it MUST target a
question, and it asserts nothing about whether that question is answered
(`ERF-6.7a`). It is the only relation whose target is not a claim.

It exists because widening validation from documents to whole corpora
surfaced 18 edges still using `answers`, a relation retired months earlier,
every one of them pointing at a question that remains open. Folding them
into each question's `answered_by` would have asserted ten answers nobody
gave, so the relation was readmitted instead, under a name that claims only
what the records support.

The lesson is recorded in the design history as the fourth reversal: a
retirement is only as good as the coverage of the check that confirmed the
disuse.

## v1.0.2 (2026-08-23)

`ERF-6.5` no longer breaks ties. It said the corpus owner's newest stance
governed when stances differed, which contradicted the format's own
position that quorum and merge resolution are out of scope because what a
disagreement means is a judgment rather than a computation. Disposition now
follows the current stances alone: none is a proposal, disagreement is
contested, agreement gives active or retired. `contested` is terminal, and
which disposition permits a use remains corpus policy. `owner` accordingly
means only the person who sets that policy, and `ERF-6.6` now tests
argument leaves on the computed disposition.

`ERF-6.8a` is new: a consumer must not present a claim as backed to a
reader who cannot resolve that backing. The classification wall constrains
what a record rests on inside a corpus and says nothing about what a reader
sees when a reference crosses a boundary, which is where a backed claim and
a bare assertion become indistinguishable. Resolvability is reader-relative
and computed at read time. A reader-safe summary of hidden evidence was
considered and rejected: it is a second version of the truth to maintain,
and an unfalsifiable claim of backing offered where it can least be checked.

## v1.0.1 (2026-08-23) — nomenclature and self-description

Field names now carry the noun that tells a reader the type, the pattern
`fetched_url` and `source_quality` already followed.

| Was | Is |
|:--|:--|
| `modified` | `last_modified` |
| `as_of` | `as_of_date` |
| `handle` | `short_name` |
| `backing_audit` | `evidence_audit` |
| `prior` | `prior_survey` |
| `hits` | `hits_reported` |

`backing_audit` named nothing on the record, since a claim has no
`backing` field. `evidence_audit` names what the audit is about and
survives surveys becoming backing, which `atoms_audit` would not have.

**Atoms self-describe.** Every atom carries its own `type` and `corpus`,
as claims, questions, and surveys already did. `ERF-7.2` now says records
self-describe rather than files, and `ERF-7.3` is rewritten: a collection
document may group records of one type, but carries no meaning of its
own, and a record extracted from one is complete without it. The earlier
inheritance rule was fitted to one file layout, and an atom's corpus had
become its confidentiality boundary, which is not something to leave
implicit in a container.

**Realm.** The word `registry` was doing three jobs: the corpus registry,
the file holding many atoms, and the operator-or-organization scope
introduced a day earlier for cross-party identity. The third is renamed
**realm** and defined in section 2: the set of corpora one operator or
organization governs, and the scope within which ids are unique. The
second is retired as a term of art in favor of *collection document*.
An atom id's leading token is a corpus prefix, not a registry prefix.
`ERF-4.11`, `ERF-4.11b`, `ERF-6.1`, and `ERF-6.2` are reworded; the
corpus registry keeps its name and gains a definition that says it
registers corpora, not sources.

## v1.0 (2026-08-22)

First published version. The format was extracted from a working practice
rather than designed up front: roughly 740 audited atoms and 300 claims
and questions across seven corpora preceded the specification, and a pilot
ran the records on a third-party substrate before it was written. Every
field and vocabulary value in it was admitted on a forcing instance and
several were retired again on measurement.

What was tried, what was retired, and the measurements that decided each
are in `DESIGN-HISTORY.md`. Changes from this version on are recorded
here, one entry per dated change, naming the requirement ids it touched.
