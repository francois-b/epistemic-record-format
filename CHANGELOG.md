# Changelog

Changes to numbered requirements, by version, newest first. Requirement ids
are stable from 0.9.0: a new requirement takes the next unused number, a
retired id is never reused, and a change to what a requirement means lands
here with its date. The work behind each version is in
[`docs/history.md`](docs/history.md); the commits are the record of
everything else.

## Unreleased

No requirement changed. Repository layout, 2026-08-26: the data model moved
to `schema/erf.schema.json` with `schema/erf.ts` generated from it (a
pre-commit hook regenerates it; `tools/generate-types.py --check` is the
gate); the reference validator is `validator/` and the viewer over it is
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

## 0.9.0 — 2026-08-26

First published version: forty-nine requirements, five of them in the
YAML/Markdown binding, and twenty-six retired ids listed under change
control in `SPEC.md`.
