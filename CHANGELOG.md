# Changelog

Newest first. Requirement ids are stable once published: a new requirement
takes the next unused number, ids carry no positional meaning, retired ids
are never reused, and every change lands here with a date.

The dated narrative of the 0.9.0 work lives in
[`docs/history.md`](docs/history.md) under "The 0.9.0 work, dated". This file
records what changed; that one records how the work went.

## Unreleased

*Nothing yet.*

## 0.9.0 — 2026-08-25

The first published version. From here requirement ids are stable: a new
requirement takes the next unused number, ids carry no positional meaning,
retired ids are never reused, and every change lands in this file with a
date. Breaking changes to a numbered requirement wait for a major version;
clarifications that do not change what conforms may land in a patch.

Fifty-four requirements, four of them with no conformance fixture and named
as such by the coverage line on every run. Nineteen open backlog defects at
P2 and P3, each with a priority and a basis, plus eleven capabilities waiting
on a trigger; six of the defects carry a verification by a hand that did not
raise them, and thirteen do not and say so in their own record. All three
numbers are published rather than hidden: this is a draft meant to be
implemented against and argued with, and what is known to be unresolved,
unverified, or untested is part of what it says.

The dated narrative of this work, one entry per change with its reasoning
and its measurements, moved to [`docs/history.md`](docs/history.md) on
2026-08-26, under "The 0.9.0 work, dated". What follows is the terse record.

### Added

- `ERF-69` A source's normalized text MAY be an excerpt of the work, and MUST then record who selected the passage and when. (2026-08-24)
- `ERF-70` Normalized text produced from a raw file in another format names the extracting tool and its exact version, and the tool is deterministic. (2026-08-24)
- `ERF-71` A source records the digest of the artifact it holds; since 2026-08-26 a recorded digest is a MUST against that file, and the loader checks it. (2026-08-24)
- `ERF-72` The `x_` extension namespace: a producer MAY originate one anywhere, a validator never reports it, a consumer treats it as unknown. (2026-08-24)
- `ERF-73` Every document a corpus holds validates against `erf.schema.json`, which is where the shape rules now live. (2026-08-26)
- `YAMLB-1` The narrative binding's HTML-comment spelling, its grammar and its recognition rule, split out of `ERF-31` when the model was separated from its wire. (2026-08-25)
- `YAMLB-2` The wire spelling of an omitted empty list and of an empty mapping written `{}`, split out of retired `ERF-55`. (2026-08-26)

### Changed

