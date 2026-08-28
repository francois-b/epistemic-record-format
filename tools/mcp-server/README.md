# erf-mcp

The Epistemic Record Format as a local MCP server: root folders holding corpora, one corpus active at a time, the server as the only writer, the reference validator as the oracle for every reading. Design and the full tool table: [`DESIGN.md`](DESIGN.md).

```
cd tools/mcp-server && npm install
npx tsx src/index.ts <root-dir> [<root-dir> ...] [--agent agent/<name>] [--fetch] [--no-commit]
```

A root may be a corpus folder or a folder holding several; corpora are found by their `corpus.yaml`. From the repository root, `npm run mcp -- <root-dir>` is the same command. When a host launches the server from another directory, pass `--tsconfig <path to tools/mcp-server/tsconfig.json>` before the script: the server imports the implementation by package name, resolved through that file. Fetching URLs is off unless `--fetch` is given; without it, `erf_source_add` takes only a file already inside the corpus folder. If the folder is a git repository the server commits its own writes as you.

## Claude Desktop

Add to `claude_desktop_config.json` (Settings > Developer > Edit Config), then restart Desktop. The key is the name Desktop shows for the connector:

```json
"Epistemic Record Format": {
  "command": "/absolute/path/to/epistemic-record-format/tools/mcp-server/node_modules/.bin/tsx",
  "args": ["--tsconfig", "/absolute/path/to/epistemic-record-format/tools/mcp-server/tsconfig.json",
           "/absolute/path/to/epistemic-record-format/tools/mcp-server/src/index.ts",
           "/absolute/path/to/your/corpora", "--agent", "agent/claude-desktop", "--fetch"]
}
```

## Claude Code

```
claude mcp add erf -- /absolute/path/to/tools/mcp-server/node_modules/.bin/tsx --tsconfig /absolute/path/to/tools/mcp-server/tsconfig.json /absolute/path/to/tools/mcp-server/src/index.ts /absolute/path/to/your/corpora --agent agent/claude-code --fetch
```

## The tools

Corpora: `erf_corpus_list`, `erf_corpus_use`, `erf_corpus_init`, `erf_corpus_check`. Capture and evidence: `erf_source_add` (which logs the search that found the page and returns the passage to quote from), `erf_atom_mint` (one atom, or every atom for a source in one call), `erf_search_log`, `erf_survey_record`, `erf_source_read`. Claims: `erf_claim_mint`, `erf_claim_update`, `erf_claim_stand`. Narratives: `erf_narrative_bind`, `erf_narrative_check`, `erf_narrative_read`, `erf_narrative_write`, `erf_narrative_status`. Flags: `erf_flag`, `erf_flags`, `erf_flag_take`, `erf_flag_resolve`. Reading and showing: `erf_record_read`, `erf_record_list`, `erf_render_site`, `erf_view`. What each does and what it refuses: [`DESIGN.md`](DESIGN.md).

## The app, and the editor

`erf_view` opens a page of the corpus inside the conversation (Claude Desktop and other MCP Apps hosts): the corpus, a claim with its evidence and standings, the narrative with its bound passages.

A narrative opened fullscreen is an editor, not a page. The app reads the file with `erf_narrative_read`, mounts the CodeMirror editor from [`../editor/`](../editor/README.md) over its markdown source, and saves through `erf_narrative_write`, which refuses a write whose digest no longer matches the file on disk and runs the narrative check on every save. Flagged passages are underlined, bound passages are marked by status (current, stale, broken), each binding marker collapses to a diamond that expands when the cursor enters it, and hovering a bound passage lists the claims it rests on with their kind and disposition.

A narrative can be open here while another worker (another chat, another session, an agent) binds a passage of it. What lands from elsewhere is merged rather than chosen over: a binding marker is the only thing another worker writes into a narrative, so its markers are placed on the passages their anchors name and everything typed here is kept. The banner is left for what merging cannot settle: an anchor whose words were rewritten here, or a change on disk that is not a binding. One write is in flight at a time, and a flag on words just typed saves them first.

Selecting a passage offers **Flag**, which asks in one popover what should happen to it: propose the claims and stop for a ruling (`mint`), back it once the claims are ruled (`back`), or back it and search for the opposite as well (`opposite`). The flag carries that choice, and for `back` and `opposite` the app also puts one line into the conversation, so the loop starts in the same chat while the person stays in the editor. While such a flag is open the app polls `erf_narrative_status`, which is a local read: when the passage is bound the flag resolves and the decoration changes under the cursor. The status line opens into the research trail behind the flag, the searches logged and the captures each led to, held or refused, then the atoms and claims, as they land; the same trail appears on survey and claim pages as "How this was found".

Rebuild the bundle after changing `app/`, `../editor/`, or the viewer's stylesheet: `npm run build:app`. The bundle is committed, so nothing builds at run time.

## What it refuses

A quote not in the held text (the nearest passage comes back), a PDF with no text layer (OCR is not done), a source not captured, a reference to a record that does not exist, a standing without a why, an edit to a standing, a URL when fetching is off, a survey with no search acts, a raw file write of any kind. Each refusal names the requirement.

## Previewing the app

To look at what the app shows for a page without a screenshot from Claude Desktop:

```
npx tsx scripts/preview-app.ts <corpus-dir> <page> [--mode inline|fullscreen] [--theme dark|light] [--out <dir>] [--serve <port>]
```

`page` is what `erf_view` or `erf_proposals` would show: `index`, `sources`, `health`, `claim:<id>`, `atom:<id>`, `capture:<id>`, `survey:<id>`, `narrative:<slug>`, `proposals[:<flag>]`. The script computes the tool's structured content in-process and writes a page that hosts the real app bundle in an iframe behind a real `AppBridge` (`@modelcontextprotocol/ext-apps/app-bridge`) over a postMessage transport, so the app runs the code it runs in Desktop: initialize, host context (theme, display mode, safe-area insets, the design guide's style tokens), the tool result delivered the way a host delivers it. `sendMessage`, `updateModelContext`, `openLink` and display-mode requests are logged under the frame. Without `--serve` the page is written to a file and the app's tool calls are refused with a notice; with `--serve` it is served on localhost and the app's read-only calls (`erf_view`, `erf_proposals`, `erf_narrative_read`, `erf_narrative_status`, `erf_record_read`, `erf_flags`) are answered from the corpus. Writes are refused either way: a preview never touches a corpus, so point it at a copy when in doubt. What the host draws around the app (its header, composer, animations) is not previewed.

## Tests

`npm test` here: every tool's output loads clean under the reference validator, and every refusal fires. The fixture is a temporary copy of `examples/corpora/minimal`. `npm run typecheck` covers `src/`, `app/` and `../editor/src/`. The editor's own arithmetic is tested separately, without a DOM: `npm run test:editor` from the repository root.
