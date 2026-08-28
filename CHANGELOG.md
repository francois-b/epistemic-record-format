# Changelog

Changes to numbered requirements, by version, newest first. Requirement ids
are stable from 0.9.0: a new requirement takes the next unused number, a
retired id is never reused, and a change to what a requirement means lands
here with its date. The work behind each version is in
[`docs/design-history.md`](docs/design-history.md); the commits are the record of
everything else.

## Unreleased

Specification, 2026-08-27: B-45 ruled, surveys age and do not go stale. `ERF-28` no longer says a survey's staleness is computed; `ERF-47` gains a fourth reading, survey age, the newest `conducted` timestamp among a claim's surveys, reported as a date and never judged against a threshold. Reference: `surveyAge`; fixture `valid/survey-age-is-reported`.

Specification, 2026-08-27: the definitions gain *assumption*, a reading and never a kind of claim: a premise reached through `assumes` edges that is not yet settled, which stops being one when it is backed without changing kind (`ERF-43`). Raised while writing the use-case table, where "an assumption reads like a fact" needed a mechanism and the mechanism was already there.

Finding, 2026-08-27: F-035, a change of mind does not show in the prose. `ERF-32` stales a binding on the claim's `last_modified` and `ERF-48` forbids a standing from advancing it, so a claim rejected through its ledger leaves its bound passages reading current. Open; a second computed reading, disposition moved since bound, is proposed and not ruled.

Patterns, 2026-08-27: `narrative-backing-loop.md` cited the retired `ERF-19` and `ERF-26`; it now names the schema's `StandingEntry` with `ERF-40`, and `ERF-27`.

Tooling, 2026-08-27: `scripts/preview-app.ts` renders any app view locally from a real corpus, hosting the real bundle behind a real AppBridge, so a card or the editor can be looked at in a browser without a screenshot from Desktop; `--serve` answers the app's read-only tool calls from the corpus, and writes are refused either way.

Tooling, 2026-08-27: the ruling card laid out as a page a person reads top down. An eyebrow (how many proposals, from what pass), the flagged passage as the title in the reading face (clipped past three lines with a toggle), the narrative's title as the deck, and nothing else above the proposals: no flag number, no ids, no worker, no survey slug, no summary. Each proposal keeps its corner row, claim, quotes and two small labelled lines, now in sentence case ("What would settle it", "Note"); the buttons read accept, accept narrower, drop, and accept narrower opens the edit box with a one-line hint. The card is built in app/card.ts, apart from the host, so it can be rendered on a plain page with real content; this layout was checked against the five-proposal set from the pilot corpus.

Wording, 2026-08-27: "span" and "scope" leave every surface a person reads. The flag listing, the tool descriptions, the instructions, the prompts, the editor's card and the ruling card say "the flagged passage" (the exact words the person selected) and "its paragraph" for the text around it; the worker had been echoing "span" back to the reader. The `survey-span` prompt is `survey-passage`. Field names (`span`, `anchor`) are unchanged. A proposal set's summary is one sentence or omitted and is not shown on the card.

Tooling, 2026-08-27: a narrative view opens the editor fullscreen only when the server served it moments ago (`served_at` on the view); a host replaying an old view when a chat is re-entered stays inline, which Cowork did on every re-entry.

Tooling, 2026-08-27: the ruling card laid out for reading. The worker's summary is one fainter line under the header, two sentences at most; a proposal's title is text, and "narrow" turns it into an edit box with "save narrowed" and "cancel" while accept and drop stay one press; the id and kind sit in the card's corner, each atom's id in its own; the quote comes first with the finding fainter under it, the citation linking to the source page with a separate "capture" link to the held text and the page number when there is one; "what would settle it" and the worker's note are labelled, smaller and fainter. From François's review of the first card.

