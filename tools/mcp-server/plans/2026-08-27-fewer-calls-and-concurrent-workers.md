---
title: "Plan: fewer calls per backing run, and an editor that survives other workers"
purpose: "A self-contained work order for one Claude Code session: cut a backing run from about forty tool calls to about fifteen without loosening a gate; let flags be taken by a worker; make the editor merge bindings that land from elsewhere instead of offering to overwrite them; serialize saves; save before flagging; keep the poll out of the trace."
status: plan
last_updated: 2026-08-27
---

# Plan: fewer calls per backing run, and an editor that survives other workers

Read this whole file first. Then read `tools/mcp-server/plans/2026-08-27-editor-and-flag-research.md` (the previous work order, executed; its Deviations and hand-off sections tell you what exists), `tools/mcp-server/DESIGN.md`, `tools/mcp-server/src/tools.ts`, `tools/mcp-server/src/index.ts`, `tools/mcp-server/src/corpus.ts`, `tools/mcp-server/src/capture.ts`, `tools/mcp-server/app/main.ts`, `tools/editor/src/marks.ts`, `tools/editor/src/index.ts`, and run the tests once (`cd tools/mcp-server && npm test`; `node --test tools/editor/test/marks.test.ts` from the repository root).

## Why

The first real backing run in Claude Desktop (2026-08-27, flag #1 of the essay) spent 40 tool calls after the ruling: 14 `erf_source_add`, 13 `erf_source_read`, 7 `erf_search_log`, 5 `erf_atom_mint`, and hit the host's per-turn tool-call limit before minting the claims and binding. The gates are right; the call count is not. Separately, a second worker (another chat, a Claude Code session, a Cowork sub-agent) binding the same narrative makes an open editor with unsaved typing offer to overwrite the new marker, and two workers can take the same flag.

## Work packages

WP0: commit this plan file alone first (`Plans: fewer calls and concurrent workers, work order`). Then one commit per package, subjects in the log's style. Never push. Before each commit: `npm test` and `npm run typecheck` in `tools/mcp-server`, the editor's `node --test`, and `npm run build:app` whenever `app/` or `tools/editor/` changed (the bundle is committed). The pre-commit hook runs the version lint.

### WP1. `erf_source_add` returns the passage, and takes the search that found it

In `src/tools.ts` `sourceAdd` and its registration in `src/index.ts`:

- New optional input `find: string` and `window: number` (same meaning as `erf_source_read`). The result text ends with the same windows `sourceRead` would return for that `find`, or the opening of the held text when `find` is absent (the first ~1200 characters of normalized text). The structured `data` carries `{ id, held: boolean, chars, windows: [{ at, text }] }`. A capture that refuses (non-text, unreachable) is unchanged.
- New optional input `found_by: { tool, query, hits_reported, scope?, for }`. When present, the search act is appended to the research log **before** the capture, exactly as `erf_search_log` would, and the result text says so. When absent, nothing is logged (a page can be captured from a citation, not only from a search). Coerce `found_by` with the same `asJson` preprocess the other object inputs use.
- Descriptions: `erf_source_add` says it returns the passage so a quote can be chosen without a second call, and that `found_by` logs the search that led to the page. `erf_search_log` stays for searches that find nothing worth capturing. `erf_source_read` stays for re-reading.
- Server instructions (`INSTRUCTIONS`): "Capture with erf_source_add, giving found_by for the search that led to the page and find for the phrase you mean to quote; it returns the passage, so quote from that rather than reading again."

Tests: a capture from a file inside the fixture corpus with `find` returns windows containing the phrase; with `found_by` the research log gains one entry dated before the capture; without it the log is untouched.

### WP2. `erf_atom_mint` takes several

- `erf_atom_mint` accepts either the current single shape or `atoms: [{ source, quote, finding, source_quality, as_of_date?, limitations? }]` (coerced with `asJson`). Each is checked and written as now; the result lists each outcome in order (`ok fei-006` / `refused: … nearest passage …`) and `data` carries `{ minted: [ids], refused: [{ index, reason, nearest }] }`. A refusal of one does not stop the others. Ids are allocated in order so a later call cannot interleave.
- Description and instructions: mint the atoms for one source in one call.

Tests: three atoms in one call from the fixture source, one of them a paraphrase: two minted, one refused with the nearest passage, ids consecutive.

### WP3. Flags can be taken

In `src/corpus.ts` and `src/tools.ts`:

- `Flag` gains `taken_by?: string` and `taken_ts?: string`.
- New tool `erf_flag_take { id, by? }`: marks an open flag taken by `by` (default: the server's agent id) at this instant; refuses if the flag is done, or already taken by someone else within the last 30 minutes (a stale take is re-takable, and the result says whose take expired). `erf_flag_resolve` and the binding that resolves a flag clear nothing; `taken_by` stays as provenance.
- `erf_flags` output shows `taken by X, 4 min ago` on taken flags; `erf_narrative_status` and `erf_narrative_read` items carry `taken_by` and `taken_ts`.
- The `work-the-flags` prompt: take a flag with `erf_flag_take` before working it; skip flags taken by someone else.
- Editor and app: a taken flag's underline uses a third class `erf-flag-taken`; the status line, when it says `researching #N`, appends `(taken by X)` when known.

Tests: take, second take refused, resolution keeps the mark, a take older than 30 minutes is re-takable.

### WP4. The editor merges bindings that land from elsewhere

Today (`app/main.ts` `pollOnce`): when the digest changes under a dirty editor the app shows the reload-or-overwrite banner, and Overwrite would write the editor's text without the marker another worker just inserted. Bindings are the only thing another worker writes into a narrative, so the fix is a narrow merge:

- In `tools/editor/src/marks.ts`, a pure function `mergeMarkers(mine: string, theirs: string): { text: string; inserted: number; conflicts: string[] }`: for every binding marker in `theirs` whose exact marker text is absent from `mine`, locate its anchor in `mine` (the `locate` function, whitespace-tolerant), find the end of that paragraph (`paragraphRange`), and insert the marker there on its own line (` \n<!-- … -->` following the serialization's spelling; look at how `erf_narrative_bind` writes it and match it exactly). Markers in `mine` that `theirs` lacks are left alone (the person may have removed one on purpose). An anchor that cannot be located in `mine` goes to `conflicts` and the marker is not inserted. Test it: a marker inserted after a paragraph the person is editing; a marker whose anchor the person deleted goes to conflicts; a marker already present is not duplicated.
- `EditorHandle` gains `mergeFrom(theirs: string): { inserted: number; conflicts: string[] }`, applying the change as one undoable edit and returning the counts.
- In `pollOnce`, when the digest changed under a dirty editor: read the file (`erf_narrative_read`), `mergeFrom` its text, then save with `force: true` (the editor now holds theirs plus mine), and show a notice `merged N binding(s) from elsewhere`. Only when `conflicts` is non-empty show the banner, with the conflicts named, and keep the two buttons. The clean, undirty case (reload silently) stays as it is.
- In `saveNow`, a refusal for a changed digest takes the same path: read, merge, force-save; the banner appears only on conflicts.

### WP5. Saves in order, and a flag saves first

- `saveNow`: one save in flight at a time. A save requested while one is in flight sets a `pendingSave` flag; when the in-flight save returns, if the document changed since, save again. No second write is ever sent with a digest the first write is about to invalidate.
- `submitFlag`: if the editor is dirty, `await saveNow(ed.getText())` before calling `erf_flag`, so a flag on words just typed is not refused for an anchor that is not on disk yet.

### WP6. The trace, the docs, the version

- `trace()` in `src/index.ts` skips `erf_narrative_status` unless it refused, so the Desktop log reads as the LLM's actions.
- `DESIGN.md`: a short section on call economy (why capture returns the passage, why atoms batch), on taken flags, and on the merge rule (bindings are the only thing another worker writes into a narrative, so they are merged, never overwritten).
- `docs/patterns/narrative-backing-loop.md`: step 5's tooling line mentions capture-returns-passage and batched atoms; the Conventions list gains "a flag is taken before it is worked, so several workers can share a queue".
- `CHANGELOG.md` Unreleased, and erf-mcp to 0.4.0 in `src/index.ts` and `implementations.yaml` (the lint will name every place).
- `tools/mcp-server/README.md` tool list.

## Constraints

- Never `git push`.
- Do not modify `SPEC.md`, `schema/`, `serialization/`, `implementations/`, `conformance/`. Tooling and patterns only.
- Do not touch `~/dev/fb-epistemology-imc` (a live run is using it) or `~/dev/isomorphic-app`. Test against `examples/corpora/minimal` and the fixtures.
- Prose in documents and commit messages: no em dashes in running text; "LLM", never bare "model"; never the hyphenated compound of "load" and "bearing".
- Existing tool signatures keep working; the single-atom shape of `erf_atom_mint` and the current `erf_source_add` inputs remain valid.
- If something is impossible as written, do the rest and write a "Deviations" section at the end of this file. Do not narrow silently.
- No Claude Desktop verification is possible from the session; add the manual checks to a "Hand-off checklist" at the end of this file (a second chat binding a passage while the first editor has unsaved typing: expected "merged 1 binding from elsewhere" and both texts kept; two chats taking the same flag: the second is told who has it).

## Out of scope

The `.mcpb` bundle, the plugin and its skill and sub-agent, the tree page, typography, Bookeh.
