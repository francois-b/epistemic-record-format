---
title: "Friction log"
subtitle: "Every re-read, guess, and inference while building a proto3 schema from the prose alone"
generated: 2026-08-25
model: claude-opus-5[1m]
spec_tried: 0.9.0
---

# Friction log

Kept as it happened, including the frictions resolved correctly. The trial's
constraint was to read `SPEC-as-tried.md` and nothing else in the repository:
no `types/erf.ts`, no `conformance/`, no `examples/`, no viewer, no other
trial, no git history.

---

## 1. The specification says the document I was reading is not the authority

Section 3, first sentence:

> The normative data model is the file `types/erf.ts`. The TypeScript below is
> an inline mirror of that file, kept in sync by hand; it omits the file's
> header comments and its identifier alias definitions [...] **where the two
> differ, the file governs.**

This is the strongest pull toward the forbidden directory in the document, and
it is not a temptation, it is an instruction. The specification tells an
implementer that the prose they are holding is a hand-maintained copy that may
be wrong, and names the file that settles it.

The same move happens again in `ERF-51`:

> The prose above names each transformation; the conformance case files
> (`conformance/cases/normalization.txt` and
> `conformance/cases/quote-check.yaml`, this repository) are **normative for
> its exact behavior: where a reading of the prose and a case disagree, the
> case governs**, and a conforming implementation reproduces every pair.

**So the answer to "does the prose alone determine a wire representation" is
partly answered by the specification itself: no, and it says so twice.** Two of
its own artifacts are declared to outrank it. For `ERF-51` that is defensible
(a folding algorithm is better pinned by cases than by sentences). For the data
model it means the document cannot be handed to an implementer as section 1
promises it can: "The specification is written to be handed to an implementer
(human or LLM) to build from."

I did not look. Everything downstream is built on the mirror, and if the mirror
has drifted, this schema encodes the drift.

## 2. Reading the file took two passes

