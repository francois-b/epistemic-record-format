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

## Hand-off checklist

Everything above is built, tested and committed. What follows needs Claude
Desktop, two chats and a person. None of it has been run from this session, and
none of it is claimed to work.

**0. A corpus outside this repository.** The server commits its own writes, so
a corpus inside `epistemic-record-format/` would commit into it.

```
cp -R examples/corpora/minimal ~/erf-corpora/workers-trial
cd ~/erf-corpora/workers-trial && git init -q && git add -A && git commit -qm "trial corpus"
```

The Desktop connector's `args` must name a root that covers that folder.

**1. Restart Desktop and check the handshake.** Quit Claude Desktop from the
menu bar (closing the window is not enough) and reopen it. Ask a new chat
"which erf tools do you have".
*Expected:* `erf_flag_take` is in the list beside the others, and
`erf_source_add` and `erf_atom_mint` describe themselves as returning the
passage and taking several atoms. If not, the host is on the cached resource or
the connector points at another checkout.

**2. The call count on a real flag.** Flag a passage with `back`, rule on the
claims, and let the LLM back one observation. Watch the per-server log
(`~/Library/Logs/Claude/mcp-server-*.log`).
*Expected:* one `erf_source_add` per page, carrying `found_by` and `find`, with
no `erf_source_read` following it; one `erf_atom_mint` per source rather than
one per quote; no `erf_narrative_status` lines at all while the poll is
succeeding. A run that took forty calls should now take roughly fifteen.
Count them: that number is the whole point of this plan, and it is the one
thing no test here can measure.

**3. A binding that lands while you are typing.** Open the narrative fullscreen
in chat A. Type a sentence into a paragraph and do not wait for the autosave
(under two seconds). In chat B, in the same corpus, say "bind the passage
starting '<a few words of a different paragraph>' to <a claim id>".
*Expected:* within about three seconds the editor's header reads `merged 1
binding from elsewhere`, the sentence typed in chat A is still there, and the
new marker appears as a collapsed diamond at the end of the other paragraph.
No banner. `git -C ~/erf-corpora/workers-trial log --oneline -3` shows chat B's
bind and then chat A's edit, in that order, and the file holds both.

**4. The case merging cannot settle.** Do it again, but this time first delete
the words chat B's binding anchors on, and leave that edit unsaved.
*Expected:* the banner appears, naming the anchor that could not be placed, with
Reload and Overwrite still doing exactly those two things.

**5. Two workers on one flag.** In chat A: "take flag #1". In chat B: "take
flag #1".
*Expected:* chat B is refused and told `flag #1 was taken by <agent> just now`,
with the note that a take goes stale after 30 minutes. In the editor, flag #1's
underline is solid rather than dashed, and the header, while researching, reads
`researching #1 (taken by <agent>)`. Both connectors need distinct `--agent`
values for this to be legible; with one connector serving both chats they share
an agent id and the second take will be allowed as a refresh.

**6. Saves in order.** Type continuously for ten seconds without pausing, then
stop.
*Expected:* the header never shows a "changed on disk" banner from your own
typing, and `git log` shows one commit per save rather than a refused write.

**7. Write down what Desktop actually did.** Anything this plan did not expect
goes in `tools/mcp-server/DESIGN.md` under "Findings from building it": a host
that batches two tool calls per turn, a `found_by` the LLM fills in from memory
rather than from the search it just ran, an `atoms` list the host flattens into
a string, the merge firing on a change that was not a binding.

## Deviations

Everything in the plan was built. Four places where what was built differs from
what was written, each with the reason:

1. **A merged marker goes on its own line, and a rebind rewrites in place.**
   WP4 says to insert the marker "on its own line (` \n<!-- … -->` following the
   serialization's spelling; look at how `erf_narrative_bind` writes it and
   match it exactly)". Those two cannot both hold: `erf_narrative_bind` writes
   the marker two spaces after the last word of the passage, on the same line.
   The marker text itself is taken verbatim from the file on disk, so its
   spelling is byte-identical to what the other worker wrote; the placement
   follows "on its own line", which also keeps the diff of a merge to one added
   line. Separately, when the passage in this text already carries a marker for
   the same anchor, that marker is rewritten rather than a second one added:
   the plan's rule as written (leave every marker of mine alone) would put two
   bindings for one anchor on one passage, which `erf_narrative_bind` itself
   refuses to create without `replace`. Nothing the person typed is touched
   either way.

2. **The banner also appears when nothing merged.** WP4 says the banner shows
   "only when `conflicts` is non-empty". But a digest that changed with no
   marker to merge and nothing to conflict means the change on disk was not a
   binding at all: a person editing the file in another editor, most likely.
   Force-saving over that would be exactly the overwrite this work package
   exists to remove, so that case raises the banner too, saying the change was
   not a binding. Conflicts and non-bindings are the two things the two buttons
   are for; a merge that placed something and conflicted with nothing never
   raises it.

3. **`mergeChanges` beside `mergeMarkers`.** The plan specifies
   `mergeMarkers(mine, theirs) -> {text, inserted, conflicts}`, which exists and
   is what the tests exercise. Applying it in the editor by replacing the whole
   document would be one undoable edit, as asked, but would throw away the
   cursor and the selection of the person typing. `mergeChanges` returns the
   same merge as ranges, `mergeFrom` dispatches those as one transaction, and
   `mergeMarkers` is written in terms of it, so the two can never disagree.

4. **`pendingSave` remembers whether the deferred save was a `force`.** WP5
   describes a plain flag. A flag alone would silently downgrade the one save
   that must not be downgraded: the Overwrite button, or the write that follows
   a merge. The pending state carries the `force` with it.

One thing outside the plan: `erf_source_add` now returns the opening of the
held text when `find` matched nothing, rather than only saying there was no
match as `erf_source_read` does. The point of the change is that a quote can be
chosen without a second call, and a bare "no match" guarantees that second call.
