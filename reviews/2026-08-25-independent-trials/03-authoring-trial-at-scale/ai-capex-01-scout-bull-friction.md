# Friction log — Lane 3a (capex bull + primary financial records)

Dated one-liner per guess or unsettled choice while applying the ERF spec
(v0.9.0 draft), with the requirement id it bears on. First-class deliverable
per task instructions.

- 2026-08-24, ERF-68: no SPDX identifier precisely names "U.S. SEC public
  filing, public-record disclosure." SPDX has no "US-Public-Domain" entry
  (it covers copyright licences, not the separate question of whether a
  private company's SEC filing is freely redistributable). Followed the
  task's explicit operator instruction ("US SEC filings and US-government
  material are public domain, they ship") and left `licence` unset while
  writing `licence_name` as prose per ERF-68's "where no identifier
  applies, prose alone is correct." Flagging because this is a real
  doctrinal simplification: an SEC filing's *prose* (MD&A discussion, risk
  factors) is authored by the company and is not a U.S. government work
  under 17 U.S.C. Section 105; only actual government-authored material
  (BEA, Fed, White House) is statutory public domain. The instruction's
  "public domain" framing is treated here as an operator-level
  redistribution policy call for this corpus, not a copyright-law
  conclusion; a future auditor should read `licence_name` on each
  SEC-filing source as recording that policy call, not a legal fact.
- 2026-08-24, ERF-68: by contrast, `bull-bea-gdp-q1-2026` genuinely is a
  U.S. government work (BEA staff, official duties), so its `licence_name`
  states the 17 U.S.C. Section 105 basis as a legal fact rather than an
  operator policy call. Company-authored press releases and blog posts
  (earnings releases, Anthropic/OpenAI/NVIDIA newsroom posts, Zuckerberg's
  and Jassy's letters, Altman's blog) were NOT extended the "public domain"
  treatment even though freely accessible: unlike an SEC filing there is no
  statutory public-disclosure mandate that would supply a licence basis, so
  these carry `status: shipped-as-quotation` (no licence field) rather than
  `shipped`. This is the line drawn between the two "freely posted by the
  company" categories in this corpus.
- 2026-08-24, ERF-4/ERF-5: the spec's closed absence-vocabulary is
  `not-redistributable`, `access-restricted`, `licence-unverified`. For
  `bull-bloomberg-ai-bull-run-2026`, the fetch returned a bot-check/access
  gate rather than the article text: treated that as `access-restricted`
  (an accepted term of access blocks reading itself, ERF-5's second
  category) rather than `not-redistributable` (copyright permits reading
  but not republication), since here the reading step itself was blocked,
  not just the republication step.
- 2026-08-24, ERF-69/excerpt sizing: the task's quality bar asks for
  100-400 word excerpts; several SEC-filing captures below run longer
  (multiple passages: risk factors plus MD&A plus a data table) because a
  single 100-400-word excerpt could not hold both the capex figures and
  the demand narrative that later atoms will need adjacent context for.
  Read ERF-69's "enough adjacent text for the passage's place in the
  source to be legible" as the binding constraint over the task's
  word-count guidance where the two point in different directions;
  multi-passage captures are still `excerpt: true` since none is the whole
  filing.
- 2026-08-24, ERF-7: two sources (`bull-nvda-openai-10gw-partnership-2026`,
  `bull-nvda-msft-anthropic-partnership-2026`) carry no publication date
  visible on the fetched page itself. `citation_text` and source-notes.md
  flag this rather than guessing a date; `as_of_date` on any atom minted
  from them should be set from external corroboration (both are widely
  reported deals), not invented from the fetch date. Likewise
  `bull-futurum-ai-capex-2026` and `bull-jpmorgan-ai-infrastructure-
  financing` carry no visible byline date; internal textual clues (a
  reference to "the first weeks of 2026" earnings for Futurum, a "June
  2026" financing described as recent for J.P. Morgan) suggest
  approximate publication windows but are not treated as confirmed dates.
- 2026-08-24, ERF-9 (guidance only, not this task's job): flagging for
  whoever mints atoms next that `bull-jpmorgan-ai-infrastructure-financing`
  and `bull-futurum-ai-capex-2026` are interested/intermediary attesters
  under ERF-9's table (an analyst house and a bank both describing deal
  flow they participated in or cover professionally), which the guidance
  suggests should land at `medium`, not `high`, even though the individual
  facts they report (loan sizes, pricing, aggregate capex estimates) are
  independently checkable. Not this task's call to make, since atoms are
  out of scope, but recording the read here so it does not have to be
  re-derived.
- 2026-08-24, house style in the operating environment (not an ERF requirement): applied its
  banned-phrase list and its em-dash-in-running-prose ban to this task's own authored text
  (friction-log.md, source-notes.md, and the prose fields in sources.yaml such as
  `licence_name`/`reason`). Did NOT alter em dashes that occur inside verbatim
  `quote`-equivalent text captured from a source (for example the Huang/Altman/Jassy quotes,
  or Zuckerberg's letter): ERF-6 requires a quote to be verbatim from the capture, and
  normalizing a source's own typographic choices out of the captured text would be a
  fidelity violation, not a style fix. The house rule binds this task's own voice, not the
  sources it is transcribing.
- 2026-08-24, task scope / SEC filing size: SEC 10-K/10-Q filings run
  several MB of HTML; captured only the capex/demand-relevant passages
  (risk factors, MD&A capex discussion, cash-flow-statement line items)
  rather than the whole filing, even though `status: shipped` would permit
  shipping the whole document. Chose to keep captures scoped to what later
  atoms are likely to quote, per the task instruction ("passages most
  likely to be quoted later... plus adjacent context"), and marked
  `excerpt: true` accordingly; a future pass could ship the full filing if
  a different passage is needed later; this is one deliberate incomplete-
  capture choice, not an oversight, but is logged since it departs from
  the maximal-permission option ERF-68's status would allow.
- 2026-08-24, ERF-71 (digest): omitted `fetched.digest` for
  `bull-bloomberg-ai-bull-run-2026` since no stable article bytes were
  held (only a bot-check page was retrieved, and its bytes are not the
  source's bytes); per ERF-71's closing sentence, a source that cannot be
  pinned simply carries no digest, which itself tells a reader what kind
  of source it was.
