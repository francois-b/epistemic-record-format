# Friction log

Every place the specification, the schema, the binding or the validator made
me guess, re-read or invent, while building a corpus from *The Bitter Lesson*
cold. One entry per moment. All entries 2026-08-26 unless dated otherwise;
they are in the order they happened.

---

## F-01 — The status vocabulary has no slot for "public, no licence stated, held for checking"

**Requirements: ERF-5, ERF-68, ERF-69.**

The first source is Sutton's essay: a public web page, no licence anywhere on
it, and the whole point of the corpus is to hold its text so quotes can be
checked. The closed set in ERF-5 offers `not-redistributable`,
`access-restricted` and `licence-unverified`, all of which mean *no normalized
text is held*, which kills the quote check and therefore the corpus. ERF-68
offers `shipped-as-quotation`, but its own words scope it to "a text shipping
under no licence **as a short quotation**", and a 1,100-word essay held in
full is not a short quotation.

I used `shipped-as-quotation` for the essay and for every paper and blog post
in the corpus, twenty-four of thirty-one sources. It is the only status that
keeps the format working, and for most of those it is a stretch. The seven
Wikipedia and Wikiquote sources are the only ones where I could honestly write
`status: shipped` with an SPDX identifier, because CC-BY-SA-4.0 is stated on
the page.

The gap is real and it is structural: the format's verifiability story
requires holding text, and its licence story gives you one honest way to hold
text you do not own, sized for a sentence. Either the set needs a
`fair-use-excerpt` member or ERF-68 needs to stop saying "short".

---

## F-02 — One source, one normalized text, one contiguous excerpt: the sharpest quote gets left behind

**Requirements: ERF-3, ERF-69.**

ERF-3 says one source entry per work. ERF-69 says the normalized text may be
an excerpt, and that fidelity is checked by the excerpt occurring, under the
ERF-51 fold, in the normalization of the whole extracted source. "Occurring"
is a contiguity test. So a work gets exactly one contiguous passage.

This bit hard, twice.

The Deep Blue paper (Campbell, Hoane and Hsu) has the "8,000 features" figure
on page 5 and the "opening book created by hand by Grandmaster Joel Benjamin"
paragraph on page 21. I wanted both. I could hold either, or hold sixteen
pages of a copyrighted journal article under a status that says "short
quotation" (see F-01). I took section 7.3 through 8.2 and got the 8,000-parts
figure from Wikipedia instead, which downgraded a `high` atom to a `low` one
purely because of an excerpting rule.

The Harpy paper is worse. Its single best sentence for this corpus is on page
8: "Much of the Harpy's success is the result of solving the difficult
technical problems associated with forcing all the diverse KSs into a unified
framework" — the DARPA winner saying in its own voice that it won by
engineering human knowledge sources. It sits 480 lines from the passage
recording that Harpy met the goals. I kept the goals passage. The best
sentence in the source is not in the corpus.

A multi-range excerpt with a marker between ranges would solve this and would
be strictly more honest than picking one range and quietly dropping the rest,
but ERF-69's occurrence test forbids it, and I could not find a reading of the
text that allows it. This is the single largest cost the format imposed on
this corpus.

---

## F-03 — "Extraction to CommonMark" invites the wrong extractor

**Requirements: ERF-1, ERF-70, ERF-67.**

ERF-1 says the pipeline is "extraction to CommonMark". I read that literally
and set the extractor to `pandoc -t commonmark_x`. The output was full of
pandoc's own escapes and attribute syntax: `Moore\'s law`, `\`\`brute force\"`,
`[search]{style="font-style: italic;"}`, `# The Bitter Lesson {#the-bitter-lesson}`.
Those all fold correctly under ERF-51 — the fold is applied to quote and text
alike, so the verdict is right — but every quote I would have stored was
unreadable, and a stored quote is something a human reads.

