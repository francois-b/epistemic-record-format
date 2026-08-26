# `erfval` — a strict validator for the Epistemic Record Format

Built cold, in Rust, from three files and nothing else:

- `../SPEC-as-tried.md` — the specification
- `../SCHEMA-as-tried.json` — the normative data model (embedded at compile
  time by `include_str!`, so the binary carries the model it was built against)
- `../BINDING-as-tried.md` — the YAML/Markdown binding, version 1

No reference implementation, conformance case, fixture, example corpus or
commit was read. Where the specification left a case unstated, the reading
taken is recorded in [`ambiguities.md`](ambiguities.md) rather than defaulted
in the code; every re-read, guess and inference is in
[`friction-log.md`](friction-log.md).

## Build and run

```sh
cargo build --release
./target/release/erfval tests/conforming
```

```
erfval [--quiet] [--no-info] [--schema PATH] <corpus-dir> [<corpus-dir> ...]
```

One directory per corpus. **Give every corpus of a deployment on one command
line**, or ERF-35, ERF-36 and ERF-38 are reported as `PARTIAL`, which section 1
requires: "a deployment-wide check (`ERF-36`, `ERF-38`) run over a single
corpus MUST be named as partial."

Exit status: `0` the corpus conforms (flags may be present), `1` it does not,
`2` the validator could not run.

### Output

Five kinds of line, each carrying a requirement id:

| Kind | Meaning |
|:--|:--|
| `VIOLATION` | The corpus does not conform. Exit 1. |
| `FLAG` | Someone should look. The corpus still conforms (section 1). |
| `UNPERFORMED` | A check this tool did not run, named as section 1 requires. |
| `PARTIAL` | A deployment-wide check run over fewer corpora than a deployment. |
| `INFO` | Something observed and reported: an ignored file (ERF-54), an extension field (ERF-72), a computed disposition (ERF-41). `--no-info` hides these. |

Requirement ids are `ERF-n` and `YAMLB-1`, plus three of the tool's own making
— `SPEC-2`, `SPEC-3`, `SPEC-5` — for the normative passages in sections 2, 3
and 5 that carry MUSTs and no number. See ambiguity A23.

### Tests

```sh
cargo test          # 12 unit tests, mostly ERF-51 and ERF-52 worked examples
tests/run.sh        # the four corpora, with their expected verdicts
python3 tests/build-corpora.py   # regenerate the corpora (recomputes digests)
```

`tests/run.sh` asserts: the conforming corpus exits 0; the flags corpus exits
0 with more than ten flags; each of the 35 violation corpora reports the
requirement named in its `EXPECT` file; each of the 18 fabrication attacks gets
the verdict written into its own `limitations` field; and no `PARTIAL` is
emitted when two corpora are given together.

## The corpora

| Directory | What it is |
|:--|:--|
| `tests/conforming/` | One corpus exercising every record type, every epistemic kind, all four relations, all five dispositions, all three source statuses, an elided quote, a quote that crosses markdown emphasis, an atom whose source holds no normalized text, and two narrative bindings (one of them spanning two lines). Zero violations, zero flags. |
| `tests/flags/` | Twenty-one flags and no violations, which is what section 1 says a conforming corpus may look like. |
| `tests/violations/` | 35 corpora, one per requirement broken, each with an `EXPECT` file naming it. |
| `tests/fabrication/` | 18 attempts to make a false quotation pass ERF-52, plus controls. Each atom's `limitations` states the attack and the expected verdict. See "The fabrication suite" below. |

## What it checks, requirement by requirement

66 numbered ERF requirements exist in the two normative documents (1–15,
17–28, 31–44, 47–63, 65–72; 16, 29, 30, 45, 46 and 64 are retired and never
refilled), plus `YAMLB-1`.

- **46 requirements have at least one violation-capable check** (45 `ERF-n`
  plus `YAMLB-1`), and three unnumbered passages do too (`SPEC-2`, `SPEC-3`,
  `SPEC-5`).
- **27 requirements produce flags.**
- **33 requirements are named `UNPERFORMED`**, in whole or in part. On a clean
  corpus that is 33 blanket declarations plus one line per atom whose source
  text is not held (ERF-50) and one per source whose raw file is unrecorded
  (ERF-70).
