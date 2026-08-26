# `erfval` — a cold Swift implementation of the Epistemic Record Format

A command-line validator for a corpus held in the YAML/Markdown binding,
version 1. Written from `SPEC-as-tried.md` and `BINDING-as-tried.md` alone, on
2026-08-25, with no access to any reference implementation, conformance case,
example corpus or type file in this repository.

Findings are in **[`ambiguities.md`](ambiguities.md)**; the working log is in
**[`friction-log.md`](friction-log.md)**.

## Build and run

Requires the Swift toolchain (developed against Apple Swift 6.2.3, macOS,
x86_64). No external dependencies.

```
swift build
.build/debug/erfval <corpus-directory> [options]
```

Options:

| flag | effect |
|:--|:--|
| `--dispositions` | print each claim's computed disposition with its ERF-41 trace |
| `--quote-trace` | print the span-by-span trace of every ERF-52 quote check |
| `--bindings` | print every narrative binding with its computed passage |
| `--model-dump` | print the canonical model instance — the ERF-53 loss probe |
| `--comment-first` | switch ERF-31 to the competing marker-delimitation reading |
| `--quiet` | suppress INFO findings |

Exit status is 1 if the corpus carries a violation and 0 otherwise. **A flag is
not a violation** (section 1): a corpus carrying flags and no violations
conforms, and `erfval` exits 0 for it.

Run everything:

```
bash tests/run-all.sh
```

## Why there is a hand-written YAML parser

`BINDING ERF-65` requires frontmatter to parse "under YAML 1.2 using the **JSON
schema**, the narrowest of the three the specification defines", and then makes
a validator responsible for reporting any string-typed field that arrived as
another type.

No off-the-shelf Swift YAML parser exposes schema selection. Yams, the usual
choice, is libyaml-backed and resolves scalars on a YAML-1.1-flavoured core
schema with no way to narrow it. Depending on it would have made ERF-65
literally unimplementable — the validator could not distinguish a string from a
number the way the requirement defines the distinction.

So `Sources/erfval/Yaml.swift` is a hand-written YAML *subset* parser with a
JSON-schema resolver. Network access was available and the dependency was
declined deliberately, not faked around. The binding document's own section 6
records "Two cold implementations on 2026-08-25 found their parsers offered no
way to select the JSON schema at all"; this is the third.

**The subset covered:** block mappings and sequences (including the compact
`- key: value` form), flow mappings and sequences (including multi-line),
plain scalars with multi-line folding, single- and double-quoted scalars with
multi-line folding and the standard escapes, literal (`|`) and folded (`>`)
block scalars with chomping indicators, and comments. It detects duplicate
keys, anchors, aliases and explicit tags rather than resolving them, which is
what ERF-66 asks for. It is not a complete YAML implementation and does not
try to be: complex keys, multiple documents per file, merge keys, directives
and tag shorthands are out.

**Scalar resolution**, per ERF-65: `null` and the empty scalar resolve to null;
`true` and `false` to booleans; JSON's own number grammar to numbers; and
*everything else stays a string*. That deliberately leaves `yes`/`no`/`on`/`off`,
`~`, `NULL`, `0x1F`, `.inf`, sexagesimals and bare timestamps as strings, which
is the whole point of the pinned schema.

## What is implemented

Enough record loading to exercise the seven requirements under re-test, and no
more.

**Loading.** Discovery by content, never by path (ERF-54): the tool walks the
directory, reads each file's `type`, and dispatches. A file carrying no `type`
is ignored and reported. Declaration, source list, atoms, claims, surveys and
narratives all load; ids and cross-record references resolve.

**The seven under test.**

