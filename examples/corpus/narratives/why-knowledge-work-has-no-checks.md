---
title: "Why knowledge work has no checks"
type: narrative
corpus: erf-example
created: {timestamp: 2026-08-23, by: "agent/claude-fable-5"}
---

# Why knowledge work has no checks

A short walk through this corpus. Every assertion below ends with a
binding: an HTML comment naming the claim the passage rests on, invisible
in any render, and how software finds the spot again after the prose is
edited. Open any claim to see what it rests on, who has stood behind it,
and what remains unchecked.

## The complaint arrives in three vocabularies

Within about a year, three communities independently coined names for the
same set of problems: production outrunning verification, reviewers
becoming the bottleneck, and context degrading as documents grow. None of
the three cites the others, and none connects the complaint to the
governance traditions that have handled it before.
<!-- claims: three-vocabularies-zero-synthesis "three communities independently coined names" bound-at=2026-08-23 -->

Underneath the naming, the practical situation is unglamorous. Outside the
reference infrastructure they buy, individual professionals have no
compounding store of their own work product. Arguments, analyses, and
hard-won knowledge accumulate in mail, in drafts, and in memory, and each
new matter starts closer to zero than it should.
<!-- claims: lawyers-lack-personal-compounding-km "no compounding store of their own work product" bound-at=2026-08-23 -->

## Why the discipline never grew

The tempting explanation is cultural: that knowledge workers are careless
where engineers are rigorous. The better explanation is mechanical.
Engineering disciplines institutionalized around primitives that made each
practice cheap to perform and hard to fake. The diff made a change
reviewable as a delta. The test runner made correctness machine-checkable.
The parser made style enforceable without an argument. Each discipline is a
social practice wrapped around a primitive, and knowledge work never grew
the equivalent practices because it never grew the equivalent primitives.
<!-- claims: discipline-needs-primitives "wrapped around a primitive" bound-at=2026-08-23 -->

That claim is an argument rather than an observation, which in this format
means something specific: it owes reasoning rather than evidence, and what
checks it is the structure of what it rests on. Its edges are visible on
its own page.

## What the tooling actually does

It would be reasonable to assume that the checking primitive already
exists, since the underlying mechanism is mature and inexpensive. Systems
that decide whether a statement follows from a retrieved passage ship
today, in several products, at low cost per call. But every shipped
implementation runs once: per answer, per request, or on demand when
somebody opens a review. None of them runs as a standing check over a
document that keeps growing.
<!-- claims: no-continuous-claim-check "runs as a standing check over a document" bound-at=2026-08-23 -->

That is a universal negative, and universal negatives are the hardest
statements to back. An atom can only ever say what some source did say, so
no pile of atoms establishes that a thing does not exist. This corpus backs
it with a survey instead: a record of what was searched, with what
instrument, yielding what, and stating what the search did not cover. The
absence rests on the coverage, and the coverage is written down where it
can be argued with.

## A worked case of infrastructure disagreeing with itself

For a century, the legal profession has bought exactly the kind of
verification infrastructure this corpus says is missing elsewhere: staffed,
expensive citation systems that mark whether a case still stands. Measured
against each other, they disagree substantially, and the vendor defense
when the disagreement was published was that no objectively correct
interpretation exists.
<!-- claims: citators-disagree-on-negative-treatment "disagree substantially" bound-at=2026-08-23 -->

The point is not that the citators are bad. It is that a mature, staffed,
well-funded verification apparatus, measured, turns out to disagree with
itself at rates its marketing does not mention, and that nobody knew this
until somebody counted. Counting is the whole idea.

## The primitive that did get standardized

Provenance, meanwhile, was standardized a decade ago and is not in dispute.
The W3C model describes a thing's history as entities, activities, and
agents, and defines attribution as ascribing an entity to an agent.
<!-- claims: prov-models-entities-activities-agents "entities, activities, and agents" bound-at=2026-08-23 -->

Read those definitions and notice what they are about: who did what to a
thing, and who is answerable for it. None of them is about whether a
statement follows from the source it cites. That is the gap this corpus
occupies, and it is worth being careful about how the point is made. The
claim above says only what the standard does say, because quoting a
document establishes its contents and never its omissions. A statement
about what a body of work lacks wants a survey, which is why the universal
negative earlier in this walk rests on one.

## What this corpus can and cannot show you

None of the claims above is active. Every one computes to `proposal`,
because nobody has yet stood behind any of them in the ledger, and the
format will not infer a position from the quality of the evidence.

The quote check runs for four atoms and not for the rest. The four are
excerpts from W3C Recommendations, whose licence permits redistribution, so
their captured copies travel with this repository and you can watch a quote
match its source character for character. The others cite journal articles
and vendor documentation that cannot be republished here, so their captures
stayed behind. The viewer says which is which on every page rather than
letting a checkable claim and an uncheckable one look the same, and that
contrast is deliberate: it is what the format looks like in the ordinary
case, where some of your evidence travels and some of it does not.
