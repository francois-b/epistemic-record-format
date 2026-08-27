---
title: "Plan: an editor in the app, and flags that carry a research request"
purpose: "A self-contained work order for one Claude Code session: put a CodeMirror editor under the narrative in fullscreen, let a selection become a flag with a research option, send that request into the conversation, and show the result on the passage when it lands. No typography, no tree page, no Bookeh."
status: plan
last_updated: 2026-08-27
---

# Plan: an editor in the app, and flags that carry a research request

Read this whole file before touching anything. Then read `tools/mcp-server/DESIGN.md`, `tools/mcp-server/app/main.ts`, `tools/mcp-server/src/tools.ts`, `tools/mcp-server/src/index.ts`, `tools/mcp-server/src/corpus.ts`, `docs/patterns/narrative-backing-loop.md`, and run the tests once (`cd tools/mcp-server && npm test`) so you know the green state before you start.

## What this builds

Today the app shows a narrative read-only in fullscreen; a selection offers one gesture, Back this, which writes a flag and asks the host to open the passage in chat. After this plan:

1. A narrative opened fullscreen is an **editor** (CodeMirror 6, markdown mode, plain monospace or system font, no typography work). Save goes through the server, which runs the narrative check and reports stale or broken bindings.
2. A selection offers **Flag**, with a small popover: what to do (`mint` only; `back` it with research; `opposite`, back it and search for the opposite) and an optional note. The flag record carries that choice.
3. Choosing `back` or `opposite` also **sends one message into the conversation** (`app.sendMessage`) so the host LLM starts the loop in the same chat. The user stays in the editor.
4. While a request is in flight the editor **polls** the server (no LLM involved) and shows a small status line. When the passage gets bound, the flag resolves, the decoration changes from flagged to bound, and hovering the passage shows the claims it rests on, with kind and disposition.

Everything the LLM does still goes through the existing `erf_*` tools. The editor writes exactly one kind of file: the narrative. Records are written only by tools the LLM calls, with the user ruling in chat, as now.

## Where it lives

Inside this repository for now. The editor is built as its own folder, `tools/editor/`, a host-agnostic browser bundle with a small interface, so the MCP app is its first host and Bookeh (a native app with a web view) can be its second without a rewrite. If it later becomes its own repository, that folder moves as a unit. The MCP app under `tools/mcp-server/app/` imports it by relative path.

Decisions already taken; do not reopen them:

- **CodeMirror 6, not ProseMirror.** The editor works on the markdown source, so binding markers (HTML comments), footnotes and frontmatter round-trip byte-exact by construction. Decorations make it readable; no document model, no markdown bridge.
- **No typography in this plan.** A readable monospace or system font, comfortable line length and line height, that is all. Headings are not sized; emphasis is not rendered. Syntax highlighting from `@codemirror/lang-markdown` is fine if it comes free.
- **The trigger is `sendMessage`.** MCP sampling and elicitation are not assumed to exist in the host. The app posts a message the user could have typed; the LLM replies in the conversation.
- **The app never pushes records.** Polling is read-only, cheap, local.

## Work packages

WP0: commit this plan file on its own first (`Plans: editor and flag research, work order`), so the work packages' commits stay thematic. Then commit at the end of each package, in the log's existing style (`MCP server: …`, `MCP app: …`, `Editor: …`, `Patterns: …`). Never push. Tests green and `npm run typecheck` clean before each commit; `npm run build:app` re-run whenever `app/`, `tools/editor/`, or the viewer stylesheet changed (the bundle is committed).

### WP1. Server: read, write, status, and a research option on flags

In `src/corpus.ts`:

- `Flag` gains `research?: "mint" | "back" | "opposite"` (absent means `mint`) and keeps `note`. Existing flags without the field still parse.

In `src/tools.ts` (and registered in `src/index.ts` with the same `on()` wrapper, `corpus` argument, and coercions as the other tools):

