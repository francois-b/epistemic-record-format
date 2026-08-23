# The layout of this corpus

**This layout is exemplary, not normative.** The specification deliberately
mandates no substrate: section 8 asks only that a corpus have one canonical
store and that records round-trip through the textual form without loss
(`ERF-7.1`). A corpus in a wiki, a database, or a differently-shaped
directory is exactly as conforming as this one.

What follows is one arrangement that works, offered so a reader has
something concrete to look at.

```
corpus.yaml            the manifest: id, classification, policy, owner
LAYOUT.md              this file
README.md              what the corpus holds and where it came from
atoms/<id>.md          one file per atom
claims/<id>.md         one file per claim
surveys/<id>.md        one file per survey
narratives/<slug>.md   prose documents, with bindings to claims
captures/<slug>.md     the immutable copies quotes are checked against
captures.yaml          atom id to capture path
```

## Why one file per record

Records self-describe: every one carries its own `type` and `corpus`
(`ERF-7.2`), so nothing about a record's meaning depends on which file or
directory it sits in. A collection document that groups many records of one
type is permitted (`ERF-7.3`) and is often more convenient at scale, but it
is a grouping convenience only. This corpus takes the plainest option so
that the mapping from record to file is one to one.

## Why captures sit apart, with a mapping file

An atom names its source in `citation_text` and, where a fetch happened,
in `fetched_url`. Neither field says where the saved copy lives. That
separation is deliberate: a citation identifies a work, a locator retrieves
one copy of it, and a storage path is neither. `captures.yaml` holds the
atom-to-copy mapping so the record stays about evidence and the storage
question stays a storage matter.

## What this corpus does not demonstrate

Almost none of its captures could ship. See `README.md` for why, and for
what that costs the demonstration.
