generated: 2026-08-25
model: claude-sonnet-5

# Batch 3 friction log — depth pass, acx-59..acx-87

Author's working notes while minting 29 second/third atoms from already-captured
sources (`corpus/atoms/acx-59.md` through `acx-87.md`). Dated one-liners first,
then the two prior authors' practice divergences I noticed and which one I
followed, per requirement id.

## Dated notes

- 2026-08-25 — Read SPEC.md §4.1, §4.2, §5, §6 (ERF-6..ERF-14, ERF-50..ERF-52),
  §7 before touching a file. Read all 58 existing atoms' `source:`/`quote:`
  fields (not full prose) to map which spans of which captures were already
  quoted, per the work order's "read existing atoms citing that source first."
- 2026-08-25 — Ranked captures by byte size; the task's named "richest
  captures" list and my own size ranking mostly agreed (SEC filings, earnings
  releases/calls, JPMorgan piece), so worked that list directly rather than
  re-deriving a ranking.
- 2026-08-25 — Wrote a small normalization script implementing ERF-51's
  ordered sequence (unwrapping steps a-f, then steps 1-11) plus ERF-52's
  `[...]`-split-before-normalize rule, and ran all 29 quotes against their
  captures before finalizing. All 29 passed on the first full run; two
  quotes (acx-83, acx-87) required leaving out capture-supplied trailing
  punctuation/omission markers rather than adding my own, per the
  don't-invent-punctuation instruction (see ERF-6/ERF-52 note below).
- 2026-08-25 — Cross-checked all 29 new quotes against each other and against
  all 58 existing quotes for substring overlap (same source, one quote
  contained in another); zero overlaps found. Also checked deployment-wide id
  uniqueness (ERF-36/ERF-37): 87 unique ids, no collisions.
- 2026-08-25 — Skipped further mining of `bull-nvda-openai-10gw-partnership-2026`
  (already 2 atoms, acx-13/14, covering the deployment size, the $100B
  investment, and the H2-2026 timing; remaining text is CEO/founder quotes
  duplicative in substance of what acx-13 already states) and of
  `bear-goldman-ai-bubble-debate-2025` (already 1 atom, acx-45; capture is
  short, 1448 bytes, and the remaining dialogue is framing/back-and-forth
  without a new checkable figure) to stay inside a 25-30 atom budget while
  covering breadth across sources. Logging as skips per the work order.
- 2026-08-25 — Also declined a second `bear-covello-goldman-too-much-spend-2024`
  atom beyond the one taken (acx-80): the only remaining un-quoted material
  is the Amazon/Barnes & Noble internet-analogy paragraph, which is
  illustrative scene-setting rather than a checkable finding distinct in
  substance from acx-16/17/80's "AI is expensive, must solve big problems"
  thread.

## Divergences between the two prior authors' practice (and what I followed)

