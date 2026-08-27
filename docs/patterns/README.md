---
title: "Patterns"
purpose: "Ways of working with the format that the specification deliberately does not require: each names a problem, the records it uses, the conventions it adds on top, and the tooling that supports it."
status: non-normative
last_updated: 2026-08-27
---

# Patterns

The specification says what a record is and what a validator checks. It says nothing about how a person and an LLM should work to produce records, in what order, or what documents sit around them. Those are patterns: practices that use the format, extracted from doing the work, and offered because a newcomer has to start somewhere.

A pattern is not a requirement. Two corpora can follow different patterns and both conform. A pattern that turns out to be the only sensible way to do something is a candidate for the specification, and the route there is a finding (`CONTRIBUTING.md`), not an edit to the pattern.

Each pattern states: the problem it answers, the records it uses (nothing outside the specification), the conventions it adds (files, fields in the `x_` namespace, orderings, gestures), and the tooling that supports it in this repository.

| Pattern | Problem |
|---|---|
| [`narrative-backing-loop.md`](narrative-backing-loop.md) | A document exists, or is being written, and its assertions need to become claims with evidence and positions, and stay tied to the prose as both change. |
| [`claims-tree.md`](claims-tree.md) | An argument has many claims; a reader needs one ordered, numbered view of it, and the author needs to cut that view from the graph rather than maintain it by hand. |

Patterns that exist in practice and are not yet written up here: the research log and surveys compiled from it; the search for the opposite as a step every observation goes through; the standing watch (a survey re-run on cadence so absence claims age visibly); the venture-design specialization (a corpus of one author's own design, where `commitment` is the ordinary backing).
