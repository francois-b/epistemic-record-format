---
title: "What the schema cannot say"
subtitle: "Every numbered requirement of the Epistemic Record Format against a proto3 file, and where the boundary falls"
generated: 2026-08-25
model: claude-opus-5[1m]
spec_tried: 0.9.0
---

# What the schema cannot say

The specification carries **66 numbered requirements** (`ERF-1` through
`ERF-72`, with `ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`, `ERF-46`, and `ERF-64`
absent from this draft). Against a `.proto` file they fall out as:

| | Count |
|:--|--:|
| Fully expressed by the schema alone | **4** |
| Partly expressed; the rest lives in code | **17** |
| Not expressible at all | **45** |
| **Of that 45, rules that are not schema-shaped in the first place** (they govern process, validator behaviour, consumer behaviour, or a substrate) | 25 |
| **Of that 45, data-shape rules a richer schema language could hold and proto3 cannot** | **20** |

The number to argue with is **20**. It is the cost of choosing proto3 in
particular, as distinct from the cost of choosing a schema at all. Everything
else on the list would fall out of any schema language, and the 25 are rules
the specification never asked a schema to carry.

Sixty-two of sixty-six requirements need code for at least part of their
enforcement. That is not a criticism of the format. It is the shape of the
thing: the format's own section 6 says so directly, "Types express what types
can express; the validator checks the relations no type can see." What this
trial adds is a measurement of where the line actually sits, and the discovery
that proto3 draws it further back than the format assumes.

---

## The four the schema fully expresses

**ERF-22**: "A claim MUST NOT store a state field: the disposition is
computed." A closed schema with no such field enforces this absolutely. A
producer generated from `erf.proto` *cannot* write a disposition. This is the
strongest form of enforcement available: not a check, an impossibility.

**ERF-55** (the list half): "Empty lists MUST be omitted: a field's absence
means none." A proto3 `repeated` field at length zero serializes to nothing.
The rule is not checked, it is the encoding. `ERF-55`'s other half, "a mapping
that is present and empty [...] MUST be written," is equally expressed, by
singular message presence. This is the one requirement in the document that
proto3 implements rather than permits.

**ERF-56**: "A reader MUST materialize an omitted list-typed field as an empty
list." This is a verbatim statement of proto3's repeated-field semantics. The
generated accessor returns an empty container. No code was written.

**ERF-58**: "The event-time key MUST be `timestamp`, everywhere." Field names
are in the schema and readable from it. `ActorStamp.timestamp`,
`StandingEntry.timestamp`, `AuditEntry.timestamp`, `SearchAct.timestamp`,
`Received.timestamp`. A grep over the `.proto` is the audit.

---

## The seventeen the schema half-expresses

| Req | Schema carries | Code must carry |
|:--|:--|:--|
| `ERF-3` | the two-key shape, the map | "exactly two keys"; id uniqueness (and the map *destroys* the evidence, F4) |
| `ERF-5` | the closed `status` set, minus the illegal zero member | `reason` REQUIRED when status is one of three values (conditional) |
| `ERF-11` | that no mechanical-check result field exists; the per-auditor list shape | "MUST NOT be stored" as a live prohibition; protocol-version comparability |
| `ERF-12` | three verdicts | that only three exist (the zero member breaks it, F1) |
| `ERF-17` | the field | that the named corpus is *declared* (cross-file) |
| `ERF-20` | `evidence_at_stance` with real presence | the producer SHOULD; "Drift MUST NOT be stored there" |
| `ERF-23` | both `atoms_for` and `atoms_against` | "Evidence against a claim MUST NOT be modeled as a rival claim" |
| `ERF-27` | `hits_reported` typed as string, which is the substantive half | "MUST NOT state precision the instrument did not give" |
| `ERF-34` | the four narrative fields, `created` as a full stamp | "MUST NOT be modelled as a record" (a modelling instruction, not a shape) |
| `ERF-41` | no stored disposition field | the whole computation, and a reading for the zero stance the spec has no reading for |
| `ERF-54` | `type` on every message; `corpus` on every record | "Exactly one file [...] MUST carry `type: corpus`"; the open/closed choice for `type` itself |
| `ERF-59` | the declaration's shape | "MUST carry" (proto3 has no `required`; every field is droppable) |
| `ERF-68` | the `shipped-as-quotation` status member | the SHOULD; that the SPDX identifier is an SPDX identifier |
| `ERF-69` | `excerpt` as an `ActorStamp` with presence | that it is REQUIRED when the text is an excerpt; the fidelity check |
| `ERF-70` | both tool fields with presence, absent when the step did not happen | determinism of the named tool; that a version string names a version |
| `ERF-71` | `received.digest` with presence, so an absence is legible | the SHOULD; that the digest matches; the `"sha256:<hex>"` format |
| `ERF-72` | nothing directly; a `map` approximates it | the entire `x_` prefix rule (F5) |

