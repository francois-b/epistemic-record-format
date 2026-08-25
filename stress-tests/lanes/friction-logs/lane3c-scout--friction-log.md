---
title: "Friction log — lane 3c (neutral/new slice)"
subtitle: "Dated one-liners with requirement ids for unsettled choices"
generated: 2026-08-25
model: claude-fable-5
---

# Friction log

- 2026-08-25 — **ERF-9/ERF-70**: TSMC's actual capex figure only appears as real extractable
  text inside the *presentation* exhibit (99.2), not the press-release exhibit (99.1); the
  official investor-relations landing page's PDF links (`investor.tsmc.com/.../encrypt_file/...`)
  are behind a Cloudflare JS challenge and returned HTTP 403 to a plain fetch. Worked around by
  pulling both exhibits from the SEC 6-K filing instead of TSMC's own site — same content,
  stabler hosting. Flagging in case a future capture attempt hits the same TSMC IR gate and
  wastes time before falling back to EDGAR.

- 2026-08-25 — **ERF-5 vocabulary boundary**: CBRE's own "Global Data Center Trends 2026" /
  "Fast-Growing North American Data Center Market Set Records in 2025" pages are also
  Cloudflare-gated (same `Attention Required!` challenge pattern as TSMC IR). Did not force a
  browser-automation route to get past it; substituted JLL's Midyear 2026 report instead, which
  covers overlapping vacancy/pre-leasing ground with real fetchable text. CBRE's report is not
  represented in this source list at all — a gap, not a `not-redistributable`/`access-restricted`
  entry, since no bytes were ever held to judge a licence against (ERF-5's closed vocabulary
  requires something actually retrieved, or at minimum found, to assess).

- 2026-08-25 — **ERF-71 digest omission judgment call**: `n-fortune-ai-debt-orgy-2026` and
  `n-softbank-openai-followon-2026` and most HTML sources in this list *did* get a stable digest
  (the fetched bytes are recorded, not the live-rendering DOM), so this isn't actually an
  omission case here — noting only that a news CMS page (Fortune) is more likely than a static
  press release to reflow its markup on a later fetch (ads, related-story modules), which would
  change the digest without changing the substance. No action taken; flagging for whoever revisits
  this source that a digest mismatch on re-fetch doesn't necessarily mean the underlying article
  changed.

- 2026-08-25 — **ERF-2 fidelity concern, not yet resolved**: `n-ercot-large-load-tac-report-2026`
  is hosted at a URL path dated `2026/03/12` but its own internal chart captions read "March
  2025" throughout (e.g., "Of the 9042 MW that have received Approval to Energize, ERCOT has
  observed a non-simultaneous monthly peak consumption of 3883 MW in **March 2025**"). A
  WebSearch summary of coverage citing an "April 2026" ERCOT report shows the same 9.0 GW /
  3.9 GW magnitude, which suggests the captions are a stale template artifact rather than the
  data itself being a year old — but this is inference, not confirmation. Recorded the source
  as dated by its URL path (2026-03-12) and transcribed the "March 2025" captions verbatim
  rather than silently correcting them (per ERF-6's verbatim requirement); flagged explicitly
  in both the source's `citation_text` and its capture. Whoever mints atoms from this source
  should treat the vintage as unconfirmed and grade `source_quality`/`limitations` accordingly
  (ERF-14) — this is exactly the kind of capture-fidelity note ERF-14's `limitations` field
  exists for, deferred to atom-minting time since this phase produces no atoms.

- 2026-08-25 — **ERF-5 status boundary, NBER papers**: Following the existing corpus's own
  precedent (`bear-academic-humlum-genai-labor-2025` → `shipped-as-quotation`), all NBER-hosted
  or NBER-adjacent working papers in this slice (Acemoglu w32487, Jones/Stanford-hosted
  w34779) are recorded `shipped-as-quotation` rather than `shipped`, even though NBER's own
  copyright notice ("short sections of text... may be quoted without explicit permission")
  reads more like a fair-use notice than a full grant. Judgment call: treat NBER's own notice
  as confirming the quotation route rather than a broader licence, consistent with the existing
  corpus's treatment of the same publisher.

- 2026-08-25 — **ERF-5/ERF-68 status boundary, Federal Reserve Board papers**: Departed from
  the NBER default above for the two Federal Reserve Board of Governors sources
  (`n-frb-feds-datacenter-investment-2025`, `n-frb-notes-ai-buildout-2026`), marking them
  `shipped` under the same U.S.-Government-Work / 17 U.S.C. §105 rationale the existing corpus
  applied to `bull-bea-gdp-q1-2026`. Verified the authors' affiliation lines read "Federal
  Reserve Board" / "Board of Governors" (not a regional Reserve Bank, which is a separate
  quasi-governmental entity whose copyright status differs) before applying this. Flagging the
  distinction explicitly in case a stricter downstream reviewer wants Board-of-Governors status
  independently re-verified rather than taken on inference from the byline.