- `erf_narrative_read { narrative }` → `{ narrative, path, title, text, digest, bindings: [{ anchor, claims, bound_at, status: "current" | "stale" | "broken" | "missing-claim", line }], flags: [{ id, anchor, note, research, status, claims, line }] }`. `text` is the file as on disk, frontmatter included. `digest` is sha256 of the bytes, first 12 hex chars. `line` is the 1-based line where the anchor is found, or null. Binding status comes from the same logic `narrativeCheck` uses; factor a helper so the two cannot disagree.
- `erf_narrative_write { narrative, text, expected_digest?, force? }` → writes the narrative file only if `expected_digest` matches the file on disk (or is absent, or `force`), runs the narrative check for that narrative, commits (`commit()` as other writes do), returns `{ written, digest, check }` where `check` is the same shape `erf_narrative_check` returns for one narrative. On digest mismatch: refuse, return the current digest, do not write. Frontmatter is preserved as sent; the tool does not parse or rewrite the text.
- `erf_narrative_status { narrative }` → `{ digest, flags, bindings }` with the same item shapes as `erf_narrative_read`, without `text`. This is the polling call. No git, no LLM, no logging beyond `trace()`.
- `erf_flag` gains `research` and validates it. Description tells the LLM what each value asks for.
- `erf_flags` output lists `research` per flag.

Server instructions (`INSTRUCTIONS` in `src/index.ts`): add two sentences. A flag's `research` says what the user asked for: `mint` means propose claims and stop for ruling; `back` means after the ruling, back each accepted observation (log, capture, atoms, survey if it is a gap) and bind; `opposite` means additionally state the strongest case against before anyone stands. While the user has the editor open, answer in text and do not call `erf_view` to re-open the narrative; the editor refreshes itself.

The `work-the-flags` prompt honours `research` the same way.

Tests (`tests/tools.test.ts`): read returns digest and located anchors; write refuses on stale digest and writes on match; write returns the check with a stale binding after a claim update; status reflects a flag resolved by a binding; a flag with `research: "opposite"` round-trips through `erf_flags`.

### WP2. Editor: `tools/editor/`

A browser bundle with no host knowledge. Dependencies: `@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/lang-markdown`, `@codemirror/commands`, `@lezer/highlight`. Add them to the repository root `package.json` (the workspace already builds the app with esbuild from there; check how `tools/mcp-server/scripts/build-app.ts` resolves modules and follow it).

`tools/editor/src/index.ts` exports:

```ts
export interface Marks {
  flags: { id: number; anchor: string; research?: string; status: "open" | "done"; claims?: string[]; note?: string }[];
  bindings: { anchor: string; claims: string[]; status: string; claimInfo?: Record<string, { title: string; kind: string; disposition: string; evidence: number }> }[];
}
export interface EditorHandle {
  setText(text: string): void;           // replaces the document (used on reload)
  getText(): string;
  setMarks(m: Marks): void;              // recomputes decorations
  onSelectionChange(cb: (sel: { text: string; anchor: string; rect: DOMRect } | null) => void): void;
  onSave(cb: (text: string) => void): void;   // Cmd/Ctrl-S and debounced autosave
  destroy(): void;
}
export function createEditor(parent: HTMLElement, text: string, opts?: { autosaveMs?: number }): EditorHandle;
```

Behaviour:

