---
title: A note on what the schema forced
corpus: relational-trial
created: {timestamp: "2026-08-24", by: "human:trial-operator"}
---
# A note on what the schema forced

Writing the format out as tables separated two kinds of rule that the prose
runs together. One kind describes an acceptable value and survives as a check
on a column. The other describes an acceptable change, and there is nothing
for a check to look at, because the previous version of the row is gone by the
time the check runs.
<!-- claims: constraints-cannot-see-transitions "there is nothing for a check to look at" bound-at=2026-08-24 -->

The uniqueness rules went the other way. Expressed as keys they became so
strong that the corpus they forbid can no longer be loaded, which is not what
a validator is for.
<!-- claims: keys-swallow-the-violations-they-enforce "no longer be loaded" bound-at=2026-08-24 -->

A third passage binds a claim that does not exist in this corpus, so that a
consumer has something to report rather than something to drop.
<!-- claims: no-such-claim-in-this-corpus "something to report rather than something to drop" bound-at=2026-08-24 -->
