---
title: "erf-mcp: design"
status: non-normative
last_updated: 2026-08-27
---

# erf-mcp: the Epistemic Record Format as a local MCP server

A local process that owns one corpus folder and exposes the format's
workflow as tools. The model proposes; the server is the only writer; the
user rules. It exists because the format's promises are producer duties (a
quote checked at mint, an id verified unused, strings quoted, empty lists
omitted, standings append-only) and no model follows those reliably from a
specification. Put them in the write path and they hold.

## Where data flows

- Runs on the user's machine, launched by the MCP client (Claude Desktop,
  Claude Code) over stdio. Nothing is hosted.
- Two things leave the machine, both already true without this server: what
  the model reads and writes goes to the model's provider; `erf_source_add`
  with a URL fetches from that site, and only when `fetch_enabled` is on
  (default off). No telemetry, no account, no other network call.
- The corpus is plain files in a folder the user chose. If the folder is a
  git repository the server commits its own writes as the user.

## The workspace: roots, corpora, the active one

The server is started with one or more **root folders** (in a Desktop
extension, the directory picker with `multiple: true`). A root may itself
be a corpus or hold several. Corpora are found by their declarations
(`ERF-54`: discovery by content, never by path), identified by the `id` in
`corpus.yaml`, and two declaring the same id are refused (`ERF-36`). One
corpus is **active** per session: the only one when there is one, else
whatever `erf_corpus_use` chose; every tool also takes an optional `corpus`
id to address another in a single call. Every result is prefixed with the
id of the corpus it touched, so a write to the wrong corpus is visible in
the same breath. `erf_corpus_init(folder, …)` creates a corpus under a root
and makes it active. Ruled 2026-08-26: the connector is the format, not a
corpus.

## The corpus it writes into

Discovery is by content (`ERF-54`), so the server reads any layout. It
writes new records into one of two layouts, chosen by what is there:

| If the folder has | Records go to | Held texts go to |
|---|---|---|
| `wiki/` (an Isomorphic brain) | `wiki/atoms/`, `wiki/claims/`, `wiki/surveys/` | `source/raw/`, `source/normalized/` |
| anything else | `atoms/`, `claims/`, `surveys/` | `raw/`, `normalized/` |

`corpus.yaml` and `sources.yaml` sit at the folder root in both. A folder
with no declaration is refused: the user creates a corpus by writing the
declaration (or the client does, through `erf_corpus_init`).

## Tools (v0, open discovery)

Every tool returns a short text result and, where it wrote, the paths it
wrote. Every refusal names the requirement. Nothing writes a raw file.

