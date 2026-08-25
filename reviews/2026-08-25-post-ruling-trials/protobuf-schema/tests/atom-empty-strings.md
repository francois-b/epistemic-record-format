---
# PRESENCE CASE P-2. The pair for atom-minimal.md: the same two optional
# scalars, PRESENT and EMPTY rather than absent.
#
# The specification never rules on this. ERF-55 governs empty LISTS and
# empty MAPPINGS and says nothing about an empty STRING. Section 3 says only
# that "Optional fields (`?`) assert existence when present", which -- read
# literally -- makes `limitations: ""` the assertion that a caveat exists and
# is blank, a different fact from no caveat having been recorded.
#
# Without `optional` on the proto field these two files produce identical
# bytes. With it they do not. That is the whole trial in one pair.
id: pt-003
type: atom
corpus: proto-trial
finding: "A survey of a private sample says something about its curation and
  nothing about the world."
quote: "the sample says something about its curation, nothing about the
  world"
source: okf-spec-v0-2
source_quality: low
as_of_date: ""
limitations: ""
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
---
