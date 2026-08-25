---
title: "erfval: an independent Rust validator for the Epistemic Record Format v0.9"
trial: "05-independent-implementation-rust"
date: 2026-08-25
---

# erfval

A validator for the Epistemic Record Format, built in Rust from `SPEC.md` alone.

**Purity.** Nothing outside this directory was read: no reference implementation, no
conformance fixtures, no example corpus, no other trial's output. The only external
material consulted was Rust crate documentation (yaml-rust2's event API, in the local cargo
registry). Where the specification refers to files it does not contain, most importantly
the normalization conformance cases named as normative in ERF-51, that absence is recorded
as a finding rather than worked around: see `ambiguities.md` A1.

Companion documents, all first-class deliverables of the trial:

| File | What it holds |
|:--|:--|
| `friction-log.md` | 91 dated one-liners: every guess, re-read and unsettled choice, with the requirement id |
| `ambiguities.md` | The 15 I judge genuine defects: two readings each, which I chose, why |
| `type-decisions.md` | 25 places the prose did not determine a type, what I chose, what someone else would |
| `tests/` | Three hand-built corpora used to exercise the build, kept as evidence of my reading |

---

## Build and run

```sh
cd erfval
cargo build --release
```

```sh
./target/release/erfval <corpus-or-deployment-directory> [OPTIONS]
```

From this directory, against the three fixtures:

```sh
erfval/target/release/erfval tests/corpus-clean
erfval/target/release/erfval tests/corpus-violations
erfval/target/release/erfval tests/deployment-two-corpora --dispositions
```

Tests (14 unit tests over the normalization sequence and the narrative-binding grammar, 5
integration tests over the fixture corpora):

```sh
cd erfval && cargo test --release
```

### Options

| Option | Effect |
|:--|:--|
| `--json` | one JSON object per line instead of the tab-separated form |
| `--no-notices` | suppress `NOTICE` findings |
| `--only-violations` | print only `VIOLATION` findings |
| `--dispositions` | also print each claim's computed disposition (ERF-41) |
| `--quiet` | suppress the trailing summary line on stderr |

### Output format

One finding per line, tab-separated, sorted by file then line:

```
SEVERITY  ERF-ID  SUBJECT  FIELD  FILE:LINE  MESSAGE
```

`SUBJECT` is the record id where there is one, otherwise the corpus id or the source key.
`FIELD` is a dotted, indexed path into the record (`standings[0].by`,
`searches[1].hits_reported`). `ERF-ID` is the requirement; `§2` and `§3` appear where the
specification states a MUST with no number (see `ambiguities.md` A8).

Real output, from `tests/corpus-violations`:

```
VIOLATION	ERF-19	brk-claim-state	standings[0].timestamp	records/claim-state-field.md:11	a standing's timestamp MUST be a full RFC 3339 instant carrying both a time and an offset, never a bare date
VIOLATION	ERF-44	brk-graph-b	edges	records/claim-graph-b.md	`conflicts-with` between `brk-graph-a` and `brk-graph-b` is stored 2 times; it MUST be stored once per pair, the reciprocal derived
FLAG	ERF-47	brk-003	finding_audit[0]	records/atom-stale-audit.md	verdict by `gemini-3.5-flash` is older than the atom's last change; a check that cannot tell says look
FLAG	ERF-49	brk-claim-unbacked	atoms_for	records/claim-unbacked-observation.md	unbacked: an observation someone stands on with empty `atoms_for` and empty `surveys`
NOTICE	ERF-65	brk-yaml	-	records/yaml-hazards.md:10	unquoted scalar `yes`: resolves to a boolean under YAML 1.1, to a string under the JSON schema
```

### The three severities

The specification distinguishes rejecting from flagging, and the output keeps them apart.

