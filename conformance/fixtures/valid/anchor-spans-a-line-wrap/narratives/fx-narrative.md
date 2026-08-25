---
type: narrative
title: "A paragraph wrapped at seventy-two columns"
corpus: fixture-anchor-line-wrap
created: {timestamp: 2026-08-25, by: "human:conformance-fixture"}
---

The ledger and the count were taken on different days, and the recorded
total is seventeen units on both of them, which is the only reason the
reconciliation closes at all.

<!-- claims: fx-claim "the recorded total is seventeen units on both of them" bound-at=2026-08-25 -->

The anchor above spans the newline between the first and second lines of
that paragraph. Under `ERF-51` the newline is a collapsed whitespace run
on both sides of the comparison, so the anchor occurs. Nothing reflowed
anything: the fold that already exists for the quote check is enough.
