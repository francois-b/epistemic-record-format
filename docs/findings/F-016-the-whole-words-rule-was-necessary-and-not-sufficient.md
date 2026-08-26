---
id: F-016
raised:
  by: "Python and Swift cold re-tests of the corrected spec, independently, 2026-08-25"
  on: 2026-08-25
  observation: "Nineteen fabrication attempts against the corrected quote check; the whole-words rule stopped the original attack and let eight distinct new fabrications through, plus nine remaining ambiguities in the other six rewritten requirements"
basis: demonstrated
specified:
  by: "claude-opus-5, reading both trials' ambiguity registers against the text"
  on: 2026-08-25
  requirement: "ERF-51, ERF-52, ERF-31, ERF-41, ERF-43, ERF-65, ERF-53, section 1, section 3"
  claim: >
    The whole-words rule was stated over letters, digits and marks only, so
    a span could end beside a word-internal character (`12.5`, `board's`,
    `non-binding`) or beside an invisible format character, and the fold
    erased paragraph structure so two paragraphs could be spliced. The
    binding grammar's `id` was greedy to the first quote in the document
    and recognition ran a raw scan that a code span could hijack. `ERF-41`
    had no tie-break and two readings of "absent". `ERF-65`'s examples did
    not satisfy its own condition under the schema it mandates. `ERF-53`'s
    loss excluded its own example, CSL being untyped.
verifications:
  - by: "claude-opus-5, every attack run against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
      All eight fabrications returned PASS against the reference before
      ruling; the original `The cat[...]sat` attack correctly failed. Both
      trials found the format characters, the hyphen and the punctuation
      edges independently.
outcome: promoted
promoted_to: "ERF-51, ERF-52, ERF-31, ERF-41, ERF-43, ERF-65, ERF-53 and sections 1 and 3, ruled directly 2026-08-25"
---

# F-016 · The whole-words rule was necessary and not sufficient

## The eight, all green before ruling

| Source said | Quote said | Why it passed |
|---|---|---|
| `Revenue fell 12.5 percent` | `Revenue fell 12` | span ends on a digit, next char `.` unconstrained |
| `the loss reached $1,000,000` | `the loss reached $1,000` | next char `,` |
| `the plan was non-binding, and management did not recommend` | `binding, and management did not recommend` | span starts after `-`; the negation is gone |
| `The board's own review` | `The board` | next char `'` |
| `cat<U+00AD>apult` | `The cat` | a format character is neither whitespace nor a word character |
| `region<U+200B>locked` | `Availability is region` | same |
| `# Field notes, 1912` then a paragraph | `Field notes, 1912 The catapult was heavy` | whitespace collapse erased the block boundary |
| two paragraphs | `sat on the wreckage. Revenue fell` | same |

Plus, from Swift: `3*4 reviewer-hours` folding to `34 reviewer-hours`, a
number the source never held, because step 2 deleted every star.

## Resolution

Ruled 2026-08-25, all of it, and measured against the three live corpora
before committing.

**`ERF-51`.** Step 1 removes format characters (`Cf`) after NFC. Step 2
removes a marker run with a word character on exactly one side and keeps
one with word characters on both sides or neither, CommonMark's rule for
`_` approximated for the other two; `a*b*c` therefore keeps its stars where
CommonMark would pair them, an approximation that errs toward keeping text.
Step 3 names Unicode `White_Space` and folds a run holding a blank line to
U+2029, a paragraph boundary no span crosses unless the quote holds the
same blank line.

**`ERF-52`.** A character is word-internal when it joins two word
characters: `.` `,` `:` `/` between digits, an apostrophe between letters,
a hyphen between word characters. A span edge that is a word character may
not sit beside a word or a word-internal character.

**`ERF-31`.** `id` excludes `<` and `>`; `anchor` is `char+`; `ws` is
`White_Space` with line breaks; the grammar applies to a comment delimited
first, at the first `-->` that precedes any further `<!--`; recognition is
where CommonMark reads an HTML comment, never in a code span or block; an
unterminated candidate extends to the end of its line and is reported; a
malformed candidate closes no passage and is blanked from whichever holds
it; escapes decode before folding; every id resolves to a claim; the anchor
meets the quote's test, whole words included.

**`ERF-41`.** A standing is admitted only with a vocabulary stance, an
instant, and a `human:` actor; a malformed entry is as though never
written, so the person's previous entry stays newest; a same-instant tie is
flagged and the later in the ledger is current, `standings` being an
ordered list in the model.

**`ERF-43`.** The prohibition is global, a dangling premise is absent from
the relation, self-edges are forbidden in all four relations, and the
retired-premise flag reaches any member of the closure, leaf or not.

**`ERF-65`.** The MUST covers what the JSON schema retypes (`true`,
`false`, `null`, JSON number grammar, `1e3` included); `012`, `no`, `on`
and `0.9.0` are a SHOULD for legacy readers; string-typed means every field
section 3 types as a string, every id and family name, and every source id;
`citation` is CSL's; an empty scalar is `null`; the report is a violation.

**`ERF-53` and section 7.** Model conformance is a property of the loaded
instance; binding conformance is a property of the bytes; a validator says
which it reports. Loss covers anything a file carried: typed values, opaque
values (CSL, extensions, unknowns), list order, narrative frontmatter and
text, and the bytes of held raw and normalized files.

**Sections 1 and 3.** Machine-checkable is defined; a validator names what
it does not check and marks a single-corpus deployment check as partial.
The identifier aliases are declared strings and `CSL` a CSL-JSON item.

**Measured.** Fourteen new quote-check cases, all nine fabrications
included. Across 164 real quotes, two atoms in the capex corpus newly fail
(`acx-22`, `acx-31`): both are honest quotations running across a paragraph
break in the source, written in the atom as one paragraph. The rule treats
the break as part of what the source said, which is the principle the fold
rests on, and the author's fix is the blank line. They are left as they are
because they are the measurement, like the four transcription divergences
before them. All 26 anchors still occur; no findings, ties or dangling
references on any live corpus.
