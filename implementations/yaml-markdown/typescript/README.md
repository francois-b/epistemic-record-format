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

- `read.ts`: bytes to documents. The fence (`YAMLB-3`), frontmatter under YAML 1.2's JSON profile with anchors, aliases, tags and duplicate keys refused (`ERF-65`, `ERF-66`), the walk over a folder, the narrative-binding marker (`YAMLB-1`).
- `validate.ts`: documents to a checked model. `loadCorpus` validates every document against the schema (`ERF-73`) and the invariants that span records (section 6), and materializes `ERF-56`'s total lists into the in-memory types this package exports.
- `compute.ts`: the readings the specification defines, from the model alone: disposition, backing, the quote check and its fold, staleness, references, argument closure. Implemented from the specification text and held to the conformance cases.
- `write.ts`: model to bytes. The one serializer: string scalars quoted, empty lists omitted, present-and-empty mappings as `{}`, the fence. Checked by round trip through `validate.ts`.
- `erf-check.ts`: the command line, built on the four.

Build: `npm run build` (emits `dist/` with types; `prepack` runs it). The viewer in `tools/viewer/` renders what this package computes and adds nothing to it.
