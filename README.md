# The Epistemic Record Format (ERF)

A record format for working research, so you can build on adjudicated claims backed by grounded source material, and keep loose LLM prose out of your research and your thinking.

![Spec version 0.9.0 draft](https://img.shields.io/badge/spec-0.9.0%20draft-1f6feb)
![Prose licence CC BY 4.0](https://img.shields.io/badge/prose-CC%20BY%204.0-555555)
![Code licence Apache 2.0](https://img.shields.io/badge/code-Apache--2.0-555555)

> Version 0.9, not 1.0. The text is a draft published to be implemented against and argued with. Requirement ids are stable from this version on; the wording is not final.

[**Read the specification**](SPEC.md) ·
[Data model](schema/erf.schema.json) ·
[Serialization](serialization/yaml-markdown.md) ·
[Every requirement, indexed](conformance/requirements-index.md) ·
[Contributing](CONTRIBUTING.md)

## What it is

Plain-text records for the research behind a document: a memo, a brief, an analysis, a position. Four record types and a rule for how prose ties to them.

- An **atom** is one piece of evidence: a verbatim quote, the source it came from, and the finding it supports. The quote is checked against a held copy of the source's text, so a quote the source never said does not get in.
- A **claim** is one statement a person could stand behind or dispute. It is typed by what would settle it (data, reasoning, the author's decision, or time) and lists its evidence for and against.
- A **survey** records a search and what it found, so a claim that something is absent rests on a record of the looking, not an impression.
- A **standing** is a person's position on a claim: for, against, or withdrawn, with a reason and a timestamp. Standings are appended, never edited. A claim's disposition (proposal, active, contested, rejected, retired) is computed from them and never stored.
- A **narrative** is prose written by a person. Each passage that asserts something ends with a binding that names the claims it rests on, so the document and the record can be checked against each other after either changes.

LLMs do the housekeeping: drafting, extracting, capturing, classifying. People make the judgments. The records show which was which.

## Why

The reasoning is in an essay, [*Epistemology for Knowledge Work in the LLM Era*](docs/essay/epistemology-for-knowledge-work-in-the-llm-era.md) ([PDF](docs/essay/epistemology-for-knowledge-work-in-the-llm-era-6ed2f.pdf)). Coding has version control and tests. Knowledge work has had prose, and LLMs now produce more of it than anyone can check by reading. The format is the record a person needs underneath that prose: what backs each statement, who stands behind it, and since when. [`docs/purpose.md`](docs/purpose.md) says what the format does and what it deliberately leaves out.

## A record

A claim, as written to disk:

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

An LLM drafted it (`created.by`). Its kind is `observation`, so data settles it: three atoms, each a verbatim quote from a captured source. Nobody has taken a position yet, so there is no `standings` list and the claim is a proposal. When someone does, the entry names the person, the instant, the stance, and the reason.

## Use it

```
npm install                                  # validator, viewer, conformance suite, MCP server
npm run check -- examples/corpora/minimal    # the reference validator
npm run view -- examples/corpora/minimal -o /tmp/erf-site   # render a corpus to static HTML
```

- **`@epistemic-record-format/validator-yaml-markdown`** ([`validator/yaml-markdown/typescript/`](validator/yaml-markdown/typescript/)) is the reference validator, as a library and as the `erf-check` command. It loads a corpus, validates every document against the schema, runs the quote check, and computes every reading the specification defines. Exit 1 on any violation.
- **`erf-view`** ([`tools/viewer/`](tools/viewer/)) renders a corpus as a self-contained static site: every claim with its evidence and standings, every atom with its quote check, the narrative with its bound passages, and a health page.
- **`erf-mcp`** ([`tools/mcp-server/`](tools/mcp-server/)) is the format as a local MCP server for Claude Desktop and Claude Code. The LLM captures sources, mints atoms and claims, records surveys, and binds prose through tools that enforce the rules: a paraphrased quote is refused, an unheld source cannot be cited, a standing needs a reason. The server is the only writer; the user rules on every proposal.

[`examples/corpora/minimal/`](examples/corpora/minimal/) is a small real corpus: nine atoms, six claims, three surveys, one narrative. Every claim in it is a proposal, because nobody has stood behind one and the format does not infer a position from evidence. Some of its sources ship their text and some do not, because licences differ; the viewer says which on every claim.

## Status

Version 0.9, August 2026. The format was extracted from a working practice, not designed in advance: about 740 audited atoms and 300 claims across seven corpora came before the specification.

On 2026-08-25 it was tested by ten independent trials that read the specification and nothing else: cold implementations in Python, Rust, SQL, Go, Haskell and Swift, a protobuf schema exercise, two authoring trials (one of 71 sources, 151 atoms and 53 claims), and an adversarial fixture set. They found defects in the reference implementation, a hole in the quote check that let a fabricated quotation pass, a requirement that could not be implemented as written, and two that contradicted each other. Each was ruled and pinned with a conformance case. The record is in [`reviews/`](reviews/), [`docs/findings/`](docs/findings/) and [`docs/design-history.md`](docs/design-history.md). What is still open is in [`docs/backlog/`](docs/backlog/), each entry with a priority and a verification.

Fifty requirements. Ids are a flat sequence: insertions append, a retired id is never reused. 1.0 waits on implementations other than the author's. The intended reading is implementation, or a requirement-by-requirement diff against a system you already have.

## Documents

The specification is normative. Everything else explains, demonstrates, or checks it.

| Read this | For |
|---|---|
| [`SPEC.md`](SPEC.md) | The rules: record types, numbered requirements (RFC 2119), vocabularies, invariants. |
| [`schema/`](schema/) | The shapes: `erf.schema.json`, the normative data model (JSON Schema 2020-12). `erf.generated.ts` is generated from it and never edited. |
| [`serialization/`](serialization/) | How records are written to files: YAML frontmatter, a markdown body, the narrative binding marker. |
| [`docs/purpose.md`](docs/purpose.md) | What the format does and refuses to do. |
| [`docs/`](docs/) | Why a rule is the way it is (`design-history.md`), what was declined (`non-goals.md`), what is open (`backlog/`), where the ideas come from (`influences.md`), the objections (`objections.md`). |
| [`examples/`](examples/) | One record per type in [`records/`](examples/records/), and complete corpora in [`corpora/`](examples/corpora/). |
| [`conformance/`](conformance/) | Cases, fixtures, and a map from every requirement to what defends it. The case tables are normative for the quote check. |
| [`validator/`](validator/) | Maintained validators, one folder per serialization and language. |
| [`tools/`](tools/) | The MCP server, the viewer, the type generator, and the repository's own lints. |
| [`reviews/`](reviews/) | Adversarial reads and cold trials of the specification, with what they found. |
| [`IMPLEMENTATIONS.md`](IMPLEMENTATIONS.md) | Maintained implementations, and the cold trials built from the specification alone. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Reporting a defect, proposing a capability, changing the code, publishing the validator. |
| [`CHANGELOG.md`](CHANGELOG.md) | Which requirements changed in which version. |

## Licence

The specification and prose (`SPEC.md`, this file, `CHANGELOG.md`, `docs/`, `examples/`, `reviews/`, and the fixture corpora and case tables under `conformance/`) are under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); text in [`LICENSE`](LICENSE). An implementation is not a derivative work of the specification, and nothing in the licence reaches the corpora you build with it.

The reference implementation and tooling (`validator/`, `tools/`, `schema/erf.generated.ts`, and the runner and suites under `conformance/`) are under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0); text in [`LICENSE-CODE`](LICENSE-CODE).