Tooling, 2026-08-27: the prose on the ruling card is governed. `erf_propose` refuses a set whose title, note, settling line or summary says "load-bearing" or uses an em dash, and warns (in the result, the set kept) on a title over thirty words, a note over two sentences, a summary over two. The prompts and the server instructions carry the style: a title is one plain sentence no stronger than the evidence with no reference to the essay and no provenance; a note is how strong and what the gap is; the summary is two sentences or none; a finding says what the source says. Found on the first card, whose note opened "The load-bearing claim for the span" and whose summary ran to a paragraph.

Tooling, 2026-08-27: a PDF's text layer is reflowed before it is held: words broken at the margin are joined ("be-" "ginning" reads "beginning" when the continuation is lowercase), typeset lines join into paragraphs, page markers stand. New captures only; held texts keep their digests. Found when the first PDF quote on a card read "the be- ginning of the knowledge management timeline".

Tooling, 2026-08-27: the research trail shows inline as well as fullscreen, folded to its summary line there, so a pass can be watched from the conversation view where the host draws no chat sheet over the app.

Tooling and pattern, 2026-08-27: the ruling has a surface. A worker's proposals for a flag are producer machinery in `proposals.jsonl` (the id the claim would take, title, kind, the atoms for and against, what would settle it, the remark), put with `erf_propose`, which renders them as a card in the conversation with every quote, citation, page and remark in view. On the card the person accepts, narrows (the title edited in place) or drops each proposal, one `erf_proposal_rule` each, and a claim is written by that ruling and by nothing else; "bind and finish" (`erf_proposal_finish`) binds the passage to the minted claims and resolves the flag. The prompts and the server instructions say so: after the research, propose and stop; never mint a claim for a flag. Found when a survey pass reported six claims as a chat table of ids and had minted them before anyone ruled.

Tooling and pattern, 2026-08-27: a flag keeps its span. The editor cut the anchor to the first twelve words of the selection, so a flag placed on a paragraph reached the server, the underline and the LLM as its first line. `erf_flag` now takes the whole selection as `span` (folded; it must contain the anchor and occur in the narrative), `erf_flags` and the narrative status name it as the scope, the underline and the flag card cover it, and the anchor stays the few words that locate the flag. Found when François flagged the "new iteration of Agile" bullet and only its first line lit up.

Tooling, 2026-08-27: the research trail folds to its title line and unfolds from the same button (folding used to hide it, and only the status line, unmarked as a handle, brought it back); the app applies the host's safe-area insets as CSS variables so the essay no longer scrolls under Desktop's composer in fullscreen. The traffic lights and arrows over the fullscreen header, and the composer's off-centre position, are the host's own chrome and outside the app.

