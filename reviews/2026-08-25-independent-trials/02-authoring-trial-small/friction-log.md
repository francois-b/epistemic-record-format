# Friction log

Dated one-liners for every guess, re-read, or unsettled choice made while
authoring `corpus/` to `SPEC.md`. Newest at bottom, in the order hit while
building. Every entry names the requirement id it turns on.

- 2026-08-25 -- ERF-3 ("one entry per work"). The Jefferson Notes-on-Virginia
  PDF needed two different extraction methods for different pages: clean
  embedded-text prose (pp. 59-85) vs. an image-only fold-out table (p. 51)
  with zero embedded OCR words. The `Source` shape has exactly one
  `converter` field, and ERF-3 says "one entry per work," which reads as
  forbidding a second source entry for the same book. Resolved by keeping
  one source entry, disclosing the split explicitly inside the capture body,
  and setting `converter.deterministic: false` for the whole entry (the
  weaker method governs the whole claim of reproducibility). Not sure this
  is the intended reading; the spec is silent on a document that needs two
  converters for two regions of itself.

- 2026-08-25 -- ERF-70. Almost shipped the founders.archives.gov letter
  capture with no `converter` field at all, on the assumption that a "web
  page" capture is just text. Re-read ERF-51's closing paragraph, which
  explicitly lists "a PDF, a web page, or an EPUB" together as needing a
  named, versioned converter under ERF-70. Added `converter.tool:
  "claude-in-chrome MCP tool get_page_text"` and `deterministic: false`.

- 2026-08-25 -- ERF-70 ("the tool and its exact version"). The Chrome
  extension/MCP tool used to extract the letter's page text does not expose
  a version string to the calling agent. Recorded the tool by name and
  noted the missing version explicitly in `sources.yaml` rather than
  inventing one. Unsettled: the spec assumes an exact version is always
  obtainable; it sometimes is not, for an interactive tool rather than a
  pinned library.

- 2026-08-25 -- ERF-70, same requirement, different question: naming depth.
  Recorded the deterministic PDF converter as "pymupdf4llm 0.3.4 (PyMuPDF
  1.28.2)" -- both the wrapper's version and its underlying rendering
  library's version -- because pymupdf4llm's markdown output depends on
  PyMuPDF's own text-extraction and layout behavior. The spec says "the
  tool and its exact version" without saying whether that means the
  top-level invoked tool alone or the whole dependency chain that can
  affect output. Chose to over-disclose rather than under-disclose.

- 2026-08-25 -- ERF-51 step 7 vs. a real PDF-extraction artifact. Buffon's
  capture contains "...origin from [the Old ][Con- ]\ntinent." -- a hyphen
  followed by a SPACE and then a newline, not a hyphen immediately followed
  by a newline. Step 7 as written ("a hyphen followed by a newline") does
  not fire on this, so per a literal reading the pair does not rejoin into
  "Continent"; it instead becomes "Con-tinent" once step 10 (dash-spacing
  unification) runs. Verified this by implementing the ERF-51 pipeline
  myself and running it against the actual capture (`_dl/normalize.py` in
  the working tree, not shipped as part of the corpus). Resolved by
  shortening the `bjd-001` quote to end before this word rather than guess
  which reading a real validator would take.

- 2026-08-25 -- ERF-51 steps 10/11 vs. a spurious OCR line-lead hyphen. A
  different Buffon line reads "...common\n - to both continents..." -- an
  OCR-inserted hyphen at the start of a wrapped line that is not a
  word-break at all. Whitespace collapse (step 11) plus dash-spacing
  unification (step 10) silently glue this into "common-to," which broke a
  longer candidate quote for `bjd-003`. Found only by testing the exact
  candidate string against the real capture, not by reading the prose
  passively. Resolved by shortening/splitting the quote rather than
  reporting a bug -- this is very plausibly the pipeline doing exactly what
  ERF-51 specifies; it is a genuinely surprising interaction, not
  necessarily a defect.

- 2026-08-25 -- ERF-51 ("Case MUST NOT be folded"), a near-miss. A first
  draft of the `bjd-004` mammoth quote opened with lowercase "the skeleton,"
  which failed the check because the capture has "The\nskeleton" (capital
  T at end of one line, the word continuing lowercase on the next). Fixed
  by capitalizing "The" to match. Worth naming because it is exactly the
  kind of failure that is invisible on a silent read of a quote and only
  surfaces by actually running the check -- which is the whole point of the
  task's framing that the quote-check machinery "cannot be satisfied from
  memory, only from captures you actually fetched."

