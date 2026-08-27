---
title: "erf-mcp: design"
status: non-normative
last_updated: 2026-08-26
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
| `erf_source_add(id, citation_text, url? \| path?, licence?, licence_name?)` | captures: raw bytes held and digested (`ERF-71`); extracted and normalized by named tools (`ERF-70`); entry written to `sources.yaml` with `status` derived from the licence; logs the act | id in use; url given while fetching is off; neither url nor path; path outside the corpus |
| `erf_search_log(for, tool, query, hits_reported, scope?)` | appends one act to the research log, tagged with what it was looking for | empty query; no `for` |
| `erf_atom_mint(source, quote, finding, source_quality, as_of_date?, limitations?)` | assigns the next id (`ERF-37`); runs the quote check (`ERF-50/51/52`) against the held normalized text; writes the atom | source not registered; source has no held text; quote not found (returns the nearest passage); `as_of_date` finer than a date |
| `erf_claim_mint(id, title, epistemic_kind, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | writes the claim; body opens with the title verbatim (`ERF-18`) | id in use; any referenced id unresolved; a self-edge (`ERF-43`) |
| `erf_claim_update(id, title?, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | rewrites the named fields, stamps `last_modified` | unresolved ids; an attempt to touch `standings` or `evidence_audit` |
| `erf_claim_stand(id, stance, why)` | appends a standing under the corpus owner with a full RFC 3339 instant (`ERF-19`, `ERF-40`); returns the computed disposition | empty `why`; no `owner` on the declaration |
| `erf_survey_record(id, title, notable_results?, coverage_bounds, from_log?: date + for, searches?: [...])` | writes the survey; `searches` come from the research log for the given day **and question** (`for`), or from the argument | no acts at all (`ERF-26`); `hits_reported` missing; `from_log` without `for`; no act logged for `for` |
| `erf_flag(narrative, anchor, note?)` / `erf_flags(narrative?, all?)` / `erf_flag_resolve(id)` | a passage marked to back later, in `flags.jsonl` (a working file, not a record); listed with its passage text; resolved by the binding that covers its anchor. The pattern: `docs/patterns/narrative-backing-loop.md` | anchor not in the narrative, or not unique; already flagged |
| `erf_narrative_bind(narrative, anchor, claims, replace?: true)` | inserts the `YAMLB-1` marker after the passage ending with `anchor`, `bound-at` today; with `replace`, rewrites the marker already on that passage | anchor not found or found twice; a claim id unresolved |
| `erf_narrative_check(narrative?)` | unresolved ids, stale bindings, broken anchors, malformed candidates (`ERF-31/32/33`) | never |
| `erf_render_site(out?)` | runs the reference viewer into `site/` (or `out`) inside the corpus; gitignores it | `out` outside the corpus |
| `erf_view(page?)` | the viewer's page (index, sources, health, claim:, atom:, capture:, survey:, narrative:) as `structuredContent`, carried by the app | unknown page or id |
| `erf_source_read(id, find?)` | the source entry and its held normalized text, whole when short, else windows around `find` under the fold | unknown source |
| `erf_record_read(id)` / `erf_record_list(type?)` | returns a record (or a source) / lists ids and titles | unknown id |

Not in v0: `erf_search` (closed loop),
finding and evidence audits, excerpts (`ERF-69`), PDF extraction, the
`.mcpb` bundle. Each has a slot; none is needed to run the loop once.

## Prompts (judgment scaffolds, read-only)

- `decompose-passage`: list every checkable assertion in a passage, typed by
  kind, with what would settle each and the anchor words.
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
> source, and nothing can be cited that was not captured this way. Log each
> search with `erf_search_log` at the moment you run it, not afterwards.
> Mint atoms only with verbatim quotes; the server checks each one against
> the held text and refuses paraphrase. Claims are typed by what would settle
> them. Propose; the user rules; never write a record the user has not
> confirmed.

## Capture

`erf_source_add` holds three things per source and names the tools that
made them, so a reader can re-run the pipeline (`ERF-70`):

1. Raw: the bytes as received, digested (`sha256:`), with the URL or path
   and a timestamp.
2. Extracted: for HTML, the article text via Readability over a DOM
   (`@mozilla/readability` + `linkedom`, versions recorded in
   `extraction`); for `.md`/`.txt`, the file itself, no extraction step.
3. Normalized: `erf-normalize-ts 0.1.0`, deterministic: NFC; CRLF and CR to
   LF; tabs to one space; runs of spaces to one; trailing spaces removed;
   three or more blank lines to two; final newline. Recorded in
   `normalization`. This is the text the quote check folds (`ERF-51`).

`status` from the licence argument: an SPDX id that permits redistribution
gives `shipped`; none given gives `licence-unverified` (the text is held for
checking and never shipped); `not-redistributable` when the user says so.

## The research log

`research-log.jsonl` at the corpus root, append-only, one JSON object per
line: `{ts, kind: "search"|"fetch", for?, tool, query?, hits_reported?,
scope?, url?, source?}`. `for` is what a search was looking for (a claim id
or a topic); a survey compiles only the acts logged for its own question,
so a day's searches for one claim can never become backing for another
(found on the first Desktop session, by the model refusing exactly that). Written by `erf_search_log` and by every capture. It is a
working file of the producer, not a record: the format says nothing about
it, which is the right boundary. `erf_survey_record(from_log)` reads it.

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