Tooling, 2026-08-27: a flagged span has a card. A click on it opens the flag: what was asked (the verb and the note), where it stands (open and not being worked; taken by whom, fresh or stale, the server's word; done and bound to which claims, linked), and the research behind it so far, the same lines the trail panel shows, repainting as work lands. The popover's state is a union of the binding card and the flag card; on a span that is both, the flag wins the click. The editor gains `setTrails`; the app passes the trails it already receives. Found when a click on the underlined span did nothing.

Tooling, 2026-08-27: the status line is the same on re-entering the editor as on first opening it. Leaving fullscreen stopped the watch and cleared the line, and re-entering took a path that re-read the marks without saying what the flags said; now every way in hands the flags to the same scheduler.

Tooling, 2026-08-27: the status line reads the flag's real state. A take that has aged past `TAKE_MINUTES` is reported by the server as `take_stale` on each flag (`erf_narrative_status`, `erf_narrative_read`), the one place the thirty-minute rule lives; the editor draws such a flag as open, not taken, and the app's status line says "researching #N (taken by X)" only for a fresh take, watching every three seconds, and "#N flagged · survey · not being worked" (a stale take named) otherwise, watching every half minute. A flag placed from the editor is watched fast for a quarter of an hour regardless. Found when a day-old take read as research in progress after a restart.

Probe, 2026-08-27, removable: what a host shows of a server besides results. `erf_source_add` and `erf_render_site` send `notifications/progress` at their steps when the call carries a progress token (nothing otherwise); every write sends a logging message naming the paths written (the logging capability is declared for it); `work-the-flags` and `survey-span` ask the worker to keep a task list and check the steps off. Verified on the wire with `scripts/smoke-notifications.ts`; whether Claude Desktop or Cowork shows any of it is the question, and the three are marked PROBE in the code so they can go if the answer is nothing.

Tooling and pattern, 2026-08-27: a survey runs as recall, then verify. Before any search the LLM writes the sources it expects to exist for the span, marked as unverified recollection, then seeks each by name and logs its fate; the survey lists them as targets. In the server instructions, the survey branch of `work-the-flags`, a new `survey-span` prompt, and step 5 of the backing loop. Found when a survey's topic queries returned retrospectives while the canonical sources went unsought.

Tooling, 2026-08-27: `erf_survey_record` compiles from the log for one question or a list of them (a survey lost the search logged under its second question), and takes `targets`, the sources sought by name with what became of each (held, unreachable with why, not found, not searched), written into the body under "Sources sought" and counted in the coverage text, so absent from the literature can be told from absent from this pass. The format has no field for it; filed as `B-71`.

Tooling, 2026-08-27: the research trail. The log's chain (a search, the capture it led to, the atoms from that source, the claims citing them) is read once (`tools/viewer/trail.ts`) and shown in three places: the editor's status line opens into the trail behind each flag being worked, as it lands, from `erf_narrative_status` (which takes `since`); survey pages and claim pages carry "How this was found". A refused capture is logged with its reason, so the trail says what was tried. `erf_view`'s description and the server instructions say that a narrative page is the editor, after a Cowork session answered that no editor exists.

Tooling, 2026-08-27: the capturer holds PDFs. `erf_source_add` takes a PDF by URL or from a file inside the corpus, holds the bytes as received, reads the text layer page by page (unpdf) and joins the pages with a marker line between them; a PDF with no text layer is refused, since OCR is not done. An atom minted from such a source reports the page its quote starts on and writes it into its body; the format has no locator field, filed as `B-70`. Found when the two best sources of a survey were open PDFs the capturer refused.

Tooling, 2026-08-27, from the first Cowork session: the active corpus is kept on disk per set of roots (`~/.erf/active.json`), so a host that starts one server per turn or per worker keeps the choice; Cowork lost it between two calls. `erf_view` no longer declares an output schema: the SDK emits draft-07 for it and the bundled Claude Code client validates 2020-12, so every call was refused before it reached the server.

Tooling, 2026-08-27: the server instructions say what a report on a flag contains (proposals with atoms and what would settle them, coverage in two lines with sources sought and not reached, what could not be held) and what it leaves out (corpus state, tool results, digests, the worker's own steps). Found when a survey pass opened with a paragraph on digests.

Known host behaviour, 2026-08-27: leaving fullscreen in Claude Desktop, the app's view jumps while the host animates it back into its inline slot. Holding the content still and showing the editor inline too were both tried and changed nothing; it is the host's animation of the iframe, and the outline inline stands.

Tooling and pattern, 2026-08-27: no requirement changed. A flag can ask for a
survey: research the span first (searches logged, sources captured, the survey
recorded with its coverage bounds and notable results, atoms minted), then the
claims the survey supports, scoped to the span, for one ruling. Backing an
observation now records a survey for it whether or not the claim is a gap. The
editor's selection bar offers Survey and Back; its popup offers all four verbs.
Found when a flag on "tried this in the '90s" wanted the review, not the claims.

Tooling and pattern, 2026-08-27: no requirement changed. A flag's anchor is its
scope. `erf_flags` lists each flag's scope and shows the passage around it as
context with the scope marked «so»; `decompose-passage` takes the span and
confines its proposals to it, the rest of the passage waiting under "also in
this passage, not flagged" for its own flag; `work-the-flags` and the
narrative backing loop say the same. Found when a flag on one sentence came
back as four claims over its paragraph.

Tooling, 2026-08-27: no requirement changed. The app and the editor, after a
first day of use. A record shown inline in the app is a card (title, what it
is, counts under each heading; the page is one press of open away). The
editor's binding card opens on a click rather than on hover, shows the
passage's claims one at a time with each atom's finding and a link to the page
it was captured from, and `erf_narrative_read`/`_status` carry those atoms in
`claimInfo` for it. Bold, italic and headings read as they render in the
editor, their marks hidden until the cursor is in the span.

Tooling, 2026-08-27: no requirement changed. erf-mcp 0.4.0 cuts what a backing
run costs in tool calls, and lets two workers hold one corpus at once.
`erf_source_add` takes `found_by`, the search act that led to the page, and
logs it before the capture; it takes `find` and returns the windows around that
phrase in the held text, so a quote is chosen without a second call.
`erf_atom_mint` takes `atoms`, every atom for one source in one call: each is
checked in turn, ids run consecutively, and one refusal is reported beside the
others rather than ending the call. A flag can be taken (`erf_flag_take`, with
`taken_by` and `taken_ts` on the flag), so several workers can share one queue;
a take goes stale after thirty minutes and is never cleared, so a resolved flag
says who did the work. The app's editor merges a binding that lands from
elsewhere instead of offering to overwrite it, keeps one write in flight at a
time, and saves before it flags. The narrative poll is no longer traced while
it succeeds.

Tooling, 2026-08-27: no requirement changed. erf-mcp 0.3.0 gains three
narrative tools, `erf_narrative_read`, `erf_narrative_write` and
`erf_narrative_status`: the file as it is on disk with a digest of its bytes as
its version id, a write that is refused when that digest no longer matches, and
a cheap read-only poll of a narrative's flags and bindings. A flag gains
`research` (`mint`, `back`, `opposite`), which records what the person asked
for when they marked the passage; flags written before the field existed still
parse and read as `mint`. The MCP app gains an editor: a narrative opened
fullscreen is edited in place over its markdown source (`tools/editor/`, a
host-agnostic CodeMirror bundle), with flags and bindings drawn on the prose
and the narrative check running on every save.

No requirement changed. Repository layout, 2026-08-26: the data model moved
to `schema/erf.schema.json` with `schema/erf.generated.ts` generated from it (a
pre-commit hook regenerates it; `tools/generate/generate-types.py --check` is the
gate); the reference validator is `validator/yaml-markdown/typescript/` (one folder
per serialization, one per language) and the viewer over it is
`tools/viewer/`; the YAML/Markdown serialization document is
`serialization/yaml-markdown.md`. Links into the repository at the old
paths (`erf.schema.json`, `types/erf.ts`, `viewer/`, `bindings/`) no longer
resolve.

Term, 2026-08-26: what was a *binding* (a named, versioned mapping of the
model to bytes; section 7, `ERF-53`) is a *serialization*. The word
*binding* now means a narrative binding and nothing else. No requirement
changed meaning; `YAMLB` ids keep their letters.

`YAMLB-3` added, 2026-08-26: the document grammar (opening `---` line,
YAML lines, the first later line that is exactly `---`, then the body with
leading and trailing line breaks removed), in ABNF; a fence-opened file that
fails it is a finding, a file with no fence is unrecognized. `YAMLB-1`'s
grammar is now ABNF (RFC 5234 with RFC 7405 `%s`); no rule changed, and
the case-sensitivity of `claims:` and `bound-at=` is now stated.

`YAMLB-1`, 2026-08-26: `bound-at` admits an RFC 3339 instant beside a date,
and `ERF-31` says so. A same-day rebind after a same-day edit had read stale
under `ERF-47` with nothing finer to compare (`F-034`).

## 0.9.0 — 2026-08-26

First published version: forty-nine requirements, five of them in the
YAML/Markdown binding, and twenty-six retired ids listed under change
control in `SPEC.md`.