| Tool | Does | Refuses when |
|---|---|---|
| `erf_corpus_list()` | every corpus under the roots, the active one marked | never |
| `erf_corpus_use(id)` | makes one corpus the target of following calls | unknown id |
| `erf_corpus_init(folder, id, title, owner)` | creates a corpus under a root: `corpus.yaml` + empty `sources.yaml`; makes it active | folder outside the roots; a declaration already there; owner not `human:` |
| `erf_corpus_check()` | loads, validates, reports violations, flags, unbacked claims, uncited sources, counts by disposition | never |
| `erf_source_add(id, citation_text, url? \| path?, licence?, find?, window?, found_by?)` | captures: raw bytes held and digested (`ERF-71`); extracted and normalized by named tools (`ERF-70`); entry written to `sources.yaml` with `status` derived from the licence; logs the act. With `found_by` it logs the search that led to the page first; it returns the windows around `find` (or the opening of the text), so a quote is chosen without a second call. HTML, markdown, plain text and PDF; a PDF is held page by page with a marker between pages | id in use; url given while fetching is off; neither url nor path; path outside the corpus; a `found_by` with no `for`; a PDF with no text layer (OCR is not done) |
| `erf_search_log(for, tool, query, hits_reported, scope?)` | appends one act to the research log, tagged with what it was looking for; for a search that led to a page, `erf_source_add(found_by)` does the same thing in the call that captures it | empty query; no `for` |
| `erf_atom_mint(source, quote, finding, source_quality, as_of_date?, limitations?)` or `erf_atom_mint(atoms: [...])` | assigns the next id (`ERF-37`); runs the quote check (`ERF-50/51/52`) against the held normalized text; writes the atom; for a source held with page markers, reports the page the quote starts on and writes it into the atom's body (the format has no locator field: `B-70`). With `atoms`, every atom for a source in one call: each checked and written in turn, ids consecutive, one refusal reported beside the others rather than ending the call | source not registered; source has no held text; quote not found (returns the nearest passage); `as_of_date` finer than a date; neither one atom nor a list |
| `erf_claim_mint(id, title, epistemic_kind, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | writes the claim; body opens with the title verbatim (`ERF-18`) | id in use; any referenced id unresolved; a self-edge (`ERF-43`) |
| `erf_claim_update(id, title?, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | rewrites the named fields, stamps `last_modified` | unresolved ids; an attempt to touch `standings` or `evidence_audit` |
| `erf_claim_stand(id, stance, why)` | appends a standing under the corpus owner with a full RFC 3339 instant (`ERF-19`, `ERF-40`); returns the computed disposition | empty `why`; no `owner` on the declaration |
| `erf_survey_record(id, title, notable_results?, coverage_bounds, from_log?: date + for, searches?: [...], targets?: [...])` | writes the survey; `searches` come from the research log for the given day **and question** (`for`: one, or a list when the acts were logged under more than one), or from the argument; `targets` are the sources sought by name with what became of each (held, unreachable, not-found, not-searched), written into the body under "Sources sought" and counted in the coverage text (the format has no field: `B-71`) | no acts at all (`ERF-26`); `hits_reported` missing; `from_log` without `for`; no act logged for any `for`; a held target with no registered source |
| `erf_flag_take(id, by?)` | takes an open flag for one worker, so a queue can be shared; a take goes stale after 30 minutes and nothing ever clears it | the flag is resolved; someone else took it inside the last 30 minutes |
| `erf_flag(narrative, anchor, note?, research?)` / `erf_flags(narrative?, all?)` / `erf_flag_resolve(id)` | a passage marked to back later, in `flags.jsonl` (a working file, not a record); listed with its passage text and what it asked for; resolved by the binding that covers its anchor. `research` is `mint` (propose claims, stop for the ruling), `back` (gather the evidence after it, then bind) or `opposite` (and state the case against before anyone stands); absent on older flags and read as `mint`. The pattern: `docs/patterns/narrative-backing-loop.md` | anchor not in the narrative, or not unique; already flagged; an unknown `research` |
| `erf_propose(flag, proposals: [{id, title, epistemic_kind, atoms_for?, atoms_against?, settles?, note?}], survey?, summary?)` | writes the set to `proposals.jsonl` (superseding an open set for the same flag) and returns it with every atom resolved (quote, finding, citation, URL, page, quality, as-of), carried by the app as the ruling card; writes no claim | flag not open; an atom or survey that does not exist; an id that is not a slug, is taken, or is given twice; an unknown kind |
| `erf_proposals(flag?)` | the latest set for a flag (open or ruled), or the latest open set, as the card | never |
| `erf_proposal_rule(flag, id, ruling, title?, atoms_for?, atoms_against?)` | the person's ruling on one proposal: `accepted` mints the claim as proposed, `narrowed` mints it with the narrower title (the proposal's title kept in the notes), `dropped` records the drop; the set comes back for the card | no open set; no such proposal; already ruled; a narrowing with the same title; an accept with a changed one |
| `erf_proposal_finish(flag)` | every proposal ruled: binds the passage to the claims the rulings minted (joining an earlier binding on the same passage rather than replacing it), which resolves the flag, or resolves the flag when all were dropped; closes the set | a proposal without a ruling; no open set |
| `erf_narrative_bind(narrative, anchor, claims, replace?: true)` | inserts the `YAMLB-1` marker after the passage ending with `anchor`, `bound-at` today; with `replace`, rewrites the marker already on that passage | anchor not found or found twice; a claim id unresolved |
| `erf_narrative_check(narrative?)` | unresolved ids, stale bindings, broken anchors, malformed candidates (`ERF-31/32/33`) | never |
| `erf_narrative_read(narrative)` | the file as it is on disk (frontmatter included), a 12-character sha256 digest of its bytes as its version id, and every binding and flag with its status and line | no such narrative |
| `erf_narrative_write(narrative, text, expected_digest?, force?)` | replaces the file with the text as sent, never parsing or reformatting it; runs the narrative check; commits | `expected_digest` no longer matches the file (the current one comes back); an empty text |
| `erf_narrative_status(narrative, since?)` | the digest, the flags and the bindings, without the text, and the research trail behind each flag that asked for research (below): the polling call, read-only and local | no such narrative |
| `erf_render_site(out?)` | runs the reference viewer into `site/` (or `out`) inside the corpus; gitignores it | `out` outside the corpus |
| `erf_view(page?)` | the viewer's page (index, sources, health, claim:, atom:, capture:, survey:, narrative:) as `structuredContent`, carried by the app; a narrative page is the editor, and "open the editor" means this tool on that narrative | unknown page or id |
| `erf_source_read(id, find?)` | the source entry and its held normalized text, whole when short, else windows around `find` under the fold | unknown source |
| `erf_record_read(id)` / `erf_record_list(type?)` | returns a record (or a source) / lists ids and titles | unknown id |

