# validator

Maintained validators, one folder per serialization and one per language under it. A validator belongs to a serialization (`SPEC.md` section 7): it reads that serialization's bytes, loads them into the model, and checks both, saying which it is reporting.

| Serialization | Language | Folder | Status |
|:--|:--|:--|:--|
| YAML/Markdown (`serialization/yaml-markdown.md`) | TypeScript | [`yaml-markdown/typescript/`](yaml-markdown/typescript/) | the reference; the conformance suite tests it |

Cold-built validators, written from the specification alone to test the document rather than to be used, are not here; they are in `reviews/` and listed in `IMPLEMENTATIONS.md`.
