# Ambiguities in ERF v0.9 (draft), found by implementing it cold in Go

Every entry below is a place where two careful implementers, each reading only
`SPEC-as-tried.md`, could build different things and each believe they had
conformed. For each: the exact spec text, the readings, the reading this
implementation took and why, and what breaks under the other.

Ordered by seriousness. A-01 through A-06 would each change whether a real
corpus passes or fails. The rest are graded down from there.

Where an entry says **demonstrated**, `tests/corpora/` holds a corpus whose
verdict actually changes with the reading, and `tests/run-tests.sh` runs it.

---

## A-01. The Validator conformance class does not bind the quote check or the narrative bindings

> **Validator**: a tool that checks. Binds every machine-checkable MUST that
> applies to the input it accepts: section 6 in full, the serialization rules
> of section 7, and the declaration and source list named under the Corpus
> class.

**Readings.**

1. *The colon introduces the exhaustive list.* A validator binds section 6
   (ERF-35..ERF-52), section 7 (ERF-53..ERF-72), the declaration (ERF-59) and
   the source list (ERF-3, ERF-4, ERF-5). Everything else is out of scope.
2. *"Every machine-checkable MUST" is the rule and the list is illustrative.*
   A validator binds every MUST anywhere in the document that a machine can
   check.

**What reading 1 excludes.** Section 4's record-type requirements are not in
the list: `ERF-6` (the quote MUST be verbatim), `ERF-9` (the grade MUST be one
axis), `ERF-12` (verdicts MUST be one of three), `ERF-13` (id shape),
`ERF-14` (`as_of_date` precision), `ERF-19` (standings MUST carry a full
instant), `ERF-26` / `ERF-27` (search acts). Section 4.6 is not in the list
either: `ERF-31`, `ERF-32`, `ERF-33`. Nor are `ERF-68`, `ERF-69`, `ERF-70`,
`ERF-71`, which sit in section 4.1 but are not among the three source
requirements the Corpus class names.

So under reading 1, a tool that never opens a normalized text, never parses a
narrative binding, and never notices a standing dated `2026-08-22` is a
**fully conforming validator**. The two of the three areas this trial was
asked to implement thoroughly are, on that reading, outside the class.

Reading 1 is also internally strained: `ERF-31` says in as many words "A
validator MUST flag an anchor that does not occur in its passage", and
`ERF-31`'s grammar rule says a non-matching binding "MUST be reported, never
skipped". Those are validator duties stated in a section the class list does
not name. Either the list is not exhaustive, or `ERF-31` binds a class that
does not exist.

**Chosen.** Reading 2. The sentence's main clause ("every machine-checkable
MUST that applies to the input it accepts") is the operative rule, and the
list after the colon reads as emphasis on the parts most easily skipped.
`erfval` checks section 4 and section 4.6 as well.

**What breaks under the other reading.** Two validators disagree about
whether a corpus conforms, with neither wrong. A corpus full of non-verbatim
quotes and dangling narrative bindings passes one and fails the other. Since
the quote check is described in section 4.1 as the thing that "makes a check
re-runnable years later", a validator class that does not bind it is a hole
at the centre of the format.

**Fix.** Say whether the list is exhaustive. If it is, move `ERF-6`,
`ERF-31`, `ERF-32`, `ERF-33`, `ERF-50`, `ERF-51`, `ERF-52` (or their
validator-facing halves) into section 6, or name section 4 in the class.

---

## A-02. "Its passage" is never defined, so the anchor check has no defined haystack

**Demonstrated:** `tests/corpora/amb-passage-scope` — same corpus, a FLAG under
one reading and clean under two others.

> **The anchor occurs in its passage under `ERF-51`**, the same fold the quote
> check uses, applied to the anchor and to the passage alike.

and

> **A validator MUST flag an anchor that does not occur in its passage.**

and, from `ERF-31`'s opening:

> A passage that asserts something SHOULD end with a narrative binding

**Readings.** The document nowhere says where a passage begins.

1. *Since the previous binding.* The passage runs from the end of the previous
   narrative binding (or the start of the body) to the start of this one.
   Bindings partition the prose.
2. *The preceding paragraph.* The passage is the last blank-line-delimited
   block before the binding, which is what "a passage that asserts something"
   most naturally means in prose.
3. *The whole document.* The passage is the narrative body. This never fails
   for an anchor drawn from anywhere in the document.
4. *The containing CommonMark block.* If the binding is inline at the end of a
   paragraph, that paragraph; if it is its own HTML block, undefined.

**Chosen.** Reading 1, exposed as `-passage=since-previous` (default), with
readings 2 and 3 available as `-passage=paragraph` and `-passage=document` so
the divergence is visible rather than buried. Reading 1 was chosen because it
never produces a false flag on a document whose bindings are in order, and
because it degrades gracefully to reading 3 for a document with one binding.

**What breaks under the others.** Reading 3 makes the check nearly vacuous: an
anchor lifted from anywhere in a long essay matches, so the mechanism that
exists to detect that "someone edited the prose" detects almost nothing.
Reading 2 flags a document where the author put the binding after a short
connecting sentence, which is a false positive on ordinary writing. Reading 1
and reading 2 disagree on the demonstrator corpus, where the anchor is two
paragraphs above the binding. Since `ERF-31` says this failure "went unnoticed
until something else happened to look", the sensitivity of the check is the
whole point, and it is undefined.