Not in v0: `erf_search` (closed loop),
finding and evidence audits, excerpts (`ERF-69`), OCR for scanned PDFs, the
`.mcpb` bundle. Each has a slot; none is needed to run the loop once.

## The ruling card (2026-08-27)

The one step of the loop that is the person's had no surface: after a
survey pass the LLM reported its proposals as a chat table (claim id, atom
ids, a remark) and, since nothing stopped it, minted the claims as records
before any ruling. Evidence appeared as ids; nothing could be opened or
acted on. So proposals became producer machinery and the ruling became a
card.

A **proposal set** is one worker's proposals for one flag, in
`proposals.jsonl` at the corpus root beside `flags.jsonl`: the id the claim
would take, its title and kind, the atoms for and against it (minted
already: evidence may exist before a ruling, a claim may not), what would
settle it, and the worker's remark. `erf_propose` validates the set (the
flag open, every atom present, every id a free slug) and returns it with
every atom resolved; the tool carries the app, so the host renders the card
in the conversation where the LLM's message would otherwise have been. One
open set per flag: a new set supersedes the open one.

The card shows each proposal with its title in an editable field, its atoms
as quotes with the citation as a link (the source page when there is one,
the capture page in the app otherwise, the page number for a held PDF), the
settling line and the remark, and three visible actions: **accept** (mints
the claim as proposed), **narrow** (enabled once the title was edited; mints
it as edited, the proposed title kept in the working notes), **drop**
(records the drop; no claim). Each is one call to `erf_proposal_rule`, and
the card re-renders from what comes back, never from its own state. When
every proposal is ruled, **bind and finish** calls `erf_proposal_finish`:
the passage is bound to the minted claims (an earlier binding on the same
passage is joined, not replaced), the flag resolves, the set closes; a set
dropped whole resolves the flag without a binding. After each ruling the
card puts one line into the LLM's context (`updateModelContext`); after
the finish it sends one line into the conversation (`sendMessage`), so the
loop continues in the same chat.

The app calls tools with `app.callServerTool({ name, arguments })`, the
MCP Apps host proxy: the host makes the call on the app's behalf and
returns the result, so the same server-side gates apply as to a call from
the LLM. The pure state of a set (counts, the all-ruled gate, the claims
bound, the finish line) is `src/proposals.ts`, shared by the server and the
app and tested without either.

What this changes in the prompts: after the research the worker calls
`erf_propose` and stops; it never mints a claim for a flag and never binds;
`erf_claim_mint` and `erf_narrative_bind` remain for a claim or a binding
the person asks for in as many words, and `erf_proposal_rule` carries a
ruling the person gives in chat instead of on the card. Not built: a
proposals page in the viewer (the card is the only rendering).

