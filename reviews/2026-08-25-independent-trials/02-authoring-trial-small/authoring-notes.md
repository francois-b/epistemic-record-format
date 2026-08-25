---
generated: 2026-08-25
model: claude-sonnet-5
---

# Authoring notes

Reflections on building `corpus/` to `SPEC.md` cold, separate from the
dated, requirement-by-requirement log in `friction-log.md`.

## Where the spec was clear

- **The quote-check pipeline (ERF-51/52) is genuinely mechanical and
  genuinely testable.** This is the biggest compliment I can pay it: I
  implemented the normalization algorithm myself (a throwaway script, not
  shipped in the corpus) and ran every candidate atom quote against its
  actual capture file before committing to it. Several quotes that looked
  fine on a silent read failed the check on the first try -- a case-fold
  mismatch, an OCR footnote-mark character, a hyphen-and-newline edge case
  -- and every failure was traceable to a specific, named step in the
  eleven-step pipeline. A spec whose central mechanical check can be
  reimplemented from prose alone and gives sensible, debuggable failures is
  rare, and this is why the task's framing ("cannot be satisfied from
  memory, only from captures you actually fetched") turned out to be
  literally true and not just a rule to follow on faith: I could not have
  guessed which quotes would pass.
- **The Source/atom split (section 4.1 vs. 4.2) is well-motivated and easy
  to apply.** Citation, locator, licence, and capture living once on the
  source rather than repeated per atom was never in question while
  authoring -- four sources, nine atoms, and the split just worked, letting
  three atoms share one Buffon source entry and four share one Jefferson
  entry without any duplication or drift risk.
- **The closed absence vocabulary (ERF-5) mapped cleanly onto a real
  decision.** Choosing `not-redistributable` for the Monticello encyclopedia
  entry, rather than `access-restricted` or `licence-unverified`, was not a
  hard call: it is freely readable, under an ordinary copyright notice,
  with no agreement gating access. The three-way split earns its keep.
- **`source_quality`'s "two inputs, weaker governs" rule (ERF-9) combined
  with ERF-10's discourse-as-subject carve-out** made grading nine atoms
  from only two authors (Buffon, Jefferson) fast and non-arbitrary: every
  finding here is about what a captured primary text itself says, so every
  atom is `high`, and that uniformity is a real reading of the rule, not a
  shortcut around it.
- **The disposition computation (ERF-41) and its refusal to supply a
  tie-break** reads as a genuine design position, not an omission --
  `contested` as a first-class terminal reading, not a default state
  something falls into, matches how this dispute actually looks two and a
  half centuries later: nobody has taken a stance in this corpus yet, so
  every claim here computes to `proposal`, but the shape of the rule is
  legible even unexercised.

## Where the spec was silent

- **One converter per source, when one physical work needs two.** The
  Jefferson Notes-on-Virginia PDF has a page (a fold-out comparative table)
  with zero embedded OCR text alongside dozens of pages with clean embedded
  text. `Source.converter` is one field; ERF-3 says "one entry per work."
  Nothing in section 4.1 or section 7 anticipates a single scanned book
  needing two different, honestly-described extraction methods for
  different regions of itself. I resolved it by disclosing the split in
  the capture body and marking the whole entry non-deterministic (see
  friction-log.md), but a producer implementation would need a real answer
  here, not an author's judgment call, if this pattern recurs at scale --
  and for a corpus built from 18th-century scanned books, it will recur.
- **What "verbatim substring" means for a narrative-binding anchor
  (ERF-31).** Byte-for-byte against the raw markdown file, or against
  soft-line-reflowed text the way a renderer would show it? The quote-check
  pipeline (ERF-51) is exhaustively specified for atoms; the anchor-match
  algorithm for narrative bindings is not specified at all beyond "verbatim
  substring." I hit this directly (see friction-log.md) and worked around
  it by never hard-wrapping narrative paragraphs, but that is a workaround,
  not an answer the format gives.
- **Exact-version naming for interactive/agentic tools (ERF-70).**
  "The tool and its exact version" reads as written for pinned CLI
  libraries (`pymupdf4llm 0.3.4`), where it works well. It has no good
  answer for a browser-automation MCP tool that does not expose a version
  string to its caller. I named the tool and disclosed the gap rather than
  invent a version number.
- **Whether a source needs to have been read in full to be listed at all.**
  I never actually got the Monticello page's own article text to render for
  me. Nothing in section 4.1 says how much of a source an author must have
  actually held before it may appear in the source list with a recorded
  absence -- ERF-1's capture-before-check rule only binds when a check
  will run, and none runs against an unshipped, uncited source. I judged
  this permissible; a stricter format could plausibly require more.
- **How much of "the tool" ERF-70 wants named for a layered dependency.**
  Named both `pymupdf4llm 0.3.4` and the `PyMuPDF 1.28.2` it wraps, since
  the latter's own text-extraction behavior can move the former's output.
  The spec doesn't say whether that's over-disclosure or exactly right.

## What I wanted that the spec did not give me

- **An example corpus to check my directory layout against.** The prompt
  for this exercise deliberately withheld one (a stated purity boundary,
  not an oversight on my part), and section 8 explicitly declines to
  mandate a substrate -- so this is a "want," logged as the task asked,
  not a defect. I would have liked to see one worked multi-record corpus
  laid out on disk, the way section 4's YAML snippets show one record each,
  to check a layout choice like mine (`atoms/`, `claims/`, `surveys/`,
  `captures/`, plus a `narrative/` held apart) against precedent rather
  than against my own reading of ERF-53, ERF-59, and ERF-62 alone.
- **A stated position on whether a narrative may be LLM-drafted at all
  under operator direction.** This is the one place the spec's own
  descriptive framing ("authored by a person and never generated," section
  4.6's lead-in, non-binding per section 4's own preamble) sits in real
  tension with how the operating environment's own practice actually works
  (a house rule there: the agent drafts, the operator gates and owns).
  The spec gets to choose either stance -- narratives are strictly
  human-typed, full stop; or narratives may be LLM-drafted under an
  operator's name, the way that environment already treats every other
  deliverable -- but section 4.6 currently reads as having picked the
  first stance in its prose while leaving it non-normative, which is the
  worst of both: strong enough to notice, not strong enough to bind. I
  wrote the narrative anyway (see friction-log.md for the attribution
  choice I made), because the task needed the binding machinery exercised,
  but a future revision of this spec should probably pick a lane. If ERF-34
  is only ever read together with the record-vs-document distinction it is
  making a different point ("a narrative is not adjudicated the way a
  record is, because a person, not a protocol, disputes it"), and the
  authorship line is scene-setting rather than a rule about who may hold
  the pen. But the prose does not disambiguate that for a reader
  encountering it cold, which is the position this exercise deliberately
  put me in.

## One process note

Every atom quote in this corpus (all nine) was checked with a from-scratch
implementation of ERF-51/52 before being finalized, against the actual
capture files shipped in `corpus/captures/`. That script lives at
`_dl/normalize.py` in this working tree and is not part of the shipped
corpus -- it is scratch tooling, not a conformance artifact, and I have not
tried to make it a general-purpose validator. It exists because the task
was explicit that this is the one thing that cannot be faked from memory,
and I wanted every quote in the corpus to be something I had actually
verified, not something that merely looked right.
