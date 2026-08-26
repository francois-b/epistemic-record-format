# erfval

A strict validator for the Epistemic Record Format, in Rust, built cold from
three documents and nothing else:

- `../SPEC-as-tried.md` — the specification
- `../SCHEMA-as-tried.json` — the normative data model (embedded verbatim at
  `schema/erf.schema.json`; the copy is byte-identical)
- `../BINDING-as-tried.md` — the YAML/Markdown binding, version 1

No other file in this repository was read, listed or searched: not the reference
implementation, not the conformance suite, not the type rendering, not the other
trials, not the git history. Where that cost something, `friction-log.md` says
so. Where two implementers could reasonably diverge, `ambiguities.md` says so.

## Building and running

```
cargo build --release
./target/release/erfval <corpus-dir> [<corpus-dir> …]
```

Two or more directories are read as one **deployment**, which is the scope
`ERF-35`, `ERF-36` and `ERF-38` are written for. A run over one corpus names
those three as PARTIAL, because section 2 requires it.

```
--dispositions      print the computed disposition of every claim (ERF-41)
--erf51-literal     read ERF-51 step 3 to the letter, collapsing U+2029 with
                    every other White_Space (see ambiguities.md, A-1)
--no-unperformed    suppress the UNPERFORMED section (on by default; naming
                    what was not checked is a duty, not a courtesy)
```

Exit code is `1` on any violation, `0` otherwise, `2` on a usage or load error.

### Output

Three kinds of line, each carrying a requirement id and a layer tag:

```
VIOLATION   ERF-52    model    atoms/lg-003.md  span 0 does not occur in the normalized text as whole words: "binding, and management did not recommend it."
FLAG        ERF-43    model    claims/annual-close.md  premise closure contains `x`, whose disposition is retired
UNPERFORMED ERF-40    model    -  Append-only "verified against the substrate's history": this tool reads a directory, not a history.
```

- **VIOLATION** — the corpus does not conform.
- **FLAG** — the corpus conforms; a person should look. Section 2: "a corpus
  carrying flags and no violations conforms".
- **UNPERFORMED** — a check this tool did not run, or ran only in part, named
  because the Validator conformance class requires it: "A validator MUST name
  the requirements it does not check".

The `model` / `binding` tag answers section 7's demand that "A validator for a
binding checks both and says which it is reporting": `model` lines are
conformance to the data model and the invariants, the same in every binding;
`binding` lines are conformance to the bytes under the YAML/Markdown binding.

## What runs the standards

Every step the specification delegates to a standard is delegated to that
standard's implementation, not re-derived:

| Standard | Library |
|:--|:--|
| CommonMark 0.31.2 (`ERF-51` step 1, `ERF-67`, `YAMLB-1` recognition) | `pulldown-cmark`, extensions off |
| UAX #15, NFC (`ERF-51` step 2) | `unicode-normalization` |
| UCD `Default_Ignorable_Code_Point`, `White_Space` (`ERF-51` steps 2 and 3) | ICU4X `icu_properties` |
| UAX #29 default word boundaries (`ERF-52`) | `unicode-segmentation` |
| RFC 3339 (`ERF-19`, `ERF-47`, `ERF-48`) | `chrono::DateTime::parse_from_rfc3339` |
| JSON Schema 2020-12 (section 3) | `jsonschema` |
| Semantic Versioning 2.0.0 (`ERF-61`) | hand-parsed against the grammar; the schema's pattern is also applied |
| YAML 1.2 (`ERF-65`, `ERF-66`) | `yaml-rust2`, read at the **event** level |
| SPDX License List (`ERF-68`) | **not held.** A hand-written slice, offline; see the table |

`ERF-67` says `ERF-66` "cannot be checked through a YAML library's tree, since
duplicate keys, anchors, aliases and tags are resolved away before a tree
exists; a validator reads the parser's event stream." So `src/yamlload.rs` never
asks for a tree: it collects the parser's events, checks `ERF-66` against them,
resolves plain scalars under YAML 1.2's **JSON schema** (`ERF-65`) itself, and
builds the value from what is left. This is also the only way to get `ERF-65`
right, because every mainstream YAML library resolves scalars under 1.1 by
default and the binding's own section 8 records that two cold implementations
"found their parsers offered no way to select the JSON schema at all".

## Closed vocabularies

