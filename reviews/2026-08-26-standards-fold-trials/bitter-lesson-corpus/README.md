# The Bitter Lesson, as an ERF corpus

Rich Sutton's *The Bitter Lesson* (2019), taken apart top-down: every passage
that asserts something checkable is a claim, every claim is typed by what
would settle it, and every claim carries the evidence found for it and against
it from public sources. Built cold from `SPEC-as-tried.md`,
`SCHEMA-as-tried.json` and `BINDING-as-tried.md`, with no other corpus,
example or implementation consulted.

**Nobody stands anywhere.** Every one of the 32 claims has an empty standings
ledger and a computed disposition of *proposal*. Only a person takes a stance
(`ERF-21`), and no person has read this yet.

```
npx tsx ../../../viewer/erf-check.ts corpus
→ 115 atoms, 32 claims, 4 surveys, 31 sources, 1 narratives: 0 violation(s)
```

## Counts

| Record type | Count |
|:--|--:|
| atoms | 115 |
| claims | 32 |
| surveys | 4 |
| sources (not records) | 31 |
| narratives (not records) | 1 |
| corpus declarations | 1 |

**Atoms by source quality** (`ERF-9`): 81 `high`, 10 `medium`, 24 `low`.
Every `medium` and `low` atom carries its reason in `limitations`.

**Atoms by origin**: 27 quote the essay itself, 88 come from outside sources.

**Claims by epistemic kind** (`ERF-24`): 25 `observation`, 4 `argument`,
2 `bet`, 1 `commitment`.

**Evidence balance**: 32 claims carry `atoms_for`; 18 of them carry
`atoms_against` as well. Four claims cite surveys.

**Sources by status**: 7 `shipped` (Wikipedia and Wikiquote, CC-BY-SA-4.0),
24 `shipped-as-quotation`. Nine are PDFs, twenty-two are web pages. All 31
hold their raw file, its sha256, the retrieval date, a normalized text, that
text's sha256, the extracting tool and version, and the normalizing tool and
version.

**Passes to zero violations: two.** Full run log in `iterations.md`.

## Layout

```
corpus/
  corpus.yaml                          the declaration (ERF-59)
  sources.yaml                         the source list, 31 entries (ERF-3)
  raw/                                 31 raw files, exactly as retrieved (ERF-2)
  normalized/                          31 normalized texts (ERF-1)
  atoms/bl-001.md … bl-115.md          115 atoms
  claims/<slug>.md                     32 claims
  surveys/<slug>-2026-08-26.md         4 surveys
  narrative-bitter-lesson-bound.md     the essay with 10 narrative bindings
scripts/                               the pipeline, below
work/                                  the pipeline's inputs: fetch manifest,
                                       excerpt ranges, source/atom/claim/survey specs
friction-log.md                        every place the format fought back
iterations.md                          every validator run
```

## The pipeline, and how to re-run it

Each stage is a named deterministic tool, because `ERF-70` requires the
extractor and the normalizer to be named and reproducible, and `ERF-6`
requires a quote to be a substring taken by a tool.

