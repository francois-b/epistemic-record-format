---
type: narrative
title: "Why we hold the text"
corpus: ledger-discipline
created: {timestamp: "2026-08-23", by: "human:fb"}
---
# Why we hold the text

The rule that every entry is made twice is not a modern invention. It is
stated flatly in a 1494 treatise, in a sentence a reader can check today
because somebody kept the text.
<!-- claims: every-entry-is-made-twice "not a modern invention" bound-at=2026-08-23 -->

What that rule buys is narrower than it sounds. The trial balance is a
control: it tells you the two sides agree, and it tells you nothing about
whether either side is true. Read it as a proof and you will trust a set of
books that two compensating errors have quietly balanced.
<!-- claims: trial-balance-is-a-control ledger-parity-detects-error
     "two compensating errors have quietly balanced" bound-at=2026-08-23 -->

The same asymmetry is why this corpus keeps normalized texts rather than
links. A link tells you the page is still there. It does not tell you the
page still says what you quoted, and no amount of link-checking closes that
gap.

An ordinary comment, which is not a candidate: <!-- a note to the editor -->

A code span mentioning the marker, which the scan must not swallow:
`<!-- claims: not-a-real-binding "x" bound-at=2026-01-01 -->`

And a fenced block, likewise:

```
<!-- claims: also-not-a-binding "y" bound-at=2026-01-01 -->
```
