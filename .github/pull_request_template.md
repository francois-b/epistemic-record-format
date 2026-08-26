## What this resolves

Name the finding or the backlog entry, by id, and link the file:
`docs/findings/F-0nn-*.md` or `docs/backlog/B-nn-*.md`. A change to the
specification normally has one. If it has none, say why here: an editorial
fix, a new instrument, or something that has not been through the gates yet
and should say so plainly.

- Finding or backlog entry:
- If neither, why:

## What changed

One line per requirement id added, changed, or retired, and one per notable
tooling change. This is the text that goes into `CHANGELOG.md`, so write it
the way it should read there.

## Gates

Green before review. The suite shells out to the linters, so a green suite
covers those; run them alone when only prose changed.

- [ ] `cd validator/yaml-markdown/typescript && npx tsc --noEmit` and `cd tools/viewer && npx tsc --noEmit`
- [ ] `cd conformance && npx tsc --noEmit`
- [ ] `cd conformance && npm test`
- [ ] `python3 tools/lint-spec-style.py SPEC.md`
- [ ] `python3 tools/lint-spec-style.py bindings/yaml-markdown.md`
- [ ] `python3 tools/lint-field-names.py`
- [ ] `python3 tools/generate-types.py --check`
- [ ] Generated indexes regenerated, if their inputs moved:
      `python3 tools/backlog-index.py`, `python3 tools/requirements-index.py`

If a conformance case failed, say which and what you decided. A failing test
is a finding about an implementation, never an expectation to edit.
