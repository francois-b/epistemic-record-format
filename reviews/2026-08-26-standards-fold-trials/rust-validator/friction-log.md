# Friction log

Every re-read, guess and inference, in the order they happened. The purity
boundary was: `SPEC-as-tried.md`, `SCHEMA-as-tried.json`, `BINDING-as-tried.md`,
and nothing else in the repository.

## Purity: what I read, and one leak

**Read:** the three named files. `SPEC-as-tried.md` came back truncated at line
1014 of 1213 on the first call and I paged the remainder with a second read of
lines 1004-1213, so the specification was read twice at the overlap and once
everywhere else. `SCHEMA-as-tried.json` and `BINDING-as-tried.md` were each read
once, in full. The schema was then copied into the crate with `cp` rather than
retyped, so the embedded copy is byte-identical
(`9d22e1e6f2c87e22bc817cf3d106d656b3c050818fc051c44b80ff8450818270`).

**The leak.** My first shell command bundled `ls -la` of the trial directory
with a `cargo --version` check, to find out where I was working. The listing
came back showing `bitter-lesson-corpus/`, `rubric.md`,
`rubric-review-gemini-flash.md`, `rubric-review-gemini-pro.md` and two stderr
files. I did not open any of them and did not look again. But I now know there
is a rubric I am being marked against and that two other models have already
been run over something here, and I cannot un-know it. That is a real
contamination of the exercise's premise, entirely my own doing: I should have
scoped the listing to the paths I needed. Recording it rather than quietly
proceeding.

Everything else in the repository — `viewer/`, `types/`, `conformance/`,
`examples/`, `docs/`, `bindings/`, the other `reviews/` subdirectories, the git
history — was never listed, opened, grepped or inferred from.

## Where I wanted to peek, and what the temptation tells me

Three places. Each is a finding about the specification, not about my patience.

1. **`erf-cases-normalization.txt` and `erf-cases-quote-check.txt`.** `ERF-51`
   says in as many words that these case files "are normative for its exact
   behavior: where a reading of the prose and a case disagree, the case
   governs". They sit beside `SPEC.md` in the real repository. So the
   specification names two normative artifacts that the specification-plus-schema
   -plus-binding bundle does not contain, and an implementer who is handed only
   the normative documents is handed a normalization sequence whose exact
   behaviour is settled elsewhere. Every choice I made in `ambiguities.md` A-1,
   A-2, A-17, A-18, A-19 and A-20 is provisional against files I was told
   outrank my reading. This is the sharpest thing the purity boundary surfaced:
   **the normative set is not self-contained.** Named as UNPERFORMED under
   `ERF-51`.

2. **The worked examples.** Section 4 points at the binding document four
   times for a worked atom, claim, survey and source entry, and all four are
   there, in the binding's section 7. That worked. What I wanted and did not
   have was a worked *narrative* and a worked *corpus declaration*: `ERF-31`
   and `YAMLB-1` between them define the one piece of syntax in the format that
   is neither YAML nor plain CommonMark, and the binding shows exactly one
   marker, inline in the rule, with one id and no second binding after it. The
   passage-delimiting rule — "from the end of the previous binding's marker, or
   the start of the body, to the start of its own marker" — is stated but never
   shown, and a worked two-binding narrative would have settled in ten lines
   whether a *failed* candidate closes a passage. It does not; the rule says so;
   I still wanted to see it.

3. **`types/erf.ts`.** Section 3 says it is "a TypeScript rendering of the
   schema for the reference implementation, held to it by a gate, and is not
   normative". I wanted it anyway, when the schema's `Instant` pattern turned
   out to admit non-RFC-3339 values (A-4), to see whether the reference
   implementation had noticed. Resisting that is the whole point of the
   exercise, and the answer would have told me nothing about what conformance
   *is*.

## Re-reads

- **`ERF-51` step 3, four times.** Because U+2029 is `White_Space` and I kept
  not believing the sequence destroys its own separator. Verified it against the
  UCD via ICU4X before accepting it (`icu_properties` says
  `white_space.contains('\u{2029}') == true`), which is when it stopped being a
  misreading and became A-1.
- **`ERF-52`, three times.** The first read to implement it; the second when the
  paragraph clause turned out to be non-operative under literal substring
  matching; the third when I noticed the sentence is textually corrupt in the
  supplied file (A-2) and wanted to be sure I was not looking at a rendering
  artifact of my own reader. Lines 972-974 really do repeat a clause with a
  different noun.