Every closed set in section 5 is a Rust enum with no default arm:
`RecordType`, `Verdict`, `Stance`, `EpistemicKind`, `Relation`,
`SourceQuality`, `SourceStatus`, plus the computed `Disposition` and the three
`ActorForm`s. Parsing returns `Option`; there is nowhere in the crate that a
value off a list can be silently absorbed. Where a match had to cover a case the
specification does not state, that case is in `ambiguities.md` and not in a
default arm — the one `unreachable!()` in the crate is
`disposition_of`'s `(false, false)`, which is unreachable because withdrawals
are discarded one line earlier.

---

# Requirement by requirement

66 requirement ids exist across the three documents: `ERF-1` through `ERF-72`
less the seven that are absent (`ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`,
`ERF-46`, `ERF-49`, `ERF-64` — see `ambiguities.md` A-27), plus `YAMLB-1`.
Every one of them is accounted for below.

Two ids in the output are mine, coined because the rules they carry have none:
`YAMLB-1s` for the binding's section 1 (A-14) and `SPEC-2` for section 2's
unnumbered "Every actor id MUST follow this convention" (A-30). `SPEC-3` and
`SPEC-4.3` appear as fallbacks when a schema failure has no finer-grained home
in section 3.1's field index.

Legend: **V** the check can report a violation · **F** the check can raise a
flag · **U** named as unperformed or partial.

## Section 4.1 — the source

| Req | | What this tool does |
|:--|:--|:--|
| ERF-1 | V U | **V**: a source whose `status` ships and whose `normalized` path is not on disk. **Self-satisfied**: the tool makes no network call of any kind, so "checks MUST run against that text, never the live web" holds by construction. |
| ERF-2 | V F U | **V**: a `received.url` with an `http`/`https` scheme and no `received.timestamp` (A-8); a `received.digest` that does not match a held raw file. **F**: `received` with no `path` and missing `url` or `digest`; a `received.path` naming a file the corpus does not hold. **U**: immutability ("a revision arriving later MUST be a new source") needs the substrate's history. |
| ERF-3 | V | **V**: no file carries `type: sources`; a source id appearing in two source lists (A-13). Uniqueness within one list is `ERF-66`'s duplicate-key check. |
| ERF-4 | V | **V**: an atom naming a source id the list does not hold; the schema's `if/then/else` conditional (a shipping source names `normalized`, an absence names `reason`). |
| ERF-5 | V | **V**: `status` off the closed set; a recorded absence with no `reason`. |
| ERF-68 | F U | **F**: a `shipped` source naming no `licence` (A-9); a `licence` outside the bundled SPDX slice; a `licence` with no `licence_name` alongside. **U**: SPDX governs its own list and this tool holds a hand-written slice, offline. The "shipping under no licence as a short quotation" MUST needs licence facts the record does not carry. |
| ERF-69 | V F U | **V**: `excerpt` present without `by` and `timestamp` (schema). **F**: a normalized text whose entire content is the quote, which is "a copy of the thing it is meant to check". **U**: the fidelity check ("MUST occur, under the folding of `ERF-51`, in the normalization of the whole extracted source") needs the raw file and the extraction tool; and nothing in the record says whether a text is an excerpt at all (A-36). |
| ERF-70 | F U | **F**: a raw file whose extension is not text and no `extraction` named; an `extraction` or `normalization` string carrying no version. **U**: determinism cannot be established without running the tool twice; "another format" is undefined (A-37). |
| ERF-71 | V F U | **V**: a digest not spelled `sha256:<64 hex>`; a digest that does not match bytes the corpus holds (A-10). **F**: an excerpt or conversion with no `received.digest`. **U**: confirming a digest against the artifact at `received.url` needs a network fetch, which `ERF-1` forbids a check from making. |
| ERF-7 | V F | **V**: the schema's `not: {pattern: "://"}` on `citation_text`. **F**: a schemeless locator — `www.`, `doi.org` — that the schema's test misses (A-7). |
| ERF-8 | F U | **F**: a `citation.title`, `citation.author[].family` or `citation.issued` that does not appear in the rendered `citation_text`. **U**: "`citation_text` MUST be rendered from it" needs a CSL processor and the Chicago style; the tool holds neither and makes no network call. |

## Section 4.2 — the atom

