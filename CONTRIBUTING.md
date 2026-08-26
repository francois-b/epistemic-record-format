# Contributing

This page routes and does not repeat: each destination states its own rules.

## You found a defect or an ambiguity in the specification

Open an issue with the **spec bug** or the **clarification** template. It
lands in [`docs/findings/`](docs/findings/) as an *observation*, which is not
yet a claim about the specification, and it passes three gates before it may
change the document: **raised** (you noticed it), **specified** (a second hand
determines what is being claimed, and about which requirement), **verified** (a
third hand checks that claim against the specification as it stands now). Only
a finding verified `accurate` becomes a backlog entry. Why three hands rather
than one is in [`docs/findings/README.md`](docs/findings/README.md).

The templates ask for gate 1 and nothing else. A raiser is deliberately not
asked to propose a fix, because one who does tends to describe the problem in
the shape of that fix.

## You want the format to do something it does not do yet

That is the backlog, [`docs/backlog/README.md`](docs/backlog/README.md), and a
proposal reaches it the same way, through `docs/findings/`. Two things the
queue asks for are easy to miss. A **basis**: `demonstrated` (an artifact
exists and can be re-run), `reported` (a careful reader judged it and nothing
failed), or `anticipated`, the weakest there is. And, for a capability, a
**trigger**: the event that would revive it, which is also its prioritization,
since capabilities are neither scheduled nor ranked. A field earns its place
by a demonstrated need rather than by symmetry.

## You built an implementation

Add a row to [`IMPLEMENTATIONS.md`](IMPLEMENTATIONS.md): name, language, the
specification version you built against, which conformance classes you claim
(Record, Corpus, Producer, Consumer, Validator, defined in `SPEC.md`
section 1), and a link. Run the conformance suite against it first. Its case
files are data rather than TypeScript, so another language consumes them
directly, and `conformance/cases/quote-check.txt` is the standing attack
suite: quotations a source never said that once passed the quote check, every
one of which your implementation must fail. A case that disagrees with your
reading of the prose is a finding, not a licence to skip it. Open an issue.

## You are changing the reference implementation or the conformance suite

These must be green before a pull request is ready. The suite shells out to
the linters, so a green suite means those passed too; run them alone when
editing prose. The last two files are generated and never hand-edited.

```
cd viewer && npx tsc --noEmit          # types, reference viewer
cd conformance && npx tsc --noEmit     # types, suite
cd conformance && npm test             # every case, then the coverage line
python3 tools/lint-spec-style.py SPEC.md
python3 tools/lint-spec-style.py bindings/yaml-markdown.md
python3 tools/lint-field-names.py
python3 tools/lint-schema-types.py
python3 tools/backlog-index.py         # regenerates docs/backlog/README.md
python3 tools/requirements-index.py    # regenerates conformance/requirements.md
```

**A failing test is a finding, not an expectation to edit.** If a case fails,
either the implementation is wrong or the case is wrong, and deciding which is
the work; when a case is genuinely wrong, fix it and say why in the commit
message. Adding a requirement means adding a row to
`conformance/coverage.yaml`, or the coverage test fails.

## Licensing of contributions

Two licences, split the way the repository is. Prose (`SPEC.md`, `bindings/`,
`docs/`, `examples/`, `reviews/`, `CHANGELOG.md`, this file, and
the fixture corpora and case tables under `conformance/`) is contributed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), the text in
[`LICENSE`](LICENSE). Code (`viewer/`, `tools/`, `types/`, and the runner and
suites under `conformance/`) is contributed under
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0), the text in
[`LICENSE-CODE`](LICENSE-CODE). Opening a pull request is your agreement to
both, each over the part it covers. An implementation is not a derivative work
of the specification, and neither licence reaches the corpora you build: what
you record is yours.
