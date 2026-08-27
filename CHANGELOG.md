# Changelog

Changes to numbered requirements, by version, newest first. Requirement ids
are stable from 0.9.0: a new requirement takes the next unused number, a
retired id is never reused, and a change to what a requirement means lands
here with its date. The work behind each version is in
[`docs/design-history.md`](docs/design-history.md); the commits are the record of
everything else.

## Unreleased

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