- Requirement ids flattened from `ERF-<section>.<sequence>` to a flat sequence carrying no meaning beyond identity; the old-to-new mapping is in `docs/history.md`. (2026-08-23)
- `ERF-1`, `ERF-50` Lost their workflow gates: the rules describe a corpus's state whatever order it was built in. (2026-08-26)
- `ERF-4` Trimmed to what a schema cannot hold: an atom names a source the corpus's source list holds. (2026-08-26)
- `ERF-6` Gains the producer's duty: a quote is copied from the normalized text by a tool, never regenerated, because an author who retypes tidies. (2026-08-26)
- `ERF-9` The `high` anchor is disclosure under accountability, ending its overlap with vendor self-claims. (2026-08-24)
- `ERF-11` No field holds the mechanical result and an `x_` copy is never read as the check; absorbs retired `ERF-12`'s clause that a failed audit is never a verdict. (2026-08-26)
- `ERF-13`, `ERF-17`, `ERF-61` Trimmed to what a schema cannot hold. (2026-08-26)
- `ERF-14` `as_of_date` states what the source pinned and no more: a year, a year and month, or a full date. (2026-08-25)
- `ERF-17` A corpus transfer is never recorded as a standing entry, which would move the disposition as a side effect. (2026-08-24)
- `ERF-18` Absorbs retired `ERF-46`: whether an opening in other words states the same claim is a reading, and authoring judgment is not numbered. (2026-08-24)
- `ERF-20` The prohibitions on storing drift and counts are gone; the reason stays. (2026-08-26)
- `ERF-24`, `ERF-43` A premise arrives from either direction of the graph; the closure excludes its own root, vacuity holds for the root alone, a retired premise is a flag rather than a violation, and the rule is global. (2026-08-24, 2026-08-25, 2026-08-26)
- `ERF-28` Immutability binds the conducted acts and their yields; a later note stamps `last_modified` like any other record. (2026-08-24)
- `ERF-31` `bound-at` is required; the grammar gains the recognition rule that had let a malformed binding be invisible rather than invalid; the anchor folds under `ERF-51` and carries the escapes `\"` and `\\`; the `id` production can no longer swallow the next binding; a missing anchor is a flag, not a violation. (2026-08-25, 2026-08-26)
- `ERF-32` A staleness comparison the stamps' precision cannot order reads as stale, and an absent `bound-at` reads as indeterminate rather than as current. (2026-08-24)
- `ERF-35` A reference asserting *now* must resolve and one recording *then* is flagged, stated as a principle rather than a longer list. (2026-08-25)
- `ERF-41` The disposition function is total: withdrawn stances are discarded first, only well-formed standings are admitted, and a same-instant tie breaks by ledger order. (2026-08-23, 2026-08-25, 2026-08-26)
- `ERF-42` `rejected` and `retired` MUST NOT be rendered identically without saying which. (2026-08-23)
- `ERF-47` Names the dependency set per audit kind, and an atom edited or attached after an audit counts as a change that audit never saw. (2026-08-26)
- `ERF-48` A validator decides only that `last_modified` never precedes `created`; the rest are SHOULDs. (2026-08-26)
- `ERF-51` Normalization went from seventeen steps to three, then to four citations of named standards: render as CommonMark plain text with leaf blocks separated by a paragraph separator, NFC, drop `Default_Ignorable_Code_Point`, collapse `White_Space` with U+2029 exempt. NFKC is gone, having folded the ellipsis and the long s that `ERF-52` requires literal. (2026-08-23, 2026-08-25, 2026-08-26)
- `ERF-52` Only `[...]` elides; every non-empty span MUST occur in order, without overlap, as whole words under UAX #29 with one stated departure (a hyphen between two letters or digits), each span taken at its earliest occurrence. (2026-08-23, 2026-08-25, 2026-08-26)
- `ERF-53` Names a canonical interchange form and defines loss against the model instance: a document round-trips through the model, an artifact byte for byte, and the source list is covered because it carries the verifiability chain. (2026-08-24, 2026-08-25, 2026-08-26)
- `ERF-54` Discovery is by content: every document self-describes with `type`, no meaning lives in a path, and a held raw or normalized file is an artifact carrying none. (2026-08-25, 2026-08-26)
- `ERF-56` Absorbs retired `ERF-55`'s presence semantics: an omitted list materializes as empty, and an optional mapping present and empty asserts existence. (2026-08-26)
- `ERF-60`, `ERF-61` A MAJOR increment means records of the previous major are unreadable *or* read with changed meaning, which is what the refusal exists for. (2026-08-24)
- `ERF-65` Gains the producer's obligation to quote every string-typed scalar whose bare spelling resolves to another type under the schema it mandates. (2026-08-25)
- `ERF-65`, `ERF-66`, `ERF-67` and the file half of `ERF-53` moved to `bindings/yaml-markdown.md`, keeping their ids: the model is separate from its wire, and section 7 now says what every binding must satisfy. (2026-08-25)
- `ERF-68` Gains `shipped-as-quotation`, so a text shipping under no licence says so, and names the SPDX identifier where one exists. (2026-08-24)

### Retired

Retired ids are never reused and never refilled; the conformance suite guards
each one against reappearing.

- `ERF-3`, `ERF-5`, `ERF-7`, `ERF-12`, `ERF-19`, `ERF-21`, `ERF-22`, `ERF-34`, `ERF-37`, `ERF-38`, `ERF-39`, `ERF-55`, `ERF-58`, `ERF-59` Fourteen shape rules the schema already enforced, retired together under `ERF-73` after four cold readers applying one rubric reached the same deletion test. Each reason moved onto the schema definition it explains, and `ERF-37` and `ERF-38` had restated `ERF-36`. Requirement count 66 to 54. (2026-08-26)
- `ERF-16` Cross-realm reference resolution, retired with the realm concept: ids are scoped to the deployment. (2026-08-24)
- `ERF-29` The survey `limitations` field, retired into the survey section's guidance: a record with a body carries its caveats there. (2026-08-23)
- `ERF-30` A narrative comprising prose plus a claims-tree document, which is one practice's doc class rather than anything the format needs. (2026-08-23)
- `ERF-45` The classification wall, which is a rule about who may cite what, and therefore a policy. (2026-08-24)
- `ERF-46` Title and body agreement, folded into `ERF-18`'s guidance. (2026-08-24)
- `ERF-49` A claim must not store whether it is backed: the schema has no such field, so the rule forbade nothing, and *unbacked* is a defined term in section 2. (2026-08-26)
- `ERF-64` The corpus registry with its ordered classification levels, now deployment practice the format does not specify. (2026-08-24)
- The question record type, with `Question`, `QuestionId`, `QuestionStatus`, the question status vocabulary and the `bears_on` field: a scope decision to keep the first version shippable. (2026-08-23)

