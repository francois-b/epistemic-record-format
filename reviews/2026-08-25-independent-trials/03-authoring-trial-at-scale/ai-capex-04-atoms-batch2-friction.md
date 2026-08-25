# Batch 2 friction log

One line per guess, re-read, or unsettled choice, dated to today (2026-08-25).
Requirement ids per `SPEC.md`. "Followed prior author" means I matched the
practice visible in `corpus/atoms/acx-1.md`..`acx-29.md` over a stricter or
looser reading of the same spec text.

## Scope / source availability

- 2026-08-25 (ERF-1, ERF-4, ERF-5): Two of the 31 nominally "unused" sources
  have no capture on disk: `bull-bloomberg-ai-bull-run-2026` (status
  `not-redistributable`/bot-gate, per `sources.yaml` reason field) and
  `bear-slok-apollo-ai-bubble-dotcom` (no `path` in `sources.yaml`).
  Confirmed both by reading `sources.yaml` directly rather than assuming from
  the task's source list; treated both as out of scope per ERF-1 ("a capture
  MUST exist before any check runs"). 29 of 31 sources were usable.
- 2026-08-25 (task work order, "1-2 atoms per source"): With exactly 29
  usable sources and a 25-30 target range, I minted exactly one atom per
  source (29 total) rather than choosing which sources deserved a second
  atom. This was a deliberate simplification to avoid an arbitrary
  "which sources get two" judgment call — flagged rather than silently
  decided.

## Id sequence and stamps

- 2026-08-25 (ERF-13, ERF-37): Verified `acx-29` was the highest existing id
  by listing `corpus/atoms/*.md` before minting; continued as `acx-30`
  through `acx-58`. No concurrent-writer risk in this single-session task.
- 2026-08-25 (ERF-65): The spec's own worked example in §4.2 writes an
  *unquoted* `created.timestamp` (`2026-07-19`), but ERF-65 itself says a
  producer SHOULD quote timestamps regardless (to dodge the YAML 1.1
  timestamp-type hazard). The prior author's 29 atoms all quote the
  timestamp as a string (`'2026-08-25'`). I followed the prior author (and
  the letter of ERF-65) over the spec's own inconsistent illustration.

## `limitations` field scope

- 2026-08-25 (§4.2 guidance vs. house practice): The prose guidance reads
  "Where `source_quality` is `medium` or `low`, put the reason in
  `limitations`," which could be read as *only* required at medium/low.
  The prior author also attaches `limitations` to several `high`-quality
  atoms for scope caveats (e.g. `acx-2`, `acx-6`, `acx-11`), consistent with
  ERF-14's broader definition ("caveat about the evidence, whether that is
  chain quality, a capture block, a scope warning..."). I followed the
  broader practice: several of my `high`-quality atoms (`acx-30`, `acx-32`,
  `acx-33`, `acx-35`, `acx-37`, `acx-43`) carry `limitations` for scope
  caveats even though not strictly required by the narrower reading.

## `source_quality` judgment calls (genuinely unsettled, flagging each)

- 2026-08-25 (ERF-9): `bear-doomberg-ai-capex-critique` (acx-53) graded
  `low`. Doomberg is a well-followed newsletter brand but publishes under a
  pseudonym with no disclosed individual identity — ERF-9's table names
  "anonymous... unaccountable" as `low` without a reputation exception. This
  is a defensible but not unique reading; a "known brand, unknown author"
  attester sits in a gap the vocabulary doesn't resolve.
- 2026-08-25 (ERF-9, ERF-10): `bear-marcus-ai-bubble` (acx-46) graded
  `medium` rather than `low`, on the reasoning that Marcus is an identified,
  accountable named critic and the specific figures quoted (Oracle's market
  cap, its ~50% weekly move) are independently checkable public market data,
  even though the passage is wrapped in argued opinion ("bonkers"). This
  contrasts with the prior author's `low` grade on two Zitron atoms
  (`acx-22`, `acx-23`) for relayed/unsupported figures from the same kind of
  independent-newsletter attester — the distinguishing factor I used was
  whether the specific figure is independently checkable, not just whether
  the writer is identified. Flagging because a stricter reader might grade
  all independent-newsletter commentary uniformly.
- 2026-08-25 (ERF-9): `bull-googl-earnings-call-2026q2` (acx-31) graded
  `high`, matching the prior author's precedent for Microsoft's Amy Hood
  earnings-call remarks (`acx-3`, `acx-4`) — spoken CFO remarks on an
  officially furnished (8-K-adjacent) earnings call, treated as an
  accountable regulatory-adjacent disclosure rather than as interested
  first-party commentary. Followed prior practice over a stricter reading
  that might grade all spoken remarks `medium`.
