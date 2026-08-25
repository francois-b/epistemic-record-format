---
title: "Friction log — batch 4 (author, n- source slice)"
subtitle: "Dated one-liners with requirement ids for unsettled choices; divergences from prior authors' practice"
generated: 2026-08-25
model: claude-sonnet-5
---

# Friction log

- 2026-08-25 — **ERF-6/scout-flagged condensation: skipped `n-tsmc-q2-2026-presentation`
  entirely.** The scout's log flags this capture's cash-flow table (and the "Selected Items from
  Statements of Comprehensive Income" table above it, same "X vs Y vs Z" condensation pattern
  though not separately named) as the converter's columnar layout compressed into inline prose by
  the capture author, not the source's own phrasing. The one paragraph in the capture that reads
  as ordinary prose ("3Q26 Guidance... Future Outlook...") sits directly beneath the flagged
  tables with no visual/structural separation in the capture, so I could not be confident it
  escaped the same condensation. Rather than gamble on a "verbatim" quote from an ambiguous span,
  I minted zero atoms from this source and covered TSMC's Q2 actuals and Q3 guidance instead from
  the sibling source `n-tsmc-q2-2026-earnings-release` (Exhibit 99.1), whose capture is
  unambiguous prose throughout. Every other flagged span (`n-skhynix-q2-2026-results`'s bracketed
  `[Q2 2025: Revenue of ... Q1 2026: Revenue of ...]` aside) was avoided by quoting only the
  unbracketed lead sentence and later prose paragraphs of that same capture, which are ordinary
  press-release prose, not table condensation.

