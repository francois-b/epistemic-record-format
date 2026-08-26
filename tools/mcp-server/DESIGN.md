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
| `erf_corpus_init(id, title, owner)` | writes `corpus.yaml` + empty `sources.yaml` | a declaration already exists |
| `erf_corpus_check()` | loads, validates, reports violations, flags, unbacked claims, uncited sources, counts by disposition | never |
| `erf_source_add(id, citation_text, url? \| path?, licence?, licence_name?)` | captures: raw bytes held and digested (`ERF-71`); extracted and normalized by named tools (`ERF-70`); entry written to `sources.yaml` with `status` derived from the licence; logs the act | id in use; url given while fetching is off; neither url nor path; path outside the corpus |
| `erf_search_log(tool, query, hits_reported, scope?)` | appends one act to the research log | empty query |
| `erf_atom_mint(source, quote, finding, source_quality, as_of_date?, limitations?)` | assigns the next id (`ERF-37`); runs the quote check (`ERF-50/51/52`) against the held normalized text; writes the atom | source not registered; source has no held text; quote not found (returns the nearest passage); `as_of_date` finer than a date |
| `erf_claim_mint(id, title, epistemic_kind, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | writes the claim; body opens with the title verbatim (`ERF-18`) | id in use; any referenced id unresolved; a self-edge (`ERF-43`) |
| `erf_claim_update(id, title?, atoms_for?, atoms_against?, surveys?, edges?, families?, notes?)` | rewrites the named fields, stamps `last_modified` | unresolved ids; an attempt to touch `standings` or `evidence_audit` |
| `erf_claim_stand(id, stance, why)` | appends a standing under the corpus owner with a full RFC 3339 instant (`ERF-19`, `ERF-40`); returns the computed disposition | empty `why`; no `owner` on the declaration |
| `erf_survey_record(id, title, notable_results?, coverage_bounds, from_log?: date \| searches?: [...])` | writes the survey; `searches` come from the research log for the given day or from the argument | no acts at all (`ERF-26`); `hits_reported` missing |
| `erf_narrative_bind(narrative, anchor, claims, replace?: true)` | inserts the `YAMLB-1` marker after the passage ending with `anchor`, `bound-at` today; with `replace`, rewrites the marker already on that passage | anchor not found or found twice; a claim id unresolved |
| `erf_narrative_check(narrative?)` | unresolved ids, stale bindings, broken anchors, malformed candidates (`ERF-31/32/33`) | never |
| `erf_record_read(id)` / `erf_record_list(type?)` | returns a record / lists ids and titles | unknown id |

Not in v0: `erf_search` (closed loop), `erf_render_site`, the MCP App,
finding and evidence audits, excerpts (`ERF-69`), PDF extraction, the
`.mcpb` bundle. Each has a slot; none is needed to run the loop once.

## Prompts (judgment scaffolds, read-only)

- `decompose-passage`: list every checkable assertion in a passage, typed by
  kind, with what would settle each and the anchor words.
- `search-for-the-opposite`: the strongest case against a claim and where
  its evidence would be found.
- `meaning-check`: reading only these quotes, would you accept this claim?

## Resources

`erf://claims/{id}`, `erf://atoms/{id}`, `erf://surveys/{id}`: the record
as it stands, so a client can pull one into context without a tool call.

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
line: `{ts, kind: "search"|"fetch", tool, query?, hits_reported?, scope?,
url?, source?}`. Written by `erf_search_log` and by every capture. It is a
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