- 2026-08-25 — **Provenance chain, arXiv preprint**: `n-chen-abundant-intelligence-deficient-
  demand` is the one source in this slice that is neither a corporate/regulatory primary
  disclosure nor a named-institution (NBER/Fed) academic paper — a single-author, not-yet-peer-
  reviewed arXiv preprint. Kept it (real, on-topic, freely fetchable, and it fills a genuine
  gap — none of the other academic sources model the financial-contagion transmission channel)
  but flagged the `source_quality` concern explicitly in `source-notes.md` rather than silently
  treating it as equivalent to the Fed/NBER sources. Deferred the actual grading call to
  atom-minting time (ERF-9/ERF-10), since this phase mints no atoms.

- 2026-08-25 — **Citation-date precision, Odlyzko "Myth of Internet Time"**: could not confirm
  the essay's original publication venue or exact date from the hosted text or a quick search;
  internal evidence (references to "early 2000" as recent past) places composition ca.
  2000–2001. Recorded `citation_text` with an explicit "date unconfirmed" flag rather than
  asserting a specific venue/date from memory ([house rule] discipline extended to this scout task
  even though it targets the ERF spec, not the operator's own corpus) — a fact a future
  atom-minting pass should verify against a bibliographic database before treating any
  as-of-date claim as settled.

- 2026-08-25 — **Dimension balance**: target was 18–22 sources across five roughly-even
  dimensions; landed at 5/5/5/3/4 (supply chain / power-land / academic / historical-analogy /
  financing) for 22 total. Historical analogy is the thinnest at 3 — both further Odlyzko
  material (railway-mania book chapters exist as separate PDFs on his site) and additional
  academic post-mortems of the fiber overbuild were available but not pulled, to avoid drifting
  past the top of the requested range. Flagging as a place to extend first if this slice is
  ever topped up rather than treating 3 as a considered floor.

- 2026-08-25 — **ERF-6 verbatim discipline, table sources — self-correction**: for two sources
  (`n-tsmc-q2-2026-presentation`'s cash-flow table, `n-skhynix-q2-2026-results`'s headline
  results table) the capture condenses the converter's columnar/pipe-table layout into compact
  inline prose ("2Q26 / 1Q26 / 2Q25: X / Y / Z") rather than preserving the table's original
  row/column structure verbatim. Every number and label is copied exactly from the converted
  text — nothing invented — but the *arrangement* is mine, not the source's. That means a
  future atom's `quote` drawn from these specific spans would be verbatim against my capture,
  not against the source's own phrasing, which is a narrower claim than ERF-1/ERF-6 intend a
  capture to support. Not fixed in this pass (would mean re-deriving both captures from the raw
  converter output); flagging so an atom-minting pass either re-derives these two spans from
  the raw converted table (kept on disk under `_fetch/` outside this deliverable) or treats
  them as a paraphrase-of-a-table rather than a source quotation.
