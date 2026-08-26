# The ERF example corpus

Eighteen records and a narrative that exercise every record type the format defines, so that
a reader can see the machine working rather than infer it from the
specification.

## Where these records came from

**These are real records, copied from the author's working practice, not
written for the demonstration.** They were minted in the course of research
into how knowledge work is governed, audited by the jury procedure the
format describes, and used in real documents before they were excerpted
here. Their ids, findings, quotes, citations, audit verdicts, and dates are
unchanged.

Three things were changed in the copying, and nothing else:

1. `corpus` is rewritten to this corpus's id, because these records now
   live here. Membership is mutable by design (`ERF-17`); identity is not,
   so the ids are as they were.
2. Working-note paragraphs that referred to the author's own sessions,
   pilots, and internal documents were dropped. They were about the
   practice, not about the evidence.
3. Actor ids were normalized to the specification's convention
   (`agent/claude-fable-5` where an early record wrote the bare model
   name), because the examples must conform to the document they
   demonstrate.
4. Nothing else. No record was invented, padded, tidied, or improved.

A corpus that demonstrates a format for recording evidence honestly should
not itself be a fabrication, so it is not one.

## What it holds

| Type | Count | What is worth looking at |
|:--|:--|:--|
| Atoms | 9 | Six have no audit verdicts, which the health view flags |
| Claims | 6 | All six compute to `proposal`: nobody has stood on them |
| Surveys | 3 | One finds nothing, one finds plenty, one is conclusive |
| Narratives | 1 | Written for this corpus, with bindings into the claims |
| Captures | 4 | Four of the nine atoms ship theirs; see below |

The three surveys are the clearest single illustration of a design decision.
A survey is neutral as to polarity: `continuous-claim-check-tools-2026-08-19`
searched hard and found nothing, and backs an absence;
`citator-agreement-studies-2026-08-22` searched and found a
twenty-five-year literature, and backs a density reading;
`granted-flag-uses-2026-08-22` searched a closed corpus exhaustively, found
zero, and carries no `limitations` at all, because when the universe
searched *is* the universe the claim is about, absence is conclusive rather
than defeasible.

## Captures, and why only some of them travel

The format's most convincing mechanism is the verbatim quote checked against
an immutable copy of its source. **Four of the nine atoms here ship their
captured copy, and five do not.** Both halves are on purpose.

Publishing a capture means redistributing someone else's text, so the
licence decides. The four that travel are excerpts from two W3C
Recommendations, PROV-DM and PROV-O. The W3C Document License permits
copying and distributing a W3C document or portions of it, in any medium and
for any purpose, provided the original link, the copyright notice, and the
document's status accompany the copy; each capture carries all three. For
those four atoms the mechanical check runs here, and the capture page shows
the quote highlighted inside the source text.

The other five cannot travel. Three quote a law journal article that is
freely readable but not licensed for redistribution, one quotes vendor
product documentation, and one quotes a documentation site whose content
carries no stated licence at all. Unverified is not permission, so nothing
shipped for them.

`sources.yaml` records every source either way, with a path and a licence
where the copy travels, and with a status and a reason where it does not. A
missing entry would be indistinguishable from an oversight, which is why
absence is written down rather than left silent. The viewer reads that file
and, on every claim resting on an atom whose capture did not ship, says so
instead of presenting the claim as backed. That is the viewer's own choice
rather than a rule of the format.

The mix is more instructive than a clean sweep would have been. It is what
the format looks like in the ordinary case, where some of your evidence can
be republished and some of it cannot, and where the reader is told which is
which.

## The layout of this corpus

**This layout is exemplary, not normative.** The specification deliberately
mandates no substrate: section 8 asks only that a corpus have one canonical
store and that records round-trip through the textual form without loss
(`ERF-53`). A corpus in a wiki, a database, or a differently-shaped
directory is exactly as conforming as this one.

What follows is one arrangement that works, offered so a reader has
something concrete to look at.

```
corpus.yaml            the declaration: id, title, spec_version, and optionally classification and owner
README.md              what the corpus holds and where it came from
atoms/<id>.md          one file per atom
claims/<id>.md         one file per claim
surveys/<id>.md        one file per survey
narratives/<slug>.md   prose documents, with bindings to claims
normalized/<slug>.txt  the normalized texts quotes are checked against
sources.yaml           the source list: each work's citation, locator, and normalized text
```

### Why one file per record

Records self-describe: every one carries its own `type` and `corpus`
(`ERF-54`), so nothing about a record's meaning depends on which file or
directory it sits in. One record per file is also the canonical
interchange form (`ERF-53`); a store may group records or hold bodies as
fields so long as everything round-trips, but this corpus takes the
plainest option, so the mapping from record to file is one to one.

### Why sources sit apart, in one list

An atom names its source by id and states its finding, its quote, and its
own quality judgment; the work's citation, retrieval locator, licence, and
capture live once on the source entry in `sources.yaml`, shared by every
atom that quotes it. The separation is deliberate twice over: a citation
identifies a work, a locator retrieves one copy of it, and a storage path
is neither; and a fact about the work stated once cannot drift into
disagreeing copies on three atoms.

### What this corpus demonstrates only partly

Two of its five sources ship their normalized text, which is what backs
four of its nine atoms; the licences of the rest permit reading but not
republication. See `README.md` for the split and what it costs the
demonstration.