1. **`as_of_date` on a period-actual disclosed inside a press release vs. a
   10-Q/10-K.** One author (acx-1, acx-5, acx-6, acx-30, acx-35, acx-37) dated
   period-actual figures to the fiscal period-end date. The other, or the same
   author on different sources, dated Oracle's press-release figures (acx-7,
   acx-8) to the press-release date, and Meta's 10-Q *guidance* sentence
   (acx-32) to the *filing* date rather than the period end, while Meta's
   press-release *actual* (acx-33) got the press-release date. So there are
   two live conventions: "date the underlying fact is true of" (period end)
   vs. "date the document said it" (filing/press-release date). ERF-14 reads
   as licensing the former ("the date the fact is true of"), but the corpus
   in practice uses the latter whenever the vehicle is a press release. I
   followed the **period-end convention for SEC-filing actuals** (acx-59,
   64, 67, 68, 69, 71, 74, 77 all use period/fiscal-year end) and the
   **press-release/statement-date convention only where the release date and
   the period covered diverge enough to matter, or where the quote is itself
   forward guidance** (acx-63, ORCL's FY26 financing action, dated to the
   FY26 close 2026-05-31 since the quote is scoped "in fiscal year 2026,"
   not to the 2026-06-10 release date — diverging slightly from the acx-7/8
   press-release-date precedent, on the reasoning that ERF-14 governs and the
   quote's own scoping is unambiguous). Flagging this as a spec-vs-practice
   gap worth an explicit house rule rather than leaving it implicit.
2. **`source_quality` for a company's own forward guidance stated on an
   earnings call vs. in a filing.** acx-4 (MSFT call, FY27 capex guidance)
   is graded `high`; acx-32/33 (Meta 10-Q/press-release, FY26 capex
   guidance) are also `high`. This is a real house convention — official
   company guidance, even though not yet realized, is graded on the
   accountability of the attester (a public company's own disclosed
   guidance) rather than downgraded for being forward-looking — and I
   followed it (acx-59, 60, 61, 62, 63, 64, 67, 68, 69, 70, 71, 72, 74, 77,
   84, 85 all graded `high` for company/institutional disclosures including
   forward statements). I did NOT extend this to Jassy's shareholder letter
   (medium, matching the existing acx-9/10 grade for that source) or to the
   Zuckerberg letter (medium, matching acx-34) — a promotional open letter
   reads differently from a 10-Q/10-K/earnings-release/call transcript even
   from the same speaker's company, and the existing atoms already drew that
   line, so I preserved it rather than re-litigating it.
3. **Grading the same source at different tiers for different findings.**
   acx-21 (medium) and acx-22 (low) both cite
   `bear-zitron-haters-guide-ai-bubble`; acx-16/17 both cite Covello at
   medium. The spec (ERF-9's closing sentence) explicitly licenses this: "two
   atoms may legitimately grade one source differently." I used it for
   acx-65/66 (Jassy letter: medium for Amazon's own reported FCF figures,
   low for a "reportedly" third-party revenue figure about OpenAI/Anthropic
   that Jassy himself hedges) and for acx-86 (Cahn, medium, matching the
   source's existing medium grade rather than downgrading to low, since it
   is Cahn's own definitional framing of his own metric, not a relayed
   third-party number).
4. **Whether a `limitations` field appears on a `high`-graded atom.** Some
   `high` atoms carry `limitations` (acx-30, acx-32, acx-33, acx-35, acx-37);
   others don't (acx-1, acx-5, acx-6, acx-8, acx-11, acx-12). Spec text
   (§4.2, "Where `source_quality` is medium or low, put the reason in
   limitations") only mandates it below `high`. I followed the looser
   practice: added `limitations` on `high` atoms only where there was a
   genuine caveat worth recording (e.g., acx-72's cost figure includes
   one-time legal/severance charges; acx-68's capex figure isn't split
   AI-vs-fulfillment), and omitted it on `high` atoms that are clean,
   self-contained figures (acx-63, acx-64, acx-67, acx-69, acx-74, acx-77,
   acx-84, acx-85).
5. **Table-row quotes.** acx-1 quotes a raw markdown table row verbatim
   (`| Additions to property and equipment | (115,948) | (64,551) |
  (44,477) |`) rather than paraphrasing it into prose. I followed this for
   three atoms drawn from tabular cash-flow-statement data where the row
   itself, not surrounding prose, was the only unquoted content left in the
   capture (acx-59 depreciation row, acx-71 Meta P&E row, acx-74 NVIDIA Data
   Center segment row).

## Requirement ids most in play

- ERF-6 / ERF-52 — verbatim quoting, `[...]` only as the literal marker,
  spans matched in order. Two quotes (acx-83, acx-87) required stopping
  exactly where the capture's own text stopped, without adding a period the
  capture doesn't have there (IEA's "...2035 TWh by 2035" quote ends cleanly;
  Cahn's followup essay quote ends at "years)" where the capture itself
  continues with its own `[...]` excerpt marker, which I did not fold into
  my quote since it's the capture author's mark, not mine).
- ERF-9 / ERF-10 — source_quality graded per finding, not per source; see
  divergence #3 above.
- ERF-14 — `as_of_date` is the date the fact is true of; see divergence #1.
- ERF-50 / ERF-51 — mechanical quote check implemented locally and run
  against all 29 quotes before finalizing; all passed.
- ERF-13 / ERF-36 / ERF-37 — id sequence continued from acx-58 with no gaps
  or collisions (acx-59..acx-87), checked against the full 87-atom
  deployment.

## Not done / explicitly out of scope this batch

- `finding_audit` left absent on all 29 atoms (per task instruction).
- No edits to `sources.yaml`, `corpus.yaml`, `captures/`, or atoms acx-1
  through acx-58.
- No claims, surveys, or narratives minted.