| requirement | what `erfval` does | test corpus |
|:--|:--|:--|
| ERF-51 / ERF-52 | NFC → strip `*`/`_`/`` ` `` → collapse and trim; split the quote on `[...]` before normalizing; every non-empty span must occur in order, without overlap, and as whole words | `tests/02-quote-fabrication` |
| ERF-43 | premise relation oriented per ERF-24 (`assumes` forward, `supports` backward); cycle detection by DFS colouring; `decomposes-into` cycles; self-edges; non-argument leaves; retired leaves flagged; visited-set traversal so it terminates on any input | `tests/03-premise-closure` |
| ERF-41 | disposition computed from each person's newest entry, withdrawals discarded, out-of-vocabulary stances reported and dropped | `tests/04-disposition` |
| ERF-31 / 32 / 33 | recognize-then-validate; the full grammar with both escapes; passage computed from the previous marker's end; anchor compared under ERF-51; staleness against `bound-at`; unresolved ids reported | `tests/05-narrative-passages` |
| ERF-65 / ERF-66 | JSON-schema resolution, then every string-typed field checked for its arrival type; duplicate keys, anchors, aliases and tags refused | `tests/06-scalar-types` |
| ERF-53 / §7 | `--model-dump` emits a canonical model instance; two forms are equivalent exactly when their dumps are byte-identical | `tests/07-round-trip` |
| §1 Validator class | see "What this validator does not check" below | — |

**Also implemented,** because the seven need them to be exercised on realistic
records: ERF-3, ERF-4, ERF-5, ERF-7 (source list, absences, no URL in a
citation), ERF-9 and ERF-12 (closed vocabularies), ERF-13, ERF-17, ERF-18,
ERF-19, ERF-21, ERF-22, ERF-23, ERF-25, ERF-26, ERF-27, ERF-28, ERF-34,
ERF-35 (with the current-versus-past-state distinction), ERF-36, ERF-38,
ERF-39, ERF-44, ERF-47, ERF-48, ERF-49, ERF-54, ERF-55, ERF-56, ERF-57,
ERF-58, ERF-59, ERF-61, ERF-67, ERF-72.

## What this validator does not check, and why that is a finding

Section 1 binds a validator to "every machine-checkable MUST that applies to
**the input it accepts**". `erfval` accepts a directory snapshot with no
substrate edit history and no raw files, and therefore does not check:

- **ERF-40**, standings append-only — the requirement itself says it is
  "verified against the substrate's history", which a snapshot does not carry;
- **ERF-69**'s excerpt-fidelity check, which "MUST be checked by anyone holding
  the raw file";
- **ERF-2**, **ERF-70** and **ERF-71** — raw-file immutability, extractor
  determinism, digest confirmation;
- **ERF-36 / ERF-38** across a *deployment*: uniqueness is checked within the
  corpus it is handed;
- **ERF-8**, that `citation_text` is rendered from `citation`, which needs a
  CSL processor.

Every one of those is skipped legally, by declaring a narrow input. That is
ambiguities.md §7a, and it is the answer to whether you can still build a
conforming validator that skips something important.

## Test corpora

Each directory carries its own `README.md` naming the requirement it exercises
and the expected outcome per case.

| corpus | exercises | result |
|:--|:--|:--|
| `01-minimal-conforming` | a clean corpus end to end | 0 violations, 0 flags — CONFORMS |
| `02-quote-fabrication` | ERF-51, ERF-52 — 19 fabrication attempts | 8 blocked, 11 through (5 of them holes) |
| `03-premise-closure` | ERF-43, ERF-49 | 7 violations, 3 flags |
| `04-disposition` | ERF-41, ERF-19 | 4 violations, 10 flags |
| `05-narrative-passages` | ERF-31, ERF-32, ERF-33 | 17/18 by default, **9/9** under `--comment-first` |
| `06-scalar-types` | ERF-65, ERF-66 | 7 violations |
| `07-round-trip` | ERF-53 | both variants conform, dumps identical |

`tests/02-quote-fabrication` and `tests/03..07` are generated by
`tests/make-02.py` and `tests/make-rest.py`; the fabrication corpus is
generated because several attacks turn on characters that do not survive a
shell heredoc (U+00AD, U+200B, U+00A0, a decomposed acute).

## Fabrication results against the quote check

Nineteen attempts, in `tests/02-quote-fabrication/README.md`. The check blocked
the spec's own worked example and every sub-word, ordering, overlap, case and
empty-span attack. Five fabrications got through:

- **punctuation as a free boundary** — `The cat[...]sat` passes against "The
  cat-apult was heavy … sat";
- **U+00AD SOFT HYPHEN** and **U+200B ZERO WIDTH SPACE** — same fabrication,
  category Cf, invisible, and endemic in extracted PDF and EPUB text;
- **asterisk deletion on a footnote marker** — a source reading `40%*` yields a
  verbatim-certified quote of `40%` with the qualifier gone;
- **asterisk deletion on an operator** — `3*4` yields `34`.

Detail and the exact quotes are in ambiguities.md §1 and the corpus README.

## Layout

```
Package.swift
Sources/erfval/
  Yaml.swift         YAML 1.2 subset parser, JSON-schema resolution (ERF-65, ERF-66)
  Normalize.swift    ERF-51, the normalization sequence
  QuoteCheck.swift   ERF-52, elision, order, no overlap, whole words
  Bindings.swift     ERF-31, the grammar, the escapes, the passage
  Disposition.swift  ERF-41
  Graph.swift        ERF-43, the premise relation and its closure
  Model.swift        record types, timestamps, staleness, the string-typed field table
  Loader.swift       discovery by `type`, per-record loading, ERF-65 reporting
  Validate.swift     cross-record checks, quote checks, narrative checks
  ModelDump.swift    ERF-53 canonical model instance
  main.swift         CLI
tests/               corpora, generators, run-all.sh
ambiguities.md       the findings
friction-log.md      the working log
```
