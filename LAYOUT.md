---
title: "Repository layout"
purpose: "What kinds of things live where, and how a new kind is admitted. Written before the next thing gets added, not after."
generated: 2026-08-25
model: claude-opus-5[1m]
---

# Repository layout

This file exists because the layout once grew the other way round: work
ran, and whatever it produced became a directory named after what
happened. That reads fine to whoever was there and badly to everyone
else. Names here classify by **function**, what a thing is for, never by
provenance, what produced it or what it happened to be about. The subject
of a thing belongs in its README, not in its path.

## The layers

**Normative.** The specification and the data model it defines. Changing
these changes what conformance means.

- `SPEC.md` — the specification: the obligations on acts, and the rules over more than one record
- `erf.schema.json` — the data model, JSON Schema 2020-12, normative
- `erf-cases-normalization.txt`, `erf-cases-quote-check.txt` — the quote
  check's normative case files (`ERF-51`): each line an input and the
  verdict a conforming implementation must return
- `bindings/` — one document per wire, each normative for any corpus
  exchanged in it; `bindings/yaml-markdown.md` is the interchange default.
  `SPEC.md` section 7 says what every binding must satisfy
- `types/erf.ts` — a TypeScript rendering of the schema for the reference implementation; not normative, held to the schema by a gate

**Instruments.** Permanent, versioned alongside the requirements, aimed at
a stranger checking their own work.

- `conformance/` — the conformance suite: fixtures, the disposition cases, and a map from
  every requirement to what defends it
- `tools/` — checks this repository holds itself to
- `viewer/` — the reference consumer, one implementation of reading a corpus

**Demonstrations.** What the format looks like when used.

- `examples/` — single-record examples, and `examples/corpora/` for whole
  corpora. **A corpus in `examples/` is stamped: it conforms, and it is
  maintained to keep conforming.** A corpus built against a pre-1.0
  specification is not promoted here, because a stamp against a moving
  target buys nothing that survives the next version.

**Evaluations.** Dated, historical, non-normative. They ask whether the
*document* works, and they produce errata and conformance cases rather
than being either.

- `reviews/` — one folder per review, dated. See `reviews/README.md`.

**History.** Why the format is the way it is, and what it does not yet do.

- `CHANGELOG.md`, `README.md`, and `docs/` (purpose, non-goals, backlog,
  influences, history). The backlog is one file per entry under
  `docs/backlog/`, fed by a triage box at `docs/findings/` that no
  observation skips, and whose README is a generated index: entries are edited
  individually and the index is never edited by hand, because an entry's
  state belongs in exactly one place. Regenerate with
  `python3 tools/backlog-index.py`.

## Admitting a new kind of thing

Decide which layer it belongs to before it exists, and add it here in the
same commit that adds the first instance. If it fits no layer, that is the
finding: either the layer list is wrong, or the thing is two things.

Two rules that follow from the layers, and settle most cases:

1. **Trial output stays with its trial.** A review is a record of what
   happened, so its artifacts stay inside it. Promotion out of a review is
   a deliberate act, never a default.
2. **An instrument may absorb what a review produced.** Fixtures written
   during an evaluation become part of the suite by adoption, which is a
   decision with a date and a reason, not a file copy.

## Naming

- Directories name a **kind**, and read the same to someone who was not
  there: `01-independent-implementation`, not `lane1`.
- Where instances are ordered by when they ran, number them, so that
  reading order is execution order.
- Filenames stay identifiable away from their directory: a friction log
  three folders deep still says which corpus it belongs to.
- No coined collective nouns for project machinery. "Trials" and
  "reviews" are ordinary words; "lanes" and "battery" were not, and both
  were retired on 2026-08-25 for that reason.
