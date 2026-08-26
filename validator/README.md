# erf-check

The reference validator: the one implementation of the format this repository maintains, and the code the conformance suite tests.

```
cd validator
npm install
npx tsx erf-check.ts ../examples/corpora/minimal
```

VIOLATION lines are conformance findings, FLAG lines are the computed flags, QUOTE lines are the quote check per atom; exit 1 on any violation. From the repository root, `npm run check -- <corpus-dir>` is the same command.

- `corpus.ts` loads a corpus: every document validated against `schema/erf.schema.json` at load time (`ERF-73`), ids checked, `ERF-56`'s total lists materialized into the in-memory types this folder exports.
- `compute.ts` derives every reading the specification defines (disposition, backing, the quote check and its fold, staleness, references, argument closure), implemented from the specification text and held to the conformance cases.
- `erf-check.ts` is the command line over both.

The viewer in `tools/viewer/` renders what this folder computes and adds nothing to it. Why TypeScript, and what is computed from which rule: `tools/viewer/README.md`.