I switched the extractor to `pandoc -t plain`, on the ground that plain text
is valid CommonMark (ERF-67's own note says every UTF-8 string is), and the
quotes became clean. That is the right answer, and nothing in ERF-1 points at
it; the phrase "extraction to CommonMark" points the other way. An
implementer following the text gets ugly, technically-conforming quotes.

The same wording bit for PDFs. ERF-1 wants CommonMark; `pdftotext` emits
hard-wrapped plain text. I treated the wrapping as a normalization concern
(ERF-70 names "reflowing wrapped lines" as normalization) and wrote a
`--reflow` mode. That works, but the division between "extraction" and
"normalization" is nowhere stated, and I invented it.

---

## F-04 — ERF-6 is right, and it is expensive to obey honestly

**Requirement: ERF-6.**

"A producer MUST take a quote from the normalized text by copying, a substring
operation performed by a tool, and MUST NOT regenerate it." I built
`scripts/mint-atoms.py` to do exactly this: the author supplies a first anchor
and a last anchor, the script `find`s both and slices between them, and the
sliced bytes go into the file. 115 quotes, none typed.

The rule caught real errors. Seven anchors did not resolve on the first run.
One of them, `bl-033`, failed because Wikipedia writes "200 million" with a
U+00A0 between the words and I had typed a space. Under the ERF-51 fold that
NBSP collapses and the quote would have passed the check — but the stored
bytes would then have differed from the source's bytes in a way nothing would
ever have told me. The substring rule surfaced a fact about the source that
the fold is designed to hide.

The cost is that a quote can no longer be composed for readability. Five
quotes failed the validator's word-boundary test (ERF-52) because my end
anchor stopped before a possessive: `Moore` in `Moore's law`, `Deep Blue` in
`Deep Blue's predecessor`, `we don` in `we don't have`. Every one was a case
where the natural place to end a quote is mid-token by UAX #29's reading. The
error message is exact and the fix is mechanical, but the loop is: write
anchor, run mint, run validator, learn that UAX #29 disagrees with your ear,
adjust. Four round trips.

---

## F-05 — The ERF-51 fold and a stored quote pull in opposite directions

**Requirements: ERF-6, ERF-51, ERF-52.**

Three characters in the sources are markup under CommonMark and text to a
reader: `[6]` reference markers in the Deep Blue paper, `^([46])` footnote
markers throughout Wikipedia, and Sutton's `` ``brute force" ``.

For each, the *fold* is fine — the same characters fold the same way on both
sides. But a quote carrying `Deep Blue used custom VLSI chips to parallelize
the alpha–beta search algorithm,^([52]) an example of symbolic AI.^([53])` is
a bad quote for a human even though it is a perfect one for a machine. I ended
up splitting six atoms into two spans joined by `[...]` purely to route around
footnote markers, which means the elision marker is now carrying "I removed a
reference number", not "I removed material", and ERF-52 explicitly says an
elision marker "is the author's assertion that they removed material".

I am using a truth-bearing marker for a typographic problem. The format has no
other tool for it. My own guard (reject a span containing `*_[]\`<>`) is
stricter than the format requires and I had to add a per-atom waiver for
Sutton's backticks after checking by hand that the file contains exactly two
of them and they therefore open no code span.

---

## F-06 — Every normalized text the format tells you to hold is reported as an unrecognized file

**Requirements: ERF-1, ERF-54, ERF-57.**

The format requires normalized text to exist (ERF-1) and the source list to
name its path relative to itself (schema: `Source.normalized`). So the texts
live inside the corpus directory. ERF-54 then says every file a corpus holds
must self-describe with `type`, and a file without one "is not part of the
corpus, and a consumer MUST ignore it and report that it did".

Result: every clean run of the validator prints 31 `UNRECOGNIZED` lines, one
per normalized text, before the summary. On a corpus with 31 sources that is
31 lines of noise on every run, forever, generated by files the format
mandated. I have been filtering them out with `grep -v` all day, which is
exactly the habit a validator should not train.

The raw files are not reported, so the validator is evidently walking `.md`
and `.yaml` only. That means the noise is a consequence of normalized text
being markdown, and would vanish if it were `.txt`. Nothing in the format says
which, and I would have picked `.md` again.

---

## F-07 — ERF-23 forbids the rival claim, and the ban is right and lossy

**Requirement: ERF-23.**

"Evidence against a claim MUST NOT be modeled as a rival claim." Three times I
had written a claim before noticing it was a rival:

- "Moore's law is slowing" — a rival to `compute-cost-per-unit-continues-to-fall-exponentially`.
- "Deep Blue was a hybrid of search and expert knowledge" — a rival to `deep-blue-was-simpler-than-its-knowledge-based-rivals`.
- Brooks's "count the total cost" counter-lesson — a rival to the thesis.

Each became `atoms_against` on the claim it opposed, which is the rule and
which reads better in the record: one statement, evidence on both sides,
rather than two statements and a reader guessing which is the real question.

What is lost is that Brooks's counter-lesson is *itself a proposition someone
could stand behind*, and the format now has nowhere to put it except as
evidence about someone else's sentence. `conflicts-with` does not help,
because it is claim-to-claim and the rival claim is precisely what I am
forbidden to mint. The corpus therefore ships with `conflicts-with` unused: I
could not find a single honest use for it, because ERF-23 routes every real
disagreement into `atoms_against` first.

---

## F-08 — ERF-9's three tiers have no slot for an accountable anonymous tertiary source

**Requirements: ERF-9, ERF-10.**

Wikipedia carries eight of the thirty-one sources here and 24 of the 115
atoms. ERF-9 grades on the weaker of provenance distance and attester
accountability. Wikipedia's provenance is one hop with a named original
cited; its attester is an anonymous collective with real institutional
accountability but no person to answer. `medium` says "an identifiable
intermediary"; `low` says "an unaccountable or unidentifiable attester, or an
aggregator citing an unnamed original".

Neither fits. I graded every Wikipedia and Wikiquote atom `low` and wrote the
reason in `limitations`, because "unidentifiable attester" is the more
literally true half. The consequence is that "Deep Blue evaluated 200 million
positions per second", a fact nobody disputes and which appears in three other
places, is recorded at the same grade as an anonymous forum comment. The grade
is doing less work than it should.

---

## F-09 — Sutton's own sentence is a `high` atom for a claim it barely evidences

**Requirements: ERF-9, ERF-10.**

Every one of the essay's assertions needs an atom saying the essay asserts it,
or the narrative bindings point at claims with no trace of their origin. ERF-10
says a finding whose subject *is* discourse must say so, and that a recorded
identified utterance is then direct and accountable, hence `high`.

So all 27 Sutton atoms are `high`. A reader scanning
`deep-blue-was-simpler-than-its-knowledge-based-rivals` sees one `high` atom
for and nine against, of which four are `high`. The arithmetic is misleading:
the one atom for is high-grade evidence *that Sutton said it* and no evidence
at all that it is true. ERF-10's rule is correct and its effect at the claim
level is to make a proponent's assertion look like backing. Nothing in the
format flags "this claim's only for-atom quotes the claim's own author".

---

## F-10 — ERF-43 makes a premise-less argument conform and an argument leaf fail

**Requirement: ERF-43.**

"An argument's premise closure ... MUST terminate in non-argument leaves",
with the note that a premise-less argument has an empty closure and satisfies
this vacuously. Read together those mean: an argument with no premises is
fine, but an argument *reached as a premise* by another argument, with no
premises of its own, is a violation.

I had written `knowledge-and-computation-compete-for-researcher-time` as a
premise-less argument that the thesis assumes. That is legal alone and illegal
in place. I fixed it by giving it an `assumes` edge to an observation, which
is the right modelling, but I only worked out that it was required by reading
ERF-43 three times. The rule punishes the same record differently depending on
what points at it, and the spec never says so in one sentence.

---

## F-11 — The validator cites a requirement the specification does not define

**Requirement: none — ERF-73 does not exist.**

Every schema-level violation the validator emits is tagged `(ERF-73)`:

```
VIOLATION  (declaration)  id  the manifest MUST declare this field (ERF-73)
VIOLATION  <id>  (record)  must have required property 'finding'; the data model is erf.schema.json (ERF-73)
```

`SPEC-as-tried.md` runs to ERF-72 plus `YAMLB-1`. There is no ERF-73 in the
specification I was given, and the specification's own change-control section
says requirement ids are stable once published and that insertions append. So
either the validator is ahead of the spec I am building to, or it is citing an
id that does not exist. From inside the purity boundary I cannot tell which,
and that is the point: I am told to fix violations by requirement id, and one
of the ids does not resolve.

Also: the validator uses the word "manifest" for what the specification calls
the declaration (ERF-59). Two names for one file.

---

## F-12 — The validator's schema is stricter than the schema I was told is normative

**Requirements: ERF-13, section 3 (`erf.schema.json`).**

When a claim record failed to validate for an unrelated reason, ajv reported
its errors against every branch of the top-level `oneOf`, including this one:

```
VIOLATION  <claim-id>  id  must match pattern "^[^\s"<>/]+-\d+$"
```

`SCHEMA-as-tried.json`, which the spec's section 3 calls normative, defines
`Id` as `^[^\s"<>]+$` and uses that one definition for atoms, claims and
surveys alike. The validator is enforcing a distinct, stricter pattern on
atom ids: a prefix, a hyphen, and digits. ERF-13's prose does describe atom
ids as "a mint-time prefix and a sequence number (`kwg-117`)", so the
validator is enforcing the prose and the shipped schema is not. My atom ids
happen to match. A corpus with atom ids like `bl-chess-opening-book` would
validate against the normative schema and fail the reference validator.

---

## F-13 — One bad field produced sixty-three violations

**Requirement: section 3 (JSON Schema `oneOf`).**

I injected a single defect into a copy of the corpus: one standing entry whose
`by` was `agent/claude-opus-5` instead of a `human:` actor, which ERF-21 and
ERF-39 correctly forbid. The validator emitted 62 violations for that one
record, one for every required-property and additional-property complaint from
each of the six `oneOf` branches, and the actual diagnosis
(`standings.0.by must match pattern "^human:..."`) was line 16 of 62.

The data model discriminates on `type`, and the schema knows it. Reporting the
failures of the branch whose `type` matched, and only that branch, is a
one-line change to the validator and would turn 62 lines into 1. As shipped,
the first real defect a producer hits buries its own explanation.

---

## F-14 — Narrative-binding staleness is not checked and is not declared unchecked

**Requirements: ERF-32, ERF-47, and the Validator conformance class.**

ERF-32: "A narrative binding MUST be checkable: it is stale when the claim it
names carries a `last_modified` later than the binding's `bound-at`, a
complete mechanical test using only fields the format already defines."
ERF-47 makes staleness a flag.

I tested it. On a copy of the finished corpus I added
`last_modified: "2026-08-30"` to a claim named by a binding stamped
`bound-at=2026-08-26` and re-ran the validator. Output: zero violations, zero
flags, nothing. The anchor check (ERF-31) does fire — I broke an anchor in the
same probe and got a clean `FLAG ERF-31`. So bindings are parsed and resolved;
the staleness comparison is simply not run.

The Validator conformance class says "A validator MUST name the requirements
it does not check". Across every run in this trial the validator printed no
such list, and no `UNCHECKABLE` line ever appeared. It also ran the
deployment-wide ERF-36 and ERF-38 duplicate-id checks over a single corpus
without, as that same paragraph requires, naming the result as partial.

So the one flag the format invented specifically for the narrative layer — the
thing narrative bindings exist to give you — is silently absent, and the
mechanism the spec provides for noticing that (naming what you do not check)
is also absent.

---

## F-15 — A narrative that reproduces someone else's prose has nowhere to say so

**Requirement: ERF-34.**

"A narrative ... is prose, authored by a person and never generated." The task
here is Sutton's essay with bindings inserted. The prose is Sutton's, the
bindings are mine, and `Narrative` has exactly four structured fields: `type`,
`title`, `corpus`, `created`. `created.by` is a single actor, so the file says
one thing and one thing only about authorship, and whatever I put there is
wrong: `human:sutton` claims he made the bindings, `agent/claude-opus-5`
claims I wrote the prose.

I wrote `agent/claude-opus-5` and put a note in the body's first paragraph
saying the prose is quoted and copied by script. That note is prose a consumer
will render, not metadata a consumer can read, and it is the only place the
distinction lives.

It also puts `created.by` in tension with ERF-34's own sentence: a narrative is
"never generated", and mine is stamped to a machine actor because the machine
is what did the part of it that is mine to claim.

---

## F-16 — I wanted to look, twice

The instruction says the temptation is a finding. It fired twice, both times
at the same kind of moment.

The first was at F-02, holding the Harpy paper with the sentence I wanted 480
lines outside my excerpt. The thought was: *there must be a worked example
somewhere in `examples/` that shows how a real corpus handles a long PDF, and
I am probably reinventing something.* That is exactly the moment the trial is
designed to catch, because what I did instead — accept the loss and write it
down — is the datum.

The second was at F-14, after the staleness probe came back empty. The pull
was to open `viewer/erf-check.ts` and confirm whether the check is missing or
whether I had constructed the probe wrong. I resisted it and instead ran three
separate single-defect probes on copies (`ERF-48` stamp ordering, `ERF-43`
self-edge and cycle, `ERF-31` broken anchor), all of which fired correctly,
which is about as strong as black-box evidence gets that the staleness check
specifically is absent. It cost four extra validator runs to learn what one
`grep` would have told me, and the four runs are better evidence.

---

## F-17 — What the essay could not be backed on

Recorded here as well as in the README because it is a finding about the
subject, not only about the format.

- **"the majority of computer-chess researchers"** (claim
  `majority-of-chess-researchers-viewed-the-1997-win-with-dismay`). No
  measurement found. Survey `chess-researcher-dismay-2026-08-26` records the
  acts. Named individuals hold the attitude; nobody counted.
- **"Most AI research has been conducted as if the computation available to
  the agent were constant"** (claim `most-ai-research-assumes-constant-computation`).
  Backed by one atom, which is Sutton's own sentence. Survey
  `field-practice-quantification-2026-08-26`. No bibliometric study exists that
  I could find; the essay is argued with, not measured against.
- **"this always helps in the short term"** (claim
  `building-in-knowledge-always-helps-in-the-short-term`). A universal. One
  search act for a counterexample returned nothing of that shape and a large
  literature arguing the reverse. Survey
  `short-term-knowledge-counterexamples-2026-08-26` states plainly that a
  single null act is close to no evidence.
- **"statistics and computation came to dominate the field [of NLP]"** (claim
  `statistics-and-computation-came-to-dominate-natural-language-processing`).
  Backed only through the speech literature and one anecdote whose own source
  says its wording and dating are unclear. A real backing needs method surveys
  across two decades of computational linguistics; not attempted.

## F-18 — What the search for the opposite found

- **Deep Blue was not simpler.** Its builders report the large majority of its
  8,000 evaluation features hand-made, a four-grandmaster opening book, a
  700,000-game grandmaster database steering its openings, and one hand-crafted
  rook feature "of critical importance in Game 2" of the match. Nine atoms
  against, one for, and the one for is Sutton's own sentence.
- **The speech paragraph is a decade out.** The system that met and exceeded
  every DARPA goal was Harpy, and Harpy was a compiled network of hand-written
  grammar, pronunciation and juncture rules searched by beam search. Its
  authors credit Baker's Dragon for the representation; Dragon did not win.
  HMM dominance dates to the 1980s. Sutton's statistical side won the decade
  and not the competition.
- **AlphaGo ran on human knowledge.** The program that broke the Go barrier
  was bootstrapped on about thirty million human expert moves and fed
  Go-specific feature pre-processing. Its own abstract says so. AlphaGo Zero
  removed the human data eighteen months later and won 100-0, which is the
  essay's pattern arriving, but after the sentence describing it.
- **"only convolution" fails in both directions.** AlexNet's authors say their
  model needs "lots of prior knowledge"; ResNet attributes its gain to an
  architectural reformulation; and by 2020 the Vision Transformer paper's
  headline is that reliance on convolutional networks "is not necessary".
- **SIFT is not discarded.** A 2025 photogrammetry paper opens by saying
  classical handcrafted SIFT matching "have been state-of-the-art for mobile
  mapping cameras", then reports learned methods beating it. Both sentences are
  atoms, on opposite sides of the same claim.
- **Domain knowledge is winning somewhere.** AlphaFold's authors attribute
  their accuracy to architectures built on "the evolutionary, physical and
  geometric constraints of protein structures", and the system still ends with
  an AMBER force field doing the final refinement. Cranmer and Rezende, quoted
  by Nielsen, say the same of lattice QCD and molecular dynamics.
- **A competing explanation for the whole seventy years.** Hooker's hardware
  lottery: an idea wins because it suits the available hardware, not because it
  is better. That reads Sutton's own evidence and reaches a different
  conclusion, and it is the strongest thing in the corpus against the thesis.