| Stage | Script | What it does |
|:--|:--|:--|
| fetch | `scripts/fetch.sh <slug> <url> [ext]` | `curl` to `corpus/raw/`, print sha256 and the date. Refuses to overwrite: a raw file is immutable (`ERF-2`). |
| extract | `scripts/extract.sh <slug> [ext]` | `pandoc 3.8.3 -f html -t plain --wrap=none` for web pages, `pdftotext 25.12.0 (poppler) -enc UTF-8` for PDFs. Output goes to `work/extracted/`, which the corpus does not keep (`ERF-70`: the extraction's own output is not retained). |
| excerpt + normalize | `scripts/excerpt.py <slug> --lines A-B [--reflow]` | Selects a contiguous line range, snapped outward to blank lines, and runs it through `bl-normalize.py`. Asserts the ERF-69 fidelity check as a byte-substring test against the normalization of the whole extracted source, which is stronger than the fold test the requirement asks for. |
| normalize | `scripts/bl-normalize.py` (v1.0.0) | The corpus's named normalizing tool. LF, no BOM, drop pandoc export artifacts, strip trailing space, collapse blank runs. `--reflow` adds line rejoining and hyphenation repair for `pdftotext` output. Never rewrites a word, never folds case. |
| digest + source list | `scripts/build-sources.py` | Writes `corpus/sources.yaml` from `work/source-specs.json`, computing both digests from the bytes on disk so the list cannot drift from the files. |
| quote by substring | `scripts/mint-atoms.py` | **The rule this corpus exists to test.** Reads `work/atom-specs.json`, where each atom names a source and one or two anchors per span. The script `find`s each anchor in the normalized text and slices between them; the sliced bytes are the quote. Nothing typed by the author reaches the `quote` field. Fatal guards: anchor not found, anchors out of order, span crossing a block boundary, span containing CommonMark inline markup. Multiple spans join with `[...]` (`ERF-52`). |
| claims + surveys | `scripts/build-claims.py` | Writes claim and survey files. A claim body opens with its title copied from the `title` field, so the ERF-18 restatement cannot drift. |
| narrative | `scripts/build-narrative.py` | Copies the essay's paragraphs out of its normalized text and interleaves the ten narrative bindings. Every anchor is checked against its own passage before the file is written. |
| YAML | `scripts/erf_yaml.py` | Emits every string-typed scalar double-quoted, always (`ERF-65`). Block style only; no anchors, aliases, tags or duplicate keys (`ERF-66`). |

Rebuild the whole record layer from the held raw files:

```sh
python3 scripts/build-sources.py
python3 scripts/mint-atoms.py
python3 scripts/build-claims.py
python3 scripts/build-narrative.py
```

(`work/manifest.tsv` and `work/excerpts.tsv` record the fetch URLs and the
excerpt ranges, so the `work/extracted/` stage is reproducible from the raw
files too.)

## What could not be backed

Four of the essay's assertions have no evidence behind them beyond the essay,
and the corpus says so rather than hiding it.

1. **"the majority of computer-chess researchers"** viewed the 1997 result
   with dismay. Nobody counted. Two web acts found named critics and no
   measurement (`chess-researcher-dismay-2026-08-26`). The survey states its
   coverage bounds: the place such a measurement would live, the ICCA journal
   and conference proceedings of the period, is not reachable from a general
   web index, so this is a sparseness reading and not an absence one.
2. **"Most AI research has been conducted as if the computation available to
   the agent were constant."** One atom backs it and that atom is Sutton's own
   sentence. No bibliometric study of the assumption surfaced
   (`field-practice-quantification-2026-08-26`). The essay is argued with, not
   measured against.
3. **"this always helps in the short term."** A universal, refutable by one
   case, and one search act did not find one
   (`short-term-knowledge-counterexamples-2026-08-26`). That survey says
   plainly that a single null act against one index is close to no evidence.
4. **"statistics and computation came to dominate [natural language
   processing]."** Reached here only through the speech literature and one
   anecdote whose own source says its wording and dating are unclear. A real
   backing needs method surveys across two decades of computational
   linguistics, which was not attempted.

## What the search for the opposite found

This is the step the format exists for, and it changed the corpus more than
anything else.

- **Deep Blue was not simpler than what it beat.** Its own builders report
  that the large majority of its 8,000 evaluation features and weights were
  created and tuned by hand; that four grandmasters wrote its opening book;
  that an "extended book" summarised a 700,000-game grandmaster database to
  nudge its play toward human opening theory; and that one hand-crafted rook
  feature was "of critical importance in Game 2" of the 1997 match. Nine atoms
  against `deep-blue-was-simpler-than-its-knowledge-based-rivals`, one for,
  and the one for is Sutton's sentence.
- **The speech paragraph is a decade out of date.** The system that met and
  exceeded every stated DARPA goal was Harpy, and Harpy was not an HMM system:
  it compiled hand-written grammar, pronunciation and juncture rules into a
  fifteen-thousand-state network and ran a beam search over it. Its authors
  credit Baker's Dragon for the representation, and Dragon did not win. HMM
  dominance is dated to the 1980s. Sutton's statistical side won the decade
  and not the competition
  (`hmm-based-methods-were-the-rival-side-in-the-1970s-speech-programme`,
  survey `hmm-entrant-darpa-sur-2026-08-26`).
