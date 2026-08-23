# erf-view

The reference consumer: renders an ERF corpus as a static site.

```
cd viewer
npm install
npx tsx erf-view.ts ../examples/corpus -o ../examples/site
```

Output is self-contained HTML. Inline CSS, no scripts, no external requests,
so it opens from disk and hosts anywhere.

## Why TypeScript

The specification names `types/erf.ts` as the normative data model, and this
tool imports it directly. That import is the point. A reader written in
another language would be a parallel reimplementation that could drift from
the model silently; this one stops compiling when the model changes, so the
demonstration and the specification cannot disagree without somebody noticing.

`npx tsc --noEmit` type-checks the viewer and the normative model together
under `strict`.

## Dependencies

One runtime dependency, `js-yaml`, for the frontmatter. Development
dependencies are `tsx` to run TypeScript directly, `typescript` for the
type check, and the two `@types` packages.

## What it computes, and from where

Every derived reading is computed at render time from the records, and
nothing is written back. Each is implemented from the specification text
rather than from any existing tooling, which is what makes the tool a test
of whether the rules are implementable as written.

| Reading | Rule |
|:--|:--|
| Disposition, with an explanation | `ERF-6.5` |
| Whether a reader can resolve a claim's backing | the viewer's own choice |
| The mechanical quote check | `ERF-6.12` |
| Stale verdicts | `ERF-6.10` |
| The unbacked warning | `ERF-6.11` |
| References that do not resolve | `ERF-6.1` |

## One thing the specification does not define

`ERF-6.12` requires that "the normalized quote occurs in the capture" but
does not define the normalization. This tool applies Unicode NFKC, collapses
whitespace, folds typographic quotes and dashes to ASCII, lowercases, and
treats the `[...]` elision marker of `ERF-4.5` as a wildcard between
segments. That is one defensible reading and not a conformance target: two
conforming tools could disagree about the same quote today, which is a gap
worth closing in the specification rather than in this file.

## Views

- **Index** what the corpus holds, and every record by type
- **Narrative** the prose, with bound passages marked and linked to claims
- **Claim** disposition and why it computes that way, evidence for and
  against, coverage, relations, and the standings ledger
- **Atom** finding, quote, citation, quality, limitations, verdicts, and
  every claim that leans on it
- **Capture** the captured copy with the quote highlighted, or an honest
  statement of why the check cannot run here
- **Health** claims with no evidence, uncited atoms, unaudited atoms, failed
  and unrunnable quote checks, dangling references, and records that diverge
  from the normative model

One reading in that table is not a rule of the format. Showing whether a
reader can resolve a claim's backing was `ERF-6.8a` until 2026-08-23,
when it was retired: v1 says nothing about how a claim is presented to
someone without the sources. The viewer keeps doing it because it is the
honest thing for a reader to see, which makes it a demonstration of a
consumer choosing to show more than the specification asks.