---

## The forty-five it cannot express

### A. Cross-record references (5)

A `.proto` file has no foreign keys. Every reference below is a bare string as
far as the schema knows.

- **`ERF-4`**: every atom's `source` "MUST exist in the corpus's source list."
- **`ERF-15`**: "References MUST be bare ids and MUST NOT encode location."
  Unstatable twice over: the resolution and the string-content prohibition.
- **`ERF-33`**: a narrative binding whose id resolves to no record "MUST report
  it and MUST NOT drop it silently [...] MUST NOT invent a record."
- **`ERF-35`**: the master reference rule, and the one that carries the format's
  sharpest distinction: a reference asserting a *current* relationship must
  resolve; one recording a *past state* must be flagged rather than rejected.
  `atoms_for`, `atoms_against`, `edges.to`, `surveys`, `prior_survey`, and
  `notable_results[].atoms` are current; `evidence_at_stance` is past. **Two
  fields of identical type and identical content are governed by opposite
  rules, and nothing in the schema distinguishes them.** A schema language with
  foreign keys would get this wrong by treating them alike.
- **`ERF-43`** (reference half): the premise closure follows edges transitively.

### B. Uniqueness and cardinality (5)

- **`ERF-36`**: ids unique across every corpus in the deployment, across
  record types. A relational schema does this with one unique index; a `.proto`
  cannot, and there is no "deployment" object for it to be unique within.
- **`ERF-37`**: a producer verifies an id is unused before writing. Explicitly
  a substrate matter: "The format states the invariant and declines to specify
  the mechanism."
- **`ERF-38`**: a validator rejects duplicate ids. See F4: the `map` encoding
  makes this *harder* than not modelling it, by resolving collisions before any
  code runs.
- **`ERF-44`**: `conflicts-with` "MUST be stored once per pair." A uniqueness
  constraint over an unordered derived key.
- **`ERF-54`** (cardinality half): "Exactly one file in a corpus MUST carry
  `type: corpus`."

### C. Ordering and acyclicity (3)

- **`ERF-43`**: "Self-edges MUST NOT exist; `assumes` and `decomposes-into`
  MUST admit no cycles," and the closure "MUST terminate in non-argument
  leaves." No schema language expresses graph acyclicity. Neither does SQL.
- **`ERF-48`**: `last_modified` later than `created` and later than any prior
  `last_modified`, with an exception for appends to three named lists and a
  precision rule ("At date precision 'later' admits the same day"). A
  comparison between two fields, conditional on a third thing having happened.
- **`ERF-19`/`ERF-40`**: standings append-only, "verified against the
  substrate's history." A schema sees one version of one document. Append-only
  is a property of a sequence of versions, which is why `ERF-63` requires a
  substrate with "an edit history sufficient to verify `ERF-40`."

### D. String content rules (8)

Every one of these is a regex a schema language with pattern support (JSON
Schema, XSD, a `CHECK` constraint) would hold, and proto3 has no such
mechanism. `string` is `string`.

- **`ERF-7`**: "A source's `citation_text` MUST NOT contain a URL."
- **`ERF-13`**: an atom id is "a mint-time prefix plus a sequence number."
- **`ERF-14`**: `as_of_date` is a year, a year-month, or a full date, and
  "MUST NOT state precision the source did not give."
- **`ERF-19`**: a standing's timestamp "MUST be a full RFC 3339 instant
  carrying both a time and an offset [...] and MUST NOT be a bare date." The
  format explains why the precision matters here and nowhere else, at length.
  proto3 knows none of it.
- **`ERF-21`/`ERF-39`**: a standing's `by` "MUST be a `human:` actor," and
  `why` must be non-empty.
- **`ERF-58`**'s companion, the *actor* convention itself (section 2:
  `human:<id>` | `<producer>/<version>` | `process:<id>`, "Every actor id MUST
  follow this convention").
- **`ERF-61`**: `spec_version` "MUST follow Semantic Versioning 2.0.0."
- **`ERF-31`**: the narrative-binding grammar, given as a formal grammar in the
  document and living entirely inside a `string body`.

