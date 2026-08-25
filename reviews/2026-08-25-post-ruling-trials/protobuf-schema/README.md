---
title: "ERF as a proto3 wire schema"
subtitle: "A cold trial: can the specification's prose alone determine a wire representation?"
generated: 2026-08-25
model: claude-opus-5[1m]
spec_tried: 0.9.0
---

# ERF as a proto3 wire schema

A cold expression of the Epistemic Record Format's data model as Protocol
Buffers (proto3), with a real round trip through wire bytes and a measurement
of what did not survive.

**Built from `../SPEC-as-tried.md` and nothing else.** No `types/erf.ts`, no
`conformance/`, no `examples/`, no viewer, no other trial, no git history. The
point of the exercise is whether the prose determines a wire representation;
consulting a reference implementation would have answered a different question.
Every place the prose ran out is written down rather than resolved by looking.

## What is here

| File | What it is |
|:--|:--|
| `erf.proto` | The data model as proto3. 20 messages, 123 fields, 6 enums. Comments cite the requirement behind each decision. |
| `losslessness.md` | **The central deliverable.** Field by field: does YAML to proto to YAML return the same document? Judged against `ERF-53`'s round-trip requirement, quoted. |
| `what-the-schema-cannot-say.md` | All 66 numbered requirements classified: 4 the schema expresses, 17 it half-expresses, 45 it cannot. Plus the 20 that a richer schema language would hold and proto3 specifically cannot. |
| `ambiguities.md` | 15 places two careful implementers produce different `.proto` files, and 8 gaps where the prose says nothing. |
| `friction-log.md` | Every re-read, guess, and inference, including the ones resolved correctly and the near-miss that almost produced a false result. |
| `harness/` | The round-trip harness and the presence probe. |
| `tests/` | A corpus authored from the spec to exercise the presence questions. |
| `tests/out/` | The round-tripped documents. |
| `results-roundtrip.txt`, `results-presence.txt`, `report.json` | Raw output. |

## The five questions, answered

**Q. What happens to an optional field whose value is a message containing only
empty collections, present versus absent? Does the round trip preserve it? Does
the specification require it to?**

Preserved, at a cost of two wire bytes. Measured: `HasField` after a full
serialize/parse cycle returns `[False, True, True]` for the absent,
present-empty, and populated cases. The specification requires it in as many
words, `ERF-55`: "Absent, it says the ruler stamped nothing; present and empty,
it says the ruler stamped, and faced no evidence. Those are different facts."
It works because singular message fields in proto3 have always had explicit
presence, which is an accident of length-delimited encoding rather than a
design proto3 made for this. Had the format modelled `evidence_at_stance` as
two sibling scalar lists instead of a nested mapping, the distinction would be
gone.

**Q. The specification says empty collections are omitted on the wire and
materialized by a reader. Does proto3 agree, disagree, or make the rule
unstatable?**

**Agrees exactly**, and this is the one requirement in the document proto3
implements rather than merely permits. `ERF-55`'s list clause and `ERF-56` are
a verbatim statement of proto3 repeated-field semantics: an empty repeated
field serializes to zero bytes, and a generated accessor returns an empty
container. No code was written for either rule.

The agreement has a cost. Because `repeated` has no presence and proto3 forbids
`optional repeated`, the two **optional lists** in the data model
(`surveys?: SurveyId[]` and `notable_results[].atoms?`) become unstatable. You
must either drop the `?` or invent a wrapper message that is not in the data
model, and the two choices are not wire-compatible with each other.

**Q. Does any enum's proto3-mandatory zero value create a legal state the
specification does not have?**

