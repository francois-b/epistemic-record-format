# implementations

Maintained implementations of the format, one folder per serialization and one per language under it. An implementation belongs to a serialization (`SPEC.md` section 7): it reads that serialization's bytes into the model, validates both the bytes and the model, computes the readings the specification defines, and writes records back out. The `erf-check` command is one product of the TypeScript one.

| Serialization | Language | Folder | Status |
|:--|:--|:--|:--|
| YAML/Markdown (`serialization/yaml-markdown.md`) | TypeScript | [`yaml-markdown/typescript/`](yaml-markdown/typescript/) | the reference; the conformance suite tests it; npm `@epistemic-record-format/validator-yaml-markdown` |

Cold-built validators, written from the specification alone to test the document rather than to be used, are not here; they are in `reviews/` and listed in `IMPLEMENTATIONS.md`.
