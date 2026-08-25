# Batch 5 friction log — closing depth pass (acx-119..acx-151)

2026-08-25. Minted 33 new atoms (acx-119 through acx-151), bringing the
corpus from 118 to 151 atoms. This batch is the last of the depth passes
per the work order, so entries below include drift observed across the
whole set (four prior authors + this batch), not just this session's own
friction.

## Skips (logged honestly, per work order)

- 2026-08-25 · `n-tsmc-q2-2026-presentation` · **skipped entirely, 0 atoms
  minted.** Confirmed the stated hazard: the capture is a pandoc
  html-to-plain flattening of an earnings-deck table, e.g. "Net Revenue
  (US$ billions) 40.20, 1Q26 Guidance 39.0-40.2, 1Q26 35.90, 2Q25 30.07,
  2Q26 Over 1Q26 +12.0%, 2Q26 Over 2Q25 +33.7%." This is column data read
  left-to-right into prose, not a sentence anyone wrote; there is no
  verbatim quotable claim in it, only numbers stripped of the row/column
  structure that gave them meaning. Correctly zero atoms before this
  batch; correctly zero after.
- 2026-08-25 · `n-coreweave-ddtl4-8k-2026` · **3rd atom skipped.** The only
  remaining unquoted material of any substance is the underwriter list
  ("MUFG and Morgan Stanley served as co-structuring agents... Goldman
  Sachs and JPMorgan serving as additional coordinating lead arrangers")
  and a headline-framing sentence that restates, in different words, the
  "first investment-grade rated financing" claim already carried by
  acx-95. Neither clears the craft bar (ERF-52's guidance on the atom
  section: "compression is a defect... redundancy that makes a finding
  checkable... is doing work, not padding" — a bank-syndicate list is
  neither); skipped rather than mined for volume.
- Multiple bear- sources with high atom-count-to-line-count ratios
  (`bear-covello-goldman-too-much-spend-2024`, `bear-cahn-600b-question-2024`,
  `bear-zitron-haters-guide-ai-bubble`, `bear-mit-nanda-genai-divide-2025`,
  `bear-iea-energy-and-ai-2025`, each ~13-19 lines carrying 3 atoms
  already) were spot-checked and judged already mined out; not
  re-opened for this batch given the priority order in the work order
  (n- sources first, then genuinely distinct bull-/bear- passages).

## Divergences from spec, logged as instructed

- **`as_of_date` over-application vs. ERF-14.** ERF-14: "dated statistics
  carry it and timeless statements omit it." Audit of the pre-existing
  118 atoms: 110/118 (93%) carry `as_of_date`, nearly always set to the
  *source's publication date*, regardless of whether the finding is a
  dated statistic or a general argument. Two examples on the same
  sources I re-mined this batch: acx-114 (Odlyzko, Railway Mania) sets
  `as_of_date: '2010-01-15'` on a general historical-analytical claim
  about 1840s critics; acx-115 (Hogendorn) sets `as_of_date: '2007-06-13'`
  on a general description of the 1990s-2001 telecom boom-bust. Neither
  is "the date the fact is true of" in ERF-14's sense — both are the
  paper's own publication date attached to a timeless argument. For this
  batch's second atoms on the *same two sources* (acx-123 Hogendorn,
  acx-124 Odlyzko-railway) plus acx-125 (Odlyzko, internet-time, second
  atom) and acx-132 (Dominion, methodology description), I followed the
  spec's literal instruction instead and omitted `as_of_date`, noting the
  divergence from the sibling atom in each `limitations` field. Net: this
  batch is not internally consistent with the majority prior practice on
  this field, by design, per instruction to follow the spec where practice
  and spec differ and log the divergence rather than silently match it.

- **`source_quality` drift on SEC-filed earnings releases.** ERF-9's table
  puts "an organization's disclosure made under legal or regulatory
  accountability" at `high`. Prior practice is split on quotes from
  officer-attributed statements inside such filings: TSMC (acx-88, acx-89),
  ASML (acx-90, acx-91), CoreWeave (acx-95, acx-96), and SK hynix
  (acx-93, acx-94) all grade `high`, including atoms that bundle forward
  guidance. Broadcom's equivalent CEO quote in its own SEC-filed 8-K
  exhibit (acx-38) grades `medium`, with the stated reason "the CEO's own
  characterization in a promotional press release." Same document class,
  different grade, from what reads as two different callers' weighting of
  ERF-9's "two inputs, weaker governs" test (provenance distance vs.
  attester accountability) against the fact that a quote is attributed to
  a named officer. For this batch's second Broadcom atom (acx-146, the
  CFO's consolidated-revenue quote), I graded `high` to match the
  TSMC/ASML/CoreWeave/SK-hynix convention and the literal table language,
  and flagged the inconsistency with acx-38 in the atom's own
  `limitations` field rather than silently resolving it.