- Decorations, all computed from `Marks` by locating each anchor as an exact substring in the document (first occurrence; a missing anchor is skipped and reported through a `missing` list on `setMarks`'s return value):
  - open flag: an underline class `erf-flag-open`; a done flag: `erf-flag-done`.
  - a binding's passage (the sentence or paragraph that contains the anchor; use the paragraph as a first cut): class `erf-bound`, or `erf-bound-stale` / `erf-bound-broken` by status.
  - the binding marker itself (`<!-- claims: … -->`) collapsed to a small replacement widget (`◆` or the count of claims) that expands to the raw marker when the cursor enters it. Never hide it from `getText()`.
  - hover on a bound passage or its widget: a tooltip listing each claim id, title, kind, disposition and evidence count from `claimInfo` when present, else the ids.
- Anchor extraction for a selection: the selected text trimmed, collapsed whitespace, cut to at most 12 words; the handle reports it and the host decides whether it is unique (the server checks anyway).
- Autosave: 2 s after the last change, plus Cmd/Ctrl-S. The handle only calls back; the host saves.
- Pure functions (anchor location, paragraph range, mark-to-range computation) live in `tools/editor/src/marks.ts` and are unit-tested with `node --test` without a DOM. The CodeMirror view code stays thin and untested.

Keep the bundle under 600 KB minified; report the size in the commit message.

### WP3. App: the editor in fullscreen, the popover, the request, the status line

In `tools/mcp-server/app/`:

- When a narrative page is shown fullscreen, mount the editor with the text from `erf_narrative_read` instead of the rendered HTML. Inline stays as it is (the outline). The existing mode toggle still works; leaving fullscreen with unsaved changes saves first.
- Save: on the handle's `onSave`, call `erf_narrative_write` with the last known digest; on success store the new digest and pass the returned check into `setMarks`; on digest refusal show a banner ("changed on disk; reload or overwrite") with two buttons that do exactly that.
- Selection toolbar: **Flag** opens the popover (research: mint / back / opposite; note field; a Flag button). Submitting calls `erf_flag` with `research` and `note`, then `setMarks` from `erf_narrative_status`. For `back` and `opposite`, then call `app.sendMessage` with one line, for example: `Back flag #7 in "<title>" (opposite requested): "<anchor>". Propose the claims first and stop for my ruling.` Keep the existing **Back this** as a shortcut equal to Flag with `research: "back"`.
- After any `sendMessage`, and whenever a flag with `research` other than `mint` is open, poll `erf_narrative_status` every 3 s for up to 15 minutes, then every 30 s. Stop when no such flag is open. A status line in the header shows `researching #7` while open and `#7: bound to 2 claims` for a few seconds after it resolves; when the digest changes underneath an unmodified editor, reload the text silently; when it changes underneath a modified one, show the banner.
- `updateModelContext` after a flag, as now, with the research option in the text.
- Theme: use the same variables as the viewer; no new palette.

Rebuild the bundle. Update `app/template.html` only if the editor needs a container the template lacks.

### WP4. Docs

- `tools/mcp-server/DESIGN.md`: a section "The editor (2026-08-27)" stating what was built, the host interface, the polling rule, and why CodeMirror. Keep the tone of the existing sections.
- `docs/patterns/narrative-backing-loop.md`: in steps 1, 3 and 9 the tooling lines mention the editor (flag from a selection with a research option; the request sent into the conversation; the prose edited in the app's editor with the check on save). One sentence in "What this pattern does not decide" stays true: where prose is edited is still the person's choice; the app's editor is one option.
- `docs/patterns/README.md`: no new pattern; nothing to add unless a sentence about tooling is needed.
- `CHANGELOG.md` Unreleased: erf-mcp gains the three narrative tools and the research option; the app gains the editor. Bump erf-mcp's version in `src/index.ts` and `implementations.yaml` to 0.3.0 (the registry lint will tell you the exact places; it runs in the pre-commit hook).
- `tools/mcp-server/README.md`: the tool list and a paragraph on the editor.

### WP5. Verification and hand-off

Automated, must all pass before the last commit: `npm test` in `tools/mcp-server`, the editor's `node --test`, `npm run typecheck`, `python3 tools/lint/lint-versions.py`, the conformance suite from the repository root (unchanged by this plan; confirm it still passes), `npm run build:app`.

Manual, which you cannot do and must not claim: the Desktop checks below. Write them at the end of this file under "Hand-off checklist" with the exact steps, and stop.

Hand-off checklist (fill in with real steps and expected results):

1. Restart Claude Desktop so the new bundle loads. Start a new chat.
2. "Open the essay in the ERF viewer" → fullscreen → the editor shows the markdown; a binding marker appears collapsed; hover shows the claim.
3. Type a character, wait 2 s → the status line shows saved; `git log` in the corpus shows the commit.
4. Select a passage → Flag → `back` → the passage underlines; the chat receives the request; the LLM proposes claims; the editor stays open.
5. Rule in the chat; the LLM mints and binds; within a few seconds the passage turns bound and the flag resolves.
6. Edit the bound passage's words → the decoration turns stale/broken after save.
7. Note anything Desktop did that the plan did not expect (the app collapsing during a long turn, a second card opening) in DESIGN.md under findings.

## Constraints

- Never `git push`. Commit locally per work package.
- Do not modify `SPEC.md`, `schema/`, `serialization/`, `implementations/`, or `conformance/`. This plan touches tooling and patterns only.
- Do not modify anything under `~/dev/isomorphic-app` or `~/dev/fb-epistemology-imc`. Use `examples/corpora/minimal` and the test fixtures for all testing.
- Prose in every document and commit message: no em dashes in running text; write "LLM" for the language model, never bare "model"; never write the hyphenated compound of "load" and "bearing" (say "essential" or name the dependency).
- If a step is impossible as written, do every other step, then write what was left out and why under a "Deviations" heading at the end of this file. Do not silently narrow.
- Existing tests keep passing; existing tool signatures keep working (the Desktop connector on this machine is configured against them).

## Out of scope, on purpose

Typography; the claims tree page; Bind to… and Rewrite gestures; the unbound-passages report; the `.mcpb` bundle and the plugin; the Bookeh host; any change to the format.