- 2026-08-25 -- ERF-6 / ERF-52, a genuine `[...]` use. Jefferson's Notes
  capture has "a hog J weigh 1,050" where "J" is an OCR misread of a
  footnote reference mark (a dagger or similar), not a letter. Used
  `[...]` to elide it: "I have seen a hog [...] weigh 1,050 ft...". This
  felt like the intended use of the omission marker (eliding apparatus
  that is not part of the sentence being quoted) rather than a workaround,
  but flagging it because it was a live judgment call, not an obvious one.

- 2026-08-25 -- ERF-14 (`as_of_date`), reversed a decision. First draft of
  `bjd-002` (the tapir/donkey/elephant comparison) carried
  `as_of_date: "1792"`, reasoning that the finding needed some date. On
  re-reading ERF-14 ("the date the FACT is true of... dated statistics
  carry it and timeless statements omit it"), a textual claim about what a
  book asserts is not a dated statistic the way a bullock's slaughter
  weight is; removed the field. Kept `as_of_date` on the two letter atoms
  (`bjd-008`, `bjd-009`), where the fact ("Jefferson sent these specimens
  on this date") really is dated.

- 2026-08-25 -- `prior_survey`, optional-field convention. First draft of
  the survey wrote `prior_survey: null` out of habit. Section 3's own rule
  ("optional fields assert existence when present") plus ERF-55/56's
  omit-when-absent convention for lists argues the same pattern should
  hold for an absent optional scalar: omit, don't null. Removed the line.

- 2026-08-25 -- ERF-34, the sharpest tension found in the whole exercise.
  The narrative's lead-in prose states a narrative "is prose, authored by a
  person and never generated" -- but this sits in section 4's non-numbered
  guidance ("advice and binds nothing" per section 4's own preamble), and
  the task asked an LLM (me) to write it. I wrote the prose anyway, since
  the guidance is explicitly non-binding and the deliverable exists to
  exercise the narrative-binding machinery. I did set the narrative's
  `created.by` to `human:francois-bouet` rather than `agent/claude-sonnet-5`
  -- an attribution choice, not a technical requirement (narratives sit
  outside the record data model entirely, so `created`'s shape for a
  narrative is itself unspecified) -- to keep the artifact's stated
  authorship consistent with what the spec's own framing expects of the
  record class, while disclosing here that an LLM drafted the actual text.
  See `authoring-notes.md` for the fuller discussion; this is the one
  finding I would most want a human reader of this log to see.

- 2026-08-25 -- ERF-31, anchor vs. markdown soft-wrapping. First draft of
  the narrative hand-wrapped prose at roughly 80 columns; one anchor phrase
  ("no bigger than a donkey where the elephant held the equivalent rank")
  landed across a line-wrap, so the literal string was not a substring of
  the raw file even though it reads as one continuous phrase in any
  rendered view. ERF-31 requires the anchor to be "a verbatim substring of
  the passage" and never says whether that check runs against raw source
  bytes or against soft-line-reflowed text. Resolved practically by
  rewriting each narrative paragraph as one unwrapped line, which makes the
  question moot for this corpus but does not answer it for the format.

- 2026-08-25 -- ERF-9/ERF-10, applied deliberately rather than by default.
  Every atom in this corpus is graded `high`, which could look like lazy
  defaulting. It is not: every finding here is explicitly about what a
  captured primary text itself asserts (Buffon's or Jefferson's own words),
  which is exactly the ERF-10 carve-out ("a finding whose subject IS
  discourse itself... a captured identified utterance is direct and
  accountable"). A finding about the real-world zoological facts these
  authors describe (rather than about what they wrote) would likely grade
  differently; this corpus never makes that kind of finding.

- 2026-08-25 -- Re-reading caught a reversed finding before it shipped
  (not a spec-ambiguity entry, a plain fact-checking one, logged per the
  operating environment's verify-before-asserting discipline). A first
  draft of `bjd-003`'s finding read Buffon's polecat sentence as saying
  the American polecats' nature was inferior; on a second, closer read the
  antecedent of "the nature of which" is the single European kind just
  introduced, and the sentence is Buffon conceding the American kind's
  superior nature. This flips which claim the atom evidences (against
  `bjd-buffon-asserts-american-degeneracy`, not for it). Caught before
  writing the claim files, not after.

- 2026-08-25 -- ERF-71, digest coverage gap. `fetched.digest` is present
  for the two archive.org PDF sources (stable downloadable bytes, hashed
  with `shasum -a 256`) and absent for the letter and the modern-secondary
  sources (live, bot-gated pages, not a fixed downloadable artifact). This
  follows ERF-71's own permission ("a page that differs on every fetch...
  simply carries no digest"), but it does mean those two sources are
  weaker provenance in practice: a future reader has no digest to confirm
  they retrieved the same bytes this corpus was built from.

- 2026-08-25 -- Not a spec question, a tooling one, logged because it ate
  real time: `curl` and the WebFetch tool both failed against
  founders.archives.gov (an AWS WAF bot challenge, HTTP 202 with an empty
  body). Had to switch to the Chrome MCP browser tool to actually render
  and read the two letters used in this corpus (`jefferson-to-buffon` and,
  briefly, a Sullivan letter that was checked but ultimately not shipped).

- 2026-08-25 -- Directory layout, reasoning logged as the task requested.
  Section 8 explicitly declines to mandate a substrate ("how the list is
  stored is the substrate's business"), and ERF-53 sets the canonical
  interchange form as one record per file. Chose one directory per record
  type (`atoms/`, `claims/`, `surveys/`) mirroring the worked examples in
  section 4, plus top-level `corpus.yaml` (the declaration) and
  `sources.yaml` (the source list, both explicitly "not a record" per
  section 3's own note), a `captures/` directory holding what the sources
  point to by relative `path`, and a `narrative/` directory held apart from
  the three record-type directories because ERF-34 says a narrative "MUST
  NOT be modelled as a record" and "has no interface in the data model."
  The corpus directory is meant to be the whole travel unit per ERF-62/59.

- 2026-08-25 -- The one modern secondary source (Monticello's Thomas
  Jefferson Encyclopedia, "American Moose") never actually rendered its
  full article text for me -- WebFetch returned HTTP 403 and the browser
  tool returned only a promotional ticketing widget, not the entry itself.
  I recorded the source from its title, URL, and the general subject
  confirmed via search-result snippets, not from having read its body.
  Judged this sufficient for a source that ships nothing and is cited for
  no atom (ERF-1's capture-before-check rule does not apply, since no
  check runs against it), but flagging that I never verified this specific
  page's exact wording -- only that it exists, is what it claims to be,
  and covers this subject.

- 2026-08-25 -- `finding_audit` left empty for 8 of the corpus's 9 atoms
  (a valid, non-violating state under ERF-56, not a shortcut). Ran exactly
  one real audit, via `mods --api google -m gemini-3.5-flash` against
  `bjd-005`, to exercise ERF-11/ERF-12 with an actual cross-model verdict
  rather than fabricate `finding_audit` entries across the board. The
  protocol name recorded (`finding-audit-adhoc-v1`) is my own invention;
  the spec deliberately does not define what a protocol contains.

- 2026-08-25 -- ERF-8 (citation is canonical, `citation_text` "MUST be
  rendered from it"). I wrote `citation_text` and `citation` by hand, in
  parallel, for all four sources, rather than mechanically deriving the
  text string from the structured block through a CSL processor. A real
  Producer would fail its own strictness bar here (ERF-55's "producers are
  strict"): nothing enforced that my hand-written prose string is what a
  CSL-Chicago renderer would actually produce from the block beside it.
  Logging this as a gap in my own conformance, not just the spec's.

- 2026-08-25 -- `owner`/`classification` on the corpus declaration are
  demonstration placeholders (`human:francois-bouet`, `public`) rather than
  a real accountable owner and confidentiality judgment; this corpus is a
  stress-test exercise, not a live research program, and a public-by-default
  convention in the operating environment was the readiest real-world analog
  to reach for.

- 2026-08-25 -- ERF-8, CSL strictness. The `citation` blocks in
  `sources.yaml` are CSL-flavored, not strictly valid CSL-JSON (e.g.
  `recipient`, `issued-container`, and a bare `page` string are not real
  CSL-JSON properties; `issued` should be a date-parts structure, not a
  bare year, for full CSL-JSON conformance). Good enough to make the
  citation's structure legible to a human reader and to demonstrate the
  field's presence, not good enough to hand a real CSL processor. Named
  here rather than silently shipped as if it were exact.