- 2026-08-25 — **ERF-6, general bracket caution beyond the two flagged spans.** Several other
  n- captures use square brackets for the capture author's own editorial insertions distinct from
  the standard `[...]` omission marker: `n-constellation-crane-tmi-restart-2024` completes
  fragmentary slide bullets with inserted words ("run until [at least 2054]", "[to restart the
  plant]", "[Timeline:]"); `n-ercot-large-load-tac-report-2026` and
  `n-frb-notes-ai-buildout-2026` carry `[NOTE: ...]` / `[Note 1: ...]` capture-author or
  source-footnote annotations. Treated all such bracketed spans as non-verbatim (not sourced from
  the document's own running text as captured) and quoted only around them. This was not flagged
  by the scout's log as a condensation concern, so it is a divergence I'm making for this batch on
  my own judgment under the general ERF-6 verbatim requirement — flagging in case a future author
  reads these brackets more permissively.

- 2026-08-25 — **ERF-14, ERCOT date discrepancy carried into `limitations`, not resolved.** Per
  task instruction, quoted the "March 2025" chart captions from `n-ercot-large-load-tac-report-2026`
  verbatim (9,042 MW / 3,883 MW / 3,801 MW) in acx-101, set `as_of_date: '2025-03'` to match what
  the quote itself states, and put the URL-path-vs-caption discrepancy (2026-03-12 posting date)
  in `limitations` rather than picking a side. This is a straightforward application of ERF-14 and
  ERF-6 together, not really a divergence, but flagging since it's the highest-friction single
  decision in the batch.

- 2026-08-25 — **ERF-9 grading, house practice vs. mechanical first-party discount.** Existing
  atoms (acx-1..87) grade a reporting company's *own* earnings-release/earnings-call disclosure of
  its own actuals and forward guidance as `high` throughout (e.g. acx-32/33 Meta capex guidance,
  acx-63 Oracle's own debt-raise figure, acx-70 Google's own cloud-backlog figure) — even though
  ERF-9's table reads "vendor's claim about its own product" as the textbook `medium` case. Prior
  authors evidently read a company's disclosure of its *own reported financial actuals and
  guidance* as accountable (SEC/exchange disclosure regime, executive certification, securities
  fraud exposure) rather than as an "interested vendor claim," reserving `medium` for
  forward-looking *partnership/deal announcements* with promotional framing (acx-13
  NVIDIA-OpenAI LOI, acx-40 Anthropic-Amazon compute) instead. I followed this house line, not the
  more mechanical spec-table reading, for all five supply-chain quarterly-results sources (TSMC,
  ASML, Samsung, SK hynix, CoreWeave) — grading them `high`. Two calls in this same family where I
  departed toward `medium` despite a completed/quantified transaction: `n-constellation-crane-tmi-restart-2024`
  (an investor presentation with explicit marketing language — "the most valuable commodity in the
  world" — about a plant not yet restarted) and `n-dominion-pjm-load-forecast-2026` (a utility's
  own interested submission advocating for its preferred load-forecast adjustment, closer to
  acx-78/79's "interested first party characterizing its own commentary" pattern than to a
  reported-actuals disclosure). Flagging this whole cluster as the most judgment-heavy grading
  decision in the batch; a stricter reviewer applying ERF-9's table literally might downgrade all
  five "high" supply-chain sources to `medium`.

- 2026-08-25 — **ERF-9/ERF-10, neutral-market-administrator grading.** Graded PJM's capacity
  auction results release and ERCOT's Large Load report `high` on the theory that a FERC/PUCT-
  overseen grid operator/RTO reporting its own auction clearing prices or interconnection-queue
  data is functionally closer to "a regulator... disclosure made under legal or regulatory
  accountability" than to a commercial vendor's product claim, even though PJM and ERCOT are
  technically private nonprofit corporations, not government agencies. No existing atom in the
  corpus cites a grid-operator source, so there was no house precedent to follow here; this is a
  fresh call, flagged for review.

- 2026-08-25 — **ERF-9/ERF-10, per the task's explicit steer, graded both Federal Reserve Board
  papers `high`** (FEDS working paper and FEDS Notes) as named studies by government economists
  reporting their own model/data, consistent with the existing corpus's treatment of
  `bull-bea-gdp-q1-2026` (also a U.S. government economic release, `high`) and the two NBER papers
  (Acemoglu, Jones), also graded `high` as named academic studies. Graded the one non-NBER,
  non-Fed academic source in the slice, `n-chen-abundant-intelligence-deficient-demand`
  (single-author, non-peer-reviewed arXiv preprint, flagged for a quality concern in the scout's
  own log), `medium` rather than `high` — the one place in "academic economics" where I departed
  from the high-grade pattern, with the reason stated in the atom's `limitations`.

- 2026-08-25 — **ERF-10, relayed-estimate downgrade inside an otherwise-high source.**
  `n-jones-ai-economic-future` is graded `high` overall (a named NBER/Stanford study), but the one
  atom quoting Jones's *relay* of Epoch AI's effective-compute growth-rate estimate (acx-110) is
  graded `medium` and flagged as a one-hop relay in `limitations`, distinct from the atom quoting
  Jones's own "weak-link" argument (acx-109, `high`). This is the same "two atoms may legitimately
  grade one source differently" case the spec itself walks through in section 4.2 for the
  first-hand-vs-relayed distinction on a single document (ERF-9).

- 2026-08-25 — **ERF-9, trade-press relay.** `n-fortune-ai-debt-orgy-2026` graded `medium`
  throughout (both atoms) as the textbook "identifiable intermediary reporting someone else's
  fact" case from ERF-9's own table — a journalist relaying S&P Global's, Nikkei's, and Moody's
  separate figures without independently verifying any of them. Not a divergence; flagging only
  because it is the cleanest application of the table in this batch.

- 2026-08-25 — **Dimension coverage.** All 22 `n-` sources have a capture on disk; 21 of 22 are
  represented in this batch (the skipped one, `n-tsmc-q2-2026-presentation`, is logged above with
  reason). Per-dimension atom counts: supply chain 9 (5 sources), power/land 9 (6 sources),
  academic economics 7 (5 sources), historical analogy 3 (3 sources), financing structure 3
  (2 sources) — 31 atoms total, ids acx-88 through acx-118.

- 2026-08-25 — **Self-check method.** Every quote was verified against its capture with a script
  implementing the ERF-51 normalization sequence in full (markup-unwrapping steps a-f, then the
  11 numbered steps, split-on-`[...]` before normalization per ERF-52), run against the raw
  capture files on disk. One mismatch was caught and fixed this way (acx-112 originally read "we
  expect" where the capture reads "We also expect" — a transcription slip during drafting, not a
  capture-fidelity issue). All 31 atoms pass after the fix.
