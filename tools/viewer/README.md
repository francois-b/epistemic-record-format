# erf-view

The reference consumer: renders an ERF corpus as a static site.

```
cd tools/viewer
npm install
npx tsx erf-view.ts ../../examples/corpora/minimal -o ../../examples/site
```

Everything this renders is computed by the reference validator in
[`validator/yaml-markdown/typescript/`](../../validator/yaml-markdown/typescript/) (`corpus.ts` loads, `compute.ts` derives,
`erf-check.ts` is the command line); this folder holds only the rendering.

Output is self-contained HTML. Inline CSS, no scripts, no external requests,
so it opens from disk and hosts anywhere.

## Why TypeScript

The normative data model is [`erf.schema.json`](../../schema/erf.schema.json), a JSON
Schema 2020-12 document (`SPEC.md` section 3). `schema/erf.ts` (generated from the schema) is a
TypeScript rendering of that schema for this implementation, held to it by a
gate and normative for nothing. This tool uses both, at two levels: it
imports the types, so a change to the model stops it compiling rather than
letting the demonstration drift from the specification in silence, and it
validates every document it reads against the schema itself at load time, so
a divergence the types cannot express is reported at the field
(`ERF-73`). The type check alone was not enough: until 2026-08-25 the loader
compared against a hand-kept field roster, and a source list carrying a
quoted `'on'` key in place of `timestamp` loaded clean here and was caught
by somebody else's validator.

`npx tsc --noEmit` type-checks the viewer and the type rendering together
under `strict`.

## Dependencies

The validator's, resolved from `validator/yaml-markdown/typescript/node_modules`: `js-yaml` for the
frontmatter, `ajv` for the schema, and `commonmark` for the render step
`ERF-51` opens with. This folder's own development
dependencies are `tsx` to run TypeScript directly, `typescript` for the type
check, and the `@types` packages.

## What it computes, and from where

Every derived reading is computed at render time from the records, and
nothing is written back. Each is implemented from the specification text
rather than from any existing tooling, which is what makes the tool a test
of whether the rules are implementable as written.

| Reading | Rule |
|:--|:--|
| Disposition, with an explanation | `ERF-41` |
| Whether a reader can resolve a claim's backing | the viewer's own choice |
| The mechanical quote check | `ERF-50`, `ERF-51`, `ERF-52` |
| Stale finding verdicts, stale backing verdicts, stale narrative bindings | `ERF-47`, `ERF-32` |
| The unbacked reading, and whether anyone stands on it anyway | `SPEC.md` section 2, *unbacked* |
| References that do not resolve | `ERF-35` |
| Evidence a standing faced that the corpus no longer holds | `ERF-35`, flagged |
| Arguments resting on a premise its holders withdrew | `ERF-43`, flagged |
| Anchors that no longer occur in their passage | `ERF-31`, flagged |
| Two standings by one person at one instant | `ERF-41`, flagged |
| Retrievals with no date | `ERF-2`, flagged |
| Files it did not recognize, and content from a newer minor | `ERF-57`, `ERF-60` |

## Normalization is the specification's, exactly

An earlier version of this file reported that the specification did not
define the quote-check normalization, and this tool improvised one (it
even lowercased, which the specification now forbids). That gap is closed:
`ERF-51` defines the ordered sequence, unwrapping steps included, this
tool implements it verbatim in `compute.ts`, and the conformance suite's
case files are normative for its exact behavior. `[...]` elision handling
is `ERF-52`, split before normalizing.

## Views

- **Index** the corpus declaration read out in full, what the corpus holds,
  and every record by type
- **Narrative** the prose, with bound passages marked, linked to their
  claims, and carrying the binding's staleness where it is not current
- **Claim** disposition and why it computes that way, evidence for and
  against, coverage, relations (including conflicts declared on the other
  side of the pair), and the standings ledger
- **Atom** finding, quote, the quote check's own verdict, citation, quality,
  limitations, audit verdicts, every claim that leans on it, and the source
  entry with its status, licence, retrieval date and pipeline tools
- **Capture** the source's normalized text with the quote highlighted, or an
  honest statement of why the check cannot run here
- **Sources** every work the corpus quotes, split by whether its text
  travels, each with the citation, the locator, the licence judgment, the
  digests, and the atoms that quote it
- **Health** claims with no evidence, uncited atoms, unaudited atoms, failed
  and unrunnable quote checks, dangling references, every computed flag, and
  records that diverge from the normative model

`--link "Label=href"` adds an entry to every page's topbar, which is how a
render dropped under a larger site points back at it. The viewer is told
where it was published; it never guesses.

One reading in that table is not a rule of the format. Showing whether a
reader can resolve a claim's backing was a numbered requirement until 2026-08-23,
when it was retired: v1 says nothing about how a claim is presented to
someone without the sources. The viewer keeps doing it because it is the
honest thing for a reader to see, which makes it a demonstration of a
consumer choosing to show more than the specification asks.
