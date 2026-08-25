# erfval — a cold Go implementation of ERF v0.9 (draft)

A conformance validator for the Epistemic Record Format, written from
`SPEC-as-tried.md` and nothing else. No other file in
`epistemic-record-format/` was read: not the reference implementation, not
`types/erf.ts`, not `conformance/cases/`, not the example corpus, not the git
history. The point of the exercise was to find out whether the prose alone is
sufficient and unambiguous. It is mostly sufficient; `ambiguities.md` records
the 29 places where it is not.

Go was chosen because no existing implementation uses it, so nothing could
leak in through familiarity with an existing codebase.

## What is here

| Path | What it is |
|:--|:--|
| `erfval/` | The validator. Go 1.22, two dependencies (`gopkg.in/yaml.v3`, `golang.org/x/text` for NFKC). |
| `tests/build-corpora.sh` | Authors every test corpus. |
| `tests/corpora/` | 57 corpora: 2 conforming, 52 non-conforming, 3 ambiguity demonstrators. |
| `tests/EXPECTATIONS.md` | Each corpus, the requirement id it violates, and at what severity. |
| `tests/run-tests.sh` | Runs the corpora against the expectations, then the Go unit tests. |
| **`ambiguities.md`** | **The main output.** 29 entries where two careful implementers would build different things. |
| `friction-log.md` | Every point where I had to re-read, guess, infer, or backtrack — including the ones I resolved correctly. |

## Running it

```bash
cd erfval && go build -o ../erfval-bin .

# validate one corpus
./erfval-bin tests/corpora/conforming

# a deployment is the union of the directories given (see ambiguities A-25)
./erfval-bin corpus-a corpus-b

# include INFO: unrecognized files and fields, and checks that could not run
./erfval-bin -info tests/corpora/conforming

# machine-readable
./erfval-bin -json tests/corpora/conforming

# the reading of "its passage" the spec does not settle (ambiguities A-02)
./erfval-bin -passage=paragraph tests/corpora/amb-passage-scope
```

Exit code is 1 if any VIOLATION was reported, 0 otherwise. Flags do not affect
the exit code, per section 2: "a corpus carrying flags and no violations
conforms."

```bash
bash tests/build-corpora.sh    # regenerate the corpora
bash tests/run-tests.sh        # 57 corpus expectations + go unit tests
```

## Severities

The spec names two categories (section 2, "A flag is not a violation"). Two
more were needed and are marked as inventions; see `ambiguities.md` A-29.

