---
title: "Ambiguities and gaps"
subtitle: "Where two careful implementers would produce different .proto files from this prose, and where the prose says nothing at all"
generated: 2026-08-25
model: claude-opus-5[1m]
spec_tried: 0.9.0
---

# Ambiguities and gaps

Two sections. **Ambiguities** are places the prose supports more than one
encoding and a reader must choose. **Gaps** are places the prose supports none,
because it does not address the case.

Each ambiguity states the spec text, the encodings available, the one this
trial chose, and what breaks under the other. The test of a real ambiguity is
that a second implementer reading the same sentences lands somewhere else and
can defend it.

---

## Ambiguities

### #A1. Is `surveys?: SurveyId[]` an optional list or just a list?

**Spec text.** The data model:

```ts
surveys?: SurveyId[];        // absence/coverage backing (section 4.5)
```

against the closing paragraph of section 3:

> Lists are total in the type and MAY be empty; empty lists are omitted in
> serialization (section 7).

and `ERF-56`:

> A reader MUST materialize an omitted list-typed field as an empty list. An
> omitted list means none, never unknown, so a record that omits one is
> complete rather than partial. [...] **The data model types these fields as
> required because they are always present in a loaded record**; the
> serialization omits them because a file should not spend a line saying
> nothing.

That last sentence explains why `families`, `atoms_for`, `atoms_against`,
`edges`, `standings`, `finding_audit`, and `evidence_audit` carry no `?`. It
does not explain why `surveys` does. `notable_results[].atoms?` has the same
problem.

**Encodings.**

1. `repeated string surveys`: the `?` is decoration; absent and empty are the
   same fact, per `ERF-56`.
2. `SurveyIdList surveys` (a wrapper message): the `?` is information; absent
   and empty are different facts.

**Chosen: 2**, so the distinction survives and can be measured. Measured:
absent/empty/full round-trips as `[False, True, True]`.

