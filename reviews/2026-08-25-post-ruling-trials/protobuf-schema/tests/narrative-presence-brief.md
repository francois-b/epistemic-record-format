---
type: narrative
title: "What a wire format can and cannot promise about an absent field"
corpus: proto-trial
created: {timestamp: "2026-08-24", by: "human:francois"}
---
# What a wire format can and cannot promise about an absent field

A record format that treats absence as an assertion is making a demand of every
serialization it will ever travel through. The demand is not that the format be
compact, and it is not that it be typed. It is that a reader can tell a field
that was never written from a field written empty.

<!-- claims: proto3-destroys-evidence-at-stance "absence as an assertion" bound-at=2026-08-24 -->

Most wire formats do not make that promise by default, and the ones that offer
it offer it as an opt-in a schema author must remember to take. A schema author
who forgets does not get an error. They get a corpus in which two different
facts have become one.

<!-- claims: presence-is-data citation-round-trip "two different facts have become one" bound-at=2026-08-24 -->

The passage below carries an anchor whose own words are in quotation marks,
which is the case ERF-31's escapes exist for: a grammar that cannot express a
legal value is a defect in the grammar.

<!-- claims: presence-is-data "the case ERF-31's \"escapes\" exist for" bound-at=2026-08-24 -->

And this last binding is MALFORMED on purpose: it names claims and gives an
anchor but omits `bound-at`, which the grammar makes mandatory. ERF-31 requires
that it be reported rather than skipped, because a comment failing the grammar
is otherwise indistinguishable from any other HTML comment and the claims it
named simply vanish from the narrative.

<!-- claims: presence-is-data "reported rather than skipped" -->

<!-- An ordinary HTML comment, not a narrative binding: it does not open with
     claims: and must not be recognized as one. -->