| Req | | What this tool does |
|:--|:--|:--|
| ERF-6 | F U | **F**: a quote that matches only once step 2 of the fold has run, which is a retyped quote's one visible trace (A-31). **U**: the producer's act of copying is not observable from the corpus. The verbatim requirement itself is enforced through `ERF-50`/`51`/`52`. |
| ERF-9 | V F U | **V**: `source_quality` off the closed set. **F**: `medium` or `low` with nothing in `limitations` (section 4.2's guidance, A-29). **U**: the grade is a judgment about an attester and a chain. |
| ERF-10 | U | **U**: "assessed against the substance the finding conveys" is a reading of the finding against its source. Nothing here is decidable from the corpus. |
| ERF-11 | V F U | **V**: `AuditEntry` shape — `auditor`, `verdict`, `timestamp` and `protocol` all required and non-empty. **F**: an `auditor` that parses as an `Actor`, which the requirement says it deliberately is not; an `x_` field on an atom whose name reads as a stored quote-check result, the one place the schema's closed property set could be evaded. **U**: the audited judgment is by construction not recomputable. |
| ERF-12 | V U | **V**: a verdict outside `SUPPORTED` / `PARTIAL` / `UNSUPPORTED`, caught twice — by the schema enum and by an explicit `Verdict::parse`. **U**: "a failed, unparseable or abandoned audit MUST NOT be written as one" is a fact about a run this tool never saw. |
| ERF-13 | F U | **F**: an id that is not a prefix plus a sequence number. A flag, not a violation, because the schema's `Id` admits any non-whitespace string (A-6). **U**: permanence needs the substrate's history. |
| ERF-14 | V U | **V**: the `AsOfDate` pattern (a year, a year and month, or a full date). **U**: "at the precision the source gave and no finer" needs the source read by a person. |

## Section 4.3 / 4.4 — the claim and the backing audit

| Req | | What this tool does |
|:--|:--|:--|
| ERF-15 | V | **V**: any id-bearing value that encodes a location — a `/`, a `\`, a `://`, a leading `.`, or a `.md`/`.yaml`/`.json` tail. Applied to every reference field including `families` and `source`. |
| ERF-17 | V | **V**: a record with no `corpus`; a `corpus` naming no declaration found in that corpus (A-26). |
| ERF-18 | V F U | **V**: `title` and `body` required and non-empty (schema). **F**: a body whose first paragraph is not the title restated verbatim under the fold; an empty body. **U**: "`title` MUST state the claim" is a judgment. |
| ERF-19 | V U | **V**: a standing `timestamp` that is not a full RFC 3339 instant — including one that satisfies the schema's pattern but not the standard (A-4). **U**: append-only is `ERF-40`'s, and needs history. |
| ERF-20 | F | **F**: a standing entry with no `evidence_at_stance`. "Drift MUST NOT be stored there" and "counts are not an acceptable digest" are enforced structurally: `EvidenceAtStance` admits exactly two id lists. |
| ERF-21 | V | **V**: a standing whose `by` is not a `human:` actor. |
| ERF-22 | F U | **F**: an `x_` field on a claim whose name reads as a state or a disposition. **U**: otherwise enforced structurally — the schema gives a claim no state field and closes the property set. |
| ERF-23 | V U | **V**: `atoms_for` / `atoms_against` shapes and the resolution of their contents (`ERF-35`). **U**: "Evidence against a claim MUST NOT be modeled as a rival claim" needs a reading of two claims' meanings. |
| ERF-24 | V F U | **V**: `epistemic_kind` off the closed set. **F**: an `evidence_audit` on a `bet` or a `commitment`, which "owe no backing, so they have nothing to audit". The premise sourcing this requirement defines — outgoing `assumes` plus incoming `supports` — is implemented and used by `ERF-43`. **U**: whether an audit asked the question the kind sets is not in the record. |
| ERF-25 | F U | **F**: a claim whose title reads as a universal negative and which cites no surveys. Labelled heuristic in the message, because the requirement gives no test (A-35). **U**: the scoped-audit obligation itself. |

## Section 4.5 — the survey

| Req | | What this tool does |
|:--|:--|:--|
| ERF-26 | V F U | **V**: `tool` and `query` required and non-empty. **F**: a `tool` matching a hand-written list of categories (A-34). **U**: whether a query is in the instrument's own terms is a judgment. |
| ERF-27 | V U | **V**: `hits_reported` required and typed as a non-empty string, so a bare `0` is caught (by `ERF-65`, which names that exact case). **U**: "MUST NOT state precision the instrument did not give" needs the instrument's own output. |
| ERF-28 | V F U | **V**: `id`, `title`, `conducted`, `searches` (at least one act) and `body` required. **F**: a re-run whose id does not end with its `conducted` date; an empty body. **U**: immutability of the acts needs history; "the `title` MUST state what was sought" is a judgment. |

## Section 4.6 — the narrative

| Req | | What this tool does |
|:--|:--|:--|
| ERF-31 | V F U | **V**: a binding id resolving to nothing, or to a record that is not a claim. **F**: an anchor that does not occur in its passage under `ERF-52` — a flag, exactly as the requirement instructs, "because anchors break for the ordinary reason that someone edited the prose". Passages are cut narrowly as specified: from the end of the previous *valid* binding's marker, or the start of the body, to the start of this marker. **U**: which passages assert something, and therefore which are missing a binding, is a reading. |
| ERF-32 | F | **F**: stale, when a named claim's `last_modified` is later than `bound-at`, under `ERF-47`'s cross-precision rule. **F**: `indeterminate` when the comparison cannot be run (A-23), never shown as current. |
| ERF-33 | F | **F**: every unresolved id is reported, alongside the `ERF-31` violation. No record is ever invented for one. |
| ERF-34 | V | **V**: the `Narrative` shape. A narrative carrying a record's furniture — `id`, `standings`, `atoms_for`, `edges`, `evidence_audit`, `epistemic_kind` — is reported under `ERF-34` rather than as a generic undefined field. |
| YAMLB-1 | V | **V**: a candidate that fails the grammar, reported and closing no passage (A-12); a `bound-at` that is not a calendar date. Recognition precedes validation: candidates are found where CommonMark would read an HTML comment, never in a code span or code block; each is delimited at its first `-->` before the grammar is applied; an unterminated candidate stops at the end of its own line so the bindings after it stay visible. The two anchor escapes are decoded before folding. |

## Section 6 — the invariants

| Req | | What this tool does |
|:--|:--|:--|
| ERF-35 | V F U | **V**: a reference asserting a current relationship that resolves to nothing, or to a record of the wrong type — an atom list must name atoms, `surveys` and `prior_survey` surveys, `edges.to` claims. **F**: an `evidence_at_stance` id that no longer resolves, because it "records a past state" and "a corpus changing afterwards is a permitted act". **U**: PARTIAL over one corpus. |
| ERF-36 | V U | **V**: through `ERF-38`. **U**: PARTIAL over one corpus. |
| ERF-37 | U | **U**: a producer's act before writing, not a state of the corpus. `ERF-38`'s detection is what a validator can do; the specification says so itself. |
| ERF-38 | V U | **V**: two records holding one id, regardless of type. **U**: PARTIAL over one corpus; pass several roots to widen the scope. |
| ERF-39 | V | **V**: a standing with no `why`, an empty `why`, or a non-`human:` `by`. |
| ERF-40 | U | **U**: "verified against the substrate's history". This tool reads a directory, not a history, and nothing in a directory distinguishes an appended ledger from a rewritten one. |
| ERF-41 | V F | **Computed** in full and printed with `--dispositions`: no standings is `proposal`; withdrawals discarded; none remaining `retired`; all `for` `active`; all `against` `rejected`; both `contested`; each person's newest admissible entry only. **V**: an inadmissible entry, reported and then treated as never written so the person's previous entry stays current (A-11). **F**: two entries by one person at the same instant, with the later in the ledger taken as current. |
| ERF-42 | U | **U**: a consumer's rendering duty. This tool names each disposition distinctly and asserts nothing about other consumers. |
| ERF-43 | V F | **V**: a self-edge in any relation; a cycle in the premise relation over all claims, whether or not any closure reaches it; a cycle in `decomposes-into`; a closure ending at an argument with no premises (A-3). **F**: a closure containing a claim whose computed disposition is `retired`. Closures are followed over distinct claims, so the walk terminates on any input. |
| ERF-44 | V | **V**: a `conflicts-with` stored on both records of a pair. |
| ERF-47 | F | **F**: a `finding_audit` older than the atom's last change; an `evidence_audit` older than the claim's last change or than any cited atom's (A-22); narrative-binding staleness is `ERF-32`. The cross-precision rule is implemented exactly: a bare date against an instant on the same day resolves to stale, two equal bare dates read as current. |
| ERF-48 | V U | **V**: a `last_modified` not later than `created`, with the same-day allowance at date precision. **U**: "later than any prior `last_modified`" needs history. |
| ERF-50 | V U | **V**: through `ERF-52`, over the source's normalized text and never the live web. **U (per atom)**: the check is reported *unavailable* — never passed, never failed — for a source whose text is not held, or is not text or markdown, exactly as `ERF-51` instructs. **U**: the gate at minting is a producer's pipeline. |
| ERF-51 | V U | **Implemented in full**, each step by its standard's library, applied identically to quote and text, case never folded. **U**: the normative case files `erf-cases-normalization.txt` and `erf-cases-quote-check.txt` were not supplied and this implementation has never been run against them; the specification says the cases govern where they and a reading of the prose disagree (A-38). One reading was forced, A-1. |
| ERF-52 | V F | **V**: split on the exact `[...]` before normalization; each span folded independently; every non-empty span must occur in order, without overlap, and with both ends on a UAX #29 word boundary as amended by the hyphen departure; an all-empty quote fails rather than trivially passing. Placement is searched, not taken greedily (A-20). **F**: a bracketed near-marker that is not the exact marker, which is checked as literal text. |

## Section 7 — serialization, bindings, versioning

| Req | | What this tool does |
|:--|:--|:--|
| ERF-53 | U | **U**: round-tripping through the model without loss is a property of a binding implementation, not of a corpus. A validator reading one binding cannot observe it. |
| ERF-54 | V F | **V**: zero or two files carrying `type: corpus`; a record with no `corpus`. **F**: every file carrying no `type`, reported as ignored and not part of the corpus — including the normalized texts and raw files, which is what the requirement literally asks for (A-16). |
| ERF-55 | V | **V**: any list written out empty, at any depth (A-15); any field the schema does not define, outside the `x_` namespace. |
| ERF-56 | U | **U**: implemented as this tool's own behaviour. An omitted list is materialized as empty and a record that omits one is read as complete. |
| ERF-57 | V/F U | **V** under a known version, **F** under a newer MINOR: an unrecognized record type. **U**: the preserve-and-report duty is this tool's behaviour — no corpus is ever rejected solely for holding unknown content. |
| ERF-58 | V | **V**: an event-time key spelled anything but `timestamp` inside `created`, `last_modified`, `conducted`, `excerpt` or `received`. |
| ERF-59 | V | **V**: not exactly one declaration; a declaration missing `type`, `id`, `title` or `spec_version`. |
| ERF-60 | V F | **Read first, before anything else.** **V**: an unsupported MAJOR, refused with an explicit diagnostic. **F**: a MINOR newer than `0.9`, which switches the run to lenient mode where unknown fields and unknown record types are reported as unrecognized and never counted as violations (A-24). |
| ERF-61 | V | **V**: a `spec_version` that is not Semantic Versioning 2.0.0. |
| ERF-72 | F U | **F**: every `x_` field, reported as unknown. **U**: the never-under-`ERF-55` half is this tool's behaviour, and is asserted by the ordering of the two checks. |
| ERF-65 | V | **V**: frontmatter that does not parse; a string-typed field that arrived as `null`, a boolean or a number under YAML 1.2's JSON schema. Resolution is done by this crate, not by a library's default, because the default is 1.1 everywhere. `2018`, `0`, `1e3` and `1.0` are numbers; `012`, `0.9.0`, `no`, `on`, `~` and every quoted scalar are strings. |
| ERF-66 | V | **V**: a duplicate key, an anchor, an alias, or an explicit tag, all read off the parser's event stream because a tree cannot show them. |
| ERF-67 | V | **V**: a file that is not valid UTF-8; a byte-order mark; CRLF line endings. |
| YAMLB-1s (coined) | V | **V**: an atom, a declaration or a source list carrying a markdown body; a `body` key in frontmatter where the binding puts the body in the file; a record written as a bare YAML document rather than frontmatter plus body. The binding's section 1 states these and numbers none of them (A-14). |

## Section 8 — storage

| Req | | What this tool does |
|:--|:--|:--|
| ERF-62 | U | **U**: "exactly one authoritative home" is a fact about a deployment's arrangements, not about bytes in a directory. |
| ERF-63 | U | **U**: a statement of what a substrate MAY be. Nothing to check. |

## Unnumbered

| Id | | What this tool does |
|:--|:--|:--|
| SPEC-2 (coined) | V | **V**: an actor id matching none of `human:<id>`, `<producer>/<version>`, `process:<id>`. Section 2 states this as a MUST and gives it no number (A-30). |
| SPEC-3 / SPEC-4.3 | V | Fallback attribution for a schema failure with no finer-grained home in section 3.1's field index. `SPEC-3` also carries the assertion that the per-definition check and the schema's top-level `oneOf` agree. |

---

## Counts

- **66** requirement ids exist; all 66 are addressed.
- **45** of them can report a **VIOLATION** (44 `ERF-*` plus `YAMLB-1`). Three
  further ids emit violations and are not the specification's: the coined
  `YAMLB-1s` and `SPEC-2`, and the `SPEC-3` schema fallback. `ERF-51` is
  implemented in full but reports through `ERF-52` and `ERF-50`, so it is not
  counted here.
- **29** can raise a **FLAG**.
- **37** are named **UNPERFORMED or PARTIAL** — 34 in the table at the foot of
  `src/checks.rs`, plus `ERF-35`, `ERF-36` and `ERF-38` named as partial
  whenever the run covers one corpus.
- **8** are named and otherwise unchecked at the corpus level: `ERF-10`,
  `ERF-37`, `ERF-40`, `ERF-42`, `ERF-53`, `ERF-56`, `ERF-62`, `ERF-63`. Four of
  those (`ERF-42`, `ERF-53`, `ERF-56`, `ERF-63`) are not checks a validator can
  perform at all; the other four need a history, an act, or a deployment fact.

## Tests

```
cargo test
python3 tests/make-corpora.py     # regenerate the corpora
```

52 tests, all passing:

- **27 unit tests** in `src/` — the fold, the quote check, the word-boundary
  departure, the YAML scalar resolution, the timestamp algebra, the narrative
  binding grammar.
- **21 fabrication tests** in `tests/fabrication.rs` — quotations the source
  never said, tried against the check. 14 are stopped; 6 pass and are recorded
  as passing, because the check's limits should be visible; 1 demonstrates what
  the rejected reading of `ERF-51` step 3 would admit.
- **4 corpus tests** in `tests/corpora.rs` — the conforming corpus must produce
  no violation, the flagged corpus must produce no violation and every named
  flag, every `bad-*` corpus must violate the requirement its directory names,
  and a single-corpus run must name the deployment-wide checks as partial.

### The corpora

`tests/corpora/` holds 44 corpora, all authored here from the specification and
regenerated by `tests/make-corpora.py`. The generator is the readable statement
of what each one does: a base corpus, then one named mutation per bad corpus.

- `conforming/` — every record type, both worked source shapes, all five
  computed dispositions, all four relations, an elided quote, a source whose
  text is withheld so the check comes back unavailable, two surveys with a
  `prior_survey` link, and a narrative with two bindings. Zero violations.
- `flags-worth-a-look/` — conforms, and raises 23 flags across 15 requirements.
  This is the corpus that proves section 2's rule that a flag is not a violation.
- `bad-*` — 42 corpora, each one change away from `conforming/`, each named for
  the requirement it breaks.

Two of the bad corpora are worth singling out because they are fabrications
against the evidence primitive rather than schema errors:
`bad-erf52-splice-across-paragraphs/`, which joins the tail of one paragraph to
the head of the next, and `bad-erf52-word-fragment/`, which cuts `non-binding`
down to `binding` and thereby reverses what the committee said.

## Layout

```
src/main.rs       CLI
src/lib.rs        module roots, and validate()
src/report.rs     the three output kinds, the two conformance layers
src/yamlload.rs   ERF-65, ERF-66: YAML at the event level
src/corpus.rs     discovery by content, frontmatter/body split, ERF-67
src/schema.rs     JSON Schema 2020-12 + section 3.1's field index, inverted
src/model.rs      the closed vocabularies as enums; the timestamp algebra
src/norm.rs       ERF-51 and ERF-52
src/nbinding.rs   YAMLB-1: recognition, delimiting, grammar
src/checks.rs     every requirement, and the UNPERFORMED table
schema/           a byte-identical copy of the normative data model
tests/            the corpora, their generator, and the test suites
ambiguities.md    38 forks, with the reading taken and what breaks under the other
friction-log.md   every re-read, guess and inference
```