### Three states, and why summary is the default (2026-08-28)

The first two-pass session produced two cards of five and four proposals.
Each was several screens tall, every quote was open, and nothing folded, so
after two flags the conversation was already hard to scroll and a third
would have buried the first. The card now has three states, and the
research trail has the same three under the same words.

**Folded** is one line: the flagged passage in the reading face, clipped to
the line, then `N proposals · k of N ruled`, then where the set stands
(`open`, `finished`, or `bound to k claims`). **Summary** is the head as
before and one row per proposal: kind, id, the claim, how much evidence it
carries (`for n · against m`), and the same three buttons. **Full** opens
every quote at once. A chevron, or the eyebrow beside it, moves between
folded and summary; one head control opens and closes every quote; and each
proposal has its own `quotes` disclosure, which opens that proposal's atoms,
its settling line and the worker's note in place.

Summary is the default because that is the unit of the decision. A person
rules on a claim, and asks for the evidence when the claim is not obviously
right; asking for it proposal by proposal is one press where reading past it
five times is five screens. The ruling flow is untouched: accept, accept
narrower with its edit box, drop and finish all work in summary and in full.

A card opens folded when it has nothing left to ask: the set is finished or
superseded, or a newer card has been drawn for the corpus, which is how a
replayed conversation shows its earlier passes as one line each. `bind and
finish` therefore folds the card it was pressed on. What the person chose is
kept per proposal set in `localStorage`, keyed by corpus, flag and the set's
timestamp, both reads and writes guarded, so a host that replays the tool
result gets the card back as it was left and a host with no storage still
renders it correctly.

The card is an inline card and asks for no fullscreen. Inline the app reports
its own height to the host, so folding has to shrink the card: nothing in it
is sized and nothing scrolls inside it. In the preview a finished set reports
84 pixels folded against 196 open.

Every instance of the app shares one origin, so `localStorage` is also how
instances tell each other what they drew: the newest set drawn for a corpus,
and the flag each card answers. The editor reads the second one, which is how
a trail folds when the card for its own flag lands in another instance.

## Prompts (judgment scaffolds, read-only)

- `decompose-passage`: list every checkable assertion in a passage, typed by
  kind, with what would settle each and the anchor words; put them with
  `erf_propose` and stop.
- `survey-passage`: recall, then verify. The sources expected from memory
  first, marked as recollection; then each sought by name and its fate
  logged; then the survey with its targets; then the claims it supports.
- `search-for-the-opposite`: the strongest case against a claim and where
  its evidence would be found.
- `meaning-check`: reading only these quotes, would you accept this claim?

## Resources

`erf://{corpus}/claims/{id}`, `erf://{corpus}/atoms/{id}`,
`erf://{corpus}/surveys/{id}`: the record as it stands, so a client can pull
one into context without a tool call.

## Server instructions (sent at initialize)

> This corpus records research so it can be checked later. Discover with any
> search you like, but read every page you might cite through
> `erf_source_add`: it holds the bytes, digests them and registers the
> source, and nothing can be cited that was not captured this way. Give it
> `found_by` for the search that led to the page and `find` for the phrase you
> mean to quote; it returns the passage, so quote from that rather than reading
> again. `erf_search_log` is for a search that found nothing worth capturing.
> Mint atoms only with verbatim quotes; the server checks each one against
> the held text and refuses paraphrase, and every atom for one source goes in
> one call. Claims are typed by what would settle
> them. Propose; the user rules; never write a record the user has not
> confirmed. A flag's `research` says what the user asked for: `mint`
> proposes claims and stops for the ruling, `back` gathers the evidence
> after it and binds, `opposite` adds the strongest case against before
> anyone stands. When more than one flag is open and the host runs
> sub-agents, take each free flag and work them in parallel, one sub-agent per
> flag, each ending with its own `erf_propose`; without sub-agents work them
> one after another and say so. While the user has the narrative open in the
> editor, answer in text and do not call `erf_view` to re-open it.

