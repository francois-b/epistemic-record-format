# The Epistemic Record Format (ERF)

The Epistemic Record Format (ERF) is a plain-text record format for bringing rigor to working research: the analysis, argumentation, and synthesis done in consulting, strategy, due diligence, and organizational decision-making, where conclusions rest on claims that no one can later trace, check, or stand behind. Academic publishing has citations and peer review; software has types, tests, and version control; the knowledge work between them has had only prose. ERF supplies the missing substrate: evidence captured verbatim and checkable against frozen copies of its sources; claims typed by what would check them; arguments as typed relations between claims; and an append-only ledger of who stands behind each claim, since when, and why. LLMs make the format maintainable (they draft, extract, classify, and keep the records tidy); people make the judgments; the records show which was which. The result is a working level above raw text: a corpus that people and machines can query, verify, and build on rather than re-read and re-interpret.

## Status

This is version 0.9 (draft, August 2026), extracted from a working practice
rather than designed in advance: roughly 740 audited atoms and 300 claims
across seven corpora preceded the specification, and a pilot
ran the records on a third-party substrate before it was written.
It is numbered below 1.0 deliberately. On 2026-08-25 it was tested by
ten independent trials that read the specification and nothing else: six
cold implementations in Python, Rust, SQL, Go, Haskell and Swift, a
protobuf schema exercise, two authoring trials (one of 71 sources, 151
atoms and 53 claims), and an adversarial fixture set. They found defects
in the reference implementation within the hour, a hole in the quote check
that let a fabricated quotation pass, a requirement that could not be
implemented as written, and two that contradicted each other. Every one was
ruled and pinned with a conformance case the same day; the record is in
`reviews/`, `docs/findings/` and `CHANGELOG.md`. What remains open is
published in `docs/backlog/` with a priority and a verification on each
entry. 1.0 waits on implementations other than the author's.
Requirement ids are a flat sequence, stable from this version on:
insertions append, and a retired id is never reused. Feedback is invited; the
intended reading is implementation, or a requirement-by-requirement diff
against an existing system.

## A record, in brief

A claim is one statement a person could stand behind or dispute. The
record carries the proposition; evidence sits on the claim in both
directions; who actually stands where is an append-only ledger:

```yaml
---
id: citators-disagree-on-negative-treatment
type: claim
corpus: knowledge-work-governance
title: "The major legal citators disagree substantially on identifying
  negative treatment, and the leading vendor defense is that no
  objectively correct interpretation exists"
epistemic_kind: observation
created: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
families: [prior-art]
atoms_for: [kwg-014, kwg-015, kwg-016]
---
```

Reading it: an LLM drafted the claim (`created.by` says so). Its kind,
`observation`, sets what would check it: data, carried by three atoms (a
peer-reviewed study of citator disagreement and the vendor's response to
it), each holding a verbatim quote checkable against a captured copy of
its source. Nobody has stood behind the statement yet, so the `standings`
ledger is empty and omitted, and the claim is a proposal. A standing, when
one comes, is an append-only entry naming the person, the date, the
stance, and the reason; nobody's position is a stored status, and the
claim's disposition (proposal, active, contested, rejected, retired) is
computed from the ledger, never written down.

One more record type covers what atoms cannot: a **survey** records
search acts and their yield (which instruments, which queries, what came
back), so a claim that something is absent, niche, or well-covered rests
on a citable record of the search instead of an unrecorded impression.
Absence is evidenced by surveys; presence by atoms.

## Seeing it work

[`examples/corpora/minimal/`](examples/corpora/minimal/) is a small corpus of real records,
copied from a working practice: nine atoms, six claims, three
surveys, and a narrative whose passages bind to the claims they rest on. [`viewer/`](viewer/) renders it to static HTML.

```
cd viewer && npm install
npx tsx erf-view.ts ../examples/corpora/minimal -o ../examples/site
```

Two things in that corpus are worth knowing before you look. Every claim
computes to `proposal`, because nobody has stood behind any of them and the
format never infers a position from the strength of the evidence. And the
captures are mixed on purpose: four of the nine atoms ship their captured
copy (two W3C documents, whose licence permits it) and the quote check runs
for them; the other five quote sources whose licences do not permit
republication, so their checks cannot run here, and the viewer says so on
every claim leaning on one rather than presenting an unresolvable backing
as backing. That is the viewer's own choice, not a rule of the format,
which says nothing about presentation. It is also what the format looks
like in the ordinary case, where some evidence can be republished and some
cannot.

## Documents

The specification is normative; everything else explains, demonstrates, or
checks it.

| Read this | To answer |
|---|---|
| [`SPEC.md`](SPEC.md) | What are the rules? Record types, numbered requirements (RFC 2119), vocabularies, invariants, serialization. |
| [`erf.schema.json`](erf.schema.json) | What are the shapes? The normative data model, JSON Schema 2020-12; `SPEC.md` section 3 says how to read it. `types/erf.ts` is a TypeScript rendering of it for the reference implementation, held to it by a gate, not normative. |
| [`docs/purpose.md`](docs/purpose.md) | **What does this format do, and what does it deliberately refuse to do?** |
| [`docs/`](docs/) | Why is a rule the way it is (`history.md`), was an idea already declined (`non-goals.md`), will it ever do X (`backlog/`), where do the ideas come from (`influences.md`). |
| [`examples/`](examples/) | What does it look like in use? Single-record examples, plus [`examples/corpora/minimal/`](examples/corpora/minimal/), a complete small corpus, and [`examples/site/`](examples/site/), that corpus rendered. |
| [`conformance/`](conformance/) | Does my implementation obey the rules? Cases, fixtures, and a map from every requirement to what defends it. |
| [`viewer/`](viewer/) | What does one implementation look like? `erf-view`, the reference consumer, computing every derived reading from the specification text. |
| [`reviews/`](reviews/) | Does the document itself work? Evaluations of the specification: adversarial reads, and independent trials that tested it by building from it. |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed, and when. |
| [`LAYOUT.md`](LAYOUT.md) | What lives where, and how a new kind of thing is admitted. |
| [`tools/`](tools/) | The style lint the specification holds itself to. |

## Licence

Two licences, because a specification and its implementation want different
things.

**The specification and prose** are under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): `SPEC.md`, this
file, `CHANGELOG.md`, `LAYOUT.md`, `docs/`, `examples/`, `reviews/`, and the
fixture corpora and case tables under `conformance/`. Full text in
[`LICENSE`](LICENSE). Use it, quote it, implement it, fork it; attribution
is the only condition. **An implementation is not a derivative work of the
specification**, and nothing in the licence reaches the corpora you build
with it: what you record is yours.

**The reference implementation and tooling** are under
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0): `viewer/`,
`tools/`, `types/`, and the runner and suites under `conformance/`. Full
text in [`LICENSE-CODE`](LICENSE-CODE). Apache rather than MIT for the
explicit patent grant, which is worth having in code a second implementer is
expected to read closely and copy from.