The document is 1,458 lines and exceeded a single read. Not a defect, recorded
because it shaped the work: the data model (section 3, lines 145 to 267) was
read before the invariants (section 6, lines 1047 onward), and several encoding
decisions were provisionally made from the type declarations and then revised
once `ERF-55` and `ERF-56` arrived 800 lines later. Specifically I had
`surveys` as a plain `repeated` field for about twenty minutes on the strength
of the closing paragraph of section 3 ("Lists are total in the type and MAY be
empty") before `ERF-55`'s mapping-versus-list distinction sent me back.

**An implementer working front to back will encode the optional-presence
questions wrong and then have to unwind them.** The rules that govern presence
are in section 7, and the types that raise the question are in section 3.

## 3. The temptation I felt most sharply: `CSL`

Section 3 lists `CSL` among the aliases it omits, alongside `AtomId` and
`ClaimId`. Six of the seven omitted aliases are self-evidently strings. `CSL`
is a nested, open-ended object with hyphenated keys, and the only thing the
document gives me is one example instance in section 4.1.

I wanted `types/erf.ts` badly here, and the wanting is the finding. Recorded as
gap **G2**. What I did instead: took the example instance as the shape, used
`google.protobuf.Struct`, and measured what it cost (every integer returns as a
float, which breaks `ERF-8`'s canonicality). A second implementer would
enumerate the CSL fields they happen to need, and produce an incompatible
schema that also cannot round-trip a citation using any field they did not
anticipate.

## 4. `Excerpt` is used and never declared

`Source` has `excerpt?: Excerpt`. There is no `Excerpt` interface, and it is not
in the omitted-aliases list. The only definition is a code comment inside the
mirror:

> // Excerpt is an ActorStamp: the one attributed step of the pipeline
> // (`ERF-69`) records who selected the passage and when, like any other act.

I used `ActorStamp`, on the comment plus the YAML example
(`excerpt: {timestamp: 2026-08-23, by: "agent/claude-sonnet-5"}`). Confident,
but it is a comment carrying a type declaration, and `ERF-34` spends two
paragraphs on what happens when a field's shape is left to inference: "Naming
the three fields without typing them left two readings, and two authors took
one each." The same hazard is live here.

## 5. Re-read four times: `ERF-55` against `ERF-56` against the `?` on `surveys`

The single largest consumer of attention in the trial. The sequence:

1. Read section 3's "Lists are total in the type and MAY be empty" and
   concluded the `?` on `surveys` was decoration.
2. Read `ERF-55` and found the mapping-versus-list distinction stated
   explicitly, with `evidence_at_stance` as the worked case, which made me
   think the `?` might be the same kind of thing.
3. Read `ERF-56` and found "The data model types these fields as required
   because they are always present in a loaded record," which explains the
   absence of `?` on seven other lists and implicitly indicts the one on
   `surveys`.
4. Searched for a rule that reads them apart and found only `ERF-49`, which
   mentions "empty `atoms_for` and empty `surveys`" in one breath, treating
   them alike.

Resolved by choosing the wrapper (so the difference is measurable) and writing
it up as ambiguity **#A1** rather than pretending it was settled. Discovering
that proto3 forbids `optional repeated` outright is what made the question
unavoidable: in YAML you can write `surveys?: SurveyId[]` and never decide what
it means.

## 6. Guesses I made and could not check

- **The corpus envelope.** The interchange form has no container and a wire
  format needs one. I invented `Corpus` and `OpaqueFile`. Nothing in the
  specification supports or forbids them. (#A15)
- **The scope of `x_`.** `ERF-72` says "any record, declaration, or source." I
  put the escape maps at file level only, which excludes narratives and every
  nested object. A guess. (#A6)
- **Emitting a zero-value scalar.** Where a field has no presence I omit rather
  than write `""`. A guess, and wrong whenever the input genuinely was `""`.
  (#A4)
- **YAML's empty scalar.** `key:` with nothing after it resolved to `null`.
  YAML 1.2's JSON schema has no production for it, because JSON has none. (#G7)
- **Whether an atom file's empty body is data.** I treated it as a property of
  the file rather than of the record, since `Atom` has no `body` field. (#A12)

## 7. Inferences I made and am confident in

- **Every timestamp is a `string`, not `google.protobuf.Timestamp`.** Inferred
  from `ERF-14`'s variable precision and `ERF-47`'s rule that an unorderable
  precision mismatch resolves to stale. Both would be destroyed by a normalized
  instant. Confident, and worth flagging that this is the opposite of what a
  code generator or a reviewer's instinct would produce. (#A13)
- **`hits_reported` is a string.** `ERF-27` settles it outright. Recorded
  because it is the field most likely to be "fixed" into an int by someone who
  skims. (#A14)
- **`type` is an open set.** Inferred from `ERF-57`'s "unknown record types"
  against `ERF-54`'s enumeration. Section 5 lists the closed vocabularies and
  omits `type`, which is the deciding evidence. (#A8)
- **A single `Claim` message, no `oneof` over `epistemic_kind`.** Section 5
  rules it directly: "kinds vary the validation contract, never the record
  shape. A kind that demands its own shape is a record type announcing itself."
  This is the clearest ruling in the document and it saved a whole design fork.
- **Narrative bindings need a `raw` field.** Inferred from `ERF-31`'s "A binding
  that does not match this grammar MUST be reported, never skipped [...] a
  required part does not make a binding invalid, it makes it invisible." A typed
  message alone cannot hold a malformed binding, so it would drop it, which is
  the named failure. Confident, and it is the nicest thing the specification
  does: it anticipated the failure mode a type system would introduce.

## 8. Toolchain friction

- `protoc 33.4` was installed; the system Python's `protobuf` was 3.20.3, which
  cannot load descriptors generated by protoc 33. Built a throwaway venv with
  `protobuf 7.36.0`. Not a specification issue, recorded for reproducibility.
- `protobuf 7.x` removed `FieldDescriptor.label`. Ported to `is_repeated`.
- Counting the `optional` scalars returned zero at first, because proto3
  `optional` compiles to a **synthetic oneof** and my filter excluded fields in
  a oneof. That is the mechanism by which the keyword buys presence back, and
  not knowing it is how an implementer ends up believing they used it when they
  did not.

## 9. The near-miss that matters

My first full run reported **0 losses on `sources.yaml`**, and I nearly wrote it
up that way.

The diff compared scalars with `!=`. In Python, `1494 == 1494.0` is `True`. The
CSL integers had already been turned into floats by `google.protobuf.Struct`
and my own comparison was hiding it. I caught it only because I had gone in
expecting that specific failure and the report contradicted my expectation.

Two things follow. First, the measured result in `losslessness.md` exists
because a prediction disagreed with an instrument, which is the only reason the
instrument got audited. Second, and more usefully: **a round-trip test written
in a dynamically typed language will silently pass a number-precision loss**,
and anyone building a conformance harness for this format needs a type-aware
comparison. `harness/roundtrip.py` now has `_same_scalar`, and it is the only
reason three of the six losses are visible.

## 10. The second near-miss, found by a number that would not sit still

After the deliverables were drafted I re-ran the harness to regenerate the
output files and the summary line changed: `key-order changes: 9` became `8`.
Running it three more times gave `10`, `6`, `7`.

I had already written up the map-ordering result as "reordered, and proto3
guarantees nothing about it," which is true and is the weaker claim. The
unstable count says something worse: the order is fixed within a process and
moves with the map's hash seed between processes. Measured directly by spawning
six subprocesses on identical input: **five distinct orderings.**

So a store built on this schema does not have a stable serialization of a
corpus at all. `ERF-63` names files in git as the reference substrate, "history
and diffing for free," and a writer that reorders the source list on every save
spends that budget on noise.

I would not have caught this if the harness had printed only per-file results.
The summary line existed for convenience and it turned out to be the
instrument. Worth remembering when building a conformance harness for this
format: **run it more than once, on the same input, and compare the runs to
each other before comparing anything to the spec.**

## 11. What I did not do

- No validator. The trial asked what the schema cannot express, not for the
  code that expresses it. `what-the-schema-cannot-say.md` enumerates 62 of 66
  requirements needing code and implements none of them.
- No conformance against `conformance/cases/*`, which the specification declares
  normative for `ERF-51`. Out of bounds, and it means the normalization and
  quote-check behaviour in `harness/bindings.py:fold` is a reading of the prose
  and nothing more.
- No multi-corpus deployment, so `ERF-35`, `ERF-36`, and `ERF-38` were reasoned
  about rather than exercised.
- No Go or C++ implementation, so the claim that map ordering differs between
  implementations rests on the proto3 language specification declaring it
  undefined, not on a second measurement. The Python reordering *is* measured.
