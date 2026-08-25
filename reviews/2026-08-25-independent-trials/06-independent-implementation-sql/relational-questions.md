# Relational questions

Questions the schema forced that the prose does not answer.

A relational schema cannot be vague. A primary key is exactly one set of
columns; a foreign key points at exactly one table and does exactly one thing
on delete; a rule is either a `CHECK`, a key, a trigger, or absent. Every
place the specification is comfortable saying something in prose, the schema
had to pick, and picking exposed the question. This is the distinctive output
of this trial.

Each question states what had to be decided, what the document says, what I
did, and what would settle it.

---

## Q1. What is the deployment, and what identifies it?

**Forced by:** ERF-35, ERF-36, ERF-37, ERF-38.

Four requirements — every uniqueness rule and every resolution rule in the
format — are scoped to "the deployment". Section 2 defines it as "the set of
corpora read and cited together, under one operator or organization" and adds
"between two deployments a bare id promises nothing."

A schema cannot enforce uniqueness inside an unnamed scope. `UNIQUE` needs
columns. So the schema invents a `deployment` table with an id, and every
primary key in it begins `deployment_id`.

That invention has consequences the format has not considered. A corpus
"travels as a directory or archive" (ERF-59) and its declaration travels with
it — but the declaration names no deployment. So a received corpus carries no
statement of the scope in which its ids were unique, and the receiving
deployment cannot tell whether it is being handed something whose ids are
already spoken for. The one thing that makes a bare id meaningful is the one
thing the interchange form does not carry.

**Would settle it:** either a `deployment` field on the corpus declaration, or
an explicit statement that a deployment is a purely local construct and that
merging two corpora is an id-collision problem the receiver owns.

---

## Q2. Does a reference point at a record, or at a record of the right type?

**Forced by:** the `REFERENCES` clause on `claim_atom`, `claim_survey`,
`claim_edge`, `standing_evidence`, `survey_notable_atom`.

ERF-35: "`atoms_for`, `atoms_against`, `edges.to`, and `surveys` name existing
records. Ids are deployment-unique (ERF-36), **so one lookup serves every
record type**." That last clause reads as though the referent's type does not
matter. The data model says the opposite: the fields are typed `AtomId[]`,
`ClaimId`, `SurveyId[]`.

So: is a claim whose `atoms_for` names a *survey* conforming? ERF-35 as
written says yes — the reference resolves. The type says no. A foreign key
must choose a single parent table and cannot express "any record".

I pointed each key at the typed table, which is stricter than ERF-35's words.

Two further gaps the same clause exposes:

- `notable_results[].atoms` is *not* in ERF-35's enumeration. It is an
  `AtomId[]` that no invariant requires to resolve. I made it a foreign key
  anyway, i.e. I enforced a rule the format does not state.
- `prior_survey` is likewise absent from ERF-35, though it is plainly a
  reference.

**Would settle it:** say whether ERF-35's list is exhaustive, and whether
"resolve" means "some record exists" or "a record of the declared type
exists".

---

## Q3. What is the primary key of a record, and can `type` be closed?

**Forced by:** `record`.

ERF-36 decides the shape of the whole schema in one sentence: ids are unique
across the deployment *regardless of record type*. Three per-type tables with
three per-type keys cannot express that — they would let an atom and a claim
share an id. So there must be one supertype table keyed `(deployment_id, id)`
with the three types hanging off it.

Then ERF-57 forbids the obvious next move. A consumer "MUST preserve unknown
fields and **unknown record types** as opaque data ... and MUST NOT reject a
corpus solely because it contains them." So `record.type` cannot carry
`CHECK (type IN ('atom','claim','survey'))`. A schema that closes the type
vocabulary is a non-conforming consumer.

The result is a supertype table whose discriminator is open, three subtype
tables, and an opaque sidecar (`record_extra_field`, `opaque_record_body`) for
everything else. **A conforming ERF store cannot be a closed schema.** It must
carry an entity-attribute-value escape hatch, and the round trip depends on
it: without the sidecar, the hostile corpus's `hypothesis` record and its
`provenance_note` key are dropped, which ERF-57 forbids.