- **`ERF-43`, three times.** "MUST terminate in non-argument leaves" against
  "a premise-less argument has an empty closure and satisfies this vacuously".
  I could not get the two to sit still (A-3).
- **`ERF-41`, twice.** Once to implement, once to check what happens when
  *every* entry is inadmissible. The requirement says an inadmissible entry "is
  treated as never written, so the person's previous admissible entry stays
  their newest" — with none, the claim falls back to `proposal`, which the
  requirement does not say and which follows from "No standings: `proposal`"
  only if you read "no standings" as "no admissible standings". I read it that
  way.
- **`ERF-55` and `ERF-56`, together, twice.** They are inverses and the
  interesting case is the mapping carve-out, which I initially read as covering
  the mapping's contents (A-15).
- **Section 2's conformance classes, twice.** The Validator paragraph is the
  spine of the whole tool and its last two sentences — "A validator MUST name
  the requirements it does not check, and a deployment-wide check (`ERF-36`,
  `ERF-38`) run over a single corpus MUST be named as partial" — are why the
  UNPERFORMED output kind exists at all. Re-read to be certain the naming duty
  was a MUST and not advice.
- **`ERF-68`, twice**, after my first implementation flagged every
  `shipped-as-quotation` source for a missing licence. The requirement's own
  second clause says that status *is* the licence-less case, so the flag was
  wrong (A-9). The schema's `if/then` grouping is what led me astray.

## Guesses and inferences, itemized

Each of these is an invention. None is stated in the three documents.

1. **Discovery.** Nothing says how a validator finds a corpus's files. `ERF-54`
   says "it walks what it was given and dispatches on `type`", so I walk the
   directory recursively, skip dotfiles and dot-directories, try to read a YAML
   document out of every regular file, and report each file with no `type` as
   ignored. Skipping dotfiles is a guess.
2. **Frontmatter detection.** The binding says one record per file, frontmatter
   then a body, and that the declaration and the source list are YAML documents
   with no body. It never says how to tell them apart from the bytes, and
   discovery is "by content and never by path", so extension is not available.
   I chose: a file opening with a `---` line is frontmatter plus body, anything
   else is a bare YAML document. That makes "a record written as a bare YAML
   document" detectable, which I then report.
3. **Closing fence.** I accept `---` or `...` as the closing fence, because
   `...` is YAML's document-end marker. Nothing says so.
