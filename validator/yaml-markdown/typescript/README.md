# @epistemic-record-format/validator-yaml-markdown

The reference validator for the Epistemic Record Format, YAML/Markdown serialization, as a library and a command line. The one implementation this repository maintains, and the code the conformance suite tests.

```
npm install @epistemic-record-format/validator-yaml-markdown
npx erf-check <corpus-dir>
```

```ts
import { loadCorpus, disposition, quoteCheck, SPEC_VERSION } from "@epistemic-record-format/validator-yaml-markdown";
const c = loadCorpus("./my-corpus");          // every document validated against the schema
for (const claim of c.claims.values()) console.log(claim.id, disposition(claim).disposition);
```

The schema this build implements ships with the package: `import schema from "@epistemic-record-format/validator-yaml-markdown/schema"` (JSON Schema 2020-12, the same bytes as `schema/erf.schema.json` at the spec version in `SPEC_VERSION`). Package versions are the implementation's own; `package.json` names the spec version it implements under `erf.spec_version`.

`erf-check` prints VIOLATION lines (conformance findings), FLAG lines (computed flags), QUOTE lines (the quote check per atom), and exits 1 on any violation. From the repository root, `npm run check -- <corpus-dir>` runs the same code from source.

- `corpus.ts` loads a corpus: every document validated against the schema at load time (`ERF-73`), ids checked, `ERF-56`'s total lists materialized into the in-memory types this package exports.
- `compute.ts` derives every reading the specification defines (disposition, backing, the quote check and its fold, staleness, references, argument closure), implemented from the specification text and held to the conformance cases.
- `erf-check.ts` is the command line over both.

Build: `npm run build` (emits `dist/` with types; `prepack` runs it). The viewer in `tools/viewer/` renders what this package computes and adds nothing to it.