**Would settle it:** nothing needs settling; this one is a consequence the
format should simply state, because it is a real constraint on implementers
and it is invisible from the data model.

---

## Q4. Does list order carry meaning?

**Forced by:** every child table needing a key, and every `ORDER BY` in the
writer.

`atoms_for`, `families`, `standings`, `searches`, `edges`, `finding_audit` are
all sequences in YAML. A child table needs a primary key; `(claim_id, side,
atom_id)` would be a set, `(claim_id, side, pos)` is a sequence. They are
different data models and the format does not choose.

I stored `pos`, because ERF-53 demands a round trip through a serialization in
which order is visible and a set cannot reproduce it.

This is not idle. ERF-41 says a person's *newest* standing entry is their
current stance, and supplies no tie-break for two entries at the same instant.
With `pos` stored, the tie is broken by position in the file, which means
**the order of lines in a file can decide a claim's computed disposition** —
the same class of accident ERF-65 was written to prevent when a weekday name
decided one.

**Would settle it:** say per field whether the list is ordered, and give
ERF-41 a tie-break (or forbid two entries by one person at one instant).

---

## Q5. What scope does a source id resolve in, and what happens when a record moves?

**Forced by:** the composite foreign key from `atom` to `corpus_source`.

Source ids are unique **within a corpus** (ERF-3). Record ids are unique
**within a deployment** (ERF-36). Two different scopes, so the source key is
three columns `(deployment, corpus, source_id)` and the atom's key is two.
The foreign key from an atom to its source therefore has to carry the atom's
corpus.

Now ERF-17: a claim's `corpus` is mutable — "changing it is a promotion or
transfer" — and ERF-15 says the id survives the move, so no reference breaks.
That reasoning holds for claims, which reference nothing corpus-scoped. It
does not hold for atoms. An atom's `source` is corpus-scoped, so **moving an
atom between corpora silently invalidates its source reference** unless the
receiving corpus's source list happens to contain the same key. The foreign
key catches it; the prose never raises it.

Worse: the format does not actually say an atom's `corpus` is mutable. ERF-17
is written about claims and surveys. The field reference table binds an atom's
`corpus` to ERF-54 alone.

**Would settle it:** say whether atoms transfer, and if so what happens to the
source list — merged, copied, or is the source id promoted to deployment
scope.

---

## Q6. What does deleting anything mean?

**Forced by:** every `ON DELETE` clause. There is no default.

The specification never describes deleting a record, a corpus, or a source.
It describes withdrawal (a standing entry, ERF-41), retirement (a computed
disposition), and supersession (a survey re-run, a new source under ERF-2) —
all of which are additions. Deletion is simply absent, and "neither is a
deletion" (ERF-42) is as close as it comes.

But `ON DELETE` is mandatory in the sense that some behaviour happens
regardless. I chose:

| Relationship | Choice | Reason |
|:--|:--|:--|
| corpus → record | `RESTRICT` | dropping a corpus must not silently take its records |
| record → its own subtype row and lists | `CASCADE` | those are parts, not references |
| claim → cited atom | `RESTRICT` | deleting evidence out from under a claim unmakes its backing |
| claim edge → target claim | `RESTRICT` | deleting a premise silently unmakes an argument (ERF-24) |
| standing → its evidence stamp | `CASCADE`, guarded | the stamp is part of the entry |
| past stamp → the atom it names | `RESTRICT` | ERF-20 records what the ruler faced; that fact outlives the attachment |

Every row of that table is an invention. A different implementer would
reasonably choose `CASCADE` for the third and fourth and get a store that
quietly loses evidence.

