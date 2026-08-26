---
id: B-60
kind: defect
status: closed
priority: closed
priority_because: "The rule as written forces a cost the format never chose (hold sixteen pages to quote two sentences), and two corpora have paid it. Widening ERF-69 to a sequence of passages is non-breaking, since a single-passage excerpt still satisfies it, and is cheapest before anyone builds a fidelity checker to the current sentence."
basis: demonstrated
raised: "F-019, the top-down essay corpus trial, 2026-08-25 (the excerpt tool was rewritten to accept exactly one range; one source holds 8 KB for two paragraphs); second demonstration in the Bitter Lesson trial, 2026-08-26, friction-log entry F-02 (Deep Blue's figure taken from Wikipedia rather than the paper, a high atom downgraded to low for no epistemic reason)"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-019; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-60 · An excerpt is one contiguous passage, and `ERF-69` never says so

`ERF-69` (a normalized text may be an excerpt) permits an excerpt and then
requires that "the normalized text MUST occur, under the folding of
`ERF-51`, in the normalization of the whole extracted source". Two
passages from different parts of a work occur nowhere as one string. So
an excerpt is, silently, one contiguous span; the schema's `SourceList`
keys one entry per work, so a second entry over the same work is not the
way out; and a reader wanting page 5 and page 21 holds everything
between.

The requirement's own rationale says the excerpt route exists "because
the format needs verifiability and not republication". The contiguity it
imposes without stating works against that: the honest excerpt of a paper
is often two or three sentences far apart, and the rule makes the author
choose between holding the whole stretch and not quoting the best
sentence.

## Proposed resolution

Either say it (an excerpt is one contiguous passage, and here is why), or
define fidelity per passage: an excerpt MAY be a sequence of passages,
each of which occurs in the normalization of the whole extracted source,
in order, with the boundary between passages marked in the normalized
text so that no quote can span two. The paragraph separator `ERF-51`
already inserts between leaf blocks is the natural boundary, and `ERF-52`
already forbids a span from crossing one.

Related: `B-64` (the status vocabulary has no slot for a full text held for
checking), which this would relieve without settling.

## Resolution

Ruled by the operator 2026-08-26, ahead of 0.9.0: `ERF-69` now says an excerpt MAY be a sequence of passages, each contiguous in the work, in the work's order, separated in the normalized text by a paragraph consisting only of `[...]`; fidelity is checked per passage. Fixtures `valid/excerpt-in-passages` and `invalid/quote-crosses-an-excerpt-gap`.
