---
title: "Post-ruling trials, 2026-08-25"
purpose: "Cold implementations run against the specification after the day's six P1 rulings, to test text only their author had read."
status: non-normative
last_updated: 2026-08-25
---

# Post-ruling trials, 2026-08-25

Nine requirements were rewritten on 2026-08-25 (`ERF-3`, `14`, `31`, `34`,
`35`, `43`, `51`, `54`, `55`), each ruled, implemented and fixtured by one
hand. The fixtures encoded the author's reading of the author's ruling,
which is the self-testing trap the independent trials exist to break. These
ran against `SPEC-as-tried.md`, a snapshot at commit `64b0921` (`c6535c9` before the 2026-08-25 history rewrite that removed build artifacts and private references), under the
same purity boundary as the morning's trials: the specification and nothing
else in the repository.

| Trial | Lens | Outcome |
|---|---|---|
| `go-implementation/` | A fifth language; explicit errors | 59 of 66 requirements; 29 ambiguities; found `F-008`, the fabricated quote that passed |
| `haskell-implementation/` | Type discipline: `Maybe` versus empty, totality | 54 requirements; 28 ambiguities, 17 unrepresentable illegal states; found `F-009`, `ERF-43` non-terminating |
| `protobuf-schema/` | A wire that structurally disagrees on presence | 20 messages, 123 fields; 45 of 66 rules inexpressible; found `F-011`, `F-013` |
| `ruby-implementation/` | YAML 1.1 parser behaviour | Stopped early on the operator's judgement that Ruby duplicated the Python trial's lens. Its parser probe survived and is worth more than the trial would have been: `F-007` |
| `yaml-markdown-case-against.md` | Sourced research | 23 sources on what the wire costs; cited by the binding document |

Findings `F-007` through `F-015` came from here. Seven were ruled the same
day and are recorded in `CHANGELOG.md` under 0.9.0.

Compiled binaries and build directories are not committed; the sources
rebuild them. `SPEC-as-tried.md` is the exact text each trial read.