**Would settle it:** one sentence saying whether records are ever deleted, and
if so whether references to a deleted record are a violation (ERF-35) or a
reportable dangling reference (ERF-33's stance).

---

## Q7. Which foreign key must be allowed to dangle?

**Forced by:** `narrative_binding.claim_id`.

ERF-33: "A consumer encountering a narrative binding whose id resolves to no
record MUST report it and MUST NOT drop it silently ... MUST NOT invent a
record to satisfy the reference."

A foreign key from `narrative_binding` to `claim` would be the natural
modelling choice and it is *forbidden by the requirement*. With the key, an
unresolved binding cannot be stored; a defect that cannot be stored is a
defect that has been dropped, which is exactly what ERF-33 forbids. So this
one reference is deliberately unconstrained, and the resolution check moved
into a view (`v_erf33_unresolved_binding`).

This is the sharpest structural statement in the format and the schema makes
it visible: **ERF-35's references must resolve; ERF-33's reference must be
allowed not to.** The difference is that one belongs to a record and the other
to a document, and the format is right about it. It is worth saying out loud,
because an implementer reaching for referential integrity will get ERF-33
wrong by default.

---

## Q8. Which MUSTs are constraints on a state, and which on a transition?

**Forced by:** the split between `CHECK` and `TRIGGER`.

This is the question the trial was set up to ask, and the answer is clean.
Measured by `tests/constraint_probes.py` (40 probes, all matching
expectation):

**State — expressible as a `CHECK` or a key** (17 of them): ERF-4, ERF-5,
ERF-7, ERF-9, ERF-12, ERF-19 (the instant grammar), ERF-21, ERF-24 (the
vocabulary), ERF-31 (anchor non-empty), ERF-35, ERF-36, ERF-38, ERF-39,
ERF-43 (self-edges), ERF-44, ERF-52 (empty spans), ERF-71.

**Transition — expressible only as a trigger** (7): ERF-2, ERF-13
(never renamed, never reused), ERF-19/ERF-40 (standings append-only), ERF-20
(the stamp never changes), ERF-28 (search acts immutable), ERF-48
(`last_modified` advances).

**Closure over a whole table** (1): ERF-43's acyclicity, which needs a
recursive CTE per inserted edge — neither a state nor a transition constraint,
but a constraint on the transitive closure.

**Absence of a column** (3): ERF-22 (no stored disposition), ERF-11 (no stored
mechanical-check result), ERF-20 (no drift, no counts). These are the MUST
NOTs a schema satisfies by having nowhere to put the thing.

**A view, because the requirement says *flag* rather than *reject*** (5):
ERF-41, ERF-42, ERF-47, ERF-49, ERF-43's retired-leaf clause. The format draws
this line deliberately and consistently — ERF-43 even explains why ("an act
the format permits cannot retroactively make a corpus non-conforming"). A
schema makes the distinction structural: a flag is a `SELECT`, a violation is
a refusal.

**Not expressible at all** (see the CANNOT section below).

The one place the format's own language is loose is ERF-40: "verified against
the substrate's history". That describes a substrate that *records* the
violation and then checks. This schema *forbids* the violation. Those are
different guarantees, and only one of them is what ERF-63 asks for.

---

## Q9. If an invariant is a key, who reports the violation?

**Forced by:** `PRIMARY KEY (deployment_id, id)`.

ERF-38: "A validator MUST reject a deployment containing duplicate record
ids." ERF-37: "A producer MUST verify that an id is unused ... The format
states the invariant and declines to specify the mechanism, because the
mechanism is exactly what varies between substrates."

Measured by `tests/negative_cases.py`, which loads four corpora each carrying
one violation:

```
duplicate-record-id        ERF-36, ERF-38   REJECTED at INSERT   (primary key)
dangling-atom-reference    ERF-35           REJECTED at COMMIT   (foreign key)
duplicate-frontmatter-key  ERF-66           REJECTED in the PARSER
alias-in-frontmatter       ERF-66           REJECTED in the PARSER
```

In this substrate the mechanism is the primary key, and it is *too strong*.
A corpus with duplicate ids cannot be loaded at all: `erf_load.py` aborts the
transaction and prints "an invariant is a key, so the corpus is unstorable".
The database can never hold the deployment that ERF-38 asks a validator to
examine and reject. It can only refuse the door.

The same swallowing happens for ERF-35 (a dangling `atoms_for` is a foreign
key violation, so the corpus containing it cannot be stored) and, in the other
direction, for ERF-2 (the store forbids the overwrite, so there is no history
in which to detect it).

This is a real design tension for any store built to hold this format:
**enforcement and validation want opposite things.** A validator needs to
represent a non-conforming corpus in order to report on it. A schema that
enforces the invariants makes non-conforming corpora unrepresentable. The
format's conformance classes name Producer, Consumer and Validator separately
and do not notice that a Validator built on an enforcing store cannot do its
job.

**Would settle it:** say whether a validator is expected to work over a stored
corpus or over the interchange files, and whether a conforming store may
refuse a write that a validator would merely report.

---

## Q10. Where does duplicate-key detection live?

**Forced by:** ERF-66 and the parser.

ERF-66 forbids a duplicate key in frontmatter. By the time YAML has been
parsed into a mapping the duplicate is gone — one of the two values survives,
silently, and which one is (as ERF-66 itself says) at the processor's
discretion. So the check has to happen *inside* the parser, which means it
cannot be a schema constraint and cannot be performed by any consumer that
receives a parsed document.

The same holds for anchors, aliases and explicit tags: all four of ERF-66's
prohibitions are invisible downstream of a parse. Demonstrated by the last two
rows of the negative suite above: both are caught before a database exists.

Consequence for the conformance classes: a Validator that accepts a parsed
document rather than bytes cannot check ERF-66, ERF-67 or the scalar-style
half of ERF-65. The Validator class binds "the serialization rules of section
7", which quietly requires byte-level input.

---

## Q11. What identifies a narrative?

**Forced by:** `narrative`'s primary key.

ERF-34 says a narrative is not a record, has no interface in the data model,
carries only `title`, `corpus` and `created`, and is checkable (ERF-32). It
has no id. A table needs a key, and the only candidate is the path — the thing
ERF-54 says carries no meaning.

So a narrative is identified by the one property the format declares
meaningless, and two narratives in one corpus with the same title, corpus and
created stamp are indistinguishable except by where they sit.

**Would settle it:** either give a narrative an id, or say that a narrative is
identified by its location and that ERF-54's path rule binds records only.

---

## Q12. The round trip needs a filename the format says means nothing.

**Forced by:** `record_file`.

ERF-53 requires records to round-trip *through the interchange form*, and the
interchange form is one record per file. ERF-54 says "no meaning lives in a
path". Both are right and together they are incomplete: to regenerate the
interchange form, the store must remember which file each record came from,
and that mapping is not part of any record.

A store that discards paths satisfies ERF-54 and fails ERF-53 at the directory
level, even while every individual record survives. This trial's writer keeps
a table for it and labels it "NOT part of the format".

**Would settle it:** state that the round trip is per-record and that filenames
are the substrate's business, or specify a filename derivation from the id.

---

## Q13. Why the ERF-48 exception is free here, and what that says.

**Forced by:** normalization.

ERF-48 carves out an exception: appending to `standings`, `finding_audit` or
`evidence_audit` MUST NOT advance `last_modified`, "or every audit and every
stance would invalidate itself at the moment it was recorded."

In a normalized schema the exception needs no code. An append is an `INSERT`
into a child table and never touches the parent row, so `last_modified` cannot
advance by accident. The carve-out exists because the interchange form is a
*document*, where appending to a list is editing the file.

That is a useful signal: the exception is an artifact of the serialization,
not of the data model. Which suggests the rule would be better stated as "any
change to a record's own fields", with the list-append case falling out rather
than being excepted.

---

## Q14. A fact the interchange form cannot carry.

**Forced by:** ERF-20 against ERF-55, and caught by the round trip.

ERF-20 makes `evidence_at_stance` a producer SHOULD, so its absence is
meaningful: this ruling was not stamped. ERF-55 requires an empty list to be
omitted. Therefore a ruling that *was* stamped and faced no evidence at all
serializes to exactly the same bytes as a ruling that was never stamped.

The database needed a column (`claim_standing.evidence_stamped`) with no field
behind it, or the round trip would invent a stamp on the way out. The hostile
corpus case `h-claim.md` demonstrates it: input
`evidence_at_stance: {atoms_for: [], atoms_against: []}`, output
`evidence_at_stance: {}` — the *presence* survives only because the schema
carries a flag the format does not define.

**Would settle it:** exempt `evidence_at_stance` from ERF-55, or say that an
absent stamp and an empty stamp mean the same thing.

---

## Q15. Which `MUST` did I refuse to enforce, and why that is a conformance question.

Twice the schema is **stricter** than the text (Q2: typed reference targets;
`notable_results.atoms` as a foreign key), and once it is **stronger in kind**
than the text (Q8: forbidding an append-only edit rather than recording and
detecting it).

The format has no vocabulary for this. Its conformance classes distinguish
strict producers from tolerant consumers, but they say nothing about a store
that enforces more than the specification requires. A corpus that is
conforming per the document can be rejected by a conforming implementation of
it — which is the same forward-compatibility failure ERF-57 exists to prevent,
arriving through the back door of an over-eager schema.

---

## CANNOT: rules no schema can express

Recorded in `schema.sql` section 11 and repeated here with the reason.

| Req | Why not |
|:--|:--|
| ERF-1 | "A capture MUST exist before any check runs" — a temporal ordering between two acts, one of which is outside the store. |
| ERF-6 | "The quote MUST be verbatim from the capture" — the capture is a file, not a row; ERF-11 forbids caching the result. |
| ERF-8 | "`citation_text` MUST be rendered from `citation`" — needs a CSL engine inside a constraint. |
| ERF-9, ERF-10 | What a grade means. A judgment about an attester, unreachable from the row. |
| ERF-11 | Half expressible: the MUST NOT (no stored result) is a missing column; the MUST (record per auditor with protocol) is a table. |
| ERF-12 | "A failed audit MUST NOT be written as a verdict" — a truthful `SUPPORTED` and a lying one are the same row. The vocabulary is enforceable; the honesty is not. |
| ERF-18 | "The body SHOULD open by restating the title" — the spec says outright it is a reading, not a test. Advisory view only. |
| ERF-24, ERF-25 | Whether the evidence carries the claim, and whether a claim is a universal negative. Both judgments. |
| ERF-26 | "A category without the instrument does not satisfy this" — `"web search"` and `"grep -rn (BSD grep, macOS)"` are both non-empty strings. Confirmed by an ALLOW probe. |
| ERF-27 | "MUST NOT state precision the instrument did not give". Worse: the column type does not even hold the "as text" half, because TEXT affinity stringifies an integer silently even under `STRICT`. |
| ERF-31 | "A passage that asserts something SHOULD end with a narrative binding" — needs to know which passages assert. |
| ERF-37 | A producer's *duty to check*. The key enforces the outcome and can never record that anyone verified anything. |
| ERF-50, ERF-51 | The mechanical check and its normalization sequence: file-level, and normative by conformance case rather than by prose. |
| ERF-60, ERF-61 | Version negotiation is an act of a consumer at read time. |
| ERF-62 | A projection cannot know from the inside that it is one. |
| ERF-63 | "An edit history sufficient to verify ERF-40" — this schema forbids the edit instead, which is a different guarantee (Q8). |
| ERF-65, ERF-66, ERF-67 | All three are pre-database: they constrain bytes and a parse, and everything downstream of the parse has already lost the evidence (Q10). |
| ERF-72 | The prefix is checkable; "a field lives under the prefix while its need is being demonstrated" is not. |