## Capture

`erf_source_add` holds three things per source and names the tools that
made them, so a reader can re-run the pipeline (`ERF-70`):

1. Raw: the bytes as received, digested (`sha256:`), with the URL or path
   and a timestamp.
2. Extracted: for HTML, the article text via Readability over a DOM
   (`@mozilla/readability` + `linkedom`, versions recorded in
   `extraction`); for a PDF, the text layer page by page (`unpdf`, below);
   for `.md`/`.txt`, the file itself, no extraction step.
3. Normalized: `erf-normalize-ts 0.1.0`, deterministic: NFC; CRLF and CR to
   LF; tabs to one space; runs of spaces to one; trailing spaces removed;
   three or more blank lines to two; final newline. Recorded in
   `normalization`. This is the text the quote check folds (`ERF-51`).

### PDF (2026-08-27)

The text layer is reflowed before it is held (same day, after the first real capture showed "be- ginning" in a quote): a line ending in a hyphen joins the next when the next starts with a lowercase letter, the hyphen dropped; consecutive lines join into one paragraph, a blank line staying a break; the page markers stand. Limitation: a real hyphen before a lowercase continuation ("well-\nknown") is lost too, since nothing in the text layer tells the two apart; a compound continuing with a capital keeps its hyphen. Held texts captured before the change are not rewritten (their digests stand).

A PDF is detected by its content type or the `%PDF-` magic, from a URL or a
file inside the corpus, and its bytes are held as received (`raw/<id>.pdf`).
The text layer is read page by page with **unpdf** (1.8.1), chosen over
`pdfjs-dist` directly because it wraps pdf.js's serverless build with no
native module, no canvas and no DOM shim, installs as one pure-JS package on
any machine that runs the server, and returns the pages as an array. The
pages are joined with a **page marker** line between them:

```
<!-- erf:page 3 -->
```

