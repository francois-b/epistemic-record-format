---
type: narrative
title: "Passage edges"
corpus: narrative
created: {timestamp: "2026-08-01", by: "human:francois"}
---
CASE A, the first binding: the passage runs from the start of the body to
this marker, so an anchor lifted from this opening paragraph must match.
<!-- claims: c1 "an anchor lifted from this opening paragraph" bound-at=2026-08-01 -->
<!-- claims: c2 "an anchor lifted from this opening paragraph" bound-at=2026-08-01 -->

CASE B is the binding directly above: two bindings with nothing between
them, so its passage is the empty string and no non-empty anchor can occur
in it.

<!-- claims: c3 "no non-empty anchor can occur in it" bound-at=2026-08-01 -->

CASE C, an empty anchor, which the grammar admits: `anchor ::= '"' char* '"'`
with `char*` matching nothing.

<!-- claims: c3 "" bound-at=2026-08-01 -->

CASE D, a malformed candidate. It opens an HTML comment and then the word
claims with a colon, so it IS a narrative binding and must be reported, never
skipped. The question the spec does not answer is whether it closes the
passage above it.

<!-- claims: c1 c2 bound-at=2026-08-01 -->

CASE E, the passage after the malformed candidate. Under reading (i) the
passage starts at the malformed marker; under reading (ii) it starts back at
CASE C's marker. The anchor below occurs only in CASE D's own paragraph, so
the two readings give opposite verdicts on it.

<!-- claims: c1 "and must be reported, never skipped" bound-at=2026-08-01 -->

CASE F, an ordinary HTML comment, which is not a candidate and must not
delimit anything. <!-- an ordinary note --> The anchor below sits before it.

<!-- claims: c2 "CASE F, an ordinary HTML comment" bound-at=2026-08-01 -->

CASE G, an anchor carrying both escapes: the passage says he called it
"unfinished\work" in as many words.

<!-- claims: c4 "he called it \"unfinished\\work\" in as many words" bound-at=2026-08-01 -->

CASE H, an anchor that spans a hard line wrap in the source prose, which
CommonMark reads as a space and ERF-51 collapses.

<!-- claims: c4 "a hard line wrap in the source prose, which CommonMark reads" bound-at=2026-08-01 -->

CASE I, an id that resolves to nothing, and an id that resolves to a survey
rather than to a claim.

<!-- claims: no-such-claim s-2026-08-01 "an id that resolves to nothing" bound-at=2026-08-01 -->

CASE O, a code span holding a comment opener. In CommonMark the sequence
inside backticks here, `<!--`, is a code span and not an HTML comment at all;
a recognizer that scans raw text instead of a CommonMark tree treats it as an
unterminated comment and swallows the next real binding whole. The binding
below is the one that gets swallowed.

<!-- claims: c4 "the one that gets swallowed" bound-at=2026-08-01 -->

CASE J, a bound-at that matches the grammar but is not a calendar date.

<!-- claims: c1 "not a calendar date" bound-at=2026-13-45 -->

CASE K, staleness: the claim was modified after the binding was made.

<!-- claims: c-moved "the claim was modified after the binding was made" bound-at=2026-08-01 -->

CASE N, indeterminate staleness: the claim carries a full instant on the same
day as bound-at, so the coarser stamp cannot order them.

<!-- claims: c-sameday "the coarser stamp cannot order them" bound-at=2026-08-01 -->

CASE L, an unterminated candidate, which has no `-->` at all and therefore no
end. Everything after it is inside it.

<!-- claims: c1 "an unterminated candidate" bound-at=2026-08-01

CASE M, trailing prose after the last binding. It belongs to no passage.
