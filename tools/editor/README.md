# erf-editor

A markdown editor over a narrative's source, with the record drawn on top of
it: flagged passages underlined, bound passages marked with what they rest on,
binding markers collapsed to a diamond that expands when the cursor enters it.

It is host-agnostic on purpose. It knows how to show text, where a flag and a
binding sit in it, and when the person selected something or asked to save. It
calls no tool, fetches nothing, and decides nothing about what a gesture means:
the host does that through the handle. The MCP app under
`tools/mcp-server/app/` is its first host, by relative import; a native
application with a web view can be its second without a rewrite. If it becomes
its own repository, this folder moves as a unit.

## The interface

```ts
import { createEditor } from "../../editor/src/index.ts";

const ed = createEditor(container, fileText, { autosaveMs: 2000 });
ed.setMarks({ flags, bindings });         // returns { missing } : anchors the prose moved under
ed.onSelectionChange((sel) => { … });     // { text, anchor, rect } or null
ed.onSave((text) => { … });               // Cmd/Ctrl-S, and 2 s after the last keystroke
ed.getText();                             // the file, markers and frontmatter included
ed.setText(text);                         // reload from disk
ed.isDirty(); ed.markSaved(); ed.destroy();
```

`flags` and `bindings` are the shapes `erf_narrative_read` and
`erf_narrative_status` return. Anchors are located as exact substrings of the
document, markers masked so a marker never matches its own anchor; an anchor
that no longer occurs is skipped and named in `missing`.

## Why CodeMirror, and why the source

The editor works on the markdown source, so binding markers (HTML comments),
footnotes and frontmatter round-trip byte for byte by construction: nothing is
parsed into a document model and serialized back. Decorations make it readable.
There is no typography here on purpose: a monospace face, a comfortable measure,
and whatever structural highlighting the markdown parser gives for free.

## Layout

- `src/marks.ts` : the arithmetic. Pure functions over the document as a
  string, no CodeMirror and no DOM. Where an anchor sits, what paragraph holds
  it, which class a binding status takes, what a tooltip says.
- `src/index.ts` : the view. CodeMirror wiring and nothing else, kept thin
  because it is the part that is not unit-tested.
- `test/marks.test.ts` : `node --test tools/editor/test/marks.test.ts`, or
  `npm run test:editor` from the repository root.

Dependencies (`@codemirror/*`, `@lezer/highlight`) are declared in the
repository root `package.json`; esbuild resolves them from there when the app
bundle is built. Types: `tools/mcp-server/node_modules/.bin/tsc -p
tools/editor/tsconfig.json`.