* **VIOLATION** — a machine-checkable MUST is breached. Non-conformance.
* **FLAG** — the spec says a validator flags rather than rejects: ERF-43 (a premise closure
  terminating in a retired leaf), ERF-47 (staleness), ERF-49 (unbacked), ERF-32
  (`indeterminate` staleness), plus the "check unavailable" outcome ERF-51 mandates and the
  unknown-record-type report of ERF-57. A flag never makes a corpus non-conforming, because
  as ERF-43 puts it, an act the format permits cannot retroactively do that.
* **NOTICE** — a SHOULD departure, or section-4 guidance that binds nothing.

### Exit codes

`0` no violations (flags and notices may still be present) · `1` at least one violation ·
`2` bad invocation.

---

## The corpus layout this validator expects

The specification defines no file layout: ERF-53 fixes one record per file, ERF-59 says the
declaration travels with the corpus, ERF-3 says the source list's interchange form is a
YAML document, and section 8 leaves storage to the substrate. Everything below is a
convention **invented for this implementation** (`ambiguities.md` A10).

```
<deployment>/                     the directory you hand to erfval
  <corpus-root>/
    corpus.yaml                   the declaration (ERF-59)
    sources.yaml                  the source list (ERF-3); capture paths resolve from here
    captures/…                    capture files, text or markdown
    **/*.md                       records (frontmatter + body) and narratives
  <another-corpus-root>/…         the deployment may hold several corpora
```

* Declaration filenames accepted: `corpus.yaml`, `corpus.yml`, `corpus-declaration.yaml`,
  `declaration.yaml`. The directory holding one is a corpus root.
* Source list filenames accepted: `sources.yaml`, `sources.yml`, `source-list.yaml`, beside
  the declaration. The document may be the map of sources itself or may nest it under a
  single `sources:` key (the section 4.1 example does the latter).
* A `*.md` file is a **record** if its frontmatter carries `type: atom | claim | survey`, a
  **narrative** if it has frontmatter without a `type`, and is ignored otherwise. Files
  named as captures by a source list are never read as records.
* **The directory you pass is the deployment.** ERF-35 (references resolve) and ERF-36 (ids
  are unique) are deployment-scoped, so pass the directory holding every corpus that is read
  and cited together. Passing a single corpus root validates a one-corpus deployment.
* A record's `corpus` field, not its directory, decides which corpus it belongs to and which
  source list its `source` resolves against (ERF-54: no meaning lives in a path).

---

## Requirement coverage

66 requirements are stated in the specification (ERF-16, 29, 30, 45, 46 and 64 do not
exist). Of these, **35 are implemented in full**, **24 are partial** (the checkable half is
implemented and the table says what the other half needs), and **7 are judged not
machine-checkable from a corpus snapshot**. Two further rules, the actor grammar and the
presence of section 3's required fields, carry no requirement id and are cited as `§2` and
`§3`.

### Implemented