An HTML comment on its own line, because the quote check folds CommonMark to
plain text and an HTML block contributes nothing (`ERF-51` step 1): the
marker can never match a word of a quote, and a page break separates blocks
exactly as a blank line does, so a quote cannot be spliced across two pages
any more than across two paragraphs. `extraction` names the library, its
version and "page markers", so a reader can re-run the step. A PDF with no
text layer (a scanned image, or text drawn as outlines) is refused before
anything is written: OCR is not done. At mint, an atom from a source held
with markers reports the page its quote starts on (the first page whose
folded text holds the quote's first segment as whole words) and writes one
line into the atom's body; the format has no locator field, and the
question is filed as `B-70`. The two open PDFs the capturer refused on
2026-08-27 (a 1998 vendor white paper on gdrc.org, a Warwick conference
paper) are the cases this is for.

`status` from the licence argument: an SPDX id that permits redistribution
gives `shipped`; none given gives `licence-unverified` (the text is held for
checking and never shipped); `not-redistributable` when the user says so.

## The research log

`research-log.jsonl` at the corpus root, append-only, one JSON object per
line: `{ts, kind: "search"|"fetch", for?, tool, query?, hits_reported?,
scope?, url?, source?}`. `for` is what a search was looking for (a claim id
or a topic); a survey compiles only the acts logged for its own question,
so a day's searches for one claim can never become backing for another
(found on the first Desktop session, by the model refusing exactly that);
`for` takes a list when one survey's acts were logged under two questions,
which is how the 2026-08-27 survey on the 1990s lost one of its three. Written by `erf_search_log` and by every capture. It is a
working file of the producer, not a record: the format says nothing about
it, which is the right boundary. `erf_survey_record(from_log)` reads it.

## The research trail (2026-08-27)

The log already held the whole chain: a search logged with what it was for,
the capture that followed it, the atoms minted from the source, the claims
citing them. It surfaced nowhere but a survey's own search list, and a
person asking "what did the LLM actually do for this flag" ran a script
over the file. `tools/viewer/trail.ts` reads the chain once, and three
places show it:

- **The editor**, while a flag is being worked. `erf_narrative_status`
  carries, for each flag that asked for research (open, or resolved within
  two hours), the acts in its window: from the take (else the flag) to the
  resolution, narrowed by `since` when the poll asks only for what is new.
  The status line ("researching #1") is the handle; it opens a panel folded
  under the head bar, fullscreen only (the design guide bans floating panels
  there), listing each search with the captures it led to, held or refused,
  then the atoms and the claims. The panel opens itself the first time an
  act lands and folds on request. Its lines are computed in
  `tools/editor/src/trail.ts`, pure and tested. Since 2026-08-28 it carries
  the ruling card's three states under the same words and the same controls:
  folded is the title line with the counts, summary is a line of counts for
  each flag, full is every act. The trail is the record of a pass and the
  card is its result, so the trail steps back to its one line when a card for
  one of its flags is drawn, once per flag, and that line carries a control
  that scrolls to the card when both are on the page.
- **The survey page**: "How this was found", each of the survey's own acts
  with what it led to. The survey's `searches` are matched to the log on
  instrument and query, and on the act's timestamp when the survey kept it.
- **The claim page**: each atom the claim cites, the capture that held its
  source, and the search that led there.

A capture is attributed to the most recent search logged before it, which
is the order the gates assume and the only link the log carries. A refused
capture (a PDF with no text layer, a fetch that failed) is now logged too,
with its reason, so the trail says what was tried and not only what was
held. The site renderer and the app share the reading, so the trail is the
same at every distance, and a corpus with no log renders without the
section.

## Probes: progress, logs, a task list (2026-08-27, removable)

Three cheap probes into what Claude Desktop and Cowork surface from a
server, each marked `PROBE` in the code and each removable without touching
a tool:

1. **Progress.** A call that carries a `progressToken` gets
   `notifications/progress` at the tool's steps: `erf_source_add` at
   fetching or reading, extracted, registering, registered (0 to 4 of 4);
   `erf_render_site` every ten pages and at the end. Without a token nothing
   is sent. `on()` in `index.ts` turns the SDK's `extra` into a `Progress`
   function the two tools call.
2. **Logs.** Every write (`finish()` in `tools.ts`) sends a logging message
   at `info` naming the relative paths written, through a hook `index.ts`
   sets; the server declares the logging capability for it.
3. **A task list.** `work-the-flags` and `survey-passage` ask the worker to
   keep a task list of the steps and check each off, to see whether
   Cowork's Progress panel follows.

`scripts/smoke-notifications.ts` spawns the server over stdio on a copy of
the minimal corpus and prints every notification as it arrives; the first
two probes were verified there on 2026-08-27. What the hosts show of them
is the open question.

## Identity

- Records the server creates carry `created.by` = the `--agent` option
  (default `agent/erf-mcp`); the client's model id is not visible to a
  server, so the user names it once.
- Standings are taken by the declaration's `owner`, which MUST be a
  `human:` actor; the server refuses to stand otherwise.
- Atom ids are `<prefix>-NNN`; the prefix is `x_atom_prefix` on the
  declaration when present, else the initials of the corpus id.

## Tests

Every tool call's output loads clean under `erf-check` (the reference
validator is the oracle, never a second implementation of the rules), and
every refusal above has a test. The fixture is a temporary copy of
`examples/corpora/minimal`; the brain `fb-epistemology-imc` is the live
trial.

## Findings from building it

- **Same-day rebinding reads stale.** `bound-at` is a date (`YAMLB-1`) and
  `last_modified` an instant; `ERF-47` resolves the mixed comparison to
  stale. A claim edited and rebound within one day therefore stays flagged
  until the next day. Ruled 2026-08-26 (`F-034`): `bound-at` admits an RFC
  3339 instant, and the server writes one; a same-day rebind now reads
  current.
- An existing marker quotes its own anchor, so anchor uniqueness must be
  checked over the prose with markers masked, not over the body.

## The app (first stab, 2026-08-26)

