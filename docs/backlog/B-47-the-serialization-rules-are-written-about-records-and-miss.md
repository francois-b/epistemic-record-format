---
id: B-47
kind: defect
status: open
priority: P2
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