| Requirement | What is checked |
|:--|:--|
| ERF-1 | a named capture exists on disk before any check runs against it |
| ERF-3 | the corpus keeps a source list; it is a mapping of source id to Source entry; keys are unique |
| ERF-4 | every atom's `source` resolves in its corpus's list; every source gives a path or records an absence |
| ERF-5 | absence statuses come from the closed set and carry a non-empty `reason`; an absence status may not ship a capture |
| ERF-6 | the quote occurs in the capture under the full ERF-51 sequence; `[...]` handled per ERF-52 |
| ERF-12 | verdicts are exactly `SUPPORTED`, `PARTIAL`, `UNSUPPORTED` |
| ERF-15 | references are bare ids and encode no location (`/`, `#`, `.md`, `..`) |
| ERF-17 | `corpus` is written on every record and names a declared corpus |
| ERF-19 | standings carry `timestamp`, `stance`, non-empty `why`; the timestamp is a full RFC 3339 instant |
| ERF-21 | a standing's `by` is a `human:` actor |
| ERF-31 | the narrative-binding grammar, including whitespace-separated ids and a required anchor that is a verbatim substring of the prose |
| ERF-32 | `bound-at` is recorded; staleness against the claim's `last_modified`; `indeterminate` when absent |
| ERF-33 | a narrative binding naming a record that does not exist, or a non-claim, is reported |
| ERF-34 | a narrative carries `title`, `corpus`, `created`, and is never treated as a record |
| ERF-35 | `atoms_for`, `atoms_against`, `edges.to`, `surveys`, `prior_survey`, `notable_results.atoms` resolve, to the right record type |
| ERF-36, ERF-38 | ids are unique across every corpus in the deployment, regardless of record type |
| ERF-39 | every standing has a `human:` actor and a non-empty `why` |
| ERF-41 | disposition computed from each person's newest non-withdrawn stance; five readings; `--dispositions` prints them |
| ERF-43 | self-edges; `assumes` and `decomposes-into` cycles; premise-closure termination; retired-leaf **flag** |
| ERF-44 | `conflicts-with` stored once per pair, in either direction |
| ERF-47 | `finding_audit`, `evidence_audit` and narrative-binding staleness, with the mixed-precision rule |
| ERF-49 | unbacked observation and unbacked argument **flags** |
| ERF-51, ERF-52 | the full normalization sequence (unwrapping steps a to f, then steps 1 to 11) and the elision-marker split, in order, without overlap |
| ERF-53 | one record per file; frontmatter plus body; an atom's body is empty |
| ERF-54 | `type` and `corpus` on every record; `type` matches the decoded shape |
| ERF-55 | unknown fields on any shape; empty lists present in a file |
| ERF-56 | omitted list-typed fields materialize as empty (reader behavior, exercised throughout) |
| ERF-57 | unknown fields and unknown record types are reported, never a reason to refuse |
| ERF-59 | the declaration exists and carries `id`, `title`, `spec_version` |
| ERF-61 | `spec_version` is Semantic Versioning 2.0.0 |
| ERF-66 | duplicate keys, anchors, aliases and explicit tags in frontmatter |
| ERF-68 | a shipped capture that names no licence must carry `shipped-as-quotation` |
| ERF-72 | `x_` fields are never reported as ERF-55 violations |
| §2 | actor ids follow `human:<id>`, `<producer>/<version>`, `process:<id>` |
| §3 | required fields are present and of the declared shape, on every interface in section 3 |

### Partial

| Requirement | Checked | Not checked |
|:--|:--|:--|
| ERF-7 | no URL in `citation_text`; `fetched.url` has a scheme | that the url names the file rather than a landing page |
| ERF-8 | an `issued` year absent from `citation_text` (notice) | that `citation_text` is rendered from `citation`; needs a CSL processor |
| ERF-9 | the closed vocabulary | the grade against the substance: judgement |
| ERF-11 | a stored mechanical-check field, by name; every audit entry carries its `protocol` | which field names count as storing the check |
| ERF-13 | prefix-plus-number shape (notice); reuse, via ERF-38 | permanence across time: needs history |
| ERF-14 | `as_of_date` parses; medium or low grade with no `limitations` (notice) | that the date is the date the fact is true of |
| ERF-18 | `title` present and non-empty; the body opens by restating it (notice) | whether an opening in other words states the same claim, which the spec says is a reading |
| ERF-20 | the shape; ids that no longer resolve (notice) | the producer SHOULD itself, deliberately not reported |
| ERF-22 | a stored state field, by name, plus the unknown-field rule | field names not in the list |
| ERF-23 | an atom listed both for and against (notice) | that evidence against is not modelled as a rival claim |
| ERF-24 | the closed kind vocabulary; premise definition (feeds ERF-43 and ERF-49); an audit on a bet or commitment (notice) | the backing question itself: judgement |
| ERF-26 | `tool` and `query` present and non-empty | that `tool` names a concrete instrument rather than a category |
| ERF-27 | `hits_reported` is text, not a YAML number | that it matches what the instrument reported |
| ERF-28 | `title` present; `prior_survey` resolves; id ends with the conducted date (notice) | immutability of `searches`: needs the substrate's history |
| ERF-48 | `last_modified` is later than `created` | that every change sets it: needs history |
| ERF-50 | the check is re-runnable and re-run here | that it runs as a gate at minting |
| ERF-58 | keys that name an event time by another name (`date`, `when`, `at`, …) are cited to ERF-58 rather than to ERF-55 | event-time keys outside that name list, which fall through to ERF-55 |
| ERF-60 | an unsupported MAJOR is reported | refusal, which would hide every other finding |
| ERF-62 | two declarations carrying one corpus id | that indexes and embeddings are treated as projections |
| ERF-65 | frontmatter parses; scalars that resolve differently under a legacy schema (notice) | see `ambiguities.md` A9 |
| ERF-67 | UTF-8, LF, no BOM | "valid CommonMark": every byte string is a conforming CommonMark document |
| ERF-69 | `excerpt: true` without a shipped capture | that the excerpt carries enough adjacent text: judgement |
| ERF-70 | `converter.tool` and `converter.deterministic` present; a tool string with no version digit (notice) | that the named tool is in fact deterministic |
| ERF-71 | digest format and sha256 length; a missing digest on an excerpt or conversion (notice) | that the digest matches the artifact: the artifact is not held |