**S1, worth isolating.** `ActorStamp.by` and `AuditEntry.auditor` are both
`string` in this schema, and `ERF-11` is emphatic that they are different
kinds of thing: "The `auditor` is a bare model or tool identifier
(`deepseek-v4-pro`), deliberately not an `Actor`: an audit entry names the
instrument that rendered a verdict, not a role in the practice." The schema
records a distinction the format calls deliberate by giving both fields the
same type. Two implementers reading only the `.proto` would have no way to know
one exists.

### E. Conditional requirements (field X required only when Y is Z) (4)

proto3 has no `if/then`, no discriminated union over field values, and no
`required` at all.

- **`ERF-5`**: `reason` REQUIRED when the status records an absence.
- **`ERF-24`**: the backing question depends on `epistemic_kind`: an
  `observation` owes atoms, an `argument` owes premises, "`bet` and
  `commitment` owe no backing, so they have nothing to audit; auditability is
  computable from the kind." This is a validation contract that varies by a
  field's value, and section 5 is explicit that it must not vary the shape:
  "kinds vary the validation contract, never the record shape. A kind that
  demands its own shape is a record type announcing itself." **That ruling is
  what makes a single `Claim` message correct and a `oneof` wrong**, and it is
  also what puts the entire backing contract outside the schema.
- **`ERF-69`**: `excerpt` REQUIRED when the normalized text is an excerpt, a
  condition nothing in the record states.
- **`ERF-70`**: `extraction` REQUIRED when the raw file was another format;
  `normalization` REQUIRED when the extracted text was then cleaned.

### F. Computed, never stored (4)

The format's most distinctive move, and the one a schema can only serve by
having no field for the answer.

- **`ERF-41`**: the disposition, from "each person's newest entry."
- **`ERF-47`**: staleness of any audit or binding.
- **`ERF-49`**: the unbacked flag.
- **`ERF-32`**: narrative-binding staleness.

The schema's contribution here is real but negative: it defines no field, so
nothing can store one. That is `ERF-22` again, generalized. What it cannot do
is compute.

### G. Text and quote mechanics (4)

- **`ERF-1`**: normalized text must exist before a check runs, and checks run
  against it, "never the live web."
- **`ERF-6`**: the quote "MUST be verbatim from the source's normalized text."
- **`ERF-50`**: the mechanical check re-runnable, and gating at mint.
- **`ERF-51`/`ERF-52`**: the three-step normalization and the `[...]` splitting
  rule ("The quote MUST be split on `[...]` BEFORE normalization"). The
  specification even names conformance case files as normative for the exact
  behaviour, which settles it: this is a program, not a shape.

### H. Immutability over time (3)

- **`ERF-2`**: "A raw file is immutable: a revision arriving later MUST be a
  new source, never an overwrite." Also unstatable is the trigger for
  `received.timestamp`: "A source whose raw file is mutable at its location, a
  web page above all, MUST record `received.timestamp`." Whether a location is
  mutable is a judgment about the world.
- **`ERF-28`**: "`searches` and each act's reported yield MUST NOT change after
  the fact." Same shape: a rule about two versions of one document.
- **`ERF-62`**: one authoritative home; every index "recomputable, derived,
  never consulted as truth."

### I. Judgment (6)

Not a schema's business, listed for completeness because they are numbered
requirements a conformance claim has to answer for.

- **`ERF-9`**, **`ERF-10`**: what `source_quality` grades and against what.
- **`ERF-18`**: that `title` states the claim.
- **`ERF-25`**: a universal negative "MUST be audited as scoped rather than as
  proved." Detecting one requires reading the claim's English sentence.
