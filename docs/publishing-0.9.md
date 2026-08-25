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

**1. There is no licence.** No `LICENSE` file exists, so the default is all
rights reserved and nobody may legally implement the specification. This is
the only item here that is purely a decision.

Recommended: **CC BY 4.0** for the prose (`SPEC.md`, `README.md`, `docs/`,
`examples/`, `reviews/`) and **Apache-2.0** for the code (`viewer/`,
`tools/`, `types/`, `conformance/`). CC BY is the ordinary choice for a
specification that wants implementations and requires only attribution.
Apache-2.0 over MIT for the code because it carries an explicit patent
grant, which matters when the code is a reference implementation someone
will copy from. Two files, `LICENSE` and `LICENSE-CODE`, with `README.md`
saying which covers what.

**2. `F-003` is a demonstrated interoperability break and is unruled.**
`ERF-3` never says whether source entries sit under a `sources:` key or
alongside `type` at the top level. Both readings are live against the
current prose, the Rust implementation took the second, and the result was
151 atoms reported as naming sources that exist. This is the one open
finding that would make a second implementer's work fail against the
author's, which is precisely what a published format must not do. One
sentence fixes it. Run it through the three gates and rule it.

**3. The changelog has no released section.** Everything sits under
`## Unreleased`. Publishing means cutting `## 0.9.0 — 2026-08-__` and
stating the version discipline the format is committing to from here:
requirement ids stable, retired ids never reused, insertions append.

**4. There is no git remote.** The repository has never been pushed. The
author creates the public repository and pushes; nothing in this repository
does that on its own.

## Worth doing first, cheaply

**The spec-to-types gate (`F-005`).** Nothing checks that `SPEC.md` and
`types/erf.ts` name the same fields, and they disagreed for a day: the
source rename reached the model, the loader, the viewer and the fixtures and
stopped short of the specification. A check that every field named in one
appears in the other is about a dozen lines. Two of the five findings raised
today are this same class, which is the argument for the gate rather than
for more care.

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

## Sequence

1. Rule `F-003` through the three gates; one sentence into `ERF-3`.
2. Choose the licence; add `LICENSE` and `LICENSE-CODE`; say so in the README.
3. Add the spec-to-types gate; settle `F-004`; normalize the example actor ids.
4. Rewrite the README's Status section around what the trials found (see below).
5. Cut `## 0.9.0` in the changelog with the date.
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
