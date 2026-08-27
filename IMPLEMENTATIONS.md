---
title: "Implementations"
purpose: "Who has built to this specification: the maintained implementations, and the cold trials that were built to test the document rather than to be used."
status: non-normative
generated: 2026-08-26
model: claude-opus-5
---

# Implementations

Two tables, and the distinction between them matters. The first is software
somebody maintains. The second is what was built once, from the specification
alone, to find out whether the specification says enough, and then left where
it was built.

## Implementations

None yet, other than the reference validator in [`implementations/yaml-markdown/typescript/`](implementations/yaml-markdown/typescript/) and the viewer over it in [`tools/viewer/`](tools/viewer/), which are
part of this repository and therefore not an independent reading of it. 1.0
waits on implementations other than the author's.

The machine-readable list, with each artifact's versioning policy, is
[`implementations.yaml`](implementations.yaml); the pre-commit hook checks it.

| Name | Language | Spec version | Conformance classes | Link |
|---|---|---|---|---|
| `@epistemic-record-format/validator-yaml-markdown` 0.9.x (`erf-check`), the reference | TypeScript | 0.9.0 | corpus, consumer; the conformance suite runs against it | [`implementations/yaml-markdown/typescript/`](implementations/yaml-markdown/typescript/), npm `@epistemic-record-format/validator-yaml-markdown` |

**To add yours**, open a pull request adding a row: the name, the language,
the specification version you built against, which conformance classes you
claim (Record, Corpus, Producer, Consumer, Validator, defined in `SPEC.md`
section 1), and a link. Run `conformance/` against it first, starting with
`conformance/cases/quote-check.tsv`. Nobody vets a row; it says what you
claim, and the suite is what checks it.

## Independent trial implementations

Each of these was built from the specification and nothing else: no reference
implementation, no conformance fixtures, no example corpus, no git history.
They exist to test the document, and they are **not maintained**. Several were
built against text that has since been rewritten in response to what they
found, so a trial disagreeing with the specification at HEAD is the expected
result rather than a defect. Each folder holds the trial's own friction log
and its list of ambiguities, which are the actual output; the code is the
instrument.

| Trial | Language | Date | Read | What it found |
|---|---|---|---|---|
| [`01-independent-implementation`](reviews/2026-08-25-independent-trials/01-independent-implementation/) | Python | 2026-08-25 | `SPEC.md`, v0.9.0 draft | Against the reference's 21 fixtures: 19 exact agreements, 2 partial with defensible readings on both sides. Its ambiguity list seeded the first backlog entries. |
| [`05-independent-implementation-rust`](reviews/2026-08-25-independent-trials/05-independent-implementation-rust/) | Rust | 2026-08-25 | `SPEC.md`, v0.9.0 draft | 91 friction entries, 15 judged genuine defects, and 25 places where the prose determined no type and the implementer had to choose. |
| [`06-independent-implementation-sql`](reviews/2026-08-25-independent-trials/06-independent-implementation-sql/) | SQL (SQLite) | 2026-08-25 | `SPEC.md`, v0.9.0 draft | `ERF-53`'s round-trip clause never defined "without loss", and three defensible readings gave three different verdicts on the same corpus. 27 tables, 40 constraint probes. |
| [`python-implementation`](reviews/2026-08-25-corrected-spec-trials/python-implementation/) | Python | 2026-08-25 | Snapshot at commit `69db400` | Nine fabrication attempts against the corrected quote check and **eight passed**: the whole-words rule had stopped the original attack and nothing else. 28 ambiguities remained across the seven rewritten requirements. |
| [`swift-implementation`](reviews/2026-08-25-corrected-spec-trials/swift-implementation/) | Swift | 2026-08-25 | Snapshot at commit `69db400` | Nineteen fabrication attempts, eleven passed, five of them real. The narrative-binding grammar's `id` production could swallow the next binding, and the loss definition excluded its own example. |
| [`go-implementation`](reviews/2026-08-25-post-ruling-trials/go-implementation/) | Go | 2026-08-25 | Snapshot at commit `64b0921` | 59 of 66 requirements implemented, 29 ambiguities, and `F-008`: an elided quote whose spans match mid-word passes the quote check, so a source can be made to say what it never said. |
| [`haskell-implementation`](reviews/2026-08-25-post-ruling-trials/haskell-implementation/) | Haskell | 2026-08-25 | Snapshot at commit `64b0921` | 54 requirements, 28 ambiguities, 17 illegal states made unrepresentable by the types, and `F-009`: `ERF-43` did not terminate as written. |
| [`protobuf-schema`](reviews/2026-08-25-post-ruling-trials/protobuf-schema/) | proto3 | 2026-08-25 | Snapshot at commit `64b0921` | The data model as a wire schema: 20 messages, 123 fields, and 45 of the 66 rules inexpressible in one. Raised `F-011` and `F-013`. |
| [`ruby-implementation`](reviews/2026-08-25-post-ruling-trials/ruby-implementation/) | Ruby | 2026-08-25 | Snapshot at commit `64b0921` | **Stopped** before the validator was built, as a duplicate of the Python trial's lens. Its parser probe survived and was worth more: Psych retypes mapping keys as it does scalars, which became `F-007` and the quoting obligation on `ERF-65`. |
| [`rust-validator`](reviews/2026-08-25-schema-spec-trials/rust-validator/) | Rust | 2026-08-25 | Snapshots at commit `7907dda`, specification plus schema plus binding | 46 violation checks, 27 flags, and 33 checks it declared it did not perform. 18 fabrication attempts, 11 blocked; 29 ambiguities, three ruled the same day; raised `F-017`. |
| [`rust-validator`](reviews/2026-08-26-standards-fold-trials/rust-validator/) | Rust | 2026-08-26 | Snapshots at commit `d124820` | Addressed all 66 ids. 21 fabrication attempts, 14 stopped and 6 green by design. 38 ambiguities, of which: `ERF-51` step 3 collapsed the separator step 1 had inserted, and nothing made a false digest a violation. |

Two further cold trials authored corpora rather than code, and are the same
kind of evidence about a different audience: whether a reader can produce
correct records from the prose. They are
[`2026-08-25-schema-spec-trials/essay-corpus`](reviews/2026-08-25-schema-spec-trials/essay-corpus/)
(133 atoms, 70 claims) and
[`2026-08-26-standards-fold-trials/bitter-lesson-corpus`](reviews/2026-08-26-standards-fold-trials/bitter-lesson-corpus/)
(115 atoms, 32 claims), alongside the two authoring trials in
[`2026-08-25-independent-trials`](reviews/2026-08-25-independent-trials/).
[`reviews/README.md`](reviews/README.md) is the index of all of it.
