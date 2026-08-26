---
id: F-033
raised:
  by: "claude-fable-5, consolidation pass 2026-08-26, reading SPEC.md at HEAD"
  on: 2026-08-26
  observation: "two of the mechanical substitutions that replaced retired requirement ids with schema pointers name a definition that does not fit the sentence"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "section 1, section 3.1"
  claim: null
verifications: []
outcome: promoted
promoted_to: "SPEC.md section 1 and section 3.1, ruled directly 2026-08-26"
resolution_note: >
  Two retired-id substitutions had landed on the wrong schema definition.
  Section 1 now reads "Requirements are numbered (`ERF-n`)" and the
  received.* row cites the schema's `Received`. Verified against
  erf.schema.json before the edit.
generated: 2026-08-26
model: claude-fable-5
---

# F-033 · Two retired-id substitutions point at the wrong schema definition

## What was observed

When the fourteen shape rules retired on 2026-08-26, citations of their
ids were replaced with pointers of the form "the schema (`Definition`)".
Two of the replacements do not fit their sentence at HEAD:

- Section 1, first paragraph after the conformance statement:
  "Requirements are numbered (the schema (`Source.citation_text`)) and use
  RFC 2119 keywords". The parenthesis replaced whatever id once stood
  there and now says that requirement numbering is a property of a
  source's citation string.
- Section 3.1, the source-field table, row for `received.url`,
  `received.path`, `received.digest`, `received.timestamp`: constrained by
  "`ERF-2`, the schema (`Source.citation_text`), `ERF-71`". The four
  fields are the schema's `Received` definition; `Source.citation_text` is
  the string that refuses a URL, which is adjacent in reasoning and not
  the definition that types them.

The other eight substitutions read correctly (`CorpusDeclaration`,
`SourceList`, `ActorStamp`, `StandingEntry`, `HumanActor`, and
`Source.citation_text` in the `citation_text` row itself).

## Why it may matter

Neither changes what conforms. Both are in text a first-time reader meets
early, and the first one reads as nonsense, which is the wrong first
impression for a document whose argument is that its prose is precise.
`tools/lint-spec-style.py` passes on both, so nothing mechanical would
catch a third.

Raised only; not specified, because the raiser may not specify.
