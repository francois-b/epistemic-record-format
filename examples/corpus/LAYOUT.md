# The layout of this corpus

**This layout is exemplary, not normative.** The specification deliberately
mandates no substrate: section 8 asks only that a corpus have one canonical
store and that records round-trip through the textual form without loss
(`ERF-53`). A corpus in a wiki, a database, or a differently-shaped
directory is exactly as conforming as this one.

What follows is one arrangement that works, offered so a reader has
something concrete to look at.

```
corpus.yaml            the manifest: id, title, spec_version, classification, owner
LAYOUT.md              this file
README.md              what the corpus holds and where it came from
atoms/<id>.md          one file per atom
claims/<id>.md         one file per claim
surveys/<id>.md        one file per survey
narratives/<slug>.md   prose documents, with bindings to claims
captures/<slug>.txt    the immutable copies quotes are checked against
captures.yaml          atom id to capture path
```

## Why one file per record

Records self-describe: every one carries its own `type` and `corpus`
(`ERF-54`), so nothing about a record's meaning depends on which file or
directory it sits in. One record per file is also the canonical
interchange form (`ERF-53`); a store may group records or hold bodies as
fields so long as everything round-trips, but this corpus takes the
plainest option, so the mapping from record to file is one to one.

## Why captures sit apart, with a mapping file

An atom names its source in `citation_text` and, where a fetch happened,
in `fetched_url`. Neither field says where the saved copy lives. That
separation is deliberate: a citation identifies a work, a locator retrieves
one copy of it, and a storage path is neither. `captures.yaml` holds the
atom-to-copy mapping so the record stays about evidence and the storage
question stays a storage matter.

## What this corpus demonstrates only partly

Four of its nine captures ship; the licences of the rest permit reading
but not republication. See `README.md` for the split and what it costs
the demonstration.
