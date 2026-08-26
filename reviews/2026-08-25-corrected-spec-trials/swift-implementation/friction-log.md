# Friction log

Every re-read, guess and inference, in the order it happened. Cold Swift
implementation of `SPEC-as-tried.md` + `BINDING-as-tried.md`, 2026-08-25.
Nothing else in the repository was opened.

## Temptations to look, recorded instead of acted on

1. **`conformance/cases/quote-check.yaml` and `conformance/cases/normalization.txt`.**
   ERF-51 says the cases "are normative for its exact behavior: where a reading
   of the prose and a case disagree, the case governs". So the requirement I was
   asked to implement from prose declares in its own text that the prose loses
   ties. This was the single strongest pull toward looking, and it recurred at
   every one of the seven readings in ambiguities.md §1. Recorded, not opened.
2. **`types/erf.ts`.** Section 3: "where the two differ, the file governs",
   and it explicitly omits the seven type aliases — including every id type —
   that ERF-65's duty depends on. Second strongest pull. Not opened.
3. **`bindings/yaml-markdown.md`.** Section 7 links it; I was handed
   `BINDING-as-tried.md` instead and assumed they are the same document. If they
   are not, everything I did with ERF-65/66/67 is against the wrong text.
4. **`reviews/2026-08-25-post-ruling-trials/yaml-markdown-case-against.md`**,
   cited in the binding's section 6, and **`docs/history.md`**, cited four
   times. Not opened; no requirement depends on them.

## Re-reads

- **ERF-24, three times.** Once to get the premise orientation, once when
  ERF-43's cycle example did not produce a cycle (§2a — I assumed I had
  mis-derived the direction and went back to check; I had not, the example is
  wrong), and once for the `bet`/`commitment` "owe no backing" clause when
  deciding what ERF-49 should flag.
- **ERF-43, four times.** The sentence "The premise relation MUST admit no
  cycles, where `X assumes Y` and `Y supports X` both make `Y` a premise of
  `X`" reads as an example of a cycle on first pass and as a definition of the
  relation on the third. I built the "example" as a test case (`c2-*`), watched
  it not fire, and only then worked out why.
- **ERF-41, three times**, all on the eleven words "as though the entry were
  absent". First read: obviously means drop the entry. Second read: drop it
  from *what*, the ledger or the selection? Third read, on "With that, every
  input has exactly one reading": realised the sentence claiming closure is the
  one that opens it.
- **ERF-31, five times.** The grammar block twice for the anchor escapes; a
  third time to work out whether ids could contain `-->` (they can); a fourth
  after `tests/05/n4` produced a well-formed binding with eleven ids; a fifth to
  confirm the passage definition against what my scanner had actually done.