- **AlphaGo ran on human knowledge.** The program that actually broke the Go
  barrier was bootstrapped on about thirty million human expert moves and fed
  Go-specific feature pre-processing before its networks saw the board; its own
  abstract says so. AlphaGo Zero removed the human data eighteen months later
  and won 100-0. The essay's pattern is real and arrives after the sentence
  describing it.
- **"only the notions of convolution and certain kinds of invariances" fails
  in both directions.** Downward: AlexNet's authors write that their model
  "should also have lots of prior knowledge"; ResNet attributes its gain to an
  explicit architectural reformulation. Upward: by October 2020 the Vision
  Transformer paper's headline sentence is that reliance on convolutional
  networks "is not necessary".
- **SIFT is not discarded.** A 2025 photogrammetry paper opens by stating that
  classical handcrafted SIFT matching "have been state-of-the-art for mobile
  mapping cameras", and then reports learned matching beating it on their own
  data. Both sentences are atoms, on opposite sides of one claim.
- **Domain knowledge is winning somewhere.** AlphaFold's authors credit
  "the evolutionary, physical and geometric constraints of protein structures"
  for their result, and the system still ends with an AMBER force field doing
  the final refinement. Two named practitioners quoted by Nielsen say the same
  of lattice QCD and molecular dynamics, and add the reading the essay does not
  admit: the bitter lesson applies where domain knowledge is weak.
- **There is a rival explanation for the whole seventy years.** Hooker's
  hardware lottery: an idea wins because it suits the available hardware, not
  because it is better. It reads Sutton's own evidence and reaches a different
  conclusion, and it is the strongest single thing against the thesis in this
  corpus.

Two things went the essay's way and should be said as plainly. Epoch AI's
470-GPU dataset gives FLOP/s per dollar doubling about every 2.5 years across
2006 to 2021, so the mechanism the whole argument rests on is measured and
holds. And AlphaGo Zero's authors state the ceiling mechanism outright —
expert data "may impose a ceiling on the performance of systems trained in
this manner" — and then demonstrate it. That is the best evidence for the
essay anywhere in this corpus, and it comes from the same paper that supplies
the best evidence against its Go paragraph.

## Flags left standing, and why

No flags were raised on any run over this corpus. Two conditions were probed
deliberately on throwaway copies:

- **`UNRECOGNIZED`, 31 lines, every run.** Not a flag, but noise on every run
  and worth naming. These are the normalized texts the format requires the
  corpus to hold, reported under `ERF-54` because a `.md` file carrying no
  `type` is not part of the corpus. Left standing: the format mandates the
  files and the format reports them. Friction log F-06.
- **`ERF-32` / `ERF-47` stale narrative bindings never fire.** A bound claim
  given a `last_modified` later than its binding's `bound-at` produces no
  flag, no violation, nothing, while a broken anchor under `ERF-31` flags
  correctly. The staleness comparison is not run and the validator names no
  unchecked requirements, though its own conformance class requires it to.
  Left standing because it is the format's to fix, not the corpus's. Friction
  log F-14.

## Where the format cost the corpus something

The full account is `friction-log.md`; the five that mattered most:

1. **F-02** — one source, one contiguous excerpt (`ERF-3` + `ERF-69`). The
   Harpy paper's best sentence for this corpus sits 480 lines outside the
   excerpt I could hold, and is therefore not in the corpus at all.
2. **F-14** — the one flag invented for the narrative layer does not fire, and
   nothing says so.
3. **F-01** — `shipped-as-quotation` is the only status that keeps the format
   working for a public, unlicensed source, and it is sized for a sentence.
   Twenty-four of thirty-one sources use it.
4. **F-11 / F-12** — the validator cites `ERF-73`, which the specification does
   not define, and enforces an atom-id pattern stricter than the normative
   schema's.
5. **F-09** — `ERF-10` grades a proponent's own assertion `high`, so a claim
   whose only for-atom quotes its own author looks backed at a glance.

## Raw artifacts are not in the repository

`corpus/raw/` holds third-party works fetched for checking (journal PDFs,
Wikipedia captures, blog posts). They are not redistributable and are not
committed; `corpus/sources.yaml` carries each one\x27s URL and SHA-256
digest, so a reader can re-fetch and verify. The normalized excerpts under
`corpus/normalized/` are what the quote check reads. See finding
`docs/findings/F-024` on the status this puts them under.
