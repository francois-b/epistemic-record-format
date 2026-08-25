---
id: B-23
kind: defect
status: open
priority: P1
priority_because: "Two trials wrote different filenames for the declaration and the narratives directory and each produced a corpus the reference could not read, twice silently, which is interoperability failing on day one."
basis: demonstrated
raised: "trials 1, 2 and 4 independently, 2026-08-25 (S1, S14, S15)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-23 · The corpus has no stated shape on disk

Neither the corpus declaration nor the source list has a stated filename, the frontmatter file grammar appears only in an example, and nothing requires a consumer to report files it scanned and did not recognize. Trial 4 wrote `declaration.yaml` where the reference expects `corpus.yaml`; trial 2 wrote `narrative/` where it expects `narratives/` and wrote claims with no closing delimiter. In each case a conforming corpus was unreadable, twice silently.

## Proposed resolution

Name the interchange layout in section 7, on the framing `ERF-3` already uses: this is what a corpus looks like when it travels as a directory, and a store is unaffected. Add a consumer SHOULD to report the unrecognized.
