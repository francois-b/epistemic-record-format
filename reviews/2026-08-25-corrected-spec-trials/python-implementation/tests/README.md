# Test corpora

Hand-authored corpora, one directory each. `sh tests/run.sh` runs the
validator over all of them. Nothing here asserts: read the output against the
tables below.

Every corpus carries its own declaration (`corpus.yaml`) and source list
(`sources.yaml`), because `ERF-59` and `ERF-3` make both mandatory.

---

## `conforming-baseline/` — the control

Expected: **0 violations, 0 flags, 0 notices**, disposition
`double-entry-is-old = active`. If this corpus ever reports anything, the
validator has a false positive.

Exercises `ERF-1`, `ERF-3`, `ERF-4`, `ERF-6`, `ERF-31`, `ERF-41`, `ERF-50`,
`ERF-51`, `ERF-54`, `ERF-55`, `ERF-59`, `ERF-65`.

---

## `erf51-52-quote-check/` — the quote check

One source, `normalized/field-notes-1912.md`. Twelve atoms.

| Atom | Exercises | Expected |
|:--|:--|:--|
| `qc-001` | `ERF-6` verbatim span | pass |
| `qc-002` | `ERF-52` elision marker | pass |
| `qc-003` | `ERF-52` whole words: `cat` out of `catapult` — the spec's own example | **fail** |
| `qc-004` | `ERF-51` step 2, `*own*` in the text vs `own` in the quote | pass |
| `qc-005` | `ERF-51` step 3, quote spans a hard line wrap | pass |
| `qc-006` | `ERF-51` "Case MUST NOT be folded" | **fail** |
| `qc-007` | `ERF-52` a bare `...` is literal | **fail** |
| `qc-008` | `ERF-52` "A quote whose spans are all empty MUST fail" | **fail** |
| `qc-009` | `ERF-51` step 1, quote spells `café` decomposed (U+0065 U+0301) | pass |
| `qc-010` | `ERF-52` "in order and without overlap" | **fail** |
| `qc-011` | `ERF-52` "Only the exact marker `[...]`": `[ ... ]` is not it | **fail** ×2 |
| `qc-012` | `ERF-51` step 2 erases a marker *inside* a word before the whole-words test, so `cat*apult` and `catapult` are one quote | pass, by design |

---

## `fabrication-succeeded/` — quotes the source never contained, that pass

Expected: **0 violations.** That is the finding. Every atom here attributes to
a source words the source does not contain, and `ERF-52`'s whole-words rule
lets all of them through. See `ambiguities.md` §1.

| Atom | The source says | The quote says |
|:--|:--|:--|
| `fab-001` | "Revenue fell 12.5 percent" | "Revenue fell 12" |
| `fab-002` | "the loss reached $1,000,000" | "the loss reached $1,000" |
| `fab-003` | `cat<U+00AD>apult` (soft hyphen, as extractors emit) | "The cat" |
| `fab-004` | "The board's *own* review" | "The board" |
| `fab-005` | "the plan was non-binding, and management did not recommend proceeding" | "binding, and management did not recommend proceeding" |
| `fab-006` | "management did not recommend proceeding" | "management did[...]recommend proceeding" |
| `fab-007` | `region<U+200B>locked` (zero-width space) | "Availability is region" |
| `fab-008` | a `#` heading and the paragraph under it | "Field notes, 1912 The catapult was heavy" |
| `fab-009` | two paragraphs separated by a blank line | "Someone eventually sat on the wreckage. Revenue fell 12.5 percent" |

`fab-006` is out of scope by the spec's own words ("The text between two spans
is unbounded by design"). The other eight are not.

---

## `fabrication-blocked/` — attempts the rule does stop

Expected: **5 violations**, one per atom.

| Atom | Attempt |
|:--|:--|
| `blk-001` | `cat` out of `catapult` across an elision |
| `blk-002` | truncating a word mid-word at a span's right edge |
| `blk-004` | `[.*..]`, hoping `ERF-51` step 2 reconstitutes the marker after the split |
| `blk-005` | spans out of order |
| `blk-006` | a zero-width space inside the *quote* |

---

## `erf43-premise-closure/` — the premise relation

