---
id: B-23
kind: defect
status: closed
priority: closed
priority_because: "Two trials wrote different filenames for the declaration and the narratives directory and each produced a corpus the reference could not read, twice silently, which is interoperability failing on day one."
basis: demonstrated
raised: "trials 1, 2 and 4 independently, 2026-08-25 (S1, S14, S15)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-23 · The corpus has no stated shape on disk

Neither the corpus declaration nor the source list has a stated filename, the frontmatter file grammar appears only in an example, and nothing requires a consumer to report files it scanned and did not recognize. Trial 4 wrote `declaration.yaml` where the reference expects `corpus.yaml`; trial 2 wrote `narrative/` where it expects `narratives/` and wrote claims with no closing delimiter. In each case a conforming corpus was unreadable, twice silently.

## Proposed resolution

Name the interchange layout in section 7, on the framing `ERF-3` already uses: this is what a corpus looks like when it travels as a directory, and a store is unaffected. Add a consumer SHOULD to report the unrecognized.

## Resolution

Closed 2026-08-25, and the entry's own framing was wrong. "The corpus has
no stated shape on disk" reads as a demand to specify a layout, which the
format refuses on purpose (`ERF-63`): a substrate arranges its files
however it likes. The true defect was narrower. `ERF-54` already said
records self-describe and no meaning lives in a path, and the declaration,
the source list and narratives carried no `type`, so three of the four file
kinds could only be found by guessing a filename. The specification
committed to corpora travelling as directories and then declined to say
what a receiving implementation could expect to find.

The fix is one field, not a layout. `type` now names what every file holds,
`corpus` and `sources` and `narrative` joining the three record types, and
a consumer discovers a corpus by reading rather than by guessing. Fixture
`valid/layout-carries-no-meaning` is the example corpus with every
convention broken (declaration at `whatever.yaml`, sources at `refs.yml`,
atoms two directories down) and it loads identically.
