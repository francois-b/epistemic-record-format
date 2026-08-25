# Batch 1 minting friction log — ai-capex corpus

One line per guess, re-read, or unsettled choice made while applying the ERF
spec (v0.9 draft) to mint atoms `acx-1` through `acx-29`. Requirement ids per
the digest in this working directory's `SPEC.md`.

- 2026-08-25 — **ERF-13 / ERF-37** (id minting): spec gives no guidance on
  zero-padding or a starting offset for a corpus's first batch (example is
  `kwg-117`, mid-sequence). Used unpadded sequential integers from the empty
  `atoms/` directory: `acx-1` … `acx-29`. Verified no existing atom, claim, or
  survey id collides (dirs were empty) per ERF-36/ERF-38.

- 2026-08-25 — **ERF-9 / ERF-10** (source_quality axis, "interested party"
  reading): the task brief's explicit reminder ("an interested party's claim
  about itself is what the spec says it is") pushed several company
  self-characterizations to `medium` rather than `high` even though they
  appear in earnings releases/10-Ks/press releases: Jassy's "not investing on
  a hunch" (acx-9), AWS power-capacity self-report (acx-10), Oracle's
  "substantially reduces the amount of capital" framing around its $75B
  prepaid-capital figure (acx-7), and all three NVIDIA/OpenAI and
  NVIDIA/Microsoft/Anthropic partnership press-release atoms (acx-13,
  acx-14, acx-15). This is a judgment call about where the "vendor's claim
  about its own product" medium-tier example ends and "organization's
  disclosure made under legal or regulatory accountability" high-tier example
  begins when a filed document mixes hard figures with self-serving
  interpretation. A different assessor could grade some of these `high`.

- 2026-08-25 — **ERF-9** (earnings-call transcripts): graded Microsoft's
  FY26Q4 CFO prepared remarks (acx-3, acx-4) as `high` even though the
  transcript itself is not an SEC filing (unlike the 10-K/10-Q/8-K-exhibit
  sources), reasoning that official CFO remarks published by IR under Reg FD
  carry comparable accountability to a filed disclosure. Not settled by the
  spec text.

- 2026-08-25 — **ERF-14** (`as_of_date` for forecasts/guidance): the spec
  says `as_of_date` "records the date the FACT is true of," but doesn't
  address forward guidance or projections directly. For MSFT's FY27 capex
  guidance (acx-4), IEA's 2030/2035 projections (acx-28), and similar, I
  used the date the forecast was *issued* rather than the future date it
  describes, on the reading that the fact being conveyed is "as of this
  report, the forecaster projects X" rather than the (not-yet-true) future
  figure itself. Flagged per-atom in `limitations` where material.

- 2026-08-25 — **ERF-4 / ERF-14** (missing publish dates): both NVIDIA
  partnership press releases (`bull-nvda-openai-10gw-partnership-2026`,
  `bull-nvda-msft-anthropic-partnership-2026`) carry no `issued` date
  anywhere in `sources.yaml` — no citation block date, no `fetched` date
  beyond the capture-fetch stamp. Rather than guess a publication date, I
  omitted `as_of_date` on all three atoms drawn from these two sources
  (acx-13, acx-14, acx-15) and noted the gap in each `limitations` field.

- 2026-08-25 — **ERF-50 / ERF-51 / ERF-52** (mechanical quote check): the
  spec states the ordered normalization sequence is normative but that its
  *exact* behavior is pinned by `conformance/cases/normalization.txt` and
  `conformance/cases/quote-check.yaml` — files not present in, and out of
  scope for, this working directory under the purity boundary. I wrote a
  best-effort reproduction of the prose rules (markup-unwrapping a–f, then
  steps 1–11) to self-check all 29 quotes against their captures before
  minting. All 29 passed my reproduction, but this is a good-faith read of
  the prose, not a guarantee of byte-identical behavior against the actual
  conformance cases.

- 2026-08-25 — **ERF-6** (verbatim quote, caught by the self-check): the
  first draft of acx-22's quote ended "...about $3 billion." with a period I
  had added: the capture actually continues "...about $3 billion, or around
  3.75% of this year's capital expenditures..." with a comma, not a period.
  Fixed by truncating the quote without inventing trailing punctuation.
  Logged because it's exactly the transcription failure the mechanical gate
  exists to catch, and it would have passed casual proofreading.

- 2026-08-25 — **Actor id convention** (`created.by`, format
  `` `${producer}/${version}` ``): the spec's own example uses
  `agent/claude-fable-5`; I am running as `claude-sonnet-5`, so I wrote
  `agent/claude-sonnet-5` by analogy. The spec doesn't define what string is
  meant to fill the `producer` slot (e.g. `agent` vs. a tool name), only the
  shape.

- 2026-08-25 — **ERF-6 / ERF-51** (quoting a table row): acx-1's quote is a
  literal markdown table row from the MSFT 10-K capture
  (`| Additions to property and equipment | (115,948) | (64,551) |
  (44,477) |`) rather than prose, because the capture presents that figure
  only in tabular form. Normalization (section 6) doesn't strip pipe
  characters, so this passes the mechanical check, but quoting a table row
  verbatim is an unusual shape the spec's own atom example doesn't
  illustrate.

- 2026-08-25 — **ERF-14** (ambiguous relayed date): acx-20 quotes Cahn
  relaying Ben Thompson's "TSMC Brake" analysis, dated only "in October" with
  no year given in the capture. Used the citing article's own publish date
  (2025-12-03) as `as_of_date` rather than guess which October, and flagged
  the ambiguity in `limitations`.

- 2026-08-25 — **Coverage, not a rule question**: two named sources in the
  work order's priority list have no capture on disk and were correctly
  excluded per the task brief's explicit "sources without captures are out
  of scope" instruction: `bear-slok-apollo-ai-bubble-dotcom`
  (`not-redistributable`, no path) and `bull-bloomberg-ai-bull-run-2026`
  (`access-restricted`, no path). No atoms drawn from either.

- 2026-08-25 — **Coverage choice**: the work order named
  `bear-covello-goldman-*` as a prefix; only one matching source exists in
  this corpus (`bear-covello-goldman-too-much-spend-2024`). A second,
  non-matching Goldman source (`bear-goldman-ai-bubble-debate-2025`) exists
  but wasn't drawn on in this batch given the 25–30 atom budget — a coverage
  decision, not a spec-reading question.

- 2026-08-25 — **ERF-9** (institutional-study grade): graded both MIT NANDA
  atoms (acx-24, acx-25) and all four IEA atoms (acx-26, acx-27, acx-28) as
  `high` under the table's "a named study reporting its own data" example,
  treating a methodologically-described institutional research report as
  equivalent in weight to a regulator/court filing for this axis. The table
  doesn't spell out whether a think-tank/agency report about an *industry*
  (rather than an org's disclosure about *itself*) is meant to qualify the
  same way; read it as qualifying.

- 2026-08-25 — **YAML scalar style** (not a spec ambiguity, a mechanical
  choice): wrote all string fields as single-quoted YAML scalars (doubling
  embedded `'` per YAML 1.2) rather than double-quoted or block-literal,
  since most captured quotes contain nested double-quoted phrases that
  single-quoting avoids having to escape. Confirmed all 29 files parse
  under `yaml.safe_load` and pass the self-built ERF-51/52 check.
