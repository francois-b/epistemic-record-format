# Changelog

Newest first. Requirement ids are stable once published: insertions use
letter suffixes (`ERF-4.8a`), retired ids are never reused, and every
change lands here with a date.

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