- **`ERF-26`**: the `tool` names a concrete instrument, not a category ("A
  category ('web search') without the instrument does not satisfy this").
- **`ERF-24`**: the audit question itself.

### J. Consumer behaviour (5)

The format is careful about what a consumer rule may say ("This format
constrains a consumer's fidelity to the record and never its use of the
corpus"). None of it is schema-shaped, and one of it is schema-*hostile*.

- **`ERF-42`**: `rejected` and `retired` "MUST NOT be conflated."
- **`ERF-57`**: preserve and report unknown fields and types, never reject.
  **A generated schema is a closed world and this rule demands an open one.**
  See F5. It is the requirement most directly at odds with the whole exercise.
- **`ERF-60`**: refuse an unsupported major openly; never silently drop.
- **`ERF-31`**'s validator clauses (flag a broken anchor; report a malformed
  binding).
- **`ERF-33`**: report an unresolvable binding.

### K. Serialization (4)

A `.proto` describes a different serialization, so it can say nothing about
this one.

- **`ERF-53`**: one record per file, frontmatter plus body. (And this is the
  rule the whole exercise is judged against.)
- **`ERF-65`**: YAML 1.2 JSON schema.
- **`ERF-66`**: no duplicate keys, anchors, aliases, or explicit tags.
- **`ERF-67`**: CommonMark body, UTF-8, LF, no BOM.

### L. Substrate and deployment (2)

- **`ERF-63`**: a substrate may be anything preserving records, ids,
  attribution, and enough history to verify `ERF-40`.
- **`ERF-62`** (the deployment half).

---

## The twenty proto3 loses that a richer schema would hold

This is the list that indicts proto3 specifically rather than schemas generally.
Each is a data-shape rule. JSON Schema, XSD, or a relational schema with
constraints would carry each of them; proto3 carries none.

| Req | The shape | The mechanism proto3 lacks |
|:--|:--|:--|
| `ERF-3` | source ids unique | unique constraint |
| `ERF-4` | `source` resolves into the source list | foreign key |
| `ERF-5` | `reason` required when status records absence | `if`/`then` |
| `ERF-7` | no URL in `citation_text` | `pattern` |
| `ERF-12` | exactly three verdicts | a closed enum with no mandatory member |
| `ERF-13` | atom id is prefix + number | `pattern` |
| `ERF-14` | `as_of_date` is year, year-month, or date | `pattern` / union of formats |
| `ERF-19` | full RFC 3339 instant; non-empty `why` | `pattern`, `minLength` |
| `ERF-21` | `by` starts `human:` | `pattern` |
| `ERF-35` | six named fields resolve | foreign keys, with two different failure modes |
| `ERF-36` | ids unique deployment-wide | unique constraint across types |
| `ERF-38` | duplicates detectable | anything that does not silently merge |
| `ERF-39` | `human:` actor, non-empty `why` | `pattern`, `minLength` |
| `ERF-44` | one edge per conflicting pair | unique constraint on a derived key |
| `ERF-48` | `last_modified` > `created` | cross-field comparison |
| `ERF-54` | exactly one `type: corpus` | cardinality over a collection |
| `ERF-59` | the declaration's four fields are required | `required` |
| `ERF-61` | SemVer | `pattern` |
| `ERF-69`/`ERF-70` | tool fields required conditionally | `if`/`then` |
| `ERF-72` | fields named `x_*` are legal | `patternProperties` |

Three of these deserve a sentence each.

**`ERF-59` and the absence of `required`.** proto3 removed `required` on
purpose, and every field in this schema is therefore droppable. The declaration
"MUST declare `type: corpus` [...] `id` [...] `title` [...] and
`spec_version`," and a message with none of them is a legal, parseable
`CorpusDeclaration` that serializes to zero bytes. So is a legal, parseable
`Atom` with no id, no finding, and no quote. **Every "MUST be written"
requirement in the document is, at the schema layer, advisory.**

**`ERF-72` and `patternProperties`.** JSON Schema has a construct that means
exactly what `ERF-72` says: `"patternProperties": {"^x_": {}}`. The rule was
evidently designed with an open-world serialization in mind, and it is the one
requirement in the document whose *phrasing* presumes a schema language proto3
is not.

**`ERF-35` and why a foreign key is not enough either.** A relational schema
would give all six reference fields the same `REFERENCES` clause and be wrong,
because `evidence_at_stance`'s ids record a past state and must be flagged
rather than rejected when they fail to resolve. The rule turns on what a
reference *means*, not on where it points, and no declarative constraint
mechanism reads meaning. This one is not proto3's fault; it is the format
finding a boundary that every schema language shares.

---

## One thing the schema said that the prose did not

Building this forced a decision the specification never makes: whether the
`type` field is a closed vocabulary or an open one.

Section 5 lists the closed sets and `type` is not among them. `ERF-54`
enumerates six values ("`atom`, `claim` and `survey` are the record types, and
`corpus`, `sources` and `narrative` name the declaration, the source list and a
narrative"). But `ERF-57` requires a consumer to preserve **unknown record
types**, which is only meaningful if the set is open. This schema types `type`
as `string` for that reason, and gains a state the format may not want:
`type: ""`, which is neither a known type nor an absent one, and which proto3
cannot distinguish from absence. `ERF-54` sends a typeless file out of the
corpus entirely, so the distinction decides membership. Recorded as ambiguity
**#A8**.
