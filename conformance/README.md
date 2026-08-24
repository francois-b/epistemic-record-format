# Conformance suite

What this specification claims, checked against an implementation.

```
npx tsx conformance/run.ts     # or: cd conformance && npm test
```

The runner executes every case and then prints a coverage line:

```
65 requirements: 41 covered, 18 untestable by design, 6 uncovered
```

(The numbers move as the specification and the suite do; the line above is
what a run printed on 2026-08-24, not a promise.)

## Why it exists

Every check built for this format was, until now, run once. A check run once
is an audit; a check run every time is a gate. The difference is not
academic: a specification change made on one afternoon left the narrative
binding grammar implemented twice, the parser gained a field and the
renderer's copy did not, and six raw HTML comments leaked into a published
page. The types compiled. The lint passed. The site generated. Nothing that
existed at the time could see it, because nothing read the output.

The second reason matters more. A format is only a format if somebody else
can implement it. These cases are the thing a second implementer clones and
runs against their own code without asking the author anything. If they
cannot, this is one person's tooling with a specification attached.

## A failing test is a finding

**Do not edit an expectation to make a test pass.** If a case fails, either
the implementation is wrong, or the case is wrong, and deciding which is the
work. A suite whose author adjusted the expectations until it was green
proves only that the author is persistent.

When a case is genuinely wrong, fix it and say why in the commit. Two cases
in this suite were wrong on the first run and were corrected: one asserted a
CSS class the renderer never used. Correcting it surfaced a real defect that
the wrong assertion had been hiding.

## Layout

```
conformance/
  run.ts               the runner: executes the suites, then reports coverage
  coverage.yaml        requirement -> the tests that defend it, or why none can
  paths.ts             shared locations
  cases/
    normalization.txt  ERF-51, raw/expected pairs, one per line
    quote-check.yaml   ERF-50, ERF-52, quote + capture + expected verdict
    disposition/*.yaml ERF-41, standings + expected reading, one case per file
  fixtures/
    valid/             corpora that must load with no finding
    invalid/           corpora that must be rejected, each with expect.yaml
  suites/*.test.ts     the assertions, by requirement group; hygiene.test.ts
                       also validates the shipped examples and greps the
                       repository for pre-flatten requirement ids
```

The case files under `cases/` are normative for the normalization and
quote-check behavior (`ERF-51`): where a reading of the specification's
prose and a case disagree, the case governs.

`cases/` holds data, `suites/` holds assertions. The split is deliberate:
the case files are the part another implementation can consume directly,
in any language, without running this TypeScript.

## Adding a case

**A normalization case** is one line in `cases/normalization.txt`: the raw
text, a tab, the expected output. `\n` means a newline. Say which step it
exercises in a comment above it.

**A disposition case** is one file in `cases/disposition/`, naming the
requirement, the standings, and the expected reading. Add one whenever a
branch changes: the two cases recording that unanimous opposition reads as
`rejected`, and that a withdrawal is exit rather than disagreement, both
describe behaviour that was wrong until 2026-08-23 and would otherwise be
free to regress.

**A quote-check case** is an entry in `cases/quote-check.yaml`.

**A record fixture** is a directory under `fixtures/`. An invalid one MUST
carry `expect.yaml` naming the requirement that must reject it, because
asserting the right rule fired is what distinguishes a validator that is
correct from one that is lucky.

**An output assertion** goes in `suites/output.test.ts`. Reach for one
whenever a requirement constrains what a reader sees rather than what a file
contains; that category is invisible to every other kind of check here.

Then add the requirement to `coverage.yaml`, or the coverage test fails. A
requirement with no row is a hole in the map, and a map with holes reports a
number that flatters.

## The three states in coverage.yaml

`tests` means one or more cases assert the requirement.

`untestable-by-design` means it constrains authoring judgment no tool can
reach: whether a finding states what its quote shows, whether a title states
its claim, which of two inputs governs a source's grade. Eighteen
requirements are in this state, and saying so plainly is more honest than
padding the covered count with tests that assert nothing.

`uncovered` means it should be tested and is not. That list is a to-do
against this suite, not a gap in the format, and it is printed on every run
so it cannot quietly grow.

## Dependencies

TypeScript, run by `tsx` under Node's built-in test runner, matching the
reference viewer so the suite adds no toolchain of its own. `js-yaml` reads
the case files. `node_modules` is a symlink to the viewer's, so the suite
runs in this repository without a second install; a fresh clone can instead
run `npm install` here against the `package.json` in this directory.
