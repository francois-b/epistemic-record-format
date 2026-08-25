---
id: F-003
raised:
  by: "claude-opus-5, re-running the 2026-08-25 verifiers against the current spec"
  on: 2026-08-25
  observation: "The Rust validator reads sources.yaml's top-level keys as the source map and breaks the moment the file also carries type: sources; the reference and the Python and SQL implementations all expect the entries under a sources: key"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-3"
  claim: null
verifications: []
outcome: open
---

# F-003 · `ERF-3` never says where the source entries live in the document

## What was observed

`ERF-3` reads: "A corpus MUST keep a source list: a document carrying
`type: sources`, one entry per work following the `Source` shape of section
3, keyed by a source id unique within the corpus."

That sentence admits two readings of the document's shape:

1. Two top-level keys, `type` and `sources`, the entries nested under the
   second. This is what `SourceList` in `types/erf.ts` types, what the
   reference loader reads, and what all four corpora on disk are written as.
2. `type` alongside the entries at the top level, each remaining key being
   a source id.

The Rust validator built cold from `SPEC.md` in the 2026-08-25 trials
implements a heuristic between the two: it unwraps a lone `sources:` key
and otherwise treats the top level as the source map. That heuristic was
invisible while no source list carried anything else at the top level.

## How it surfaced

`ERF-54` was widened so every file self-describes with `type`. Adding
`type: sources` to the two authored corpora gives their source lists a
second top-level key, which defeats the unwrap. The Rust validator then
reports the whole file as two malformed source entries and cascades:

    VIOLATION ERF-3  sources.yaml  source entry `type` is a scalar, not a mapping
    VIOLATION ERF-5  sources       required field `status` is missing
    VIOLATION ERF-7  sources       required field `citation_text` is missing
    VIOLATION ERF-4  × 151         `bull-msft-10k-2026` is not a key in the source list

151 atoms are reported as naming sources that do not exist, when the source
list is present and correct. The same binary reports 0 violations on its
own test corpus, whose source list carries no `type`.

## Why it may matter

This is the first demonstrated interoperability break between two
independent implementations of the format, and it is not drift: both
readings are live against the prose as it stands today. It also touches
`ERF-54`, whose whole argument is that a file's `type` makes it
self-describing. A widening intended to make discovery robust is what broke
the reading here.

Note also the failure mode. The Rust validator does not say "I could not
make sense of this file." It blames 151 records for a fault in one. Whether
a validator should be required to report an unparseable source list as such
rather than cascade is arguably a second, separable question.