- 2026-08-25 (ERF-9): Private market-research vendors (`bear-synergy-
  hyperscale-capex-2025`, `bear-delloro-datacenter-capex-forecast-2025`)
  graded `medium`, not `high`, on the reasoning that they are commercial
  data vendors compiling their own estimates for sale, not a regulator,
  court filing, or public-interest institution — contrasted with the prior
  author's `high` grade for IEA (`acx-26`-`acx-28`, an intergovernmental
  agency) and my own `high` grade for the NBER/Humlum paper (`acx-58`, an
  academic study). ERF-9's `high` band literally includes "a named study
  reporting its own data" without excluding commercial vendors, so this is
  a line I drew rather than one the spec draws explicitly.
- 2026-08-25 (ERF-9): Consultancies (`bear-mckinsey-cost-of-compute-2025`,
  `bear-bain-tech-report-2025`) graded `medium` as interested parties
  forecasting the market they sell advisory services into, same treatment
  as `bull-futurum-ai-capex-2026` and `bull-jpmorgan-ai-infrastructure-
  financing`, whose own capture files carry an inline HTML-comment note
  pre-judging them `medium` per ERF-9 (see next item).
- 2026-08-25 (ERF-9, §4.1 source neutrality): Two capture files
  (`bull-jpmorgan-ai-infrastructure-financing.md`,
  `bull-futurum-ai-capex-2026.md`) contain an editorial `source_quality`
  recommendation embedded in their provenance comment header — unusual,
  since §4.1 frames a capture as a neutral copy of the source, not a place
  to pre-judge grading. I did not edit the captures (out of scope per
  instructions) and made my own independent ERF-9 assessment; it happened
  to agree with the embedded note in both cases, which I note as a
  coincidence worth flagging rather than treating the note as authoritative.
- 2026-08-25 (ERF-9, ERF-70): `bear-kedrosky-ai-capex-critique` (acx-47) is
  a two-hop capture: Kedrosky's original post is paywalled, and the capture
  reproduces his text in full via a third party's curation page. Graded
  `medium` on the combination of (a) it is Kedrosky's own disclosed-
  methodology estimate, first-person, not a relayed paraphrase, but (b) the
  capture itself is once removed from the primary artifact. A stricter
  reading might downgrade to `low` purely for the relay path regardless of
  whose words are reproduced.

## Quote fidelity (caught by the self-check)

- 2026-08-25 (ERF-6, ERF-51, task instruction "do not invent or append
  punctuation"): Built `normalize_check.py`, a from-scratch implementation
  of the ERF-51 normalization sequence (markup-unwrap steps a-f, then steps
  1-11), and ran every proposed quote against its capture before writing
  any atom file. It caught two real defects: `acx-38` (Broadcom) originally
  ended a quote span with an invented period where the source actually has
  a comma before the closing attribution ("...AI networking,\" said Hock
  Tan"); `acx-55` (Bain) originally ended a quote span with an invented
  period where the source continues "...fund the full investment (see
  Figure 2)." Both fixed to end exactly where the capture's punctuation
  allows, per the task's explicit instruction. This self-check is advisory
  (not a substitute for a real conformant validator) — it implements the
  prose reading of ERF-51, not the normative conformance-case files
  (`conformance/cases/normalization.txt`, `conformance/cases/quote-check.
  yaml`), which are not present in this working directory to test against.
- 2026-08-25 (ERF-52): `bull-nvda-openai-ports-pike-2026` (acx-36) quote is
  drawn from an unattributed markdown bullet list; excluded the leading
  "- " bullet marker from the extracted span (not part of the sentence
  itself) and verified the remaining span still matches the capture
  verbatim under normalization.
- 2026-08-25 (ERF-6): `bear-doomberg-ai-capex-critique` (acx-53) contains no
  dollar/percentage/gigawatt figures anywhere in its free-preview excerpt
  (the piece continues behind a paywall) — could not satisfy the "prefer
  quotes carrying figures" guidance for this source. Minted a qualitative-
  argument atom instead, consistent with the prior author's precedent
  (`acx-17`, also figure-free).

## Dates

- 2026-08-25 (ERF-14): `bull-jpmorgan-ai-infrastructure-financing` (acx-42)
  and `bull-futurum-ai-capex-2026` (acx-44) omit `as_of_date`: neither
  `sources.yaml`'s `citation_text`/`citation` nor the capture's own body
  text states a publication date, and I did not want to guess one from the
  `fetched_date` (which records when *I* retrieved the page, not when the
  fact was stated). Flagged the gap in `limitations` instead of guessing.
- 2026-08-25 (ERF-14): For several forward-looking projections (e.g.
  `bear-mckinsey-cost-of-compute-2025`'s 2030 forecast, acx-54), I set
  `as_of_date` to the report's own publication date rather than the
  projection's target year, matching the prior author's precedent on
  `acx-28` (IEA's 2030 projection dated to the report's 2025-04-10 release).
