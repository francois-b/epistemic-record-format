# erfval — a Haskell conformance validator for the Epistemic Record Format v0.9

Built cold from `reviews/2026-08-25-post-ruling-trials/SPEC-as-tried.md` and
nothing else. No reference implementation, no fixtures, no examples, no other
trial, no git history from this repository was read. Where the prose was
insufficient, that is written down rather than resolved by peeking — see
`ambiguities.md`.

## What is here

| file | what it is |
|:--|:--|
| `erfval.hs` | the whole program, one file, ~1400 lines |
| `run-erfval.sh` | build + run wrapper |
| `tests/make-tests.py` | generates the corpora below |
| `tests/conforming/` | one corpus that should produce zero violations |
| `tests/nonconforming/` | 38 corpora, one defect each, requirement id in the directory name |
| `tests/flagging/` | 8 corpora that should produce flags and no violations |
| `tests/run-tests.sh` | runs all 47 and checks the expectation |
| `type-decisions.md` | the distinctive output: what the type system found |
| `ambiguities.md` | 28 places two implementers would build different things |
| `yaml-behaviour.md` | measured parser and normalization behaviour |
| `friction-log.md` | 43 moments of re-reading, guessing or inferring |

## Build and run

No Haskell toolchain was present on this machine. Installed:

```bash
brew install haskell-stack        # 3.11.1
```

`stack script` downloads its own GHC (9.6.6, Stackage LTS 22.43) and the
packages on first run — about 25 minutes cold, instant thereafter from the
compile cache.

```bash
./run-erfval.sh tests/conforming          # validate a corpus
./run-erfval.sh --probe-yaml              # what Data.Yaml resolves scalars/keys to
./run-erfval.sh --probe-normalize         # ERF-51 normalization on sample inputs
bash tests/run-tests.sh                   # the whole suite
python3 tests/make-tests.py               # regenerate the corpora
```

`run-erfval.sh` is `stack script --compile`, so the first invocation compiles and
caches a binary. To run without the wrapper, the `{- stack script ... -}` header
comment at the top of `erfval.hs` carries the full package list.

Dependencies: `yaml`, `aeson`, `text`, `bytestring`, `containers`,
`unordered-containers`, `vector`, `scientific`, `directory`, `filepath`, `time`,
`unicode-transforms`. All were available; nothing was faked or stubbed.

## Exit codes and output

```
VIOLATION  [ERF-19  ]  path/to/file.md.standings[0]
            standing timestamp is a bare date; ERF-19: "MUST NOT be a bare date"
FLAG       [ERF-32  ]  path/to/narrative.md
            narrative binding #1 is STALE: ...
note       [ERF-41  ]  path/to/claim.md
            computed disposition: active
```

- exit **0** — conforms. Section 2: "a corpus carrying flags and no violations
  conforms." Flags are still printed in full; §2 also says a consumer "MUST NOT
  hide one".
- exit **1** — at least one violation.
- exit **2** — usage error.

`note` is a third severity this program invented, because ERF-54, ERF-57, ERF-72
and ERF-41 all require a validator to *report* things that are neither violations
nor flags and §2 supplies only two words. See `type-decisions.md` §5.

## What is implemented

**54 requirements carry an actual check.**

Serialization and loading: ERF-53, ERF-54, ERF-55, ERF-56, ERF-57, ERF-58,
ERF-59, ERF-60, ERF-61, ERF-65, ERF-66 (lexically — see below), ERF-67, ERF-72.

Sources: ERF-1, ERF-2 (partially), ERF-3, ERF-4, ERF-5, ERF-7, ERF-68, ERF-69
(the `excerpt` stamp only), ERF-70, ERF-71.

Atoms and the quote check: ERF-6, ERF-9 (vocabulary), ERF-11, ERF-12, ERF-13,
ERF-14, ERF-50, ERF-51, ERF-52.

Claims: ERF-15, ERF-17, ERF-18, ERF-19, ERF-20, ERF-21, ERF-22, ERF-35, ERF-36,
ERF-38, ERF-39, ERF-41, ERF-43, ERF-44, ERF-47, ERF-48, ERF-49.