## Hazards encountered and how they were handled

- **Bracket insertions are not verbatim** (per the work order's warning).
  Two live instances found and avoided: `n-constellation-crane-tmi-restart-2024`
  has "Approximately $1.6 billion capex will be deployed **[to restart the
  plant]**." — the bracketed clause is the capture author's own gloss, not
  deck text. acx-138's quote stops at "...will be deployed" (before the
  bracket) and resumes at the next clean sentence via `[...]`, with a
  `limitations` note explaining the exclusion. Similarly,
  `n-softbank-openai-followon-2026` has a `[Footnote: SBG manages LTV
  below 25%...]` block; it was not quoted at all (not just trimmed),
  because the whole block reads as the capture author's paraphrase-label
  of a footnote rather than a clean verbatim span.

- **ERCOT's March-2025-vs-2026 caption conflict, contained.** The existing
  atom (acx-101) already carries the corpus's caveat about the source's
  own chart captions reading "March 2025" against a 2026-03-12 posting
  date. This batch's second ERCOT atom (acx-120, the 137-new-LLI-submissions
  /140,000-MW-by-2036 figure) deliberately picks a passage that carries no
  such caption, and its `limitations` field says so explicitly, so a
  reader doesn't have to re-derive that the caveat doesn't apply here.

- **New normalization edge case: a hyphenated compound word wrapped
  exactly at its internal hyphen.** `n-softbank-openai-followon-2026`'s
  capture line-wraps as "...Investment: Pre-\nmoney valuation...". Per
  ERF-51 step 7 ("remove a hyphen followed by a newline and any leading
  whitespace on the next line"), the *capture's* normalized form loses
  the hyphen entirely ("Premoney"), while a quote hand-transcribed as
  continuous text ("Pre-money valuation") normalizes with the hyphen
  intact, since it contains no embedded newline for step 7 to act on. The
  mechanical check on the two sides then disagrees over a quote that *is*
  verbatim. Caught by running the ERF-51 sequence in a standalone checker
  before minting (see Method note below) rather than by eye. Worked
  around by moving the quote boundary to start after the affected word
  (acx-128); logged in that atom's `limitations`. This is the same family
  of hazard the work order flagged for line-wraps immediately before
  punctuation/ellipses, just one step earlier in the pipeline — it hits
  step 7 (hyphen-join) rather than step 11 (space-before-punctuation).

- **Same family, an em-dash at a line-wrap.** Amazon's Jassy letter
  wraps "...in two months —\nfour times faster...". The capture's
  normalized form collapses the em-dash + newline entirely to a single
  space (step 7 again, since the folded em-dash is a hyphen at that
  point); a hand-typed quote with the em-dash surrounded by ordinary
  spaces instead folds (step 6) then loses its *surrounding* spaces (step
  10, dash-spacing unification), landing on "months-four" with no space
  at all. Two different lossy transformations of the same character,
  diverging because one instance sits at a line-wrap and the other
  doesn't. Handled by splitting the quote at that exact point with
  `[...]` (acx-151) instead of trying to reproduce the dash across the
  wrap.

- **Self-caught punctuation invention.** A first draft of the J.P. Morgan
  Stargate/Abilene quote (acx-144) ended "...on both transactions." — but
  the source actually continues "...on both transactions — a single
  engagement that illustrates the scale of capital now moving into AI
  infrastructure." I had silently substituted a period for the source's
  em-dash to make a "clean-sounding" quote boundary. The standalone
  mechanical checker caught the mismatch before minting; fixed by
  extending the quote to the source's actual next full stop rather than
  inventing one. Worth naming as a general risk: a boundary chosen because
  it *reads* clean in isolation is exactly where an author is likely to
  round off punctuation that isn't there — only a mechanical re-check
  against the capture catches it reliably.

## Method note (not a corpus artifact, but relevant to how this batch's
claims were checked)

