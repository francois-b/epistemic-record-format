# Trial 1: independent implementation

**Question:** can someone build a working validator from the specification
prose alone?

The agent received `SPEC.md` and nothing else from this repository: no
reference implementation, no fixtures, no example corpus. It chose its own
language (Python, against the reference's TypeScript, so that a shared
idiom could not hide a shared assumption). Afterwards the reference's
fixtures were run through this validator and this validator over the
reference's corpus; every disagreement was classified as a specification
ambiguity, a reference bug, or a bug here.

`ambiguities.md` is the harvest: places where two careful implementers
would build different validators. `friction-log.md` records every guess
and re-read along the way. What follows is the agent's own operating
documentation.

---

---
generated: 2026-08-25
model: claude-fable-5
---

# ERF validator (cold-build stress test)

A conforming ERF validator built from `SPEC.md` (v0.9.0 draft) alone, with
no access to the reference implementation, test fixtures, or any real
corpus. Purpose: stress-test the spec's prose by implementing it cold.
The choices the spec did not settle are in `friction-log.md`; the subset
judged genuine spec defects is in `ambiguities.md`.

## Invocation

```bash
python3 erf_validate.py <corpus-directory>            # normal run
python3 erf_validate.py <corpus-directory> --quiet-info
```

Requires Python 3.9+ and PyYAML (`pip install pyyaml`). No other
dependencies.

The argument is a directory treated as one **deployment**: every corpus
declaration found in the tree is registered, and record ids are checked
unique across all of them (ERF-36/38). A single corpus directory is the
degenerate one-declaration case.

What the validator looks for in the tree (content-based, since the spec
names no filenames):

- **Declarations** (ERF-59): any YAML document in a `*.yaml` / `*.yml`
  file carrying `spec_version` (or `id` + `title`).
- **Source lists** (ERF-3): any YAML document carrying a top-level
  `sources` mapping. A declaration file may hold its source list inline.
  A list is attached to the corpus whose declaration sits in the nearest
  ancestor directory. Capture `path`s resolve relative to the list's file.
- **Records**: every `*.md` file with YAML frontmatter whose `type` is
  `atom`, `claim`, or `survey`. Files listed as captures are excluded.
- **Narratives** (ERF-31 to ERF-34): every non-record `*.md` file
  containing a `<!-- claims: ... -->` narrative binding.

## Output format

One finding per line, then a summary line:

```
LEVEL [REQ] record-or-file :: field :: message
```

- `record-or-file`: `atom:kwg-117`, `claim:some-id`, `survey:...`,
  `source:<source-id>`, `narrative:<relative-path>`, or a relative file
  path when no record id is usable.
- `REQ`: the requirement id the finding cites. Almost always `ERF-N`.
  Three pseudo-ids cover normative text the spec states without a number:
  - `S2.ACTOR`: the section 2 actor-id convention ("Every actor id MUST
    follow this convention").
  - `S3.DM`: the normative data model of section 3 (shape and type
    violations with no closer numbered requirement).
  - `S5.VOCAB`: the closed vocabularies of section 5 ("A value outside
    them is a validation failure") for `stance`, `relation`, and
    `epistemic_kind`; `source_quality` cites ERF-9 and verdicts ERF-12.

Levels (the spec's flag-vs-reject distinction is preserved):

- `VIOLATION`: a machine-checkable MUST is broken; non-conformance.
- `FLAG`: the spec says flag or report rather than reject: staleness
  (ERF-47, ERF-32), unbacked claims (ERF-49), retired premise leaves
  (ERF-43), indeterminate readings, opaque unknown record types (ERF-57),
  and checks this implementation deliberately demoted (see friction log).
- `UNAVAILABLE`: the quote check could not run and must be reported as
  unavailable rather than passed or failed (ERF-51): capture not held,
  capture not text/markdown, source holds no capture.
- `INFO`: orientation only, no conformance content.

Exit code: `1` if any VIOLATION, else `0`.

## The quote check

Implements ERF-50/51/52 in full: split on the exact `[...]` marker
BEFORE normalization; markup-unwrapping steps a-f, then normalization
steps 1-11 in order, applied identically to each span and to the capture;
spans matched in order without overlap; all-empty span sets fail; case
never folded; the check runs only against captures, never the live web
(ERF-1). Note: ERF-51 declares the repository's conformance case files
normative over the prose; those files were not available to this cold
build, so the prose reading governs here (logged as friction F31).

## Coverage

66 numbered requirements exist (ERF-1..72 minus the gaps 16, 29, 30, 45,
46, 64). Status here:

- **54 requirements** have their machine-checkable content implemented
  (some in part, where a clause needs history or judgment; each such cut
  is in the friction log): ERF-1, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15,
  17, 19, 20, 21, 22, 23, 24, 26, 27, 28, 31, 32, 33, 34, 35, 36, 38, 39,
  41, 43, 44, 47, 48, 49, 50, 51, 52, 53, 54, 55, 58, 59, 60, 61, 65, 66,
  67, 68, 69, 70, 71, 72.
- **2 requirements** are implemented as the validator's own conduct
  rather than as checks: ERF-56 (omitted lists read as empty) and ERF-57
  (unknown types reported and treated as opaque, never a rejection).
- **10 requirements** judged not machine-checkable by a directory-level
  validator: ERF-2 and ERF-40 (immutability and append-only need the
  substrate's edit history), ERF-8 (needs a CSL/Chicago renderer),
  ERF-10, ERF-18, ERF-25 (human judgment about prose), ERF-37 (producer
  conduct at mint time), ERF-42 (consumer rendering conduct), ERF-62 and
  ERF-63 (facts about the deployment's storage, not about its files).

## Smoke corpora (kept as evidence of the reading)

- `tests/corpus-clean/`: a minimal fully conforming deployment (one atom,
  claim, survey, narrative, two-entry source list, one capture). Expected:
  0 violations, 0 flags.
- `tests/corpus-norm/`: eight atoms exercising the ERF-51 normalization
  paths (typographic quotes, em dash, soft-hyphen-free line-break join,
  link unwrap, blockquote, emphasis markers, literal ellipsis via NFKC,
  elision spans). Expected: exactly 2 violations (out-of-order spans;
  all-empty spans).
- `tests/corpus-dirty/`: ~40 seeded defects across every check family
  (source list, vocabularies, standings ledger, graph, staleness,
  serialization, narrative bindings, encodings). Expected: 41 violations,
  4 flags.
