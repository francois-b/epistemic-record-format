---
id: B-47
kind: defect
status: closed
priority: closed
priority_because: "Verified against the spec: ERF-3 already puts the source list under section 7, so only the narrative file is unscoped. Fold into B-36."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed: the three serialization rules have three different subjects, and ERF-66 has the narrowest and most consequential. The merge into B-36 was misfiled and is removed."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-47 · The serialization rules are written about records and miss the other files

`ERF-65` says "Frontmatter", `ERF-66` says "A record's frontmatter", `ERF-67` says "A record body". The declaration, the source list and narrative files are not records. `ERF-3` and `ERF-59` pull them in by reference, but on a literal read `ERF-66`'s duplicate-key and anchor ban, which exists precisely because two parsers may legally disagree, does not reach `sources.yaml`.

## Proposed resolution

Scope section 7 to files rather than records, or say which rules reach the non-record files.

## Consolidation note (2026-08-26)

Narrowed at HEAD, not resolved. The three rules moved to the binding on
2026-08-25 and their subjects are now: `ERF-65` "Frontmatter MUST parse"
(unscoped, so it reaches every file with frontmatter); `ERF-67` "a file
MUST be UTF-8 encoded" (every file), with "A record body is CommonMark"
still record-scoped; `ERF-66` "A record's frontmatter MUST NOT contain a
duplicate key, an anchor, an alias, or an explicit tag" (records only).
The residual is therefore `ERF-66`, which is the rule the entry called
"the narrowest and most consequential": on a literal read the source
list and the declaration may carry a duplicate key, and two parsers may
legally disagree about them. One word ("A document's frontmatter") is the
fix; the priority stands because that is the interoperability case.

## Resolution

Ruled by the operator 2026-08-26, ahead of 0.9.0: `ERF-66` now reads "A document's frontmatter", so the declaration and the source list may not carry a duplicate key, an anchor, an alias or a tag either.
