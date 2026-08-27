---
id: B-71
kind: capability
status: open
priority: trigger-driven
priority_because: "A survey's coverage bounds say what instrument ran; they do not say which named sources were sought and not reached, so a reader cannot tell absent from the literature from absent from this pass. The producer now writes that list into the survey's body, which the format keeps and no consumer reads as data."
basis: anticipated
raised: "erf-mcp, the 2026-08-27 survey on 1990s knowledge management, whose two best sources were open PDFs the capturer refused and whose canonical source was paywalled; the record could not say so in a field"
verifications:
  - by: "claude-fable-5, the hand that built the tooling"
    on: 2026-08-27
    verdict: unverified
    note: "raised by the hand that made the change; needs a check by another"
trigger: "A consumer that wants to read a survey's unreached sources as data (a viewer listing what to chase next, a second producer picking up where the first stopped), or a second producer inventing its own place for the list."
generated: 2026-08-27
model: claude-fable-5
---

# B-71 · A survey names the sources it sought, and what became of them

A survey records its search acts (`ERF-26`, `ERF-27`) and, in prose, its
coverage bounds (`ERF-28`). Neither says which named sources the survey went
looking for and did not reach. A pass that runs three topic queries and one
that searches for six named works by author and year read the same in the
record, and "no source found ranks the capture burden first" cannot be told
from "the period surveys that would settle it were not reached".

erf-mcp's `erf_survey_record` now takes `targets`: the sources sought by
name, each `held` (with the registered source), `unreachable` (with why:
PDF, paywall, 403), `not-found`, or `not-searched`, and writes them into
the survey's body under a "Sources sought" heading with a one-line count in
the coverage text. That is producer convention in free prose; `Survey`
models no such field.

The question for a ruling: does a survey carry `targets` as data, one entry
per source sought with a closed status vocabulary, so a consumer can list
what a survey leaves unreached and a later survey can pick the list up as
`prior_survey` does for acts? The cost is one optional field and a status
vocabulary the format would then own. The alternative is to leave it in
prose, where the reader finds it and no tool does.

Related: `ERF-26` to `ERF-28` (surveys), `B-70` (a locator on an atom).
