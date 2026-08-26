# Friction log

Every re-read, guess and inference made while building `erfval` from
`SPEC-as-tried.md`, `SCHEMA-as-tried.json` and `BINDING-as-tried.md`. Kept as
it happened, in order, so that the specification's editors can see where a
cold reader slowed down.

The three source files were read once each, front to back, before any code was
written. The spec is long enough that the first read was paginated (lines
1–1035, then 1035–1271); nothing was skipped.

## Places I wanted to peek, and did not

The instruction was that the temptation is the finding. Six times:

1. **`conformance/cases/normalization.txt` and `conformance/cases/quote-check.yaml`.**
   ERF-51 names them and says "where a reading of the prose and a case
   disagree, the case governs, and a conforming implementation reproduces
   every pair." I had a live, decisive question about step 2 (ambiguity A1)
   and the specification told me the answer exists in a file I was not to
   open. This is the sharpest instance: **the prose is not self-sufficient and
   says so.** Anyone handed the spec without the cases is guessing at the one
   check the format is built around.
2. **`types/erf.ts`.** Section 3 says it is "a TypeScript rendering of the
   schema for the reference implementation, held to it by a gate, and is not
   normative." I wanted it anyway, to see whether the reference implementation
   types `atoms_for` as `AtomId` rather than `Id` — which would settle
   ambiguity A3 in one line. Not normative, but it would have told me what the
   reference does, which is what I actually needed.
3. **`CHANGELOG.md`.** ERF-51's note says "the 2026-08-25 trials then showed
   the three steps were necessary and not sufficient [...] `CHANGELOG.md` has
   the measurements." A requirement pointing at measurements I cannot see, for
   a rule I have to implement exactly.
4. **`docs/backlog/`**, when ERF-36's note deferred content-addressed identity
   "behind that trigger". Curiosity only; nothing depended on it.
5. **`examples/`**, twice, when I was writing `tests/conforming` and wanted to
   know whether a real corpus writes `corpus.yaml` with `---` fences
   (ambiguity A4). I resolved it by accepting both forms.
6. **`bindings/`**, to see whether the drafted SQL binding treats the source
   list's key order as meaningful (ambiguity A29).

## Re-reads

- **ERF-51 step 2, five times.** Every reading produced a different answer for
  `**bold**` and I could not make the sentence decide. Settled by working the
  truth table in `ambiguities.md` A1 and choosing the reading that makes the
  stated purpose true.