Six of them. `EpistemicKind`, `Stance`, `Relation`, `SourceQuality`, `Verdict`,
`SourceStatus`. Section 5: "Closed sets. A value outside them is a validation
failure, not a dialect." The worst is `Verdict`, because `ERF-12` was written
against precisely this: "Recording a tool failure in the field that holds a
judgment makes the two indistinguishable to everything downstream." The most
consequential is `Stance`, because `ERF-41` asserts totality ("Every input has
exactly one reading") and the zero member has no reading, so two
implementations compute different dispositions for the same corpus.

**Q. Is the source list a `map<string, Source>` or a `repeated` entry with a key
field, and what does each choice do to ordering and to duplicate detection?**

Chosen `map`, because it mirrors `Record<SourceId, Source>` literally. Two
measured costs, the second worse than expected.

Key order is not preserved, and it is not even **stable**: five distinct
orderings came out of six separate runs of identical code over identical input.
The order is fixed within a process and moves with the map's hash seed between
processes, and proto3 declares map ordering undefined, so this is the language
licence being exercised rather than a bug. `ERF-63` names files in git as the
reference substrate, "history and diffing for free." A store that emits a
different key order on every write spends that for nothing.

Duplicate keys are worse. Two entries under the same key arriving on the wire
produce one entry, resolved last-one-wins by the parser, **before any validator
can run**. `ERF-3` requires unique source ids and `ERF-38` requires a validator
to reject duplicates; the map encoding does not fail the check, it removes the
evidence the check would run on.

`repeated SourceEntry` preserves order and duplicates, and invents both a
message and an ordering the specification does not define, so two producers
emit different bytes for the same corpus.

**Q. A narrative is prose with markers embedded in it. What does protobuf do
with that, and what does it tell you about whether a narrative is data or a
document?**

It carries it as a `string` and understands none of it, which settles
`ERF-34`'s claim that a narrative is a document rather than a record. The
sharper result: modelling narrative bindings as typed messages *only* would
violate `ERF-31`, because a typed `NarrativeBinding` has no legal assignment
for a comment that omits `bound-at`, so a producer would drop it, which is the
exact failure `ERF-31` forbids ("a required part does not make a binding
invalid, it makes it invisible"). The schema therefore carries `raw` and
`well_formed` beside the parsed fields, and the round trip confirms the
malformed binding survives. **A format that requires preserving what fails to
parse cannot make a schema the authority over it.**

## Regenerating and running

Requires `protoc` (tested with 33.4) and a Python `protobuf` runtime new enough
for it (tested with 7.36.0; the system 3.20.3 will not load protoc 33
descriptors), plus `pyyaml`.

```bash
python -m venv .venv
.venv/bin/pip install 'protobuf>=6.30' pyyaml

# generate
protoc --python_out=gen --pyi_out=gen erf.proto

# round trip the corpus, writing tests/out/
.venv/bin/python harness/roundtrip.py tests/ --write

# the presence measurements
.venv/bin/python harness/presence_probe.py
```

Current results:

```
files: 16   losses: 6   hard failures: 1   spec-licensed changes: 7   key-order changes: 6..10

messages defined      : 20  (15 from the data model, 5 scaffolding proto3 forced)
fields defined        : 123    (91 data-model, 32 machinery)
enums defined         : 6
`optional` scalars    : 21   <- explicit-presence opt-ins
```

Every number there is stable run to run except the last, which varies between 6
and 10 because proto3 map ordering moves with the process hash seed. That
instability is itself a finding (`losslessness.md`, P-5 and F4), and the way it
was found is in `friction-log.md` §11.

## The harness, briefly

- `harness/erf_yaml.py` implements `ERF-65` (YAML 1.2 JSON schema, so
  `timestamp: 2026-08-23` stays a string) and `ERF-66` (rejects duplicate keys,
  anchors, aliases). PyYAML's defaults violate both.
- `harness/mapping.py` is descriptor-driven, so the mapping cannot drift from
  `erf.proto`.
- `harness/roundtrip.py` goes through `SerializeToString()` and
  `FromString()`. An in-process object retains distinctions the wire does not;
  only real bytes test presence. Its scalar comparison is type-aware, because
  Python's `1494 == 1494.0` hides the CSL loss (see `friction-log.md` §9).
- `harness/bindings.py` separates recognizing a narrative binding from
  validating one, in that order, per `ERF-31`.

## What is not covered

- **No validator.** 62 of 66 requirements need code for at least part of their
  enforcement; none of it is written here.
- **No conformance against `conformance/cases/*`**, which the specification
  declares normative for `ERF-51`. Out of bounds for this trial, which means
  the folding in `harness/bindings.py` is a reading of the prose and nothing
  more.
- **No multi-corpus deployment**, so `ERF-35`, `ERF-36`, and `ERF-38` were
  reasoned about rather than exercised.
- **One protobuf implementation.** The map reordering is measured in Python.
  The claim that another implementation may order differently rests on the
  proto3 language specification declaring the order undefined, not on a second
  measurement.
- **No `Any`-based or `FileDescriptorSet`-based dynamic escape.** A schema that
  carried unknown record types dynamically would change the `ERF-57` result and
  was not attempted.

## The one-line result

The prose determines a wire representation for most of the record fields and
fails to determine one at fifteen decision points, six of which produce
mutually unreadable bytes between two conforming implementations. The
specification also says, twice and in its own words, that the prose is not the
authority: `types/erf.ts` governs the data model and `conformance/cases/*`
governs `ERF-51`. Section 1 says the document can be handed to an implementer
to build from. On the evidence of this trial, it can be handed to an
implementer to build *something* from, and two implementers will not build the
same thing.