**Fix.** One sentence: "A binding's passage is the text from the end of the
previous narrative binding in the same document, or the start of the body,
to the start of this binding."

---

## A-03. Independent normalization of elision spans lets a fabricated quote pass

**Demonstrated:** `tests/corpora/amb-elision-matches-mid-word` — verdict
CONFORMS; unit test `TestElisionMatchesMidWord`.

> The quote MUST be split on `[...]` BEFORE normalization [...] each span is
> then normalized independently. Every non-empty span MUST occur in the
> normalized text, in order and without overlap.

combined with `ERF-51` step 3:

> Collapse whitespace runs to a single space, then trim.

**The problem.** Normalizing each span independently means each span is
**trimmed**, so the whitespace that made a span a whole word at its edge is
destroyed. "Occur in" is then plain substring containment. Against a
normalized text reading

> The catapult was heavy. Someone eventually sat on the mat beside it.

the quote `The cat[...]sat` produces spans `The cat` and `sat`. Both occur, in
order, without overlap. **The check passes.** An atom may now record, verbatim
and with a green quote check, that the source says "The cat ... sat" when it
says nothing of the kind. This is the exact failure the format exists to
prevent, produced by two of its own rules interacting.

**Readings.**

1. *Substring containment, as written.* What this implementation does.
2. *Spans are not trimmed at their inner edges.* Trim only the outer edges of
   the first and last span, so an interior span boundary keeps the space that
   made it a word boundary. Rejects the example.
3. *Match must respect word boundaries at a span edge adjacent to an elision.*
   Rejects the example; needs a definition of "word".
4. *The whole quote, with `[...]` replaced by a wildcard, must match with the
   spans anchored at token boundaries.* Rejects the example.

**Chosen.** Reading 1, because it is what the text says and reading 2 requires
inventing a trimming rule the spec does not have. Recorded here rather than
silently improved, because a divergent implementation is a smaller problem
than a silently different one.

**What breaks under the others.** Corpora that pass today start failing:
any quote whose elision falls mid-word-adjacent — `"the ledger[...]entries"`
where the text has `"the ledgers"` — flips from pass to fail. So this cannot
be fixed by a later MINOR: under `ERF-61`'s own definition, changing it
changes the meaning of existing records, which is a MAJOR.

**Fix.** Either state that a non-empty span must occur bounded by whitespace
or by the string ends, or state explicitly that mid-word matching is accepted
and why.

---

## A-04. `ERF-51` says its own prose is not authoritative

> The prose above names each transformation; the conformance case files
> (`conformance/cases/normalization.txt` and
> `conformance/cases/quote-check.yaml`, this repository) are normative for
> its exact behavior: where a reading of the prose and a case disagree, the
> case governs, and a conforming implementation reproduces every pair.

**Readings.**

1. *The cases are a tie-breaker for genuinely ambiguous prose.*
2. *The cases are the normative artifact and the prose is a summary.* An
   implementer who has only the specification document cannot know whether
   their normalization conforms.

**Chosen.** Neither: the cases were deliberately not read for this trial. Every
normalization decision here is a reading of the prose, recorded in
`erfval/norm_test.go` so the divergence can be diffed against the cases later.

**Why this belongs in a list of ambiguities.** The specification's stated
purpose is that it "is written to be handed to an implementer (human or LLM)
to build from". `ERF-51` is the one requirement that says handing over the
document is not enough. Every ambiguity in A-05 through A-09 below is a place
where I could not tell what the cases would say. If the intent is that the
cases ship with the spec, say so at the top; if the intent is that the prose
is sufficient, the prose has to answer A-05 through A-09.

---

## A-05. `ERF-51` step 3: "whitespace" is undefined

> 3. Collapse whitespace runs to a single space, then trim.

**Readings.** ASCII `[ \t\n\r\f\v]`; Unicode `White_Space`; CommonMark's
whitespace set; Go's `unicode.IsSpace`. They differ on U+00A0 NO-BREAK SPACE,
U+2007 FIGURE SPACE, U+202F NARROW NO-BREAK SPACE, U+3000 IDEOGRAPHIC SPACE,
and U+0085 NEL. NFKC in step 1 maps *some* of these to U+0020 (U+00A0 does
**not** map; U+2000..U+200A do), so which set step 3 uses is directly
observable.

**Chosen.** `unicode.IsSpace`, the broadest reasonable set, because a
non-breaking space that an extractor emitted is exactly the "difference the
author did not introduce" the requirement is justified by.

**What breaks under the other.** A quote copied out of a PDF that carries a
non-breaking space fails against a text that carries an ordinary one, in an
ASCII-only implementation, and passes here. Two conforming tools reach
different verdicts on the same pair, which is the thing the requirement's own
sentence promises will not happen.

---

## A-06. `ERF-51` step 2: are the markers removed unconditionally?