One `ui://` resource, `app/template.html` plus `app/main.ts` bundled by
`scripts/build-app.ts` into `src/app-bundle.generated.ts` (committed; rebuild
after touching `app/` or the viewer's stylesheet). The app shows the
reference viewer's pages, body only, inside the host: `erf_view` returns a
page as `structuredContent`, the host feeds it to the app, and the page's
own links (`claim-x.html`, `atom-y.html`, `index.html` …) are turned into
`erf_view` calls back through the host. Read-only by construction: the app
calls one tool. Non-UI hosts get the page flattened to text. The viewer's
stylesheet, fonts inlined, is the app's stylesheet, so the site and the app
are the same views at two distances. Versioned by content hash in the URI,
since hosts cache the resource.

### Inline is an answer, fullscreen is the app (2026-08-27)

Inline, the card is the answer to one turn: no app bar, sized to its content
(the SDK's auto-resize reports the height, so the host's scrollbar is the only
one), and a link followed inside the card tells the model what the user is
now looking at (`updateModelContext`), so the conversation and the screen
never disagree without a turn per click. Fullscreen is the app, chosen on
purpose: the bar returns and browsing is expected; a control toggles the two
(`requestDisplayMode`). Nothing in the card writes; "Back this" turns a
gesture into a proposal in chat.


### The editor (2026-08-27)

A narrative opened fullscreen is now an editor, not a page. The app reads the
file with `erf_narrative_read`, mounts `tools/editor/` over the markdown
source, and writes back through `erf_narrative_write`. Inline is unchanged: a
narrative is still its outline there, because a document inside a card the host
caps in height is a document nobody reads.

**CodeMirror 6, over the source, not ProseMirror over a document model.** The thing the
rest depends on is that a binding marker is an HTML comment inside the prose.
An editor with a document model has to parse the markdown, hold the comment as
some node, and write it back; every round trip is a chance to move a byte, and
a moved byte is a broken anchor. Working on the source means markers,
footnotes and frontmatter survive by construction, and there is nothing to
bridge. Decorations do the reading work: flagged passages underlined, bound
ones marked by status, each marker collapsed to a diamond that expands when the
cursor enters it, a hover listing the claims a passage rests on with their kind
and disposition. No typography, on purpose: a monospace face and a comfortable
measure, nothing sized, nothing rendered.

**The host interface.** `tools/editor/` knows nothing about MCP. It takes a
parent element and the text, and offers `setText`, `getText`, `setMarks`
(returning the anchors it could not place), `onSelectionChange`, `onSave`,
`isDirty`, `markSaved` and `destroy`. The app is its first host and does all
the deciding: what a gesture means, which tool to call, what to say in chat. A
native application with a web view can be its second without a rewrite, and if
the folder becomes its own repository it moves as a unit. `setMarks` returns
`{missing}` rather than nothing, which the plan's behaviour asked for and its
interface sketch did not: an anchor the prose moved under has to be reportable,
or the editor silently draws less than the record says.

**Saving is digest-gated.** `erf_narrative_read` returns a 12-character sha256
of the file's bytes; `erf_narrative_write` takes it back as `expected_digest`
and refuses when the file moved underneath, returning what is on disk. The app
raises a banner with two buttons that do exactly the two things available:
reload, or overwrite. Two writers cannot silently overtake each other, and the
person is never asked to guess which version they have.

**The trigger is a message, and the answer is polled.** MCP sampling and
elicitation are not assumed to exist in the host, so a flag asking for `back`
or `opposite` puts one line into the conversation with `sendMessage`: a message
the person could have typed. The LLM answers in the same chat while the editor
stays open. From then on the app watches by polling `erf_narrative_status`
every three seconds for a quarter of an hour, then every half minute, stopping
the moment no such flag is open. Polling is a local read of files this machine
owns: no LLM, no git, no network, and the app still pushes no record. When a
binding lands, the flag resolves, the decoration turns from flagged to bound,
and the header says so for a few seconds.

**Bundle size.** The app resource is 1102 KB (script 856 KB), of which
CodeMirror and the editor are about 520. Most of that last figure is
`@codemirror/lang-markdown` pulling `@codemirror/lang-html` in at module scope
for embedded HTML, which no configuration turns off. The resource is served
over stdio and cached by the host against its content-hashed URI, so it is paid
once a session; if it ever needs to shrink, the markdown language is where to
look.

### Call economy, and two workers at once (2026-08-27)

The first real backing run in Claude Desktop spent forty tool calls after the
ruling and hit the host's per-turn limit before the claims were minted: 14
captures, 13 reads of what had just been captured, 7 search logs, 5 atoms one
at a time. None of the gates was wrong. The shape of the calls was.

**A capture returns the passage, and takes the search that found it.** Reading
a page you have just held is a second call for something the server already had
in memory, so `erf_source_add` now takes `find` and returns the same windows
`erf_source_read` would, folded as the quote check reads them; without `find` it
returns the opening of the held text. It also takes `found_by`, the search act
that led to the page, and logs it before the capture, which is the order the
survey gate assumes anyway. `erf_search_log` stays for the searches that find
nothing worth capturing, and `erf_source_read` for re-reading a source captured
earlier. Three calls become one.

**Atoms come in a batch.** `erf_atom_mint` takes `atoms`, every atom for a
source in one call. Each is checked and written in turn, so ids run
consecutively and one paraphrase does not stop the four quotes that were
verbatim: the refusal is reported beside the others, with its nearest passage,
and the caller fixes that one. The single shape is unchanged, because a single
atom is still what a follow-up looks like.

**A flag is taken before it is worked.** Two workers on one corpus (another
chat, another session, an agent in a queue) can otherwise decompose the same
passage twice. `erf_flag_take` marks a flag for one worker at this instant; a
second take is refused and names who has it. A take goes stale after thirty
minutes, so a worker that stopped does not lock a flag for good, and the
re-take says whose take expired. Nothing clears a take: once the flag is
resolved it says who did the work. The editor draws a taken flag differently
from a free one, and the status line names the holder.

**Flags are worked in parallel where sub-agents exist.** Taking a flag made
several workers possible; nothing said to use them, so the first two-pass
session in Cowork ran its two flags one after the other. The server's
instructions and the `work-the-flags` prompt now say that when more than one
flag is open and the host has sub-agents, the LLM takes each free flag and
gives one sub-agent one flag, each running the whole loop for its own flag and
ending with its own `erf_propose`; a refused take means another worker holds
that flag, and it is skipped. The report comes once, when they are all on
cards, one line per flag. Without sub-agents the flags run one after another,
still one card each, and the LLM says so in a line. The app has the matching
gesture: a flag placed at the selection still sends its own request line, one
flag per gesture, and the head bar carries **Work the flags** while two or
more flags asking for research are open with nobody on them, which sends one
message naming them all. The rule for whether that control is there at all is
pure, in `app/flags.ts`, and tested.

**Bindings are merged, never overwritten.** An open editor with unsaved typing
used to meet a binding written from elsewhere as a banner offering reload or
overwrite, and overwrite dropped the marker that had just landed. A binding
marker is the only thing another worker ever writes into a narrative, so the
two texts do not need a general merge: `mergeMarkers` in `tools/editor/` takes
every marker of the file on disk that this text lacks and places it on the
passage its anchor names, rewriting an older marker for the same anchor rather
than adding a second, and touching nothing else. A marker this text has and the
file lacks is left alone, because the person may have deleted it on purpose. An
anchor whose words were rewritten here cannot be placed, and that is the one
case the banner is still for, along with a change on disk that is not a binding
at all. The merged text is then written with `force`, since it now holds both.

**Saves go one at a time.** A second write carrying the digest the first is
about to invalidate would be refused, and the person would be told their own
typing had changed the file underneath them. The app keeps one write in flight
and remembers a save asked for meanwhile, saving again when the first returns
if the document moved on. A flag on words just typed saves them first, since
the server checks the anchor against the file on disk.

**The poll is out of the trace.** `erf_narrative_status` succeeds a few times a
minute while the editor is open, which drowned the per-server log. It is traced
only when it refuses, so the log reads as the session's actions.