Surveys: ERF-26, ERF-27, ERF-28.

Narratives: ERF-31 (recognition, full grammar, escapes, anchor occurrence),
ERF-32 (three-valued staleness), ERF-33, ERF-34.

The three areas the trial asked for in depth — the source list, narrative
bindings, the quote check — are implemented in full, including: the two-key
source-list document shape; every `Source` field and the conditional requirements
between `status`, `normalized`, `reason` and `licence`; the complete binding
grammar with both escapes, recognition-before-validation, enumerated grammar
errors, anchor matching under ERF-51, and staleness; and the ERF-51 normalization
sequence with ERF-52's split-before-normalize elision handling, ordered
non-overlapping span matching, and the three-valued pass/fail/unavailable result.

## What is NOT implemented, and why

| requirement | why not |
|:--|:--|
| **ERF-8** `citation_text` rendered from `citation` | needs a CSL processor and a style; out of scope for one file |
| **ERF-10** grading against substance | a judgment about meaning |
| **ERF-23** evidence lives on the claim | structural; the type enforces it, nothing to check |
| **ERF-24** the backing audit asks the kind's question | a judgment; only the vocabulary and ERF-49's computable half are checked |
| **ERF-25** universal negatives audited as scoped | requires recognising a universal negative from a title |
| **ERF-37** producers verify id novelty | a producer rule, not a validator's |
| **ERF-40** standings append-only | **cannot be checked from the interchange form at all.** ERF-40 says it is "verified against the substrate's history" and the format defines no interchange representation of that history. `erfval` reports per corpus that this MUST is unchecked, rather than omitting it silently |
| **ERF-42** don't conflate `rejected` and `retired` | a consumer presentation rule |
| **ERF-62/63** authoritative home, substrate | not observable from a directory |
| **ERF-69** "enough adjacent text to be legible" | a judgment with no threshold, and the antecedent is undetectable |

**ERF-66 is checked lexically, not through the parser.** libyaml resolves aliases,
applies tags and merges duplicate keys before `Data.Yaml` returns a value, so all
four prohibited constructs are erased before any Haskell value exists. `erfval`
pre-scans the frontmatter text. The scan is approximate and says so in the code:
it sees top-level duplicate keys but not duplicates inside a one-line flow
mapping, and an unquoted scalar beginning with `&`, `*` or `!` will produce a
false positive. Details and measurements in `yaml-behaviour.md` §4.

**ERF-65 is checked by consequence, not by resolution.** `Data.Yaml` offers no
way to select YAML 1.2's JSON schema. `erfval` reports every string-typed field
that arrived as a number or a boolean. This catches the three collisions between
ERF-65 and ERF-14 / ERF-27 / ERF-61, and the six YAML 1.1 boolean literals
(`yes`, `no`, `on`, `off`, `y`, `N`) that libyaml resolves and the JSON schema
does not. `yaml-behaviour.md` §1.

## Test results

```
passed 47, failed 0
```

`tests/conforming` reports **0 violations, 1 flag, 8 notes** and exits 0. Each
`tests/nonconforming/nc-ERF-NN-*` exits 1 with a violation citing ERF-NN. Each
`tests/flagging/fl-*` exits 0 with at least one flag — including the pair
`fl-ERF-20-evidence-at-stance-absent` and
`fl-ERF-20-evidence-at-stance-present-and-empty`, which exist to demonstrate that
the two states ERF-55 says are different facts produce different output.

One test's name changed during the build: a corpus written to violate ERF-31 by
comma-separating binding ids turned out to parse cleanly, because ERF-31's
grammar admits a comma inside an id even though its prose forbids one. It is now
`nc-ERF-33-binding-comma-separated-ids`. See `friction-log.md` [F-27].

## Reading order

If you read one file, read `type-decisions.md` §1 (the `Maybe`-versus-empty
axis), §8 (illegal states that could not be made unrepresentable) and §10
(totality holes). If you read two, add `ambiguities.md` A1–A3.