> 2. Remove the markdown emphasis and code markers `*`, `_`, and `` ` ``.

**Readings.**

1. *Remove those three characters wherever they occur.* `snake_case` becomes
   `snakecase`; `2 * 3` becomes `2 3`; a source that genuinely contains an
   asterisk loses it from both sides, so the check still passes.
2. *Remove them where they function as markers,* per CommonMark's emphasis
   rules. Requires a CommonMark parser inside the normalizer, and the
   normalizer runs on the quote too, which is a fragment and not a document.

**Chosen.** Reading 1, because the requirement calls it a sequence of three
steps "so that two conforming tools reach the same verdict", and reading 2
makes the verdict depend on a parse.

**What breaks under the other.** Under reading 1 a quote containing
`the file_name field` normalizes to `the filename field` and matches a text
containing `the filename field`, which is a fidelity failure the check is
supposed to catch. Under reading 2 the two do not match. Different verdicts,
same pair. Reading 1 is also silently destructive for source domains where
underscores are content: code, identifiers, chemical notation, LaTeX.

---

## A-07. `ERF-65` does not say whether it binds the document or the parser

> Frontmatter MUST parse under YAML 1.2 using the **JSON schema** [...] Under
> it only `null`, the literals `true` and `false`, and JSON's own number
> grammar resolve to non-string scalars; everything else stays a string.

**Readings.**

1. *A duty on the parser.* An implementation MUST resolve scalars under the
   JSON schema, whatever its library does by default.
2. *A duty on the document.* Frontmatter MUST be written so that it parses
   correctly under the JSON schema — i.e. producers must quote anything
   ambiguous — and a validator flags a file that would resolve differently.

**Chosen.** Reading 1, implemented by hand: `erfval` decodes to a
`yaml.Node` tree and re-resolves every plain scalar itself, because
`gopkg.in/yaml.v3` implements neither the JSON schema nor the YAML 1.2 core
schema. Measured on 2026-08-25, yaml.v3 resolves all of these to non-strings:

| written | yaml.v3 tag | JSON schema |
|:--|:--|:--|
| `2026-08-23` | `!!timestamp` | string |
| `2026-08-23T14:02:00Z` | `!!timestamp` | string |
| `0o14` | `!!int` | string |
| `0x1f` | `!!int` | string |
| `1_000` | `!!int` | string |
| `012` | `!!int` | string |
| `+1` | `!!int` | string |
| `1.` | `!!float` | string |
| `.inf` | `!!float` | string |

`!!timestamp` is not in **any** YAML 1.2 schema — it is a YAML 1.1 survival
that yaml.v3 keeps. So the exact hazard `ERF-65` names ("YAML 1.1 defines a
timestamp type, and common libraries keep it in their default schema") bites
Go too, not only the Python ecosystem the note seems aimed at. PyYAML adds
`yes`/`no`/`on`/`off`/`y`/`n` as booleans on top, so a Python implementation
and a Go implementation diverge from each other *and* from the spec.

**What breaks.** Under reading 2, a corpus writing `timestamp: 2026-08-23`
unquoted is non-conforming and should be flagged. Under reading 1 it is
perfectly fine and the burden is on every reader. `erfval` reports these at
INFO ("quote it") rather than as violations, which is a third position neither
reading licenses. The `SHOULD` in the requirement's last sentence ("A producer
SHOULD quote a timestamp regardless") suggests reading 1, but then the format
depends, for correctness, on every implementer noticing that their YAML
library is wrong. That is a lot to hang on a SHOULD.

**Fix.** State reading 1 explicitly, and add a conformance case file of
scalars — this is precisely the kind of thing the `ERF-51` cases exist for.

---

## A-08. `ERF-66` is scoped to "a record's frontmatter", which leaves the source list unprotected

**Demonstrated:** `tests/corpora/nc-erf3-duplicate-source-id`.

> **ERF-66** A record's frontmatter MUST NOT contain a duplicate key, an
> anchor, an alias, or an explicit tag. YAML permits all four and leaves a
> processor's response to duplicates at its own discretion, so two conforming
> parsers may legally disagree about the same file.

The corpus declaration and the source list are explicitly **not records**
(section 3's comment: "Neither is a record"). So on a literal reading, a source
list may legally contain a duplicate key — and source ids **are** mapping keys
(`ERF-3`). A duplicated source id is exactly the case where "two conforming
parsers may legally disagree about the same file" does real damage: one parser
keeps the first entry, another the last, and two readers check the same quote
against two different normalized texts.

**Readings.** (1) ERF-66 covers only records, as written. (2) ERF-66 is meant
to cover every YAML document the format defines.

**Chosen.** Reading 2. `erfval` applies the structural checks to every typed
file. Note the consequence: my validator reports the duplicate source id under
`ERF-66` rather than under `ERF-3`'s "keyed by a source id unique within the
corpus", because the structural layer sees it first. A validator taking reading
1 reports nothing at all, since `sv.Keys` after any sane parse has already
silently dropped one of them.

**Fix.** Change "A record's frontmatter" to "A record's frontmatter, a corpus
declaration, and a source list".

---

## A-09. `ERF-31`'s grammar admits commas in ids, and its prose forbids them

**Demonstrated:** `tests/corpora/nc-erf31-comma-separated-ids`; unit test
`TestParseBinding`.

> ```
> ids      ::= id (ws+ id)*
> id       ::= one or more characters, none of them whitespace or '"'
> ```
> Every part is required. Ids are separated by whitespace, never by commas,
> because a comma inside an unquoted list invites a parser to guess.

**The problem.** A comma is neither whitespace nor `"`, so under the grammar a
comma is a legal **character inside an id**. A binding written