- **ERF-52's word-internal definition, three times**, working the two worked
  examples backwards to recover the rule: `Revenue fell 12` against
  `12.5 percent` tells you the test looks at the character *after* the span
  and then at the character after *that*; `binding, and management` against
  `non-binding,` tells you the same on the left. The examples are what made
  the rule implementable — the definition alone ("a character joins two word
  characters") does not say which two characters you look at when the span
  boundary is one of them.
- **ERF-41, twice**, to be sure "each person's newest admissible entry" is per
  person and not global. It is. The second read was to check whether the
  collision flag fires on any shared instant or only when the entries are the
  *newest* for that person. "Where one person's **newest** entries share an
  instant" — only the newest. Implemented that way.
- **ERF-43, three times.** The premise relation is defined across two
  requirements (ERF-24 gives it, ERF-43 uses it) and the closure, the cycle
  prohibition and the leaf condition are three different tests in one
  paragraph. Once separated they were unambiguous.
- **ERF-35, four times**, over ambiguity A3, and once more to be sure
  `evidence_at_stance` really is the *only* past-state field named. It is:
  "The test for any later id-bearing field is whether it asserts something now
  or records something then."
- **ERF-47 and ERF-48 together, twice**, because the precision rule is stated
  once in ERF-47 (indeterminate resolves to stale) and once in ERF-48 (same
  day admits later) and they point opposite ways for the same pair of stamps.
  They are not in conflict: one is about a judgment aging, the other about an
  edit ordering. Two different questions, two different defaults, both
  correct. It took two passes to see that.
- **Section 1's conformance classes, twice**, to build the UNPERFORMED list.
  "A validator MUST name the requirements it does not check" is what produced
  a third of this tool's output.
- **The binding's ERF-65, three times.** The rule is one long paragraph mixing
  a MUST (quote what would resolve to a non-string), a SHOULD (quote what a
  legacy reader would retype), and a report obligation. Separating the three
  took three reads.

## Guesses and inferences, each marked in the code or in `ambiguities.md`

- **The fold's marker rule runs to a fixed point** (A1). Biggest guess in the
  build.
- **The whole-words test reads the text, never the quote's own neighbours**
  (A2), so an elision marker is not a boundary.
- **Typed reference resolution** (A3). Inferred from ERF-23, ERF-43 and
  section 4.5, against a sentence in ERF-35 that points the other way.
- **"A run holding a blank line" means two or more line terminators** (A13).
- **`normalized` and `received.path` resolve against the source-list file's
  directory** (A11). The schema says this for one of them and nothing says it
  for the other.
- **A normalized text is "text or markdown" if it is valid UTF-8 with no
  control characters other than tab, CR and LF.** ERF-51 says a validator
  facing a normalized text that is not text or markdown "MUST report the check
  as unavailable" and never says how to tell. I chose content over extension
  so that a `.dat` file holding markdown still gets checked.
- **1.5× is "enough adjacent text"** (A22). Pure invention, so it is a flag.
- **`u+2019` counts as an apostrophe** (A15).
- **A file that carries no `type` is silently not part of the corpus, but a
  file that opens with `---` and whose frontmatter will not parse is a
  violation of ERF-65.** The two rules interact: a corrupt record file has no
  readable `type`, so ERF-54 would have it ignored, and ERF-65 would have it
  reported. I chose to report it, and to exclude the source list's `normalized`
  and `received.path` targets from the record scan first, so that a normalized
  markdown text opening with a thematic break is never mistaken for a broken
  record. Neither requirement anticipates the other.

## Things the specification made easy, and worth saying

- **The flag-versus-violation distinction is stated once, early, with its
  reason, and then held.** Every requirement that wanted a flag said so in the
  same words. I never had to decide the severity of an ERF-31 anchor, an
  ERF-32 staleness, an ERF-35 past-state reference, an ERF-41 collision or an
  ERF-43 retired premise: all five are named.
- **The "*Shape*" convention.** Knowing which requirements delegate their form
  to the schema meant I could build schema validation once and route its
  errors back to requirement ids, rather than re-implementing forty patterns.
- **ERF-52 splits before normalizing, and says why.** That one sentence is
  what makes the check implementable at all; a tool that normalized first
  would fold the marker and never recover it.
- **Section 1 defines machine-checkability.** "A MUST is machine-checkable
  when its truth is decidable from the corpus and the files it holds alone,
  without a network, a judgment, or a second party." That sentence generated
  the whole UNPERFORMED list mechanically. Very few specifications tell an
  implementer where the floor is.

## Tooling friction, not the spec's fault

- No YAML library available offers YAML 1.2's JSON schema resolution, exactly
  as the binding's own section 6 reports two cold implementations finding.
  The loader in `src/yamlload.rs` is hand-built over `yaml-rust2`'s event
  stream for that reason — and it turned out to be necessary anyway, since
  duplicate keys, anchors, aliases and explicit tags (ERF-66) are all invisible
  once a tree has been loaded. **ERF-66 cannot be checked by any tool that uses
  a normal YAML loader.** The binding should say so.
- `jsonschema`'s top-level `oneOf` reports only "valid under none of the six",
  so the six branches are compiled separately and selected by the `type`
  discriminator. That is what ERF-54 says the discriminator is for, so the
  workaround is the design.

## Where I expect to be wrong

In order of how much it would cost:

1. **A1**, the fold's marker rule. If the conformance cases say one pass, every
   quote against an emphasized passage flips verdict.
2. **A3**, typed references. `erfval` will fail corpora a schema-first
   implementation passes.
3. **A2**, the elision boundary. If the reference treats `[...]` as a word
   boundary, `erfval` rejects quotes it accepts.
4. **A12**, a dangling narrative-binding id as a violation rather than a flag.
5. **A8**, an unknown record type as a violation.