**What breaks under 1.** `tests/claim-surveys-empty.md` and
`tests/claim-surveys-absent.md` converge, and a producer that writes
`surveys: []` (already an `ERF-55` violation) gets silently corrected. Nothing
else. **Which is the argument for 1**: `ERF-49` reads the two alike ("an
`observation` someone stands on with empty `atoms_for` and empty `surveys`"),
so the distinction the wrapper preserves has no consumer.

**What breaks under 2.** A wrapper message appears in the wire format that the
data model does not have, and a second implementer's `.proto` and this one are
not wire-compatible: the same field number carries a length-delimited message
in one and a packed string list in the other. **Two conforming implementations
of the same specification produce mutually unreadable bytes at this field**, and
the specification gives no way to tell which is right.

The honest reading is that `ERF-28`'s aside tips toward 2 for
`notable_results[].atoms` ("a `notable_results` entry gaining its `atoms` once
a hit is minted") and `ERF-49` tips toward 1 for `surveys`, which would mean the
two optional lists in the format should be encoded differently. No implementer
would guess that.

**Recommendation.** Delete both `?`s, or add a sentence saying what an absent
`surveys` means that an empty one does not.

### #A2. Is the source list a `map` or a `repeated` entry with a key field?

**Spec text.** `ERF-3`:

> A corpus MUST keep a source list: a document whose top level is a mapping of
> exactly two keys, `type` with the value `sources`, and `sources`, holding one
> entry per work following the `Source` shape of section 3, **keyed by a source
> id unique within the corpus**

and the data model's `sources: Record<SourceId, Source>`. `ERF-3` also records
that an earlier wording caused a misread, so the nesting is deliberate.

**Encodings.**

1. `map<string, Source> sources`: mirrors `Record<SourceId, Source>` exactly.
2. `repeated SourceEntry sources` with `string id = 1; Source source = 2;`,
   which mirrors the YAML's observable order and preserves duplicates.

**Chosen: 1**, because it is the shape the data model states.

**What breaks under 1, measured.** Key order changed, and did not change the
same way twice: **five distinct orderings from six separate runs of identical
code on identical input.** Fixed within a process, moving with the hash seed
between them. proto3 declares map ordering undefined, so this is conforming
behaviour. It means one corpus serialized on two days is two different
documents, which is a direct cost against `ERF-63`'s git substrate.

Worse, two entries under one key on the wire produce one entry, resolved
last-one-wins by the parser: **a validator built on the generated code cannot
see the duplicate, because the collision is resolved before any code runs.**
`ERF-3`'s uniqueness requirement becomes unfalsifiable rather than satisfied.

**What breaks under 2.** A `SourceEntry` message and an `id` field appear that
the specification does not have; the entries now carry an *order*, which the
data model does not define, so two producers serializing the same corpus emit
different bytes; and the reverse mapping must decide what to do with an order
the format assigns no meaning.

**The general lesson.** Whether uniqueness is enforced by the container or
checked by a validator is a real design fork, and `ERF-3` states the invariant
without saying which. The format's own note on uniqueness sides with checking
("Detection belongs to the validator"), which argues for encoding 2 and against
the shape the data model literally writes.

### #A3. Must an empty `sources` mapping be written?

**Spec text.** `ERF-3`: "a mapping of exactly two keys." `ERF-55`: "a mapping
that is present and empty asserts existence [...] and MUST be written," against
"Empty lists MUST be omitted."

A `Record<SourceId, Source>` with no entries is a present, empty mapping, so
`ERF-55`'s mapping clause says write it. But is it a mapping or a collection?
It is spelled as a mapping and behaves as a collection.

**Chosen.** `sources: {}` is always written, and every other map field
(`x_fields`, `unrecognized`) is written only when non-empty. That asymmetry is
a rule in code (`mapping.py`, `from_proto`), because a proto3 map has no
presence and cannot hold it.

**What breaks under the other choice.** A corpus with no sources emits a
one-key document, violating `ERF-3`'s "exactly two keys" on a literal reading.

### #A4. A scalar at its zero value: emit or omit?

Where a field has no explicit presence (`Claim.body`, every `type` field, every
enum), a reader must decide whether `""` means absent.

**Chosen: omit.** The alternative writes `limitations: ""` onto every atom that
never had one, which is worse. But omission is a guess, and where the input
genuinely was `""` it is wrong. For `body` it is provably harmless (see #A12);
for `type` it is a real conflation (#A8).

### #A5. What goes at enum value zero?

**Spec text.** Section 5: "Closed sets. A value outside them is a validation
failure, not a dialect."

proto3 mandates a zero member. There is no encoding without one.

**Encodings.**

1. `EPISTEMIC_KIND_UNSPECIFIED = 0`: an illegal value the spec does not have,
   but a detectable one.
2. `EPISTEMIC_KIND_OBSERVATION = 0`: every member legal, but an omitted field
   silently becomes `observation`, which under `ERF-24` owes atoms and under
   `ERF-49` gets flagged unbacked. A missing field becomes a confident wrong
   answer.

**Chosen: 1**, six times over. Neither is conformant. See losslessness **F1**
for why the `Stance` case is the dangerous one: `ERF-41` asserts "Every input
has exactly one reading," and the zero member has none, so two implementations
will invent different readings and compute different dispositions for the same
corpus.

**What breaks under 2.** `Stance` would default to `for`, `Verdict` to
`SUPPORTED`, and `SourceStatus` to `shipped`. A corrupted or truncated record
would report a claim as backed by a supported audit under a licence nobody
granted. That is not a hypothetical: it is what proto3 does with a field it did
not receive.

### #A6. Does `ERF-72`'s `x_` namespace cover a narrative?

**Spec text.** `ERF-72`: "a producer MAY originate one on any **record,
declaration, or source**."

A narrative is none of the three. `ERF-34` is emphatic: "A narrative MUST NOT
be modelled as a record: it is a document."

**Chosen.** No `x_fields` map on `Narrative`; only `unrecognized`, per
`ERF-57`.

**What breaks under the other choice.** Nothing observable, which is the
problem: an implementer who reads `ERF-72` as covering every file will accept
`x_reviewed_by` on a narrative and one who reads it literally will report it as
an unknown field. Both are defensible and they disagree. The same question
applies to *nested* objects: may a `StandingEntry` or a `SearchAct` carry an
`x_` field? `ERF-72` says "on any record," and a standing entry is inside a
record rather than being one. This schema puts the escape maps only at file
level, which is a guess.

### #A7. `well_formed` as a `bool` at zero.

A `bool` in proto3 has no presence. `well_formed = false` and "not examined"
are the same byte. Chosen anyway, because the alternative
(`optional bool`, or an enum with an UNSPECIFIED member) reintroduces the
problem it solves. The field is a projection, not record data, so nothing in
the specification rides on it.

### #A8. Is `type` a closed vocabulary or an open one?

**Spec text.** `ERF-54` enumerates six values. Section 5 lists the closed sets
and does not include `type`. `ERF-57` requires a consumer to preserve **unknown
record types**, which presupposes an open set.

**Encodings.**

1. `string type`: open, per `ERF-57`.
2. `enum RecordType type`: closed, per `ERF-54`'s enumeration, with the usual
   mandatory zero member.

**Chosen: 1.**

**What breaks under 1.** `type: ""` becomes representable and, having no
presence, is indistinguishable from an absent `type`. `ERF-54` sends those two
down different paths ("A file carrying no `type` is not part of the corpus; a
consumer MUST ignore it"), so the conflation decides corpus membership. This
schema pays for it once more in `OpaqueFile`, where `optional string
type_value` exists precisely to keep "unrecognized type" apart from "no type."

**What breaks under 2.** `ERF-57` becomes unimplementable: an unknown type
string has no enum member and lands on the zero member, and the record vanishes.

### #A9. Is a half-present `evidence_at_stance` legal?

**Spec text.** `ERF-20` gives the shape as
`{atoms_for: [ids], atoms_against: [ids]}`. `ERF-55` treats the whole mapping
as one present-or-absent thing.

Nothing says whether `evidence_at_stance: {atoms_for: [kwg-1]}` (with
`atoms_against` omitted) is legal. Under `ERF-55`/`ERF-56` an omitted list
materializes empty, so it should be, and this schema accepts it and emits it
that way (measured: `standings[0].evidence_at_stance.atoms_against` dropped as
a licensed change). But `ERF-20` reads as though the pair is the unit, and an
implementer could reasonably require both keys.

### #A10. The `Actor` union is ambiguous on its own terms.

**Spec text.**

```ts
type Actor = `human:${string}` | `${string}/${string}` | `process:${string}`;
```

`${string}/${string}` matches any string containing a slash, including
`human:claude/v1` and `process:nightly/2`. The three arms are not disjoint, and
section 2's "Every actor id MUST follow this convention" gives no
disambiguation rule. A validator checking "is this a `human:` actor"
(`ERF-21`, `ERF-39`) must decide whether `human:a/b` qualifies. This schema
types it `string` and defers, which is the only thing proto3 can do, and the
ambiguity would bite any implementer regardless of encoding.

### #A11. Is `Excerpt` a type or an alias?

**Spec text.** `Source` declares `excerpt?: Excerpt`, and no `Excerpt`
interface exists. A comment says:

> Excerpt is an ActorStamp: the one attributed step of the pipeline (`ERF-69`)
> records who selected the passage and when, like any other act.

The comment is not normative prose and `Excerpt` is not in the list of aliases
section 3 says it omits (`AtomId`, `ClaimId`, `SurveyId`, `SourceId`,
`CorpusId`, `FamilyName`, `CSL`). So `Excerpt` is a type the document declares
and never defines, glossed only in a code comment. Chosen: `ActorStamp`, per
the comment and the example (`excerpt: {timestamp: ..., by: ...}`).

### #A12. Does a record's body participate in the round trip?

`Atom` has no `body` field, and `ERF-53` says an atom's file "is frontmatter
and nothing else" while insisting "the shape is still frontmatter plus body."
So an atom file has a body position that the data model cannot describe. This
schema gives `Atom` no body field and treats the empty body as a property of
the file.

For `Claim` and `Survey`, `body` is a required string, and in the interchange
form there is no syntax distinguishing an absent body from an empty one: both
are zero bytes after the closing `---`. proto3's implicit presence matches the
format exactly here. **This is the one field where the standard criticism of
proto3 lands equally on the specification's own serialization**, and it is
worth saying because it shows the criticism is about a real property of
interchange forms rather than about protobuf.

### #A13. String timestamps or a typed instant?

Chosen: `string`, everywhere. `ERF-14`'s variable precision and `ERF-47`'s
precision-comparison rule make `google.protobuf.Timestamp` actively wrong, not
merely inconvenient. An implementer who reaches for the typed instant, which is
the obvious move and what a code generator would suggest, produces a schema
that cannot represent `as_of_date: 2018` and cannot implement `ERF-47`. The
specification does not warn them.

### #A14. `hits_reported` as text.

`ERF-27` settles this ("as text ('0', '3', '~120 reported, two pages
inspected')"), and it is listed here because it is the field an implementer is
most likely to "fix" into an integer. Doing so violates "a record MUST NOT state
precision the instrument did not give." The `.proto` records the correct choice
and cannot record the reason.

### #A15. Is there a container at all?

The interchange form is one record per file with no envelope, and `ERF-54`
insists "no meaning lives in a path." A wire format needs *something* to carry a
corpus. This schema invents `Corpus` and `OpaqueFile`, which are not in the
specification. Another implementer would invent a different envelope, or a
length-prefixed stream, or none. Nothing is wire-compatible across that choice.
Recorded rather than solved: the specification is about records, and a corpus is
a set of files whose only stated container is "a directory or archive"
(`ERF-59`).

---

## Gaps: places the prose says nothing

### G1. An unquoted year is a number.

`ERF-14` uses `2018` as its worked example of a legal `as_of_date`. `ERF-65`
resolves frontmatter under YAML 1.2's JSON schema, where `2018` is JSON number
grammar and therefore an integer. The data model types the field `string`.
`ERF-65`'s producer SHOULD covers "a timestamp"; a bare year is not one.

**Measured: hard failure.** `tests/atom-unquoted-year.md` raised a `TypeError`.
The specification's own example value, written the way the specification writes
it, does not load.

The fix is one clause: extend `ERF-65`'s SHOULD from "a timestamp" to "any
date-valued or version-valued string." Note that `spec_version: 0.9.0` survives
only by having two dots; `spec_version: 1.0` would resolve to the float `1.0`
and break `ERF-61` the same way.

### G2. `CSL` is never defined.

Section 3 says the inline mirror "omits [...] its identifier alias definitions
(`AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId`, `FamilyName`,
`CSL`)". Six of those seven are obviously strings. `CSL` is a nested object of
substantial complexity, and its definition is in a file the implementer is told
about but not given. An implementer building from the prose has to invent the
type, and every invention is different. This schema used
`google.protobuf.Struct` and measured the cost: every integer in the citation
returns as a float, which breaks `ERF-8`'s canonicality.

### G3. `ERF-53`'s round-trip guarantee does not reach the source list.

"provided every **record** round-trips through the interchange form without
loss." The source list, the declaration, and every narrative are explicitly not
records. Three of six measured losses fall there, including the entire CSL
block, which `ERF-8` calls canonical, and the digests that `ERF-71` says close
the check the format cannot otherwise run. Either the word "record" is doing
unintended work or the guarantee has a hole where the provenance chain lives.

### G4. An empty string is undefined.

`ERF-55` rules on empty lists and empty mappings. Nothing rules on an empty
scalar. Section 3's "Optional fields (`?`) assert existence when present" read
literally makes `limitations: ""` an assertion that a blank caveat exists. The
only two places the format forbids an empty string are `ERF-19` and `ERF-39`,
both about `why`. Twenty-one fields in this schema are affected, and the
specification's answer for each of them is silence.

### G5. `ERF-41` has no reading for a stance outside the vocabulary.

"Every input has exactly one reading" is stated of the three legal stances. A
standing entry whose `stance` is missing, empty, or outside the set is
something `ERF-57` obliges a consumer to read and `ERF-41` gives no rule for.
Since disposition drives everything downstream, two consumers will disagree
about the same corpus. Adding one sentence ("a stance outside the vocabulary is
discarded from the disposition computation and flagged") would close it.

### G6. `ERF-72`'s scope is stated at file level only.

"any record, declaration, or source" leaves narratives, and every nested object
(a standing entry, a search act, a notable result, a `Received`), unaddressed.
See #A6.

### G7. YAML's empty scalar.

`key:` with nothing after it. YAML 1.2's JSON schema has no production for it,
because JSON has no empty scalar. This harness resolves it to `null`, which is a
guess. `ERF-65` names the JSON schema and does not say what falls outside it.

### G8. Nothing states that a producer must round-trip its own output.

`ERF-53` binds a *store*. The Producer conformance class binds "the
serialization rules (section 7) and the producer SHOULDs of section 4."
Idempotence of write-read-write is never required, which is the property that
would have caught every loss measured here on the first save.