```
<!-- claims: a-real-claim, kwg-117 "anchor" bound-at=2026-08-24 -->
```

parses cleanly, yielding the ids `a-real-claim,` and `kwg-117`. My validator
reports a violation of `ERF-33` ("resolves to no record") rather than of
`ERF-31`. So the prose's stated intent — a comma should make the parser refuse
rather than guess — is not what the grammar produces. The parser did guess; it
guessed that the comma was part of the name.

**Readings.** (1) Grammar as written; commas attach to ids. (2) The prose is
normative and a comma anywhere in the ids section is a grammar failure.

**Chosen.** Reading 1, because the grammar block is the normative artifact and
the prose sentence explains it rather than amending it.

**What breaks under the other.** Reading 2 reports `ERF-31`; reading 1 reports
`ERF-33`. Both report *something*, which is the important part, but they
report different requirements against different records, and only reading 2
tells the author what actually went wrong.

**Fix.** Exclude `,` (and probably `'`, `<`, `>`) from `id` in the grammar.

---

## A-10. `ERF-31`'s anchor grammar can express strings HTML cannot carry

**Demonstrated:** `tests/corpora/amb-anchor-contains-comment-terminator`.

> The marker MUST be an HTML comment, so that it is invisible in every render
> and survives any markdown pipeline

> ```
> anchor   ::= '"' char* '"'
> char     ::= any character other than '"' and '\', or one of the
>              two-character escapes '\"' and '\\'
> ```
> It carries two escapes because a grammar that cannot express a legal value is
> a defect in the grammar

