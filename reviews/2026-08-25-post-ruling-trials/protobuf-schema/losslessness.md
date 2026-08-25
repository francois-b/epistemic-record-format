---
title: "Losslessness: YAML to protobuf to YAML, field by field"
subtitle: "What survived a real wire round trip of the Epistemic Record Format, what did not, and whether the specification cares"
generated: 2026-08-25
model: claude-opus-5[1m]
spec_tried: 0.9.0
---

# Losslessness

## The specification's own round-trip requirement

The format states one, in `ERF-53`, and states it as the licence for any store
that is not a directory of markdown files:

> **ERF-53** The canonical interchange form MUST be one record per file: YAML
> frontmatter plus markdown body, for every record type. [...] A store MAY hold
> records any other way it likes, body as one more field, many records in one
> collection document, rows in a database, **provided every record round-trips
> through the interchange form without loss**; how records are grouped in a
> store carries no meaning, because each record states its own `type` and
> `corpus` (`ERF-54`).

A protobuf schema is exactly the store `ERF-53` contemplates. So the test this
trial ran is the test `ERF-53` names, and the verdict below is a conformance
verdict, not a curiosity.

Two things about that sentence matter more than they look.

It says **record**. The format is careful elsewhere that a source is not a
record ("A source is not a record: it carries no created stamp, no standings,
and no disposition, because nobody asserts a source"), that the corpus
declaration is not a record, and that a narrative "MUST NOT be modelled as a
record: it is a document." The only losslessness requirement in the format
therefore does not cover the source list, the declaration, or any narrative.
Three of this trial's six measured losses fall in that uncovered space. See
finding **F2**.

It says **without loss** and does not say loss of what. Mapping key order is a
difference a reader sees and a diff tool reports. Whether it is loss is not
answered.

## Method

`harness/roundtrip.py` reads each test file, splits frontmatter from body under
`ERF-53`, parses the frontmatter under `ERF-65`'s YAML 1.2 JSON schema, maps it
into a generated protobuf message, **serializes it to wire bytes**, parses those
bytes back into a fresh message, maps that back to a YAML document, and diffs.

The serialize/parse cycle is the point. An in-process protobuf object in Python
retains distinctions the wire encoding does not. Only real bytes test presence.

Differences are classified three ways:

| Class | Meaning |
|:--|:--|
| **licensed** | The specification requires or permits the change. Not loss. |
| **order** | Same data, different mapping key order. The specification is silent. |
| **loss** | Data went in and did not come out. |

Raw output: `results-roundtrip.txt`, `results-presence.txt`, `report.json`.
Round-tripped documents: `tests/out/`.

## Headline

```
files: 16   losses: 6   hard failures: 1   spec-licensed changes: 7   key-order changes: 9
```

Schema size, counted from the compiled descriptor:

```
messages defined      : 20  (15 from the data model, 5 scaffolding proto3 forced)
fields defined        : 123    (91 from the data model, 32 machinery)
enums defined         : 6
`optional` scalars    : 21   <- explicit-presence opt-ins
singular message flds : 15   <- presence for free
repeated fields       : 20
map fields            : 15   <- ordering + duplicates lost
```

**21 explicit-presence opt-ins.** That number is the answer to the question this
trial was set to ask. Twenty-one times, a naive proto3 encoding of this data
model would have silently merged "the author wrote nothing" into "the author
wrote the empty string," and twenty-one times the schema had to reach for a
keyword that did not exist in proto3 until 2020 to stop it. A schema author
working from this prose without the presence question in front of them would
have written all twenty-one as plain `string` and shipped a corpus in which a
recorded blank and an unrecorded field are the same bytes.

---

## Part 1. The presence matrix

Measured directly in `harness/presence_probe.py`, which round-trips through
bytes and then asks `HasField`.

### P-1. `evidence_at_stance`: absent vs present-and-empty. **PRESERVED.**

The specification's clearest statement that absence is data:

> **ERF-55** [...] a producer MUST NOT generalize it to an optional mapping: a
> mapping that is present and empty asserts existence, per section 3, and MUST
> be written. `ERF-20`'s `evidence_at_stance` is why the distinction is worth a
> sentence. Absent, it says the ruler stamped nothing; present and empty, it
> says the ruler stamped, and faced no evidence. Those are different facts, and
> `ERF-20` calls the second the one thing about a ruling's context that cannot
> be recovered later, so a producer tidying `{}` away destroys it and makes
> never-stamped and stamped-facing-nothing the same bytes.

Measured, three standing entries differing only in that field:

```
HasField after a full wire round trip:  [False, True, True]
bytes for an EvidenceAtStance carrying two empty lists:
    0 bytes of content; the parent spends 2 bytes to say 'present'
```

The output document (`tests/out/claim-evidence-at-stance.md`) carries entry [0]
with no `evidence_at_stance` key, entry [1] with `evidence_at_stance: {}`, and
entry [2] with `evidence_at_stance: {}` (its longhand empty lists normalized
away by `ERF-55`, correctly). Two bytes on the wire is the entire cost of the
one fact `ERF-20` says cannot be recovered later.

**This is the one place proto3's semantics land exactly on the
specification's, and it lands there by accident of a 2008 design decision.**
Singular message fields in proto3 have always had explicit presence, because a
sub-message is length-delimited and a zero-length submessage is still a tag on
the wire. Had `evidence_at_stance` been modelled as two scalars rather than as
a nested mapping, the distinction would have been gone. The format's data model
made a choice here that a wire format happens to reward, and nothing in the
prose shows any awareness that it was a choice.

### P-2. Optional scalar: absent vs present-and-empty. **PRESERVED, but only because the keyword was used.**

```
with `optional`:      absent=False  empty=True   bytes differ by 2
CONTROL (implicit):   bytes identical: True; has_presence=False;
                      a reader cannot ask, and there is no API to ask with
```

`tests/atom-minimal.md` and `tests/atom-empty-strings.md` are the same record
shape with `as_of_date` and `limitations` absent in one and `""` in the other.
Both round-trip unchanged.

**The specification never rules on the empty string.** `ERF-55` governs empty
lists and empty mappings and says nothing about an empty scalar. Section 3 says
only that "Optional fields (`?`) assert existence when present," which read
literally makes `limitations: ""` the assertion that a caveat exists and is
blank. That reading is probably not intended. It is also the only reading the
document supports. Recorded as gap **G4**.

The two places the format does forbid an empty string are `ERF-19` and
`ERF-39`, both about a standing's `why` ("an entry without a reason is a
toggle, not a judgment"). Nowhere else.

### P-3. The optional list. **PRESERVED ONLY BY INVENTING A MESSAGE.**

`surveys?: SurveyId[]` and `notable_results[].atoms?: AtomId[]` are the only
two optional lists in the data model. **proto3 forbids `optional repeated`
outright.** There is no syntax. A repeated field has no presence and there is
no keyword that gives it one.

Two encodings exist and the specification does not choose between them:

```
WRAPPER encoding (chosen):  absent/empty/full -> [False, True, True]
PLAIN `repeated`:           absent and empty are the same zero bytes
```

The wrapper preserves a distinction that `ERF-55` and `ERF-56` between them
say does not exist:

> **ERF-56** A reader MUST materialize an omitted list-typed field as an empty
> list. An omitted list means none, never unknown, so a record that omits one
> is complete rather than partial.

If that governs `surveys`, the `?` is decoration and `repeated` is right. If
the `?` governs, `ERF-56` has an unstated exception. `ERF-49` sides with
`ERF-56` in passing ("an `observation` someone stands on with empty
`atoms_for` and empty `surveys`" reads absent and empty alike), which is the
best evidence available and is not a ruling. Recorded as ambiguity **#A1**.

`tests/claim-surveys-empty.md` and `tests/claim-surveys-absent.md` are the pair.
The first round-trips with four empty collections dropped as licensed and
`surveys: []` retained; the second round-trips byte-identical. Under the plain
`repeated` encoding the two would converge.

### P-4. Enum zero values. **SIX ILLEGAL STATES CREATED.**

proto3 requires the first member of every enum to have the value 0 and to be
the field's default. Section 5 of the specification:

> Closed sets. A value outside them is a validation failure, not a dialect.

Six vocabularies, six mandatory members outside the sets:

| Field | proto3 zero member | What the spec says about it |
|:--|:--|:--|
| `Claim.epistemic_kind` | `EPISTEMIC_KIND_UNSPECIFIED` | `ERF-24`: "the kind is the backing contract." A claim with no kind has no contract. |
| `StandingEntry.stance` | `STANCE_UNSPECIFIED` | `ERF-41`: "Every input has exactly one reading." This input has none. |
| `Edge.relation` | `RELATION_UNSPECIFIED` | Section 5 defines four relations subject-first. There is no fifth. |
| `Atom.source_quality` | `SOURCE_QUALITY_UNSPECIFIED` | `ERF-9`: the grade "MUST grade one axis." |
| `AuditEntry.verdict` | `VERDICT_UNSPECIFIED` | `ERF-12`, quoted in full below. |
| `Source.status` | `SOURCE_STATUS_UNSPECIFIED` | `ERF-5`: "MUST carry a `status` from a closed set." |

All six are `has_presence=False`, so an omitted field and a field written at
the zero value are the same zero bytes. See finding **F1**.

The alternative, aliasing zero onto a real member (`EPISTEMIC_KIND_OBSERVATION
= 0`), is worse: it converts an omission into a confident wrong answer rather
than a detectable one. proto3 offers no third option, and neither choice is
conformant. Recorded as ambiguity **#A5**.

### P-5. The source list as a map. **ORDER NOT MERELY LOST BUT UNSTABLE; DUPLICATES UNDETECTABLE.**

```
key order in   ['zeta', 'alpha', 'mu', 'beta']
key order out  ['mu', 'beta', 'zeta', 'alpha']

is the order stable across PROCESSES?
    5 distinct orderings from 6 separate runs of identical code on
    identical input:
      alpha,zeta,beta,mu / beta,alpha,zeta,mu / mu,beta,alpha,zeta
      mu,beta,zeta,alpha / zeta,beta,mu,alpha

two map entries with the SAME key arriving on the wire:
    1 entry survives, citation_text='SECOND'
```

This is worse than reordering, and it was found by accident: the harness's
key-order count came back different on two consecutive runs of the same code
over the same corpus (9, then 8, then 10, then 6, then 7). The map's iteration
order is fixed within a process and moves with the hash seed between processes.

**Serializing one corpus today and again tomorrow produces different bytes and
a different YAML document.** For a format whose reference substrate is files in
git (`ERF-63`: "Files in git are the reference implementation (history and
diffing for free)"), a store that reorders the source list on every write does
not merely lose information. It fills the history with diffs nobody made.

proto3 guarantees nothing about map ordering, so this is the licence being
exercised rather than a bug. See finding **F4** and ambiguity **#A2**.

### P-6. CSL through `google.protobuf.Struct`. **INTEGER FIDELITY LOST.**

```
in   issued=1494   chapter-number=36
out  issued=1494.0 chapter-number=36.0
```

See finding **F2**.

### P-7. Unknown fields. **RETENTION IS REAL AND WORTHLESS HERE.**

proto3 has retained unknown wire fields since 3.5, and the probe confirms it:
an unrecognized field number survives a proto-to-proto round trip byte for byte.
That buys nothing for this format, because the corpus is YAML. A YAML key has a
*name*, not a field number. The value never reaches the wire: a reader must
decide where to put `granted:` before serializing anything. Preservation of
`ERF-57`'s unknown fields requires an explicitly declared
`map<string, google.protobuf.Value>`, and every corpus that goes through it
pays P-6's number-precision cost. See finding **F5**.

### P-8. Narrative bindings. **CARRIED, UNDERSTOOD NOT AT ALL.**

```
2 recognized, 1 malformed and carried anyway in `raw`
what the schema knows about a binding inside `body`: Nothing.
```

See finding **F6**.

---

## Part 2. Field-by-field round trip

Every field of every message, against the test corpus. `licensed` entries are
changes the specification requires.

### Atom

| Field | Result | Note |
|:--|:--|:--|
| `id` | identical | |
| `type` | identical | but `type: ""` would be indistinguishable from absent (#A8) |
| `corpus` | identical | |
| `finding` | identical | |
| `quote` | identical | `[...]` survives as literal text; nothing checks it |
| `source` | identical | the referent is not checked by the schema |
| `source_quality` | identical when written; **absorbed into the zero member when omitted** | F1 |
| `as_of_date` | identical, absent and `""` both preserved | **hard failure on an unquoted year**, G1 |
| `limitations` | identical, absent and `""` both preserved | needed `optional` |
| `created` | identical | message presence, free |
| `last_modified` | identical, absence preserved | `ERF-48`: "A record never edited since minting correctly carries no `last_modified` at all" |
| `finding_audit` | identical; absent stays absent | `ERF-56` names this case; proto3 agrees exactly |
| `finding_audit[].verdict` | **LOSS on an out-of-vocabulary value** | F1 |

### Claim

| Field | Result | Note |
|:--|:--|:--|
| `id`, `type`, `corpus`, `title` | identical | |
| `epistemic_kind` | identical when written | zero member illegal, F1 |
| `created`, `last_modified` | identical | |
| `short_name`, `semantic_query` | identical, absence preserved | needed `optional` |
| `families`, `atoms_for`, `atoms_against` | identical; **empty omitted (licensed, `ERF-55`)** | 4 licensed changes measured |
| `surveys` | three-state preserved | only via the wrapper, P-3 |
| `edges` | identical, all four relations including both hyphenated ones | hand-written name table required |
| `standings` | identical; order preserved (repeated fields are ordered) | append-only is not checkable |
| `standings[].evidence_at_stance` | **three-state preserved**, P-1 | 2 licensed inner-list omissions |
| `evidence_audit` | identical | |
| `body` | identical | absent and empty are the same bytes in *both* formats |
| `x_*` | **LOSS: `x_confidence: 3` returned `3.0`** | F5 |
| unknown keys | preserved as opaque, order lost | F5 |

### Survey

| Field | Result | Note |
|:--|:--|:--|
| `id`, `type`, `corpus`, `title` | identical | |
| `conducted` | identical | machine actor legal here |
| `searches[].tool`, `.query`, `.hits_reported` | identical, `hits_reported` stays text | `ERF-27` forbids inventing precision, so an int here would be a conformance bug |
| `searches[].scope` | identical in all three states: absent, `""`, present | needed `optional` |
| `searches[].timestamp` | identical, absence preserved | absence triggers `ERF-28`'s inheritance rule, so it is data |
| `notable_results[].what`, `.note` | identical | |
| `notable_results[].atoms` | three-state preserved | second optional list, P-3 |
| `prior_survey` | identical, absence preserved | needed `optional` |
| `last_modified`, `body` | identical | |

### CorpusDeclaration

All five written fields identical; `classification` and `owner` absent and
preserved absent. No losses.

### Source (not a record)

| Field | Result | Note |
|:--|:--|:--|
| `citation_text` | identical | |
| `citation` | **LOSS: every integer returned as a float** | F2 |
| `received` | present-and-empty vs absent **preserved** | `received: {}` survives, P-1's mechanism |
| `received.url/.path/.digest/.timestamp` | identical, each absence preserved | four `optional`s; `ERF-71` makes an absent digest evidence |
| `status` | identical when written | zero member illegal, F1 |
| `normalized`, `normalized_digest`, `reason`, `licence`, `licence_name`, `extraction`, `normalization` | identical, absences preserved | seven `optional`s; `ERF-70`: "Both fields are absent when the step did not happen" |
| `excerpt` | identical, absence preserved | message presence |
| `x_*` | **LOSS: `x_retrieval_attempts: 3` returned `3.0`** | F5 |

### SourceList

| Field | Result | Note |
|:--|:--|:--|
| `type` | identical | |
| `sources` | contents identical; **key order changed** | F4 |

### Narrative

| Field | Result | Note |
|:--|:--|:--|
| `type`, `title`, `corpus`, `created` | identical | `ERF-34` rules `created` is the full stamp |
| `body` | byte-identical, bindings and all | and entirely opaque, F6 |
| `bindings` | 4 recognized, 1 malformed carried | a projection, not part of the diff |

### OpaqueFile (unknown and typeless files)

Both preserved with frontmatter intact and body byte-identical. Mapping key
order changed. The distinction between "unknown type" and "no type at all"
needed `optional string type_value`, because `ERF-54` sends the two down
different paths ("A file carrying no `type` is not part of the corpus").

---

## Part 3. The findings

### F1. proto3 mints exactly the state `ERF-12` was written to forbid.

> **ERF-12** A verdict MUST be exactly one of `SUPPORTED`, `PARTIAL`, or
> `UNSUPPORTED`. A failed, unparseable, or abandoned audit MUST NOT be written
> as a verdict: an audit that produced nothing is an audit that did not happen,
> the atom is unaudited, and the remedy is to run it again. **Recording a tool
> failure in the field that holds a judgment makes the two indistinguishable to
> everything downstream.**

proto3 requires `VERDICT_UNSPECIFIED = 0` and makes it the default. The field
that holds a judgment now has a mandatory member meaning "no judgment," and
because enum fields have no presence, it is the same zero bytes as an omitted
field. The specification wrote a rule against a failure mode; the wire format
requires it by fiat.

Measured: `tests/atom-illegal-vocabulary.md` carries `verdict: FAILED`. It came
back with the key gone entirely. A consumer obeying `ERF-57` ("MUST preserve
[...] MUST report [...] MUST NOT reject") cannot obey it here, because a proto3
enum can hold an unknown *number* but not an unknown *string*, and the input was
a string. The value has nowhere to go.

The `Stance` case is the one with teeth. `ERF-41` computes a claim's
disposition and asserts totality: "Every input has exactly one reading."
`STANCE_UNSPECIFIED` has no reading. Every implementation must therefore invent
one, and two implementations will invent different ones. One reads a
zero-stance entry as `withdrawn` (it is not a position), another discards it
(it is malformed), a third treats it as `for` (it is an entry, and entries back
claims). Under `ERF-41`'s own algorithm those three produce `retired`,
`proposal`, and `active` for the same corpus.

### F2. The only losslessness requirement in the format does not cover the data that lost the most.

`ERF-53` requires that "every **record** round-trips through the interchange
form without loss." The format is emphatic that a source is not a record:

> A source is not a record: it carries no created stamp, no standings, and no
> disposition, because nobody asserts a source.

Three of the six measured losses are in `sources.yaml`: two CSL integers turned
into floats, and one extension field. Two more are extension fields on a claim.
The source list is also where the corpus keeps its digests, its licence
judgments, and its normalized-text paths, which is to say the entire
verifiability chain of `ERF-1`, `ERF-69`, `ERF-70`, and `ERF-71`.

The CSL loss is not incidental. `ERF-8` makes the citation canonical:

> **ERF-8** When `citation` is present it is canonical: it MUST carry
> everything the rendered `citation_text` string shows, chapter, translator,
> and edition included, and `citation_text` MUST be rendered from it.

A store that returns `chapter-number: 36.0` has broken the field the format
declares canonical, and `ERF-53` does not notice, because a source is not a
record. Whether the format wants `ERF-53` to reach the source list is not
stated anywhere. It should be.

Two structural reasons a hand-written CSL message does not escape this: CSL-JSON
field names contain hyphens (`publisher-place`, `chapter-number`,
`container-title`), which are illegal proto identifiers, so any typed CSL needs
a rename table the specification does not supply; and CSL-JSON is open-ended, so
the table can never be complete. The specification also omits `CSL` from its own
inline mirror ("it omits the file's header comments and its identifier alias
definitions [...] `CSL`"), so an implementer working from the prose has no
definition of the type at all. Recorded as gap **G2**.

### F3. `google.protobuf.Timestamp` is unusable, and the reason is a real property of the format.

Every timestamp in this schema is a `string`. That looks like laziness and is
not. `ERF-14`:

> It MAY be a year, a year and month, or a full date, and MUST NOT state
> precision the source did not give: a study reporting a figure for 2018 carries
> `2018`, not an invented day.

And `ERF-47`:

> Where the two stamps differ in precision and the coarser one cannot order them
> (a bare date against a full instant on the same day), the comparison MUST
> resolve to stale.

`google.protobuf.Timestamp` is a normalized instant. It cannot hold "2018" as
anything other than `2018-01-01T00:00:00Z`, which invents the precision
`ERF-14` forbids, and it destroys the input `ERF-47`'s rule reads. In this
format the *written precision of the text* is data, and the natural typed
representation of a time throws it away.

The measured consequence is a hard failure, not a loss:
`tests/atom-unquoted-year.md` writes `as_of_date: 2018` unquoted. Under
`ERF-65` that is JSON number grammar and loads as an integer. The data model
types the field as a string. The harness raised `TypeError`. `ERF-65`'s
producer SHOULD covers "a timestamp"; a bare year is not one, and nothing in
the document says to quote it. Two conforming rules collide on the exact value
`ERF-14` uses as its worked example. Recorded as gap **G1**.

### F4. A `map` makes `ERF-38`-style duplicate detection structurally impossible.

`ERF-3` requires source ids "unique within the corpus." `ERF-38` requires a
validator to reject duplicate record ids. The specification's own note on
uniqueness is explicit about who does what:

> Detection belongs to the validator, prevention at mint to the producer, and
> concurrent minting to neither: two writers, or two git branches, can mint the
> same next number and merge without conflict.

Measured: two map entries under the same key arriving on the wire produce one
entry, silently, resolved by the parser. A validator built on the generated code
receives an already-clean object. There is nothing left to detect. **The
encoding does not merely fail to check the rule, it removes the evidence the
check would run on.**

And the same field is unstable in order across processes: five distinct
orderings from six identical runs. `ERF-63` names files in git as the reference
substrate, "history and diffing for free." A store that emits a different key
order on every write turns that into history and diffing for nothing, and it
does so without changing one byte of meaning, which is the kind of noise that
trains a reviewer to stop reading diffs.

The specification calls this exact hazard out for YAML, in `ERF-66`, and refuses
to adjudicate it:

> YAML permits all four and leaves a processor's response to duplicates at its
> own discretion, so two conforming parsers may legally disagree about the same
> file. [...] declining them removes the disagreement rather than adjudicating
> it.

proto3 adjudicates it. Last one wins. The format's stated preference is to
decline, and a map field takes the choice away.

### F5. The extension namespace `ERF-72` defines cannot be expressed at all, and the workaround is lossy.

> **ERF-72** A field whose name begins `x_` is an extension field: a producer
> MAY originate one on any record, declaration, or source, and a validator MUST
> NOT report it as an unknown-field violation of `ERF-55`.

A `.proto` file has no way to say "any field whose name begins `x_`". Field
names are fixed at compile time. The only home is a
`map<string, google.protobuf.Value>`, which costs ordering (proto3 declares map
ordering undefined) and integer fidelity (Value's only number type is `double`).
Measured: `x_confidence: 3` returned `3.0`; `x_review.rounds: 2` returned `2.0`.

The same map is the only home for `ERF-57`'s unknown fields, and the same costs
apply. This is worth stating plainly: **the Producer conformance class is free
in protobuf and the Consumer class is close to impossible.** A generated schema
enforces `ERF-55`'s "A producer MUST NOT originate a field the declared
`spec_version` does not define" for nothing, automatically, because the schema
is closed. And a closed schema is precisely what `ERF-57` forbids a consumer to
be. An unknown *record type* is worse still: there is no message to parse it
into, so a schema serving the Consumer class must be authored with the escape
hatch already in it, before anyone knows what will arrive.

### F6. A narrative is a document, and protobuf settles the question.

`ERF-34` says a narrative "MUST NOT be modelled as a record: it is a document."
The schema can carry it (four typed frontmatter fields and a string) and can say
nothing whatever about it. Every operation the format defines over a narrative,
`ERF-31`'s grammar, `ERF-32`'s staleness, `ERF-33`'s resolution, `ERF-51`'s
folded occurrence test, re-parses prose at read time. The `.proto` contributes
no constraint.

The sharper result is that modelling bindings as typed messages *only* would
violate `ERF-31`:

> A binding that does not match this grammar MUST be reported, never skipped.
> A comment opening `<!--` followed by `claims:` IS a narrative binding:
> recognizing one and validating one are separate acts, and a consumer performs
> them in that order. **Without this rule a required part does not make a
> binding invalid, it makes it invisible.**

A typed `NarrativeBinding` message with `claim_ids`, `anchor`, and `bound_at`
has no legal assignment for a comment that omits `bound-at`. A producer
populating that message must drop it, which is the failure `ERF-31` exists to
forbid. This schema therefore carries `raw` and `well_formed` beside the parsed
fields, and the round trip confirms the malformed binding survives: "2
recognized, 1 malformed and carried anyway in `raw`."

The general lesson: **the format's requirement to preserve what fails to parse
means no schema can be the authority on any part of a narrative.** The bytes
are.

---

## Part 4. Verdict against `ERF-53`

| Class | Count | `ERF-53` verdict |
|:--|:--|:--|
| Records round-tripping without loss | 8 of 11 | conforms |
| Records losing data | 1 (`atom-illegal-vocabulary`, out-of-vocabulary verdict) | **fails**, on input the record was already non-conforming for |
| Records failing hard | 1 (`atom-unquoted-year`) | **fails**, and the input is arguably conforming (G1) |
| Records losing only key order | 1 (`claim-extension-and-unknown`, also lost integer type) | **fails** |
| Non-records losing data | `sources.yaml` (2 CSL integers, 1 extension field, key order) | **not covered by `ERF-53`** |

So: as a store under `ERF-53`, this schema does not conform, and it fails on
three distinct mechanisms (an out-of-vocabulary enum value, a scalar whose YAML
type is ambiguous under `ERF-65`, and the number precision of the extension
escape hatch). Two of the three are proto3's fault. The third, the unquoted
year, is the specification's.

Every one of the twenty-one `optional` keywords is a place where this verdict
would have been worse without deliberate effort, and nothing in the
specification tells an implementer that the effort is required. The prose says
"Optional fields (`?`) assert existence when present" once, in a closing
paragraph of section 3, and never returns to it except for
`evidence_at_stance`. An implementer who reads `?` as "may be omitted" rather
than as "its absence is an assertion" writes twenty-one plain strings and loses
every one of them.
