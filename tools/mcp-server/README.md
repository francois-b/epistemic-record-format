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

## The app

`erf_view` opens a page of the corpus inside the conversation (Claude Desktop and other MCP Apps hosts): the corpus, a claim with its evidence and standings, the narrative with its bound passages. Rebuild the bundle after changing `app/`: `npm run build:app`.

## What it refuses

A quote not in the held text (the nearest passage comes back), a source not captured, a reference to a record that does not exist, a standing without a why, an edit to a standing, a URL when fetching is off, a survey with no search acts, a raw file write of any kind. Each refusal names the requirement.

## Tests

`npm test` here: every tool's output loads clean under the reference validator, and every refusal fires. The fixture is a temporary copy of `examples/corpora/minimal`.
