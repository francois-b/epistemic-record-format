# The Epistemic Record Format (ERF)

> **Version 0.9, not yet 1.0.** The format is under stress test as of
> August 2026: cold implementations, cold authoring trials and adversarial
> reads against the specification alone, with what they found recorded in
> `reviews/`, `docs/findings/` and `docs/design-history.md`. Requirement ids are
> stable from this version on; the text is not final.

![Spec version 0.9.0 draft](https://img.shields.io/badge/spec-0.9.0%20draft-1f6feb)
![Prose licence CC BY 4.0](https://img.shields.io/badge/prose-CC%20BY%204.0-555555)
![Code licence Apache 2.0](https://img.shields.io/badge/code-Apache--2.0-555555)

ERF is a plain-text record format for research whose conclusions have to hold
up later: evidence quoted verbatim and checkable against frozen copies of its
sources, claims typed by what would settle them, arguments as typed relations
between claims, and an append-only ledger of who stands behind each claim and
since when. It is a specification with a reference implementation, a
conformance suite, and a real corpus you can read.

[**Read the specification**](SPEC.md) ·
[Data model](schema/erf.schema.json) ·
[Serialization](serialization/yaml-markdown.md) ·
[Every requirement, indexed](conformance/requirements-index.md) ·
[Contributing](CONTRIBUTING.md)

**See it work:** a rendered site (the case for the format plus the 151-atom
corpus in the reference viewer) is built by `site/build.sh` and is being
prepared for publication; until then, `npm run view` renders any corpus
locally.

The Epistemic Record Format (ERF) is a plain-text record format for bringing rigor to working research: the analysis, argumentation, and synthesis done in consulting, strategy, due diligence, and organizational decision-making, where conclusions rest on claims that no one can later trace, check, or stand behind. Academic publishing has citations and peer review; software has types, tests, and version control; the knowledge work between them has had only prose. ERF supplies the missing substrate: evidence captured verbatim and checkable against frozen copies of its sources; claims typed by what would check them; arguments as typed relations between claims; and an append-only ledger of who stands behind each claim, since when, and why. LLMs make the format maintainable (they draft, extract, classify, and keep the records tidy); people make the judgments; the records show which was which. The result is a working level above raw text: a corpus that people and machines can query, verify, and build on rather than re-read and re-interpret.

## Why this exists

The reasoning is in an essay, [*Epistemology for Knowledge Work in the LLM
Era*](docs/essay/epistemology-for-knowledge-work-in-the-llm-era.md)
([PDF](docs/essay/epistemology-for-knowledge-work-in-the-llm-era-6ed2f.pdf)):
knowledge work outside coding has no equivalent of version control and
tests, LLMs multiply the volume of plausible text, and what a person needs
is a record where every statement carries what backs it, who stands behind
it, and when. The format is that record. [`docs/purpose.md`](docs/purpose.md)
states what it does and deliberately does not do.

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
`reviews/`, `docs/findings/` and `docs/design-history.md`. What remains open is
published in `docs/backlog/` with a priority and a verification on each
entry. 1.0 waits on implementations other than the author's.
Forty-nine requirements, three of them with no conformance fixture and
named as such by the coverage line on every run; fourteen open backlog
defects and eleven capabilities waiting on a trigger, each with a priority,
a basis, and a verification record.
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
surveys, and a narrative whose passages bind to the claims they rest on. [`validator/yaml-markdown/typescript/`](validator/yaml-markdown/typescript/) checks it and [`tools/viewer/`](tools/viewer/) renders it to static HTML.

```
npm install                                   # installs the validator, the viewer and the conformance suite
npm run check -- examples/corpora/minimal     # the validator: violations, flags, what it does not check
npm run view -- examples/corpora/minimal -o examples/site
```

`erf-check` is the reference validator, and the first thing to run on a
corpus you wrote: it prints a line per violation and per flag, a `QUOTE`
summary of how many quotes checked, and a `NOT-CHECKED` line for each
requirement it does not decide. Exit 1 on any violation.

Two things in that corpus are worth knowing before you look. Every claim
computes to `proposal`, because nobody has stood behind any of them and the
format never infers a position from the strength of the evidence. And the
held texts are mixed on purpose: four of the nine atoms ship their
normalized text (two W3C documents, whose licence permits it) and the quote check runs
for them; the other five quote sources whose licences do not permit
republication, so their checks cannot run here, and the viewer says so on
every claim leaning on one rather than presenting an unresolvable backing
as backing. That is the viewer's own choice, not a rule of the format,
which says nothing about presentation. It is also what the format looks
like in the ordinary case, where some evidence can be republished and some
cannot.

## Try to break it

If you read one file here, read
[`conformance/cases/quote-check.tsv`](conformance/cases/quote-check.tsv). It
is a standing attack suite: every quotation a source never said that once
passed the quote check, kept as a case that any implementation must fail. A
number cut at its decimal point. A negation dropped at a hyphen. A word
halved at a soft hyphen. Two paragraphs spliced into one sentence. `3*4` read
as `34`. Each of those was green until somebody attacked it, and most were
found by cold implementations that had never seen the reference.

The quote check is the mechanism the rest of the format rests on, so this is
where an attack is worth most. A case is never removed from the file, and a
new way through is the contribution: open an issue, and it joins the suite
with the trial that found it.

## Documents

The specification is normative; everything else explains, demonstrates, or
checks it.

| Read this | To answer |
|---|---|
| [`SPEC.md`](SPEC.md) | What are the rules? Record types, numbered requirements (RFC 2119), vocabularies, invariants, serialization. |
| [`schema/`](schema/) | What are the shapes? `erf.schema.json`, the normative data model, JSON Schema 2020-12; `SPEC.md` section 3 says how to read it. Beside it, `erf.ts` is generated from the schema (never edited; a pre-commit hook regenerates it and the suite checks it), not normative. |
| [`docs/purpose.md`](docs/purpose.md) | **What does this format do, and what does it deliberately refuse to do?** |
| [`docs/`](docs/) | Why is a rule the way it is (`design-history.md`), was an idea already declined (`non-goals.md`), will it ever do X (`backlog/`), where do the ideas come from (`influences.md`). |
| [`examples/`](examples/) | What does it look like in use? [`examples/records/`](examples/records/), one record per type in the interchange form, and [`examples/corpora/minimal/`](examples/corpora/minimal/), a complete small corpus; `npm run view -- examples/corpora/minimal -o <dir>` renders it. |
| [`conformance/`](conformance/) | Does my implementation obey the rules? Cases, fixtures, a map from every requirement to what defends it, and [`requirements-index.md`](conformance/requirements-index.md), that map as one page. |
| [`validator/`](validator/) | What does one implementation look like? One folder per serialization, one per language under it: [`yaml-markdown/typescript/`](validator/yaml-markdown/typescript/) is `erf-check`, the reference validator, which loads a corpus against the schema and computes every derived reading from the specification text. The conformance suite tests this code. |
| [`tools/viewer/`](tools/viewer/) | What does a corpus look like rendered? `erf-view`, the reference consumer, a static-site renderer over the validator. |
| [`reviews/`](reviews/) | Does the document itself work? Evaluations of the specification: adversarial reads, and independent trials that tested it by building from it. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How do I report a defect, propose a capability, or change the code? The findings pipeline, the backlog's basis and trigger discipline, and the gates. |
| [`IMPLEMENTATIONS.md`](IMPLEMENTATIONS.md) | Who has built to this? The maintained implementations (none yet but the reference), and eleven cold trials that were built from the specification alone to test it. |
| [`CHANGELOG.md`](CHANGELOG.md) | Which requirements changed in which version. |
| [`tools/`](tools/) | `viewer/`, the reference consumer; `generate/`, the type generator and the two index generators; `lint/`, the checks the repository holds itself to. |

## Licence

Two licences, because a specification and its implementation want different
things.

**The specification and prose** are under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): `SPEC.md`, this
file, `CHANGELOG.md`, `docs/`, `examples/`, `reviews/`, and the
fixture corpora and case tables under `conformance/`. Full text in
[`LICENSE`](LICENSE). Use it, quote it, implement it, fork it; attribution
is the only condition. **An implementation is not a derivative work of the
specification**, and nothing in the licence reaches the corpora you build
with it: what you record is yours.

**The reference implementation and tooling** are under
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0): `validator/`,
`tools/`, `schema/erf.generated.ts`, and the runner and suites under `conformance/`. Full
text in [`LICENSE-CODE`](LICENSE-CODE). Apache rather than MIT for the
explicit patent grant, which is worth having in code a second implementer is
expected to read closely and copy from.