| Claims | Exercises | Expected |
|:--|:--|:--|
| `ok-argument`, `ok-observation`, `ok-supporter` | a closure terminating in observations, reached by both edge directions | clean |
| `bad-root-argument`, `bare-argument` | closure terminates in an argument leaf | **violation** |
| `doubled-a`, `doubled-b` | `X assumes Y` **and** `Y supports X`: `ERF-43`'s own sentence, which orients both edges the *same* way, so this is a doubled premise edge and **not** a cycle | violation for the argument leaf only, no cycle |
| `assume-cycle-a/b` | a real `assumes`/`assumes` cycle | **violation** |
| `mixed-cycle-x/y` | X assumes Y and X supports Y | **violation** |
| `mutual-p`, `mutual-q` | two mutually `supports`-ing arguments — the case the spec says "made a literal traversal run forever" | **violation**, and the run terminates |
| `self-edge` | `ERF-43` "Self-edges MUST NOT exist" | **violation** ×2 |
| `decomp-i/j` | "`decomposes-into` MUST admit no cycles likewise" | **violation** |
| `orphan-cycle-a/b` | two *observations* in a mutual `assumes` cycle, reachable from no argument | **violation under my reading**; clean under the other (`ambiguities.md` §2) |
| `dangling-premise` | an argument whose only premise resolves to nothing | `ERF-35` violation; no `ERF-43` violation under my reading |
| `retired-leaf-argument`, `retired-observation` | "MUST flag a closure that terminates in a leaf whose disposition is `retired`" | **flag** |
| `vacuous-argument` | an argument with no premises, nobody standing on it | clean: "an argument with no premises has an empty closure and satisfies this rule vacuously" |
| `stood-on-bare-argument` | same, but stood on | `ERF-49` **flag**, not a violation |

---

## `erf41-disposition/` — the computed reading

| Claim | Standings | Expected disposition |
|:--|:--|:--|
| `d1-proposal` | none | `proposal` |
| `d2-active` | one `for` | `active` |
| `d3-contested` | one `for`, one `against`, two people | `contested` |
| `d4-rejected` | one person, `for` then `against` | `rejected` |
| `d5-retired` | one person, `for` then `withdrawn` | `retired` |
| `d6-bogus-newest` | `for`, then a newer `endorsed` | `active` + violation: the bad entry is dropped "as though absent", so the older `for` is that person's newest |
| `d7-all-bogus` | one `maybe` | `proposal` + violation (see `ambiguities.md` §3) |
| `d8-tie` | one person, `for` and `against` **at the same instant** | undetermined by the spec; this implementation says `rejected` (document order) |
| `d9-bare-date` | a bare-date `timestamp` | `ERF-19` violation, disposition still computed |

---

## `erf31-narrative-passage/` — passage edges

One narrative, `narratives/edges.md`, fifteen markers labelled CASE A..O.

| Case | Exercises | Expected |
|:--|:--|:--|
| A | first binding: passage runs from the start of the body | anchor matches |
| B | two bindings with nothing between them: the passage is the empty string | **flag**, no non-empty anchor can occur |
| C | an empty anchor, `""`, which the grammar admits | **flag**: the check is vacuous |
| D | a malformed candidate (no anchor). "A comment opening `<!--` followed by `claims:` IS a narrative binding" | **violation**, reported, not skipped |
| E | the passage after D, with an anchor that occurs only in D's own paragraph | **flag under my reading** (D delimits); clean under the other (`ambiguities.md` §4) |
| F | an ordinary HTML comment, which is not a candidate and must not delimit | anchor matches |
| G | an anchor using both escapes, `\"` and `\\` | anchor matches |
| H | an anchor spanning a hard line wrap | anchor matches |
| I | `ERF-33`: one id resolving to nothing, one resolving to a survey | **violation** ×2 |
| J | `bound-at=2026-13-45`: matches the grammar, is not a calendar date | **violation** |
| K | `ERF-32` staleness: the claim was modified after `bound-at` | **flag** stale |
| L | an unterminated candidate | **violation** |
| M | trailing prose after the last binding: belongs to no passage | nothing reported |
| N | `ERF-32` indeterminate: a full instant against a bare `bound-at` on the same day | **flag** indeterminate |
| O | a CommonMark code span holding `` `<!--` ``, followed by a real binding | **the real binding vanishes**: 15 markers, 14 recognized (`ambiguities.md` §4) |

Verify O with:

```
python3 -c "import erf_validate as E; b=open('tests/erf31-narrative-passage/narratives/edges.md').read().split('---',2)[2]; print(len(E.recognize_bindings(b)))"
```

---

## `erf65-yaml-typing/` — scalar typing and YAML structure

Every file here is deliberately wrong. Expected: 10 violations, 12 flags, 2 notices.

| File | Exercises |
|:--|:--|
| `corpus.yaml` | `spec_version: 1.0` → float under both schemas; renders back as `1` |
| `sources.yaml` | source ids `012` and `no` as bare mapping keys |
| `atoms/yt-001.md` | `as_of_date: 2018` (int under both), `limitations: yes`, unquoted `created.timestamp` |
| `atoms/yt-002.md` | unquoted RFC 3339 instant, the hazard `ERF-65`'s prose is built around |
| `surveys/yt-survey.md` | `hits_reported: 0` → int |
| `claims/yt-claim.md` | `ERF-66`: anchor, alias, explicit `!!str` tag, duplicate `title` key; bare `no`/`off` family names |

The split matters: **violations** are fields that arrive retyped under the
JSON schema the binding pins; **flags** are fields that arrive as strings
under that schema but would be retyped by any reader on a library default.
`ambiguities.md` §5 argues the binding's own examples put three of its five
cases in the second bucket, not the first.

---

## Regenerating

The corpora were written by a generator kept outside the repository. They are
plain files now: edit them in place. Nothing here is derived at run time.