### Fixed

- The quote check passed quotations no source contained: `The cat[...]sat` against "The catapult was heavy. Someone eventually sat", `Revenue fell 12` against `12.5 percent`, `The board` against `The board's`, a word halved at a soft hyphen, two paragraphs spliced into one sentence, and `3*4` folded to `34`. Every one is pinned in `conformance/cases/quote-check.txt`. (2026-08-25)
- The disposition function was partial: a claim whose current stances are all `against` matched none of its four branches. `rejected` is the fifth reading. (2026-08-23)
- An unquoted timestamp was coerced to a date, so newest-stance selection compared stringified dates and every computed disposition turned on the day of the week. (2026-08-23)
- The narrative binding grammar was implemented twice in the reference viewer and only the parser gained `bound-at`, so six raw HTML comments reached a published page and no "rests on" link rendered at all. There is now one grammar, defined once and imported. (2026-08-23)
- A duplicate record id silently discarded the first record and redirected every claim citing it. (2026-08-23)
- `spec_version: 1.0` loaded as the number 1 under the schema `ERF-65` mandates, destroying the minor version the major-version rule reads. Quoted SemVer throughout. (2026-08-24)
- The reference viewer implemented none of `ERF-51`'s mandatory normalization while printing "Quote check passes". (2026-08-23)
- The example normalized texts carried an SPDX identifier for a different licence than the one their headers invoke. (2026-08-24)
- The loader skipped unrecognized files in silence, so a widening that orphaned two source lists surfaced as 151 accusations against the atoms. (2026-08-25)
- The command-line validator computed narrative-binding staleness and never printed it, and named nothing it did not check, which the Validator class requires. (2026-08-26)
- A held raw or normalized text was reported as an unrecognized file, one line per source. (2026-08-26)
- The schema's `Instant` admitted seconds-less stamps RFC 3339 forbids. (2026-08-26)

### Tooling

- Two licences: CC BY 4.0 for the specification and prose, Apache-2.0 for the reference implementation and tooling. An implementation is not a derivative work of the specification, and neither reaches the corpora anyone builds. (2026-08-25)
- `erf.schema.json` became the normative data model (JSON Schema 2020-12), with a gate validating every valid fixture against it and a second gate holding `types/erf.ts` to it. (2026-08-25)
- `conformance/coverage.yaml` maps every requirement to what defends it, or states why nothing can; a requirement with no row fails the run, and covered, untestable-by-design and uncovered counts print on every run. (2026-08-24)
- The suite validates the shipped examples and greps the repository for pre-flatten requirement ids, so that class of drift fails a run instead of waiting for a reviewer. (2026-08-24)
- `tools/lint-spec-style.py`, `tools/lint-field-names.py` and `tools/lint-schema-types.py` are invoked by the suite rather than being commands someone has to remember. (2026-08-25)
- `tools/backlog-index.py` parses entry frontmatter with a real YAML parser, after four entries were invalid YAML for a day without the tool whose job is to catch that noticing. (2026-08-25)
- The attack suite is named: `conformance/cases/quote-check.txt` carries, under `F-016`, every fabrication that once passed, and a case is never removed. (2026-08-26)
- Observations pass three gates in `docs/findings/` before they may become a backlog entry, and `docs/backlog/README.md` is generated from the entry files. (2026-08-25)
- Requirement definition lines carry HTML anchors, so `SPEC.md#erf-6` resolves; `conformance/requirements.md` is generated from the two normative documents and the coverage map by `tools/requirements-index.py`; and the repository gains `CONTRIBUTING.md`, `IMPLEMENTATIONS.md`, `SECURITY.md`, `CITATION.cff`, and GitHub issue and pull-request templates. (2026-08-26)