**The problem.** `-->` is neither `"` nor `\`, so the grammar permits it inside
an anchor. HTML does not: a comment ends at the first `-->`. A passage whose
own words contain `-->` — a pipeline description, an arrow diagram, a shell
snippet — has **no expressible anchor**, which is exactly the defect the
paragraph above says a grammar must not have. The two escapes solve the
quotation-mark case and leave this one open.

**Chosen.** HTML wins: `erfval` finds comments by the HTML rule and then fails
the truncated result against the grammar, reporting `ERF-31` plus a note naming
the conflict.

**What breaks under the other.** An implementer who scans for `<!--` ... and
then applies the grammar greedily to the rest of the line would accept the
anchor, and produce a document whose bindings a browser, a markdown renderer,
and every other tool disagree about. The visible text `bound-at=2026-08-24 -->`
would leak into the rendered prose.

**Fix.** Add `-` runs to the excluded set, or define a third escape, or say
that an anchor containing `-->` is not expressible and the author must pick
different words.

---

## A-11. `ERF-55`'s unknown-field rule contradicts `ERF-61`'s MINOR compatibility promise

> **ERF-55** [...] A producer MUST NOT originate a field the declared
> `spec_version` does not define, outside the extension namespace of
> `ERF-72`. An unknown key is a producer validation error, caught by a
> validator, and never a consumer's licence to refuse (`ERF-57`).

> **ERF-61** [...] A MINOR increment is a backward-compatible addition,
> under-interpreted by an older reader but never misread.

**The problem.** A corpus written under 0.10.0 legitimately carries a field
0.10.0 defines. A validator built against 0.9.0 does not know that field.
`ERF-55` tells it to report a violation; `ERF-61` says the addition is
backward-compatible. There is no rule telling a validator to check the field
set *against the corpus's declared spec_version rather than its own*, and no
mechanism by which a 0.9.0 validator could know 0.10.0's field set.

**Readings.** (1) A validator reports unknown fields as violations against the
field set it knows. (2) A validator reports unknown fields only when the
corpus's declared `spec_version` is one it implements, and otherwise reports
them under `ERF-60`/`ERF-57` as unrecognized content.

**Chosen.** Reading 1, with `ERF-60` emitting an INFO when the MAJOR differs.
`erfval` therefore reports a violation on any field 0.9.0 does not define,
regardless of the declared version, which is wrong for a future MINOR.

**What breaks.** Every corpus written under a later MINOR is reported
non-conforming by every older validator, which makes MINOR increments useless
in practice and pushes producers into the `x_` namespace permanently.

---

## A-12. `ERF-68`: "ships under no licence" is only detectable as the absence of a field

> A source whose normalized text ships SHOULD name the licence that permits
> it [...] The text may also ship under no licence at all, as a short
> quotation for verification and comment; such a source MUST carry the status
> `shipped-as-quotation` rather than leaving the permission unstated, because
> an absent licence field otherwise reads as an oversight rather than as a
> different basis.

**The problem.** Two rules land on the same observable. When `normalized` is
present and `licence` is absent:

- the SHOULD is breached (no licence named), which is an advisory, **and**
- the MUST fires *if* the text ships under no licence — but the only evidence
  a validator has that it ships under no licence is that `licence` is absent.

**Readings.** (1) `normalized` present + `licence` absent + status `shipped`
⇒ violation of the MUST. (2) `normalized` present + `licence` absent ⇒
advisory only, because the validator cannot know whether the author simply
forgot. (3) The status is the assertion: status `shipped` asserts a licence
exists, so a missing `licence` under `shipped` is a violation; that is
reading 1 by another route.

**Chosen.** Reading 1: violation when status is `shipped` with no `licence`;
advisory otherwise. This makes the two `shipped*` statuses mutually
determining, which is defensible given the data model's own inline comments
("`shipped` — under a licence", "`shipped-as-quotation` — under none").

**What breaks.** Under reading 2 a corpus that has quietly lost its licence
metadata still conforms, and the "absent licence field reads as an oversight"
problem the requirement exists to solve is unsolved. Under reading 1, a source
under a licence with no SPDX identifier (the requirement explicitly permits
"prose alone") must still choose between two statuses that both misdescribe
it: it is not a quotation, and its `licence` field cannot hold an identifier.
**That case has no correct encoding.**

---

## A-13. The corpus declaration and the source list have no stated file shape

> **ERF-3** A corpus MUST keep a source list: **a document** whose top level
> is a mapping of exactly two keys

> **ERF-59** A corpus MUST carry a declaration, **a YAML document** under this
> section's rules following the `CorpusDeclaration` shape

versus

> **ERF-53** The canonical interchange form MUST be one record per file: YAML
> frontmatter plus markdown body, **for every record type.**

**Readings.** (1) Records get frontmatter + body; the declaration and source
list are bare YAML documents. (2) Everything is frontmatter + body, since
`ERF-54` says every file self-describes and a uniform shape is simpler.

**Chosen.** Both accepted. `erfval` treats a file as frontmatter + body only
when an opening `---` is followed by a later line that is exactly `---` or
`...`, and as a bare YAML document otherwise.

**Why this is worse than it looks.** A bare YAML document may legally begin
with the `---` document-start marker. `---\ntype: corpus\nid: kwg\n` is
byte-identical to the opening of a frontmatter block with no terminator.
There is no way to tell them apart except by looking for a closing fence, and
if an author writes a declaration with a leading `---` and a trailing `...`
(both legal YAML), a frontmatter-first reader sees an empty body and a
bare-YAML reader sees a valid document — they agree by luck, not by rule.

---

## A-14. `ERF-54` makes every corpus report its own evidence as ignored

> A file carrying no `type` is not part of the corpus; a consumer MUST ignore
> it and MUST report that it did (`ERF-57`).

A corpus "travels as a directory or archive of its records **and their
normalized texts**" (`ERF-59`). Normalized texts are markdown; they carry no
`type`. Raw files under `received.path` carry no `type`. So a literal reading
requires a validator to emit one report line per normalized text and one per
raw file, in every run, forever — a corpus with 200 sources reports 400
ignored files. `erfval` does this at INFO, hidden unless `-info` is passed,
which is a compromise the spec does not license ("MUST NOT hide one either" is
said of flags, not of these).

**Readings.** (1) Report everything, as written. (2) A file named by a source
entry (`normalized`, `received.path`) is corpus content and is not "ignored".
(3) Report once, in aggregate.

**Chosen.** Reading 1, at a suppressible severity.

**Fix.** Exempt files a source entry names.

---

## A-15. `ERF-49`: "someone stands on" has three readings

> A validator MUST flag as unbacked an `observation` someone stands on with
> empty `atoms_for` and empty `surveys`

**Readings.** (1) The claim carries at least one standing entry, of any
stance. (2) The claim's computed disposition is `active` (somebody currently
stands *behind* it). (3) The disposition is anything other than `proposal` —
i.e. at least one standing exists, which collapses to (1).

These differ for a claim every holder has withdrawn from (disposition
`retired`) and for a claim everyone rejects (`rejected`). Under reading 2
neither is flagged; under reading 1 both are.

**Chosen.** Reading 1 (implemented as disposition ≠ `proposal`). "Stands on"
reads as "has been the subject of a stance", and flagging a rejected unbacked
observation seems right: someone rejected it without evidence either.

**What breaks.** Under reading 2, a corpus of withdrawn unbacked observations
raises no flags at all, and `ERF-49`'s "the computed warning a render shows"
shows nothing for exactly the records most likely to be junk.

---

## A-16. `ERF-31`: is a malformed binding a violation or a flag?

> **A binding that does not match this grammar MUST be reported, never
> skipped.**

The requirement says *report*. Section 2 defines exactly two reporting
categories with different meanings — violation and flag — and this sentence
picks neither. The sibling sentence two paragraphs earlier picks one
explicitly ("A validator MUST flag an anchor that does not occur in its
passage. [...] A flag rather than a violation"), which makes the omission here
conspicuous.

**Chosen.** Violation. A malformed binding is a defect in the file being
validated, not a condition created by someone else's permitted act, so
section 2's own justification for the flag category does not apply.

**What breaks under the other.** A corpus with broken bindings would conform.
Given that `ERF-31`'s own motivating story is bindings going unnoticed, a
category that says "this corpus still conforms" is probably not intended — but
nothing in the text says so.

Same question, same silence, for `ERF-33` ("MUST report it and MUST NOT drop
it silently"). I chose violation there too, though `ERF-33`'s failure mode —
a record deleted elsewhere — is structurally identical to `ERF-35`'s, which
the spec explicitly makes a flag. **`ERF-33` and `ERF-35` treat the same event
differently and the spec does not say why.**

---

## A-17. `ERF-40` and `ERF-28` are untestable by a validator handed a directory

> **ERF-40** Standings MUST be append-only; an edit or deletion of an existing
> entry is a violation, **verified against the substrate's history.**

> **ERF-28** What a survey conducted is immutable: `searches` and each act's
> reported yield MUST NOT change after the fact

Section 1 defines a Validator as "a tool that checks" and binds it to "every
machine-checkable MUST that applies to **the input it accepts**". A validator
whose input is a directory has no history. `ERF-63` says a substrate must
preserve "an edit history sufficient to verify `ERF-40`", but no requirement
says a validator must be given one, and no interchange form carries it.

**Chosen.** Not implemented, and said so in the README. `erfval` reports
nothing about append-onlyness.

**What this means for the format.** Two of the format's strongest claims — the
append-only ledger and the immutable survey — have no check that ships with the
records. Anyone diffing an existing system "requirement by requirement" will
find these two unfalsifiable.

---

## A-18. `ERF-70`: "its exact version" has no checkable syntax

**Demonstrated (accidentally, during this trial):** my first heuristic
"the string contains a digit" passed `pymupdf4llm` — the tool's *name*
contains a 4.

> the source MUST name the extracting tool and its exact version
> (`extraction`), and that tool MUST be deterministic

**Readings.** (1) Free text; a validator can only check non-emptiness.
(2) A validator may require a version-looking token. (3) A structured
`{tool, version}` pair, which the data model does not provide.

**Chosen.** Reading 2 with a digit heuristic, reported as a violation. It is
a guess, and it has already produced one false negative on a real tool name.

Determinism is not checkable at all: nothing in the record says whether a
named tool is deterministic, and "A non-deterministic tool MUST NOT be used"
is a rule only a human can apply.

The same problem, one level worse, in `ERF-69`: "A source's normalized text
MAY be an excerpt of the work rather than a whole copy, and MUST then record
who selected the passage and when". Nothing in a source says whether its text
is whole or excerpted, so the MUST has **no detectable trigger**. `erfval`
checks the shape of `excerpt` when present and cannot check its absence.

---

## A-19. `ERF-2`: "mutable at its location" is not machine-decidable

> A source whose raw file is mutable at its location, a web page above all,
> MUST record `received.timestamp`, the date it arrived

A validator cannot tell whether a URL serves stable bytes. `erfval` emits an
advisory when `received.url` is present and `received.timestamp` is absent, and
says in the message that the requirement's trigger is undecidable. `ERF-71`
has the mirror problem in the other direction: "A digest is worth recording
only where the location serves stable bytes", which is also undecidable.

**Consequence.** A validator that enforces this strictly generates false
positives on archival permalinks; one that ignores it lets exactly the mutable
web pages the requirement is about go undated.

---

## A-20. Where do `normalized` and `received.path` point?

The section 4.1 example writes `normalized: normalized/pacioli-1494-geijsbeek.md`
and `path: raw/pacioli-1494-geijsbeek.pdf`. Relative to what? `ERF-54` says
"no meaning lives in a path" and that a consumer "walks what it was given"; a
corpus "travels as a directory or archive". Candidates: the corpus root, the
directory holding the source list, the current working directory, an archive
root.

**Chosen.** Corpus root first, then the source list's own directory.

**What breaks.** A source list held in a subdirectory resolves differently
under the two, so the same corpus has its normalized texts either found or
missing depending on the implementer's guess — and a missing normalized text
is A-21's problem below.

---

## A-21. A dangling `normalized` path: violation, or "check unavailable"?

> **ERF-1** A source's *normalized text* MUST exist before any check runs
> against it

> **ERF-4** Every source MUST either give the path of its normalized text or
> record that none is held and why.

versus `ERF-51`'s handling of a text a validator does not hold:

> Facing a normalized text that is not text or markdown it MUST report the
> check as unavailable rather than pass or fail it, **exactly as it does for a
> text it does not hold.**

**Readings.** (1) A source naming a path whose file is missing is a broken
record: violation of `ERF-1`. (2) It is a text the validator does not hold, so
every quote check against it is simply unavailable and nothing is violated —
which is also what happens when a corpus ships records without its normalized
texts, a case the Security section explicitly contemplates ("a recipient of
the records alone holds citations and locators, not proof").

**Chosen.** Reading 1. The `ERF-4` alternative is explicit: give the path *or*
record the absence. A path that goes nowhere does neither.

**What breaks.** Under reading 1, the entirely legitimate act of shipping a
corpus without its copyrighted normalized texts — which the Security and
privacy section describes as normal — makes the corpus **non-conforming**,
because every source now names a path that is not there. That is a serious
consequence, and the spec has no `status` value for "held upstream, not in
this cut". Reading 2 avoids it and lets a corpus with no texts at all conform
vacuously.

---

## A-22. Section 2's actor convention is a MUST with no requirement id

> *actor*: `human:<id>` for a person, `<producer>/<version>` for a model or
> agent, `process:<id>` for automation. **Every actor id MUST follow this
> convention.**

Section 1 says conformance is claimed per class, and every class is defined by
the requirement numbers it binds. This MUST has no number, so it is in no
class. `erfval` reports it under the invented id `ERF-Actor`, which is not a
thing.

Related: the grammar is ambiguous. `<producer>/<version>` admits anything with
a slash, so `human:alice/bob` matches both the first and the second form, and
a path-like string `process:a/b` matches the second rather than the third.
`erfval` requires `human:` and `process:` ids to contain no slash, which the
spec does not say.

---

## A-23. `ERF-13`: the atom id shape is given by example only

> An atom's `id` MUST be permanent: a mint-time prefix plus a sequence number
> (`kwg-117`), never renamed and never reused.

No character set, no separator rule, no statement of whether the prefix is the
corpus id. `erfval` requires `<something>-<digits>`. A claim id has **no**
stated shape at all (the example is a slug), and a survey id only a SHOULD
about its ending. So `ERF-13` is the one id rule with a shape, stated as an
example in parentheses.

**What breaks.** An implementation requiring `^[a-z]{2,5}-\d+$` rejects
`knowledge-work-governance-117`; one requiring nothing accepts `atom-one`.

---

## A-24. `ERF-41`: no tie-break when a person's entries share a timestamp

> Disposition MUST be computed [...] from the current stances alone, meaning
> **each person's newest entry**.

Two entries by one person at the same instant have no newest. `ERF-19`
requires a full instant precisely so ordering works, but equal instants are
legal. `erfval` breaks the tie by document order, on the reasoning that
`standings` is append-only so later-in-file is later-in-ledger — which the
spec never says, and which is false for a store that holds standings as
database rows (`ERF-63` explicitly permits one).

**What breaks.** A claim flips between `active` and `rejected` depending on
how the store enumerated the ledger. Since `ERF-65`'s own motivating story is
"a claim's computed disposition depend[ing] on how a weekday name sorts", an
unstated ordering rule here is the same class of bug.

---

## A-25. What is a "deployment", operationally?

> **ERF-36** Every record id MUST be unique across every corpus in the
> deployment.
> **ERF-38** A validator MUST reject a deployment containing duplicate record
> ids.

Section 2 defines a deployment as "the set of corpora read and cited together,
under one operator or organization" — a social fact, not a file. Nothing tells
a validator how it is given one: no manifest, no registry, no field on a
declaration naming its deployment. `erfval` takes each command-line directory
as a corpus and their union as the deployment, which is an invention.

**What breaks.** `ERF-38` is unenforceable in the common case where a
validator is pointed at one corpus: the duplicate is in the corpus next door
and nothing says where that is. `ERF-35` has the same problem — every
cross-corpus reference resolves to nothing when the validator was handed one
directory, so a conforming corpus reports violations purely because of how it
was invoked.

---

## A-26. Are source ids and record ids in the same namespace?

`ERF-3` says a source id is "unique within the corpus". `ERF-36` says a record
id is unique across the deployment "regardless of record type". A source is not
a record. So a source id and an atom id may collide, and `ERF-35`'s "Ids are
deployment-unique (`ERF-36`), so one lookup serves every record type" is a
lookup that would then find the wrong thing. `erfval` keeps them in separate
maps. Not implemented: any check that a source id does not shadow a record id.

---

## A-27. `ERF-32`'s `indeterminate` is a state with no home

> Where the comparison cannot be run, a consumer MUST show the binding as
> staleness `indeterminate` and MUST NOT show it as current

`indeterminate` appears in no vocabulary in section 5, is not a field, and is
addressed to a consumer rather than a validator. `erfval` emits it as a FLAG,
which is the closest available category, but a flag says "worth a person's
attention" and `indeterminate` says "I could not tell" — arguably not the same
thing. When *can* the comparison not be run? The spec gives no list.
`erfval` treats an unresolvable id and an unparseable timestamp as the two
cases.

---

## A-28. Miscellaneous smaller gaps

- **`ERF-7`, "MUST NOT contain a URL".** URL is undefined. `erfval` matches a
  scheme, a leading `www.`, or a `doi:` prefix. A bare `archive.org/details/x`
  passes. A citation legitimately naming a work whose *title* contains a URL
  has no escape.
- **`ERF-8`, "`citation_text` MUST be rendered from it".** Requires a CSL
  processor and a named style. Untestable here; reported at INFO as
  not-checked, per the brief's instruction to say so rather than skip
  silently.
- **`ERF-67`, "A record body MUST be valid CommonMark".** Every byte string is
  valid CommonMark — the spec has no error productions. This MUST cannot fail.
- **`ERF-53`, "An atom's body is empty".** Is a trailing newline after the
  closing `---` a body? `erfval` trims whitespace before deciding. A stricter
  reader would reject every file a text editor saves.
- **`body` in the data model vs the serialized body.** `Claim` and `Survey`
  carry `body: string` as an interface field, and `ERF-53` says a store MAY
  hold "body as one more field". Is `body:` inside frontmatter legal in the
  *interchange* form? `erfval` accepts it as a known key and does not compare
  it to the markdown body. Two implementers will differ.
- **`ERF-3`'s "exactly two keys" vs `ERF-72`'s `x_`.** `ERF-72` permits an
  extension field "on any record, declaration, or source". A source *list* is
  none of those, so `x_` on the list document violates `ERF-3`. `erfval`
  enforces that. Probably not intended.
- **`ERF-55` vs `ERF-56` on `evidence_at_stance: {}`.** The present-and-empty
  mapping must be written and the empty lists inside it must be omitted, so
  the only legal encoding of "stamped, faced nothing" is a literal `{}`. Under
  YAML that is a flow mapping; under `ERF-65`'s JSON schema it resolves to an
  empty map, which `erfval` handles. Worth a conformance case.
- **Missing requirement ids.** `ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`,
  `ERF-46`, `ERF-64` do not appear. "Versioning and change control" says
  retired ids are never refilled, so they are presumably retired — but a reader
  diffing an existing system requirement by requirement cannot tell a retired
  id from an editing accident. Publish the retired list.
- **`ERF-25`'s "universal negative" trigger.** "A claim of the form 'no shipped
  tool does X' MUST be audited as scoped" — a validator cannot detect the form
  of a natural-language title. Not implemented.
- **`ERF-9` / `ERF-10` grading.** Both are MUSTs about a judgment. `erfval`
  can only check that the value is in the closed set. Not implemented as
  stated; noted rather than skipped.
- **`ERF-47`'s "the last change to what it judged".** For a `finding_audit`
  that is the atom's `last_modified` — but an atom's *source's* normalized text
  could change under it, and nothing stamps that. `normalized_digest` exists
  and no requirement says a change to it ages the audits that depend on it.
- **RFC 3339 second-precision.** `ERF-19` requires "a full RFC 3339 instant".
  `2026-08-23T14:02Z` (no seconds) is not RFC 3339 and Go rejects it; some
  parsers accept it. Another parser-behaviour dependency the spec does not pin.
- **An empty plain scalar under the JSON schema.** `key:` with nothing after
  it. JSON has no such production, so `ERF-65` does not say what it resolves
  to. `erfval` treats it as null; another implementation could treat it as the
  empty string, which changes whether `why: ` breaches `ERF-39`'s "non-empty".
- **`ERF-51`, "a normalized text that is not text or markdown".** How does a
  validator decide? By file extension, by a UTF-8 check, by sniffing for NUL
  bytes, by a media type nobody records? `erfval` uses extension plus a NUL
  scan. A source whose normalized text is `notes` with no extension is text
  here and might not be elsewhere.
- **How many source lists may a corpus keep?** `ERF-3` says a corpus "MUST
  keep a source list". `ERF-54` says exactly one file MUST carry `type:
  corpus` and says nothing about `type: sources`. `erfval` merges multiple
  lists and emits an advisory. Two lists declaring the same source id
  differently have no stated resolution.
- **A source that both ships a text and declares an absence.** `normalized:
  path` together with `status: not-redistributable`. The two contradict; no
  requirement addresses the combination. `erfval` calls it a violation of
  `ERF-5`.
- **`ws` in the `ERF-31` grammar is undefined.** Space only, ASCII
  whitespace, or Unicode? It decides whether a binding may span lines.
  `erfval` uses Unicode whitespace, so a binding wrapped across two lines
  parses; an implementation reading `ws` as `[ \t]` would reject it.
- **Bindings outside a narrative.** Nothing says whether a narrative binding
  in a *claim's* body is one. `erfval` recognizes it, does not validate it,
  and reports at INFO.
- **A binding id that resolves to a non-claim.** The marker says `claims:`,
  but `ERF-33` speaks only of an id that "resolves to no record". An id that
  resolves to an *atom* satisfies `ERF-33` literally. `erfval` reports an
  advisory.

---

## A-29. A validator has no category for a breached SHOULD, or for a check it could not run

> **A flag is not a violation.** A validator reports two kinds of thing, and
> they answer different questions.

Section 2 defines exactly two. Neither fits a breached SHOULD (`ERF-68`'s
licence naming, `ERF-18`'s restatement, `ERF-20`'s evidence stamping,
`ERF-28`'s dated survey id, `ERF-71`'s digest), and neither fits a check the
validator could not run — which `ERF-51` explicitly requires ("MUST report the
check as unavailable rather than pass or fail it") and which section 2 gives
no category for. "Unavailable" is not a violation and is not "worth a person's
attention" in the sense flags are defined by.

`erfval` invents two more severities, ADVISORY and INFO, and says so in its
output. A validator that only has the two the spec names must either promote
SHOULD breaches to flags (drowning the real flags) or drop them (which makes
the SHOULDs invisible). Two implementations will pick differently and their
outputs will not be comparable.

**Fix.** Name the third and fourth categories, or say explicitly that a
validator reports only MUSTs and the designated flags.

---

## Count

**29 numbered entries**, of which A-01, A-02 and A-03 change whether a real
corpus is reported as conforming, and A-04 says the prose alone is not
sufficient to settle A-05 and A-06.