| | Meaning |
|:--|:--|
| **VIOLATION** | A machine-checkable MUST was breached. The corpus does not conform. |
| **FLAG** | A condition the spec explicitly directs a validator to flag: `ERF-31` (anchor), `ERF-32`/`ERF-47` (staleness), `ERF-35` (past-state reference), `ERF-43` (retired leaf), `ERF-49` (unbacked). A corpus carrying flags and no violations conforms. |
| **ADVISORY** *(invented)* | A SHOULD was breached, or a MUST whose trigger condition is not machine-decidable was breached under a heuristic the message states. |
| **INFO** *(invented)* | Something not recognized (`ERF-57`, `ERF-72`), or a check that could not be run (`ERF-51`'s "report the check as unavailable"). |

## What is implemented

**59 of the specification's 66 numbered requirements are implemented**, plus
the unnumbered actor convention in section 2's Definitions.

(The document numbers 66 requirements: `ERF-1`..`ERF-15`, `ERF-17`..`ERF-28`,
`ERF-31`..`ERF-44`, `ERF-47`..`ERF-63`, `ERF-65`..`ERF-72`. `ERF-16`,
`ERF-29`, `ERF-30`, `ERF-45`, `ERF-46` and `ERF-64` do not appear at all —
presumably retired, though nothing says so.)

54 of them surface under their own finding id. Five more are enforced but
surface under a neighbouring id, because that is where the observable failure
lives: `ERF-23` and `ERF-36` (under `ERF-35` and `ERF-38`), `ERF-41`
(computed, and consumed by `ERF-43` and `ERF-49`), `ERF-52` (under `ERF-6`,
except the all-empty-spans case), `ERF-56` (an omitted list materializes as
empty everywhere it is read).

*Source list (scope area 1).* `ERF-1` (normalized text present), `ERF-2`
(`received` shape, timestamp advisory), `ERF-3` (document shape, exactly two
top-level keys, source-id uniqueness), `ERF-4` (atom names a listed source;
every source gives a path or records an absence), `ERF-5` (closed status set,
required reason), `ERF-7` (no URL in `citation_text`), `ERF-8` (shape only —
the rendering rule is reported as not-checked), `ERF-68` (licence/status
coherence), `ERF-69` (excerpt stamp shape), `ERF-70` (extraction and
normalization named with a version), `ERF-71` (digest shape, and
`normalized_digest` verified against the file on disk).

*Narrative bindings (scope area 2).* `ERF-31` — the full grammar including
both escapes, the recognition-versus-validation split, and the anchor's
occurrence in its passage under `ERF-51`; `ERF-32` (staleness, including
`indeterminate`); `ERF-33` (ids that resolve to nothing); `ERF-34` (the
narrative document's four fields, with `created` typed as an ActorStamp);
`ERF-47` (the mixed-precision staleness rule).

*Quote check (scope area 3).* `ERF-6`, `ERF-50`, `ERF-51` (the three-step
sequence, case never folded, unavailable rather than pass-or-fail for a text
not held or not text), `ERF-52` (split on `[...]` before normalization, spans
normalized independently, in order and without overlap, all-empty fails).

*Everything needed to support those.* `ERF-9` (closed set), `ERF-11` (stored
check results, auditor shape), `ERF-12` (verdict set), `ERF-13` (atom id
shape), `ERF-14` (`as_of_date` precision), `ERF-15` (bare ids), `ERF-17`
(declared corpus), `ERF-18` (title present; restatement as advisory), `ERF-19`
(full RFC 3339 instant on standings), `ERF-20` (`evidence_at_stance` shape, no
drift or counts), `ERF-21` (`human:` actors only), `ERF-22` (no stored state),
`ERF-23`, `ERF-24` (kind vocabulary), `ERF-26`, `ERF-27`, `ERF-28` (title,
`prior_survey`, dated-id advisory), `ERF-35` (current vs past-state
references), `ERF-36`/`ERF-38` (deployment-wide id uniqueness), `ERF-39`,
`ERF-41` (disposition computed), `ERF-43` (self-edges, cycles in `assumes` and
`decomposes-into`, closure leaves, retired-leaf flag), `ERF-44`, `ERF-48`
(`last_modified` ordering), `ERF-49` (unbacked flag), `ERF-53`, `ERF-54`,
`ERF-55`, `ERF-56`, `ERF-57`, `ERF-58`, `ERF-59`, `ERF-60`, `ERF-61`,
`ERF-65`, `ERF-66`, `ERF-67`, `ERF-72`, plus the unnumbered actor convention
from section 2's Definitions.

The YAML layer does not use `gopkg.in/yaml.v3`'s scalar resolution. It decodes
to a node tree and re-resolves under the YAML 1.2 **JSON schema** by hand,
because yaml.v3 resolves unquoted dates to `!!timestamp` — the exact hazard
`ERF-65` names — along with six other forms that are not JSON numbers. See
`ambiguities.md` A-07 for the measured table.

## What is deliberately NOT implemented

- **`ERF-40` (standings are append-only) and `ERF-28`'s immutability.** Both
  require the substrate's edit history. A validator handed a directory has
  none, and no interchange form carries one. See `ambiguities.md` A-17.
- **`ERF-37`, `ERF-20`'s producer duty, `ERF-50`'s "gate at minting".** These
  bind a producer, not a validator.
- **`ERF-42`, `ERF-57`'s presentation half, `ERF-60`'s refusal behaviour.**
  These bind a consumer's rendering. `erfval` reports rather than renders;
  `ERF-60` emits an INFO naming the supported MAJOR.
- **`ERF-8`'s rendering rule** ("`citation_text` MUST be rendered from
  `citation`"). Needs a CSL processor and a named style. Reported at INFO as
  explicitly not-checked, rather than skipped silently.
- **`ERF-9` and `ERF-10`'s substance.** Whether a grade correctly reflects
  provenance distance and attester accountability is a judgment. Only the
  closed set is checked, plus an advisory nudge for a `medium`/`low` grade with
  no `limitations`.
- **`ERF-24` and `ERF-25`'s backing judgments.** Whether atoms jointly entail a
  statement, and whether a title is a universal negative, are not detectable
  from a record.
- **`ERF-69`'s excerpt trigger.** Nothing in a source says whether its
  normalized text is whole or excerpted, so the MUST has no detectable
  trigger. Only the shape of `excerpt` when present is checked.
- **`ERF-62`, `ERF-63`.** Storage properties, not corpus content.
- **`ERF-67`'s "valid CommonMark".** Every byte string is valid CommonMark;
  the requirement cannot fail. Encoding, LF and BOM are checked.
- **The conformance case files.** `ERF-51` names
  `conformance/cases/normalization.txt` and
  `conformance/cases/quote-check.yaml` as normative and says they govern over
  the prose. They were not read, by design. Every normalization decision here
  is a reading of the prose, recorded as a unit test in `erfval/norm_test.go`
  so it can be diffed against the cases rather than re-derived.

## The three findings that matter most

1. **A-01.** Section 1's Validator class list — "section 6 in full, the
   serialization rules of section 7, and the declaration and source list" —
   does not name section 4 or section 4.6. On an exhaustive reading, the quote
   check and the narrative bindings are outside the class a validator conforms
   to.
2. **A-02.** "The anchor occurs in its passage" — *passage* is never defined.
   `tests/corpora/amb-passage-scope` is clean under two readings and flagged
   under a third.
3. **A-03.** `ERF-52` normalizes each elision span independently and `ERF-51`
   trims, so a two-span quote matches inside longer words.
   `tests/corpora/amb-elision-matches-mid-word` records, verbatim and with a
   passing quote check, a sentence its source does not contain.