- **8 requirements have nothing substantive done for them**: ERF-8, ERF-10,
  ERF-25, ERF-37, ERF-40, ERF-42, ERF-62, ERF-63. Every one is a judgment, a producer
  duty, or a fact about the substrate or the deployment.
- **4 are enforced but reported under another requirement's id**, because the
  schema or the check cannot name them: ERF-22 and ERF-57 report as ERF-55,
  ERF-50 and ERF-51 report as ERF-52.
- **2 are satisfied by construction and need no check**: ERF-33 (this tool
  reports every unresolvable narrative binding and invents no record) and
  ERF-56 (an omitted list is materialized empty).

Legend: **V** a violation-capable check · **F** a flag · **U** named
unperformed · **S** structural, enforced by the schema's shape rather than by
a dedicated test.

| Req | V | F | U | What is checked, and what is not |
|:--|:-:|:-:|:-:|:--|
| ERF-1 | V | | | The normalized text named by a shipping source exists on disk. When it does not, the quote check for every atom citing it is reported unavailable rather than passed or failed (ERF-51). Checks never touch the network. |
| ERF-2 | | F | U | **F** `received.url` without `received.timestamp`; a `received.path` the corpus does not hold. **U** immutability, and that a later revision was minted as a new source — not decidable from one snapshot. Whether a location is mutable is a judgment (A6). |
| ERF-3 | V | F | | **V** the corpus keeps a source list; source ids unique within the corpus. **F** more than one `type: sources` file (A20). |
| ERF-4 | V | S | | **V** every atom names a source and the id exists in the list. **S** the `shipped → normalized` / `otherwise → reason` conditional. |
| ERF-5 | S | | | The closed status set and the required `reason`. |
| ERF-6 | V | F | | **V** through ERF-52: a bare `...` or `…` is matched literally. **F** a quote carrying one outside an elision marker. |
| ERF-7 | V | F | | **V** the schema's `://` test. **F** a bare domain or a DOI, which that test passes and the prose forbids (A24). |
| ERF-8 | | | U | Rendering `citation_text` from `citation` needs a CSL processor and a judgment about "everything the string shows". Wholly unperformed. |
| ERF-9 | S | F | U | **S** the three-value enum. **F** `medium` or `low` with no `limitations`. **U** the grade itself: a judgment about provenance distance and attester accountability. |
| ERF-10 | | | U | That a grade was assessed against the substance and not the utterance. Wholly unperformed. |
| ERF-11 | S | | U | **S** every audit entry names an `auditor` and a `protocol`. **U** that the verdict is the judgment it claims to be; that no mechanical-check result is stored (structurally impossible: the model has no such field). |
| ERF-12 | S | | U | **S** the three-verdict enum. **U** that a failed or abandoned audit was not written as one — the corpus records the verdict, never the run. |
| ERF-13 | | F | U | **F** an atom id that is not "a mint-time prefix and a sequence number"; the prose makes it a MUST and the schema's `Id` permits anything, so the two disagree (A5). **U** never renamed, never reused across time. Uniqueness now is ERF-36/38. |
| ERF-14 | S | | U | **S** the `AsOfDate` precision pattern, plus calendar validity. **U** that the precision matches what the source gave. |
| ERF-15 | | F | | Bare ids; otherwise subsumed by ERF-35, which a location-encoding id fails anyway. **F** a reference id that reads as a path. |
| ERF-17 | V | F | | **V** `corpus` present on every record and naming a declared corpus. **F** naming a corpus other than the one whose declaration holds the file. |
| ERF-18 | S | F | U | **S** a non-empty `title`. **F** a body that does not open with the title verbatim, and an empty body. **U** that the title states the claim — a reading. |
| ERF-19 | S | | U | **S** a standing's `timestamp` is a full instant. **U** that no entry was edited or deleted: needs the substrate's history. |
| ERF-20 | | F | | A standing entry carrying no `evidence_at_stance`. The "drift MUST NOT be stored there" half is structural: the model gives the field two id lists and nothing else. |
| ERF-21 | V,S | | | Enforced twice: by the schema (`HumanActor`) and independently in ERF-41's admissibility test. |
| ERF-22 | S | | U | **S** any stored state field is refused by `additionalProperties: false` — reported under ERF-55, since the schema cannot tell a stored disposition from any other undefined field (A26). **U** that the origin story lives in working notes. |
| ERF-23 | S | | U | **S** both directions exist and are typed. **U** that evidence against a claim is not modelled as a rival claim: a judgment about two records' content. |
| ERF-24 | | F | U | **F** a `bet` or `commitment` carrying an `evidence_audit`, which owes no backing and so has nothing to audit. The premise definition this requirement gives is implemented and drives ERF-43 and ERF-49. **U** the audit's own question. |
| ERF-25 | S | | U | **S** a malformed `surveys` list is reported under this id. **U** the requirement itself: detecting a universal negative from a title is a reading, and so is judging whether it was audited as scoped. Nothing substantive is checked. |
| ERF-26 | S | | U | **S** the `SearchAct` shape. **U** that `tool` names a concrete instrument rather than a category. |
| ERF-27 | V,S | | U | **S** `hits_reported` is a non-empty string; an unquoted `0` is caught as ERF-65. **U** that it states no precision the instrument did not give. |
| ERF-28 | V | F | U | **V** `searches`, `conducted` and `title` present; each act's own timestamp parses. **F** a re-run whose id does not end with its conducted date. **U** that the acts and yields never changed after the fact. |
| ERF-31 | V | F | | **V** the YAMLB-1 grammar; every id resolves, and resolves to a claim (A12). The passage is computed exactly as stated: from the end of the previous binding's marker, or the start of the body, to the start of this one's. A failed candidate closes no passage. **F** an anchor that does not occur in its passage — named a flag by the requirement itself. |
| ERF-32 | | F | | Stale when the named claim's `last_modified` is later than `bound-at`, under ERF-47's precision rule. Reported `indeterminate` when the comparison cannot be run. |
| ERF-33 | | | | Satisfied by construction. Every unresolvable binding is reported (under ERF-31) and no record is ever invented. |
| ERF-34 | S | | | The `Narrative` definition, whose failures report as ERF-55 or SPEC-3: no id, no evidence, no standings, no disposition. Narratives are excluded from id uniqueness. |
| ERF-35 | V | F | U | **V** `atoms_for`, `atoms_against`, `edges.to`, `surveys`, `prior_survey` and each `notable_results` entry's `atoms` resolve — **and resolve to the right record type**, which is the contested reading A3. **F** an `evidence_at_stance` id that resolves to nothing: a past state, so a flag, exactly as the requirement says. Reported `PARTIAL` over a single corpus. |
| ERF-36 | V | | | Deployment-wide id uniqueness across every record type. `PARTIAL` over a single corpus. |
| ERF-37 | | | U | A producer-class duty with no trace in the corpus. Wholly unperformed. |
| ERF-38 | V | | | The rejection ERF-36 implies. `PARTIAL` over a single corpus. |
| ERF-39 | S | | | `why` required, non-empty, with a `human:` `by`. |
| ERF-40 | | | U | Append-only "verified against the substrate's history", which this tool does not read. The requirement's other half — that `standings` is an *ordered* list, so its order is a fact about the corpus — is used by ERF-41's collision rule. |
| ERF-41 | V | F | | **V** every inadmissible entry is reported and treated as never written. **F** two of one person's newest entries sharing an instant; the later in the ledger wins. The disposition is computed for every claim and printed as `INFO`, since it is never stored. The five readings are a Rust enum and the computation is a total match — see "Why Rust" below. |
| ERF-42 | | | U | A consumer rule. This validator never conflates the two: it prints `rejected` and `retired` by name. |
| ERF-43 | V | F | | **V** self-edges in any relation; cycles in the premise relation over all claims, whether or not a closure reaches them; cycles in `decomposes-into`; a closure terminating in an `argument` leaf. The closure follows outgoing `assumes` and incoming `supports`, excludes the argument itself, and visits each claim once. **F** a closure containing a claim whose disposition is `retired`, leaf or not. |
| ERF-44 | V | F | | **V** `conflicts-with` stored on both claims of a pair. **F** any edge stored twice on one claim. |
| ERF-47 | | F | | Staleness of `finding_audit` (against the atom), `evidence_audit` (against the claim, its cited atoms, and its cited surveys' `conducted` — see A17) and narrative bindings. The precision rule is implemented as written: differing precision on the same day resolves to stale, two equal bare dates read as current. |
| ERF-48 | V | F | U | **V** `last_modified` earlier than `created`. **F** an identical instant (A18). **U** "later than any prior `last_modified`", and the same-day full-instant SHOULD: only the current stamp survives in the file. |
| ERF-49 | | F | | An `observation` someone stands on with empty `atoms_for` and empty `surveys`; an `argument` with no premises. "Someone stands on" is read as a disposition other than `proposal` or `retired` (A7). |
| ERF-50 | | | U | The check is run on every atom; a failure is reported under ERF-52, so this id never carries a violation of its own. **U** per atom, whenever the normalized text is not held or is not text — reported unavailable, never passed or failed. **U** that it ran as a gate at minting: a producer duty. |
| ERF-51 | | | U | The fold is implemented as an ordered sequence: NFC then `Cf` removal; the marker rule; whitespace collapse with U+2029 for a run holding a blank line; trim. Case is not folded. **U** the conformance case files are normative for this check's exact behaviour and govern over any reading of the prose; this tool was built from the prose alone and has not been run against them. See A1. |
| ERF-52 | V | | | The span check in full: split on the exact `[...]` before normalization, each span folded independently, every non-empty span occurring in order without overlap and as whole words, with the word-internal characters (`.` `,` `:` `/` between digits, an apostrophe between letters, a hyphen between word characters). A quote whose spans are all empty fails rather than trivially passing. No span crosses a paragraph boundary unless the quote holds the same blank line — which falls out of the fold and is asserted by a unit test. |
| ERF-53 | V | F | U | **V** an atom carrying a body; a declaration or source list carrying one; more than one YAML document in a file. **F** a `normalized_digest` that does not match the bytes held (no requirement makes the digest binding — A10). **U** that a store round-trips the corpus: a property of a store. The one loss vector reachable from the bytes is checked, under ERF-65. |
| ERF-54 | V | | U | **V** every file self-describes with `type`; exactly one declaration, and two are rejected; every record carries `corpus`; a file without `type` is ignored **and reported** as `INFO`. **U** that no meaning lives in a path — unfalsifiable. This tool dispatches on `type` alone and reads no path as a signal, with one exception it declares: the source list's `normalized` and `received.path` targets are excluded from the record scan first, so a normalized markdown text is never mistaken for a broken record. |
| ERF-55 | V | | U | **V** any empty list written out, anywhere in any record; any undefined field; any undefined `type` (A8). `x_` fields are never reported here (ERF-72). **U** the version-relative half: this tool holds one schema, 0.9.0. |
| ERF-56 | | | | Satisfied by construction: an omitted list is materialized empty and never read as unknown. |
| ERF-57 | | | U | Unknown fields and unknown record types are detected and reported **under ERF-55**, which is the validator's half ("Strictness belongs to the producer and detection to the validator"). **U** consumer tolerance, which is the other half and not a validator's to perform. |
| ERF-58 | V,S | | | A time key other than `timestamp` is refused by `additionalProperties: false`; when the offending key is a recognisable time word (`date`, `when`, `datetime`, `time`, `created_at`) the failure is reported under ERF-58 rather than ERF-55. |
| ERF-59 | V | | | Exactly one declaration, carrying `type`, `id`, `title`, `spec_version`. |
| ERF-60 | V | F | | **V** a MAJOR `spec_version` this tool was not built from is refused with an explicit diagnostic rather than guessed at. **F** an unsupported MINOR, with unrecognized content preserved and reported rather than dropped. |
| ERF-61 | S | | | The `SemVer` pattern. |
| ERF-62 | | | U | A deployment fact. Wholly unperformed. |
| ERF-63 | | | U | A substrate fact. Wholly unperformed, and it is why ERF-19, ERF-28 and ERF-40 are unperformed too. |
| ERF-65 | V | F | | **V** frontmatter that will not parse; any string-typed field that arrived as another type under YAML 1.2's JSON schema. **F** a plain scalar a YAML 1.1 reader would retype (`no`, `on`, `012`, `0.9.0`, a bare date, sexagesimal, `.inf`, underscored integers), which the requirement makes a SHOULD. The resolution is implemented from scratch — see "Why the YAML loader is hand-built". |
| ERF-66 | V | | | Duplicate key, anchor, alias, explicit tag. Detected on the event stream, which is the only level at which they are observable at all. Applied to every file the corpus holds, including the declaration and the source list, which the requirement's wording arguably excludes (A9). |
| ERF-67 | V | | U | **V** UTF-8, LF line endings, no byte-order mark. **U** "valid CommonMark": every UTF-8 string is valid CommonMark, so the clause excludes nothing a validator can fail. |
| ERF-68 | | F | U | **F** a `shipped` source naming no licence; a `licence` with no `licence_name` alongside. `shipped-as-quotation` is the no-licence route and is not flagged. **U** that a named licence is a real SPDX identifier: the list is a network fact. |
| ERF-69 | S | F | U | **S** `excerpt` requires both `by` and `timestamp`. **V** a normalized text whose fold equals a quote it carries — "a copy of the thing it is meant to check". **F** a text under 1.5× a quote's length, a threshold with no warrant in the text (A22). **U** the fidelity check one level up: needs the raw file and the tools of ERF-70. |
| ERF-70 | V | F | U | **V** a source whose raw file is not text and which names no `extraction`. **F** `extraction` on a source that arrived as text. **U** determinism, and the case where no raw file is recorded at all, which is named per source (A21). |
| ERF-71 | V | F | | **V** a `received.digest` that does not match a held raw file. **F** an excerpt or a conversion carrying no digest, which the requirement makes a SHOULD. |
| ERF-72 | | | | A suppression rule, not a test: an `x_` field is never reported under ERF-55, and is surfaced as `INFO`. |
| YAMLB-1 | V | | | Recognition and grammar in full: a candidate is `<!--` then `claims:` where CommonMark would read an HTML comment, never in a code span or a code block; delimited at the first `-->`; unterminated when that `-->` never comes or comes after another `<!--`, in which case it extends to the end of its own line and the bindings after it stay visible. Ids whitespace-separated and never comma-separated, the anchor's two escapes decoded before the fold. A candidate that fails is reported and closes no passage. |
| SPEC-2 | V,S | | | The three actor forms and their disjointness (section 2, unnumbered — A23). |
| SPEC-3 | V | | | Everything the model refuses that no numbered requirement claims. |
| SPEC-5 | S | | | The six closed vocabularies (section 5, unnumbered). |

## The fabrication suite

`tests/fabrication` is 18 attempts to make a quotation the source does not
carry pass ERF-52, plus controls. The specification's conformance README
describes an attack suite; this is the independent one, written without seeing
it. Every atom's `limitations` field states the attack and the verdict a
correct reading of ERF-51 and ERF-52 should produce, and `tests/run.sh`
asserts each one.

**11 blocked, 7 passed.** Every result matched the prediction.

Blocked: a paragraph splice with no marker; a span lifted from inside
`non-binding`; `12` lifted from `12.5`; `1` lifted from `1,000`; `MAXLEN` for
`MAX_LEN`; `34` for `3*4`; a case change; a zero-width space used to join two
words; spans out of order; spans that would have to overlap; **and the sharpest
one, `[...]binding, and management did not recommend`**, which tries to use the
elision marker to make the whole-words test forget the hyphen beside it in the
text (ambiguity A2 — a naive implementation lets this through).

Passed, and three of them matter:

- **`The board did [...] approve the acquisition.`** reverses the sense of
  `The board did not approve the acquisition.` and passes. This is not a
  defect: ERF-52 says "The text between two spans is unbounded by design: an
  elision marker is the author's assertion that they removed material, and
  whether the removal misleads is a judgment for the audit, not a distance a
  validator can measure." The mechanical check cannot catch a fabricated
  meaning, only a fabricated string, and the format says so. Worth stating
  plainly anyway, because it is the failure mode a reader of a corpus most
  needs to know about.
- **`The board [...] unanimously`** elides an entire document between two
  three-word spans and passes, for the same reason.
- **`Revenue fell 12*.*5 percent`** passes, because the marker rule keeps a
  marker only between two *word* characters and a full stop is not one, so
  `*.*` folds away. The quote as written renders as `12.5` in markdown, so the
  outcome is arguably right — but it means what a reader sees rendered and what
  the check compares are not the same string, which nothing in ERF-51 says.

Controls that must pass and do: an honest copied quote; a quote typed without
the soft hyphen the text carries inside a word; a quote with composed accents
against a text storing them decomposed; two spans crossing a sentence boundary
inside one paragraph.

## Why Rust, and where it paid

The brief asked for exhaustiveness. Three places it produced something:

- **ERF-41.** The five dispositions are an enum and the computation is a total
  match on three booleans, with the fourth arm proved unreachable rather than
  defaulted:
  ```rust
  match (any_live, any_for, any_against) {
      (false, _, _)      => Disposition::Retired,
      (true, true, false)  => Disposition::Active,
      (true, false, true)  => Disposition::Rejected,
      (true, true, true)   => Disposition::Contested,
      (true, false, false) => unreachable!("a live stance is `for` or `against`"),
  }
  ```
  Writing it this way forced the question of what a claim with standings but no
  admissible entry reads as (ambiguity A19), which a `_ => proposal` arm would
  have swallowed.
- **ERF-43.** The four relations are an enum, so the premise relation had to say
  what it does with each of them — including the two it deliberately ignores:
  "`conflicts-with` and `decomposes-into` name tension and structure, never
  premises." A match arm that says `ConflictsWith | None => {}` is a claim
  about the specification, and it is checkable against the text.
- **The source statuses.** Five variants, and the compiler asked whether
  `shipped-as-quotation` owes a licence. It does not — it *is* the no-licence
  route — which is a distinction I would have flattened with a boolean.

Where it did not pay: the closed vocabularies are also in the schema, so the
enums are a second copy. That redundancy is deliberate (the graph checks must
work whether or not the schema compiled) but it is redundancy.

## Why the YAML loader is hand-built

`src/yamlload.rs` builds the tree from `yaml-rust2`'s event stream rather than
using a loader. Two reasons, both from the binding:

1. **ERF-65 pins YAML 1.2's JSON schema.** No available library offers that
   resolution — the binding's own section 6 reports two cold implementations
   on 2026-08-25 finding their parsers "offered no way to select the JSON
   schema at all", and that is still true. It is reimplemented here: `null`,
   `true`, `false` and JSON's own number grammar resolve to non-strings, and
   everything else, including `yes`, `on`, `012`, `~` and every date, stays a
   string.
2. **ERF-66 is invisible to a loader.** Duplicate keys, anchors, aliases and
   explicit tags are all resolved away before a tree exists. **No tool built on
   a normal YAML library can check ERF-66 at all.** The binding should say so
   where it states the rule.

## What "conforming" does and does not mean here

A `0` exit from this tool means: the corpus does not violate any MUST that is
decidable from the corpus and the files it holds, **under this tool's readings
of the twenty-nine ambiguities in `ambiguities.md`**, and under the 33
requirements it names as unperformed. It is not a certificate. In particular
it says nothing about whether a finding follows from its quote, whether a
source deserves its grade, whether an audit's verdict is honest, or whether an
elision misleads — the four judgments the format deliberately keeps with
people.

## Layout

```
src/main.rs        CLI, ordering, exit status
src/report.rs      the five kinds of finding
src/load.rs        discovery, the frontmatter/body split, ERF-54, ERF-67
src/yamlload.rs    YAML 1.2 JSON-schema resolution, ERF-65, ERF-66
src/schema.rs      the six compiled branches, and schema-error → requirement id
src/model.rs       the closed vocabularies as enums, ERF-41's computation
src/fold.rs        ERF-51 and ERF-52, with the worked examples as unit tests
src/narrative.rs   YAMLB-1 recognition and grammar
src/util.rs        RFC 3339, and ERF-47's precision rule
src/checks.rs      every invariant, and the UNPERFORMED declarations
tests/             the four corpora, the generator, the runner
```
