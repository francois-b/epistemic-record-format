---
# GAP G1. ERF-14: `as_of_date` "MAY be a year, a year and month, or a full
# date, and MUST NOT state precision the source did not give: a study
# reporting a figure for 2018 carries `2018`, not an invented day".
#
# ERF-65 resolves frontmatter under YAML 1.2's JSON schema, under which
# "JSON's own number grammar" resolves to a number. An unquoted `2018` is
# therefore an INTEGER, and the data model types `as_of_date` as a string.
#
# ERF-65's producer SHOULD covers "a timestamp"; a bare year is not one, and
# nothing in the specification says to quote it. The two rules collide on the
# exact value ERF-14 uses as its worked example.
id: pt-005
type: atom
corpus: proto-trial
finding: "A study reported a figure for the 2018 calendar year."
quote: "in 2018, the figure stood at 41 percent"
source: okf-spec-v0-2
source_quality: high
as_of_date: 2018
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
---