- **ERF-52, twice**, for the exact wording of the whole-word rule — specifically
  whether "the character before its occurrence" is constrained when the span
  *starts on punctuation* (it is not: "A span that opens or closes on
  punctuation is unconstrained on that side").
- **Section 1's conformance classes, twice**, once at the start to know what I
  was building and once at the end when section 7's "Conformance is a property
  of a corpus as loaded into the model" contradicted my memory of it.
- **ERF-55 vs ERF-56, twice.** Empty lists MUST be omitted (ERF-55) and a
  reader MUST materialize an omitted list as empty (ERF-56). Consistent, but the
  two sentences are 14 requirements apart and I had to hold both to write the
  loader.

## Guesses and inferences, with what I inferred from

- **`AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId`, `FamilyName` are
  `string`.** Inferred from the example values (`kwg-117`, `prior-art`) and
  from ERF-65 naming "a source id or family name" among the things a producer
  must quote. Section 3 says the definitions are omitted. Everything ERF-65
  does rests on this guess.
- **`CSL` is not typed by the model**, so nothing inside a `citation` block is
  checked. Inferred from the same omission sentence. Directly contradicts
  ERF-53's worked example (ambiguities §6a).
- **The declaration and the source list are bare YAML documents, not
  frontmatter-fenced.** From the binding's "The declaration and the source list
  are YAML documents with no body." I accept both spellings anyway, because a
  YAML document may legally begin with `---` and I cannot distinguish that from
  a frontmatter fence.
- **`normalized:` paths resolve relative to the source-list document's
  directory.** Pure guess; nothing states a base. I try the corpus root as a
  fallback so that either convention works. ERF-54's "no meaning lives in a
  path" made me hesitate for a while over whether these are paths at all.
- **An atom id must end in `-` plus digits** (ERF-13, "a mint-time prefix plus
  a sequence number (`kwg-117`)"). One example, no grammar. I made it a
  violation and I am not confident; a corpus using `kwg.117` or `kwg/117` would
  fail for me and pass for a looser reader.
- **ERF-33 is a violation, not a flag.** Guess; the text says only "MUST report".
- **ERF-65 is a violation, not a flag.** Same guess, same reason.
- **A standing whose `by` is not `human:` still counts toward the disposition.**
  Guess. ERF-41 excludes out-of-vocabulary *stances* and says nothing about
  invalid actors.
- **"unavailable" quote checks are INFO, not violations.** From ERF-51's "MUST
  report the check as unavailable rather than pass or fail it" — it is neither,
  so it is neither a violation nor a flag, and the spec has no third severity.
  I invented one.
- **The empty-anchor flag** in ERF-31 is entirely mine. The spec has no rule
  for it; I flag it rather than let it pass in silence.
- **`ws` in the ERF-31 grammar is Unicode `White_Space`.** Undefined in the
  text.
- **"whitespace" in ERF-51 step 3 is Unicode `White_Space`.** Undefined in the
  text, and I went back and forth: the requirement's rationale argues against
  forgiving retyped characters, which points at ASCII.
- **"digit" is Nd only**, not Nl or No. Undefined.
- **"character" is a Unicode scalar**, not a grapheme cluster. Inferred from
  the fact that the combining-mark clause would otherwise be dead text.
- **Exactly one corpus per input directory.** ERF-54 says a validator must
  reject a corpus carrying two declarations; nothing says what a *deployment*
  directory looks like, and ERF-35/36 are deployment-scoped. I treat the input
  as one corpus and note the limit.

## Tooling friction

- **No usable YAML dependency.** ERF-65 requires YAML 1.2 JSON-schema scalar
  resolution. Yams is libyaml-backed and exposes no schema selection, so using
  it would have made ERF-65 unimplementable — the validator could not tell a
  string from a number the way the requirement defines it. Network was
  reachable; I declined the dependency and wrote the parser, which is roughly a
  third of the code. The binding document predicts this in its own section 6
  and I am the third cold implementation to hit it.
- One Swift syntax error (`for x = [...]` for `for x in [...]`), caught by the
  compiler, no spec bearing.
- Initial noise: my loader reported YAML parse diagnostics for the sources'
  normalized-text markdown files, which have no `type` and are therefore not
  part of the corpus (ERF-54). Fixed by deciding `type` first and reporting
  after — which is itself ERF-54's "walks what it was given, reads each file's
  `type`, and dispatches on it" read in the right order.

## Things the new text made easy, recorded for symmetry

- ERF-43's termination clause ("a claim reached twice being visited once, so
  that a validator terminates on any input") is the only place in either
  document where an implementation technique is authorised outright. It removed
  a decision instead of adding one.
- ERF-51 naming NFC *and* saying why not NFKC pre-empted the question I would
  otherwise have spent the longest on.
- ERF-34 typing `created` as "the same stamp as everywhere else" and saying
  which two readings it was closing meant there was nothing to guess.
- ERF-3 writing out the source list's nesting, and saying it does so because an
  earlier wording misled an independent implementation, meant I built it right
  the first time.
- ERF-52's worked fabrication (`The cat[...]sat` against "The catapult was
  heavy. Someone eventually sat") is the best sentence in the document for an
  implementer: it is a test case, and I ran it as `fab-001`.
