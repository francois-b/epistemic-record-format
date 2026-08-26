---
title: "Publishing 0.9"
purpose: "What stands between the repository as it is and a public draft, separated into what blocks and what does not."
status: non-normative
last_updated: 2026-08-25
---

# Publishing 0.9

0.9 is a **draft published to be implemented against and argued with**, not
a finished standard. That framing decides most of what follows: a known
defect with a written-down ruling is fine to ship, and a known defect that
makes two implementations silently disagree is not.

## Blocking

Three of the four are done, kept here with what was decided: a list that
deletes what it settled stops being a record of the decision.

**1. ~~There is no licence.~~ Done 2026-08-25.** CC BY 4.0 for the prose,
Apache-2.0 for the code, canonical texts fetched rather than reproduced,
each under a header naming the paths it covers. `README.md` says which is
which, that an implementation is not a derivative work of the
specification, and that nothing reaches the corpora anyone builds.

**2. ~~`F-003` is unruled.~~ Done 2026-08-25.** `ERF-3`'s top level is now
exactly `type` and `sources`, with a worked example. Three gates, three
hands, none of them the raiser's. The observation's second half, about a
validator cascading rather than reporting the file it could not read, was
split out as `F-006` rather than folded in.

**3. ~~The changelog has no released section.~~ Done 2026-08-25.** Cut as
`## 0.9.0 — 2026-08-25`, with the version discipline stated from here on and
the two numbers a reader should have: sixty-six requirements with seven
uncovered, and sixteen open backlog entries. Everything since the `type`
widening was unlogged and now has an entry.

**4. There is no git remote.** The repository has never been pushed. The
author creates the public repository and pushes; nothing in this repository
does that on its own.

## Worth doing first, cheaply

**~~The spec-to-types gate (`F-005`).~~ Done 2026-08-25.**
`tools/lint-field-names.py` checks that every field declared in a normative
interface is named in `SPEC.md`, and was verified against the defect it
exists for. It also surfaced that neither linter ran anywhere: both are now
invoked by the conformance suite, so one command is the gate.

**`F-004`, the capture header.** Every normalized-text file in both authored
corpora opens with YAML frontmatter the format never specifies, five of them
do not parse, and the header sits inside the text quotes are folded against.
Either the format specifies the file or it says a capture is the normalized
text and nothing else. Shipping example corpora that do something the
specification does not describe teaches the wrong thing.

**Actor ids in the examples are inconsistent.** `human:francois`,
`human:fbouet` and `human:francois-bouet` all appear for one person across
the example and trial corpora. Harmless mechanically, but a reader learning
the actor grammar from the examples learns three answers. Related to `B-37`,
which is open at P2.

## Not blocking, and shipping with it is correct

**Sixteen open backlog entries** (eight P2, eight P3) plus twelve
trigger-driven. A published backlog with a stated priority and a
verification record on each entry is a reason to trust the specification,
not a reason to delay it. It says what is known to be unresolved, which is
the thing most drafts hide.

**Seven uncovered requirements.** `ERF-26`, `ERF-27`, `ERF-28`, `ERF-68`
through `ERF-71` have no conformance fixture. The coverage line already
prints this on every run. Disclose it in the README; do not paper it.

**A fresh cold-implementation trial.** The Python, Rust and SQL
implementations now test a specification that no longer exists: every
disagreement they report traces to a ruling made after they were built.
Re-running them on the current prose is the strongest instrument this
project has, and it is the **1.0** gate, not the 0.9 gate. 0.9 exists so
that other people's implementations become that evidence.

## Bindings, added 2026-08-25

Ruled after the post-ruling trials: the model is separate from its wire.
`SPEC.md` section 7 now says what every binding must satisfy, `ERF-53`
defines loss against the model instance, and the YAML/Markdown rules moved
to `bindings/yaml-markdown.md` keeping their ids. Eighteen mixed
requirements are listed there for splitting in 0.10, when the model becomes
a JSON Schema and a SQL binding is drafted from the relational trial.

## Sequence

1. ~~Rule `F-003`.~~ Done.
2. ~~Choose the licence.~~ Done.
3. Add the spec-to-types gate; settle `F-004`; normalize the example actor ids.
4. Rewrite the README's Status section around what the trials found (see below).
5. ~~Cut `## 0.9.0` in the changelog.~~ Done.
6. Tag `v0.9.0`. Create the public repository. Push.

## One note on the Status section

It currently says the specification is "complete and internally verified."
That was true when written and is now understating the case. Six
independent trials ran against `SPEC.md` alone on 2026-08-25, three of them
building working implementations in three languages by hand from the prose,
and they found defects in the reference implementation within the hour. The
honest and stronger claim names that: what was tried, what it found, what
was fixed, and what is still open. A draft that publishes its own adversarial
review is making a different and better argument than one that asserts it is
verified.