Before finalizing, I implemented the ERF-51 normalization sequence
(unwrap steps a-f, then steps 1-11) as a standalone script and ran the
mechanical quote-check (ERF-50) against every new atom's actual on-disk
file before treating any of them as done. This is what surfaced the three
issues above (two normalization edge cases, one invented-punctuation
slip) that a by-eye read had missed. All 33 pass. This is not a corpus
artifact and isn't proposed as one; noted here because ERF-50/51 are
explicitly meant to be independently re-runnable, and this batch is a
data point that they're worth actually re-running rather than trusting
by eye, even for a careful transcription pass.

## Cross-author drift, corpus-wide (since this is the closing batch)

- **`created.by` carries no distinguishing provenance across batches.**
  All 151 atoms — this batch and, per the task brief, four prior
  authors' batches — carry the identical `created: {timestamp:
  '2026-08-25', by: 'agent/claude-sonnet-5'}`. If four different sessions
  really did produce the earlier 118 atoms, that fact is not recoverable
  from the corpus itself: ERF's `created.by` field is the only per-record
  attribution mechanism an atom carries, and here it's uniform. A reader
  trying to trace "which pass minted this" has to fall back to id-range
  inference (this batch: 119-151) or out-of-band knowledge. Not a spec
  violation (ERF-13 constrains `id` permanence, not `created.by`
  granularity) but worth flagging as a provenance gap if per-batch
  attribution is ever wanted.
- **`as_of_date` and `source_quality` drift**, detailed above under
  "Divergences from spec" — both are cross-author inconsistencies, not
  just this-batch-vs-spec ones: the SEC-filing `source_quality` split
  (TSMC/ASML/CoreWeave/SK-hynix vs. Broadcom) and the as_of_date
  over-attachment pattern both predate this batch and appear to reflect
  different callers' judgment on the same open questions rather than a
  single rule applied inconsistently by one author.
- **No atom in the corpus, old or new, carries `finding_audit`.** Fully
  consistent with ERF-56 (an unaudited atom is a complete record with an
  empty list, not a malformed one) — but worth noting plainly: the
  audit machinery (`ERF-11`, `ERF-12`, the `SUPPORTED`/`PARTIAL`/
  `UNSUPPORTED` vocabulary) is specified in detail and entirely
  unexercised across all 151 records. If audits are expected to run at
  some point, none of this corpus has been through one yet.
- **No `x_`-prefixed extension fields anywhere.** All four prior authors
  and this batch stayed inside the spec's defined field set; no practice
  drift to report there, noted only because ERF-72 clearly anticipated
  it would be needed somewhere and it hasn't been.
- **`created` is uniformly written in one-line flow-mapping style**
  (`created: {timestamp: '...', by: '...'}`) across all 151 atoms, though
  the spec's own worked example in section 4.2 shows it in expanded
  block style. Harmless (YAML flow vs. block style isn't constrained by
  ERF-53/65/66) and completely consistent corpus-wide — flagged only so
  a future diff against the literal spec example doesn't mistake it for
  drift.

## Summary

- New atoms: 33, ids acx-119 through acx-151 (corpus total 118 → 151, no
  id gaps).
- Per-source: 20 atoms across 20 of the 22 `n-` sources (11 sources'
  second atom, 9 sources' third atom); 13 atoms across 13 older
  `bull-`/`bear-` sources (mostly second atoms, plus three third/fourth/
  fifth atoms on the richest captures: J.P. Morgan financing article,
  Oracle Q4 release, Microsoft FY26Q4 call, Amazon/Jassy letter).
- Quality distribution of the 33 new atoms: high 17, medium 16, low 0.
- `as_of_date` present on 27/33, omitted on 6/33: 4 of the 6 (Hogendorn
  2nd, Odlyzko-time 2nd, Odlyzko-railway 2nd, Dominion 3rd) are the
  intentional spec-vs-practice divergence logged above; the other 2
  (Futurum 2nd, J.P. Morgan 4th) omit it for an unrelated, non-divergent
  reason — the source list records no publication date for either
  article, matching the existing sibling atoms on those same sources
  (acx-44; acx-42/78/79).
- Skips: `n-tsmc-q2-2026-presentation` (0 atoms, condensed-table hazard
  confirmed), CoreWeave 3rd atom (thin remaining material), several
  already-mined-out bear- captures spot-checked and left alone.