4. **Empty body.** "An atom's body is empty" — I read whitespace-only as empty.
5. **"Not text or markdown"** (`ERF-51`'s unavailability rule). Decided from the
   normalized text's file extension: `.md`, `.markdown`, `.txt`, `.text` are
   text, everything else is not. A guess, and the only alternative I could think
   of — sniffing the bytes — is worse.
6. **`ERF-70`'s "another format".** Same method, over the raw file's extension.
   Flagged rather than violated because of it.
7. **"Names no exact version"** (`ERF-70`). I test for a digit anywhere in the
   tool string. `pandoc` fails, `pandoc 3.1.11` passes, and `pandoc latest`
   would pass wrongly.
8. **The SPDX slice.** 24 identifiers, written from memory. Membership is a
   hint; absence is a flag; the real check is named unperformed.
9. **The category list for `ERF-26`.** Eleven strings, written from the
   requirement's one example. Entirely mine.
10. **The universal-negative heuristic for `ERF-25`.** Title starts with "No ",
    or contains "no shipped", "there is no", "nothing in the". Entirely mine,
    and labelled heuristic in the output line so a reader knows.
11. **"Letters or digits"** (`ERF-52`'s hyphen departure) read as
    `char::is_alphanumeric` (A-19).
12. **Leaf-block flushing** in `ERF-51` step 1: I flush at the end of a
    paragraph, heading, code block, HTML block *and list item*, and at the start
    of a code block, list, list item, block quote and HTML block. The list-item
    handling is inferred from the requirement naming "a list item's content"
    among the leaf blocks, which CommonMark does not (A-17). Empty blocks are
    dropped and a thematic break contributes nothing — both invented (A-18).
13. **Backtracking over greedy** for span placement (A-20). Invented; nothing
    picks either.
14. **The `ERF-6` copying trace.** Running the check twice, once with step 2 of
    the fold suppressed on both sides, and flagging when only the full fold
    matches. Entirely my construction. It is the only mechanical shadow I could
    find of "MUST take a quote from the normalized text by copying".
15. **The `ERF-69` degenerate-excerpt test.** "a text holding the quote alone
    proves nothing" made checkable as: the matched spans cover the entire
    normalized text. Mine.
16. **The `x_`-namespace smuggling flags** for `ERF-11` and `ERF-22`. The schema
    closes every object, so the only way to store a forbidden field is under
    `x_`, which `ERF-72` explicitly permits anywhere. I flag `x_` names that
    read like a stored quote-check result or a stored disposition. Mine, and
    a heuristic over field names, which is thin.
17. **Requirement attribution for schema failures.** Section 3.1's field index
    is a field-to-requirement map and I inverted it. Where it gives no answer I
    fall back to `SPEC-3`, and for the three fields it marks *guidance* I use
    `SPEC-4.3`. Both ids are mine.
18. **Per-type validation.** Section 3 says a file conforms when it validates
    against the schema, whose top level is a `oneOf` over six definitions. A
    `oneOf` failure is unreadable, so I dispatch on `type` and validate against
    the one definition, then assert that the whole-schema check agrees. The
    assertion exists so the readable path cannot drift from the sentence the
    specification wrote.
19. **`ERF-60`'s version window.** "Supported" is `0.9`. Major `0` and minor
    `> 9` is lenient; any other major is refused. The specification defines the
    behaviour and not the window, which is correct of it; the window is mine.
20. **Ordering of the `ERF-2` web-mutability test** on the URL scheme (A-8).
21. **`last_change`** for staleness: `last_modified`, else `created`, else
    `conducted`. `ERF-47` says "the last change to what it judged" and never
    defines it for a record that was never edited. Reading a minting stamp as
    the last change is an inference.
22. **The `--erf51-literal` flag.** Not asked for by anything. It exists so A-1
    is demonstrable rather than merely argued, and so the fabrication test
    `h01` can prove the consequence instead of asserting it.

## Things that cost time and were not ambiguities

- `icu_properties` 2.x moved to
  `CodePointSetData::new::<DefaultIgnorableCodePoint>()`; the older
  `sets::default_ignorable_code_point()` shape does not exist. One smoke test to
  find out. Using ICU4X rather than a hand-transcribed table was deliberate:
  `Default_Ignorable_Code_Point` and `White_Space` are UCD properties the
  specification cites by name, and a hand-transcribed table is a re-derivation
  of a standard, which is what `ERF-51`'s "Each step is a standard's, not this
  format's, and that is the point" tells you not to do.
- `yaml-rust2`'s `Tag` lives in `parser`, not `scanner`. One compile error.
- `jsonschema` 0.51's `ValidationErrorKind` is in `jsonschema::error`, not the
  crate root. One compile error.
- My first backtracking search returned a three-valued failure index and was
  wrong. Rewritten as a plain boolean search with a deepest-index side channel.
- My first `last_change` implementation looked for a string at
  `front[key]` when the value is an `ActorStamp` object. It silently returned
  `None` for every record, so no staleness ever fired, and I only caught it
  because the flag corpus was supposed to trip `ERF-47` and did not. A check
  that silently never runs is worse than one that fails, which is the same
  argument `ERF-12` makes about a tool failure written as a verdict.
- The first `bad-erf43-premise-cycle` corpus I wrote was not a cycle. I had
  misread the requirement's parenthetical — "`X assumes Y` and `Y supports X`
  both making `Y` a premise of `X`" — as describing a cycle, when it is
  describing the two ways one premise edge arrives. My own error, and the
  sentence is clear on a second read.

## What I would ask the specification's editors

1. Ship the case files with the normative set, or stop calling them normative.
2. Fix the corrupted sentence in `ERF-52` (A-2).
3. Decide whether `ERF-43`'s "non-argument leaves" is a rule or a restatement
   (A-3); as it stands the sentence has no content under one reading.
4. Either tighten the schema's `Instant` pattern to require seconds or say
   explicitly that RFC 3339 overrides it (A-4). Right now the two normative
   documents disagree about the one field whose whole purpose is ordering.
5. Number the binding's section 1 rules (A-14). They are the binding's core and
   nothing can cite them.
6. Say something about `ERF-51` step 3 and U+2029 (A-1). One clause would do it.
