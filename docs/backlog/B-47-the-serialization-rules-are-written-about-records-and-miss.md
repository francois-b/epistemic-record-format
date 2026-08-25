---
id: B-47
kind: defect
status: open
priority: P1
priority_because: "`ERF-66`'s duplicate-key and anchor ban exists precisely because two parsers may legally disagree about a file, and on a literal read it does not reach `sources.yaml`, the one file every quote check depends on; provisional pending verification by someone other than the raiser."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verified:
  by: "raised by the verification pass itself"
  on: 2026-08-25
  verdict: unverified
  note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-47 · The serialization rules are written about records and miss the other files

`ERF-65` says "Frontmatter", `ERF-66` says "A record's frontmatter", `ERF-67` says "A record body". The declaration, the source list and narrative files are not records. `ERF-3` and `ERF-59` pull them in by reference, but on a literal read `ERF-66`'s duplicate-key and anchor ban, which exists precisely because two parsers may legally disagree, does not reach `sources.yaml`.

## Proposed resolution

Scope section 7 to files rather than records, or say which rules reach the non-record files.
