# The Epistemic Record Format (ERF)

The Epistemic Record Format (ERF) is a plain-text record format for bringing rigor to working research: the analysis, argumentation, and synthesis done in consulting, strategy, due diligence, and organizational decision-making, where conclusions rest on claims that no one can later trace, check, or stand behind. Academic publishing has citations and peer review; software has types, tests, and version control; the knowledge work between them has had only prose. ERF supplies the missing substrate: evidence captured verbatim and checkable against frozen copies of its sources; claims typed by what would check them; arguments as typed relations between claims; and an append-only ledger of who stands behind each claim, since when, and why. LLMs make the format maintainable (they draft, extract, classify, and keep the records tidy); people make the judgments; the records show which was which. The result is a working level above raw text: a corpus that people and machines can query, verify, and build on rather than re-read and re-interpret.

## Status

This is version 1.0 (August 22, 2026), extracted from a working practice
rather than designed in advance: roughly 740 audited atoms and 300 claims
and questions across seven corpora preceded the specification, and a pilot
ran the records on a third-party substrate before it was written.
Requirement ids are stable from this version on: insertions take letter
suffixes, and a retired id is never reused. Feedback is invited; the
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
claim's disposition (proposal, active, contested, retired) is computed
from the ledger, never written down.

One more record type covers what atoms cannot: a **survey** records
search acts and their yield (which instruments, which queries, what came
back), so a claim that something is absent, niche, or well-covered rests
on a citable record of the search instead of an unrecorded impression.
Absence is evidenced by surveys; presence by atoms.

## Seeing it work

[`examples/corpus/`](examples/corpus/) is a small corpus of real records,
copied unchanged from a working practice: five atoms, five claims, three
surveys, a question, and a narrative whose passages bind to the claims they
rest on. [`viewer/`](viewer/) renders it to static HTML.

```
cd viewer && npm install
npx tsx erf-view.ts ../examples/corpus -o ../examples/site
```

Two things in that corpus are worth knowing before you look. Every claim
computes to `proposal`, because nobody has stood behind any of them and the
format never infers a position from the strength of the evidence. And none
of the captured copies could be republished, mostly for copyright reasons,
so the quote check cannot run there. The viewer says so on every claim
rather than presenting an unresolvable backing as backing, which is what
`ERF-6.8a` requires. The demonstration is weaker for it and honest about
why.

## Documents

| File | What it is |
|---|---|
| [`SPEC.md`](SPEC.md) | The specification: record types, numbered requirements (RFC 2119), vocabularies, invariants, serialization. |
| [`types/erf.ts`](types/erf.ts) | The normative data model as a compiling TypeScript file; `SPEC.md` carries an inline mirror. |
| [`DESIGN-HISTORY.md`](DESIGN-HISTORY.md) | Non-normative companion: how the format got this way (the subtraction ledger, the reversals) and the prior-art survey. |
| [`CHANGELOG.md`](CHANGELOG.md) | Change history, newest first. |
| [`examples/`](examples/) | Single-record examples as standalone YAML, plus [`examples/corpus/`](examples/corpus/), a small complete corpus of real records exercising every record type, and [`examples/site/`](examples/site/), that corpus rendered. |
| [`viewer/`](viewer/) | `erf-view`, the reference consumer: a TypeScript static-site generator that imports the normative model and computes every derived reading from the specification text. |
| [`tools/lint-spec-style.py`](tools/lint-spec-style.py) | The style lint the spec itself is held to (requirement-block shape, note form, no em dashes in prose). Run: `python3 tools/lint-spec-style.py`. |

## License

To be chosen before publication.