### Judged not machine-checkable from a corpus snapshot

| Requirement | Why |
|:--|:--|
| ERF-2 | a web capture MUST be dated, and the `Source` shape defines no field to date it (`ambiguities.md` A5). A notice is emitted on every shipped web capture saying so |
| ERF-10 | grading the substance rather than the utterance is a judgement about meaning |
| ERF-25 | recognizing a universal negative from a claim's title needs natural-language judgement |
| ERF-37 | a producer's duty at mint time; for a validator it collapses into ERF-38 |
| ERF-40 | append-only "verified against the substrate's history", which a directory snapshot does not hold |
| ERF-42 | binds a consumer's rendering, not a corpus. `--dispositions` prints the five readings under distinct names so a caller cannot conflate `rejected` and `retired` |
| ERF-63 | a property of the store, not of the files |

---

## The three fixture corpora

| Corpus | What it is for |
|:--|:--|
| `tests/corpus-clean` | A conforming corpus: 3 atoms, 2 claims, 1 survey, 1 narrative, 2 sources, 1 capture. **Zero violations.** Its quote checks exercise line-broken words, an em dash against a `--`, and an elision marker; one atom's source ships no capture, which produces the ERF-51 unavailable flag |
| `tests/corpus-violations` | A corpus built to trip every implemented rule: 36 distinct requirement ids across 55 violations, plus 9 flags and 14 notices |
| `tests/deployment-two-corpora` | Three declarations, two corpus ids: ERF-62 (two homes for one corpus), ERF-38 across a corpus boundary, ERF-3 (a corpus with no source list), a legal cross-corpus reference, and all five ERF-41 dispositions |

The integration tests in `erfval/src/fixtures_test.rs` assert that the clean corpus reports
no violations and that the other two trip the expected requirement ids.

---

## Design notes

**Why no serde.** ERF-66 forbids duplicate keys, anchors, aliases and explicit tags, and
ERF-65 pins the resolution schema. A deserializer resolves the last duplicate, expands
aliases and reports none of it. Frontmatter is parsed through yaml-rust2's event stream into
a raw tree that keeps insertion order, duplicate keys, scalar style and line numbers; the
typed model of section 3 is decoded from that tree by hand. Every field's optionality was
therefore a decision typed out explicitly rather than a serde default, which is what
`type-decisions.md` records.

**Two layers, deliberately.** Serialization requirements (ERF-55, ERF-58, ERF-65, ERF-66)
run on the raw tree, where absence and duplication are visible. Semantic requirements run on
the typed model, where ERF-56's "an omitted list means none" has already been applied. A
record that fails to decode is dropped from the typed set but keeps its id in the sightings
list, so ERF-36 and ERF-35 still see it.

**Dependencies:** `yaml-rust2` (event-level YAML), `unicode-normalization` (NFKC for ERF-51
step 1), `regex`, `walkdir`. No CSL processor, no markdown parser, no date library.
