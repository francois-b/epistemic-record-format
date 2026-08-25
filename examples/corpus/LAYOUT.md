# The layout of this corpus

**This layout is exemplary, not normative.** The specification deliberately
mandates no substrate: section 8 asks only that a corpus have one canonical
store and that records round-trip through the textual form without loss
(`ERF-53`). A corpus in a wiki, a database, or a differently-shaped
directory is exactly as conforming as this one.

What follows is one arrangement that works, offered so a reader has
something concrete to look at.

```
corpus.yaml            the declaration: id, title, spec_version, and optionally classification and owner
LAYOUT.md              this file
README.md              what the corpus holds and where it came from
atoms/<id>.md          one file per atom
claims/<id>.md         one file per claim
surveys/<id>.md        one file per survey
narratives/<slug>.md   prose documents, with bindings to claims
captures/<slug>.txt    the immutable copies quotes are checked against
sources.yaml           the source list: each work's citation, locator, and capture
```

## Why one file per record

Records self-describe: every one carries its own `type` and `corpus`
(`ERF-54`), so nothing about a record's meaning depends on which file or
directory it sits in. One record per file is also the canonical
interchange form (`ERF-53`); a store may group records or hold bodies as
fields so long as everything round-trips, but this corpus takes the
plainest option, so the mapping from record to file is one to one.

## Why sources sit apart, in one list

An atom names its source by id and states its finding, its quote, and its
own quality judgment; the work's citation, retrieval locator, licence, and
capture live once on the source entry in `sources.yaml`, shared by every
atom that quotes it. The separation is deliberate twice over: a citation
identifies a work, a locator retrieves one copy of it, and a storage path
is neither; and a fact about the work stated once cannot drift into
disagreeing copies on three atoms.

## What this corpus demonstrates only partly

Four of its nine captures ship; the licences of the rest permit reading
but not republication. See `README.md` for the split and what it costs
the demonstration.
