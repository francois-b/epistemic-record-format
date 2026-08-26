# Ambiguities remaining in the seven rewritten requirements

Built cold from `SPEC-as-tried.md` and `BINDING-as-tried.md` only. Each entry
quotes the exact text, enumerates the readings two careful implementers could
take, names the one I built, and says what breaks under the other.

Verdict per requirement, up front:

| # | Requirement | Verdict | Open readings |
|:--|:--|:--|:--|
| 1 | `ERF-51` / `ERF-52`, the quote check | **OPEN** | 5 |
| 2 | `ERF-43`, the premise closure | **OPEN** | 4 (both questions asked are answered; the rest are not) |
| 3 | `ERF-41`, disposition | **OPEN** | 3 |
| 4 | `ERF-31`, narrative bindings | **OPEN** | 7 |
| 5 | `ERF-65`, the quoting obligation | **OPEN** | 4 |
| 6 | `ERF-53` and §7's opening, bindings and loss | **OPEN** | 4 |
| 7 | the Validator conformance class | **OPEN** | 4 |

Nothing in the seven came out fully determined. Several individual *clauses*
did, and they are marked DETERMINED inline; that is a real result and the
rewrites earned it.

---

## §1 — `ERF-51` and `ERF-52`, the quote check

### First, the framing problem: `ERF-51` says the prose does not govern

> The prose above names each transformation; the conformance case files
> (`conformance/cases/normalization.txt` and
> `conformance/cases/quote-check.yaml`, this repository) are normative for its
> exact behavior: where a reading of the prose and a case disagree, the case
> governs, and a conforming implementation reproduces every pair.

This trial asks whether the prose alone determines one implementation.
`ERF-51` answers that question itself, in the negative, by construction: the
prose is explicitly subordinate to files it does not contain. Every reading
below is therefore *provisionally* open — a case file may settle any of them —
and none of them can be settled by reading. A cold implementer holding only
`SPEC.md` is told, in the requirement itself, that their reading may be
overruled by an artifact they have not been given.

The same structure appears in section 3: "The normative data model is the file
`types/erf.ts` [...] it omits the file's header comments and its identifier
alias definitions (`AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId`,
`FamilyName`, `CSL`); where the two differ, the file governs." Two of the
seven requirements under test (`ERF-51`/`ERF-52` and `ERF-65`) hang on
artifacts the specification names as governing and does not include.

### DETERMINED: the normalization form

> 1. Unicode NFC.

Named, and defended at length against NFKC ("NFC and not NFKC, which was the
first choice"). No reading remains. Same for "Case MUST NOT be folded", for
the three-step order, and for "The quote MUST be split on `[...]` BEFORE
normalization".

### DETERMINED: "in order and without overlap"

Not an ambiguity, though it looks like one. Taking the earliest
boundary-legal occurrence of span *i* minimises span *i*'s end position, so it
never starves span *i+1*: greedy-leftmost and full backtracking agree on every
input. I implemented backtracking (`locate_spans`) and confirmed it. An
implementer who reasons about it reaches one answer.

### DETERMINED: the empty-span rule

> A quote whose spans are all empty MUST fail rather than trivially pass.

Covers `quote: ""` and `quote: "[...]"` alike. One reading.

### AMBIGUITY 1.1 — "a letter, digit, or combining mark" names no character set

> where a span begins with a letter, digit, or combining mark, the character
> before its occurrence MUST NOT be one, and where it ends with one, the
> character after MUST NOT be one

**Readings.**

- **(A)** Unicode general categories `L*`, `N*`, `M*`. "Letter" = `L*`,
  "digit" = all of `N*`, "combining mark" = `M*`.
- **(B)** `L*`, `Nd`, `M*` — "digit" read narrowly, so Roman numeral `Ⅷ`
  (`Nl`) and `½` (`No`) become boundaries.
- **(C)** Python's `\w` / `str.isalnum()`, which adds `_` (already deleted by
  step 2) and drops nothing.
- **(D)** ASCII `[A-Za-z0-9]`.

**Chosen: (A).**

**What breaks under the others.** Under (D) every non-ASCII letter is a legal
boundary, so a French, German or Greek source loses the rule entirely: `cat`
out of `catéapult` passes, and so does `Bund` out of `Bundesbank` only if a
non-ASCII letter is adjacent — but more damagingly, `naiv` out of `naïve`
passes, because `ï` is not `[A-Za-z]`. That is the exact failure mode the
spec's own note about the seventeen character folds says it wanted to avoid
("a French source failed a format that claimed to fold quotation marks"). (A)
and (B) differ only on numeric-adjacent quotes and are unlikely to bite; (A)
and (D) differ on any non-Anglophone corpus.

### AMBIGUITY 1.2 — step 2 removes characters, or removes markup?

> 2. Remove the markdown emphasis and code markers `*`, `_`, and `` ` ``.

**Readings.**

- **(A)** Delete every occurrence of those three characters, unconditionally.
- **(B)** Delete them only where CommonMark reads them as emphasis or code
  delimiters — which requires parsing the body as CommonMark, since `_` inside
  a word is *not* an emphasis delimiter in CommonMark, and neither is a `*`
  with whitespace on both sides.

**Chosen: (A).** The rationale sentence is about (A)'s effect ("a source that
italicises a word mid-sentence yields `*however*` in one and `however` in the
other"), and (B) drags a CommonMark parser into a check the spec elsewhere
insists needs no conversion.

**What breaks under the other.** Under (A) a source containing the identifier
`MAX_LEN` folds to `MAXLEN`, and a quote spelled `MAXLEN` — a string the
source does not contain — passes. Under (B) it does not. Any corpus quoting
code, file paths, `snake_case` names or multiplication (`a*b`) gets different
verdicts. `tests/erf51-52-quote-check/atoms/qc-012.md` shows the same
mechanism inside a word: `cat*apult` and `catapult` are one quote under (A).

### AMBIGUITY 1.3 — which characters are "whitespace"?

> 3. Collapse whitespace runs to a single space, then trim.

**Readings.** (A) Python's `str.split()` set — Unicode `White_Space`, which
includes U+00A0 NO-BREAK SPACE and U+3000 IDEOGRAPHIC SPACE. (B) ASCII
`[ \t\n\r\f\v]`. (C) CommonMark's whitespace definition.

**Chosen: (A).**

**What breaks under the others.** Extracted web text is full of U+00A0. Under
(B) a quote typed with an ordinary space fails against a source holding a
non-breaking one; under (A) it passes. Neither is obviously right — (B) is
arguably more faithful, since which space character a source used is "a fact
about the source" by the spec's own reasoning about glyphs — and the spec does
not choose. Note that U+200B ZERO WIDTH SPACE is *not* whitespace under any of
the three, which is where AMBIGUITY 1.4 comes from.

### AMBIGUITY 1.4 — format characters (`Cf`) are neither whitespace nor word

Not stated anywhere; it falls out of 1.1 and 1.3 together. U+00AD SOFT HYPHEN
and U+200B ZERO WIDTH SPACE are category `Cf`: step 3 does not remove them,
and they are not "a letter, digit, or combining mark", so they read as word
boundaries. Every hyphenation point a PDF extractor leaves in a normalized
text becomes a legal place to cut a word in half and quote the fragment. See
`tests/fabrication-succeeded/atoms/fab-003.md` and `fab-007.md`.

An implementer who adds `Cf` to the "wordish" set, or strips `Cf` in step 2,
gets a different and safer validator, and nothing in the text tells them not
to. Third reading: treat `Cf` as whitespace and collapse it.

### AMBIGUITY 1.5 — what happens when there is no normalized text

> **ERF-1** A source's *normalized text* MUST exist before any check runs
> against it

against

> **ERF-4** Every source MUST either give the path of its normalized text or
> record that none is held and why.

`ERF-4` explicitly permits a source with no normalized text — that is what the
`not-redistributable` / `access-restricted` / `licence-unverified` statuses are
for. An atom may then quote a source whose quote can never be checked.

**Readings.** (A) the check is *unavailable* and the atom is neither pass nor
fail (the treatment `ERF-51` gives to a text that is "not text or markdown").
(B) the atom violates `ERF-1`, because a check is required and cannot run.
(C) the atom is fine and nothing is reported.

**Chosen: (A)**, reported as a notice. `ERF-51` names the unavailable
treatment for one cause only ("a normalized text that is not text or
markdown... exactly as it does for a text it does not hold"), and that
trailing clause is the only hook for (A). It is doing a lot of work for a
subordinate clause.

**What breaks under the others.** Under (B) a conforming corpus that withholds
a copyrighted text cannot carry atoms quoting it, which contradicts `ERF-5`'s
whole purpose. Under (C) an unverifiable quote is silently indistinguishable
from a verified one, which is the failure `ERF-31`'s new paragraph calls "a
confident sentence".

---

## §2 — `ERF-43`, the premise closure

### DETERMINED: the orientation

> The premise relation MUST admit no cycles, where `X assumes Y` and `Y
> supports X` both make `Y` a premise of `X` (`ERF-24`)

Read with `ERF-24` ("An argument's premises are the targets of its own
outgoing `assumes` edges together with the claims that carry `supports` edges
pointing at it"), the orientation is unambiguous: the relation runs from a
claim to its premises, `assumes` forward, `supports` backward. **Yes, the text
tells you unambiguously how to orient them.**

One readability trap worth naming: the sentence lists `X assumes Y` and `Y
supports X` side by side in a sentence about cycles, and both edges point the
*same* way. On a fast read it looks like the definition of a cycle. It is
not — it is the definition of the orientation, and the pair is a doubled
premise edge. `tests/erf43-premise-closure/claims/doubled-a.md` pins it.

### DETERMINED: termination, and its authorisation

> The closure is followed over distinct claims, a claim reached twice being
> visited once, so that a validator terminates on any input, conforming or
> not.

**Yes** on both halves of the question. A validator terminates on every input,
and the text authorises exactly the thing that makes it terminate. Confirmed
against `mutual-p` / `mutual-q`, the case the same paragraph says "made a
literal traversal run forever": my implementation reports the cycle and exits.

### DETERMINED: an argument leaf inside a closure is a violation

> The closure is what the edges *reach* and does not include the argument
> itself, so an argument with no premises has an empty closure and satisfies
> this rule vacuously [...] Reading the root into its own closure would make
> the same record a violation here and a flag there.

That last sentence settles it: the same record *is* a violation when it sits
inside someone else's closure and a flag when it is the root. One reading.

### AMBIGUITY 2.1 — is the cycle prohibition global, or scoped to closures?

> The premise relation MUST admit no cycles

**Readings.**

- **(A)** The premise relation is a relation over all claims. Any cycle in it
  is a violation, whether or not any argument reaches it.
- **(B)** The premise relation exists only as a feature of an argument's
  closure (`ERF-24` defines premises only for arguments), so a cycle matters
  only when some argument reaches it.

**Chosen: (A).**

**What breaks under (B).** Two observations in a mutual `assumes` cycle
conform, and then adding one unrelated `argument` with an edge into the pair
makes a previously conforming corpus non-conforming without either observation
being touched — the exact "one person's permitted act makes another person's
untouched corpus non-conforming" pattern that §1 says the format flags rather
than violates. Under (A) the cycle is caught where it is written.
`tests/erf43-premise-closure/claims/orphan-cycle-a.md`.

### AMBIGUITY 2.2 — an unresolved premise

An argument's only `assumes` edge names an id that resolves to nothing.
`ERF-35` makes the dangling reference a violation. Does `ERF-43` *also* fire?

**Readings.** (A) drop the unresolved premise from the relation, so the
argument may become a leaf and may then trip `ERF-43` from inside someone
else's closure. (B) treat an unresolved id as a non-argument leaf, satisfying
termination. (C) treat the closure as uncomputable and report nothing under
`ERF-43`.

**Chosen: (A).** Under (B) the corpus reports one violation instead of two and
loses the information that the argument is now groundless.
`tests/erf43-premise-closure/claims/dangling-premise.md`.

### AMBIGUITY 2.3 — "a leaf whose disposition is `retired`"

> A validator MUST flag a closure that terminates in a leaf whose disposition
> is `retired`

**Readings.** (A) only leaves — closure members with no premises of their own.
(B) any member of the closure whose disposition is `retired`, since a retired
premise "hollows the argument above it" (§1's own wording) regardless of
whether it is a leaf.

**Chosen: (A)**, on the literal word "leaf".

**What breaks under (B).** A retired *intermediate* premise — an argument's
premise that itself has premises — produces no flag under (A). §1's motivating
sentence, "a premise retired elsewhere hollows the argument above it", is
about premises generally, not leaves, so (A) under-reports against the stated
motive.

### AMBIGUITY 2.4 — "Self-edges MUST NOT exist"

Stated inside `ERF-43`, which is about the premise relation. Does it forbid a
`conflicts-with` or `decomposes-into` self-edge too?

**Readings.** (A) all four relations. (B) only the premise-bearing ones
(`assumes`, `supports`).

**Chosen: (A).** Low stakes, but a corpus with `X conflicts-with X` conforms
under (B) and does not under (A).

---

## §3 — `ERF-41`, disposition

### DETERMINED: the out-of-vocabulary stance

> A standing whose `stance` is outside that vocabulary is a producer error
> (`ERF-55`), MUST be reported, and MUST be left out of this computation as
> though the entry were absent

This is now determinate, and it settles the case that the rewrite targeted.
"As though the entry were absent" also settles the follow-on the sentence does
not mention: if the excluded entry was that person's newest, that person's
*next* newest valid entry is their current stance
(`tests/erf41-disposition/claims/d6-bogus-newest.md` → `active`, not
`proposal`). And if every entry is excluded, "as though the entry were absent"
makes the ledger empty, so "With no standings at all the disposition is
`proposal`" applies rather than "nothing remaining means `retired`"
(`d7-all-bogus` → `proposal`). Both fall out of the one phrase, and I take
them as determined.

### The claim the text makes about itself is false

> With that, every input has exactly one reading.

It is not true. Two inputs remain undetermined, below. This sentence is the
most dangerous line in the seven, because it invites an implementer to stop
looking.

### AMBIGUITY 3.1 — two entries, one person, the same instant

> from the current stances alone, meaning each person's newest entry

`ERF-19` requires "a full RFC 3339 instant carrying both a time and an
offset", which reduces collisions but does not forbid them, and `ERF-40`
forbids editing or deleting either entry, so both stay on the record forever.
With two entries at `2026-08-05T10:00:00Z` by `human:francois`, one `for` and
one `against`, there is no newest entry.

**Readings.** (A) last in serialization order wins. (B) first in
serialization order wins. (C) the tie is itself a disagreement, so the claim
reads `contested`. (D) the corpus is non-conforming and the disposition is
refused.

**Chosen: (A)** — `tests/erf41-disposition/claims/d8-tie.md` computes
`rejected`.

**What breaks.** (A) and (B) give opposite answers on the same file. Worse,
(A) and (B) are answers about *bytes*, and §7 says "Conformance is a property
of a corpus as loaded into the model, and is the same in every binding". A
relational binding with no ordering column loads the same model instance and
cannot reproduce (A). So the tie-break I chose is not expressible in the model
the spec says conformance lives in. (C) is defensible and gives a third
answer. This is the single sharpest hole in `ERF-41`.

### AMBIGUITY 3.2 — an entry whose `timestamp` will not parse

`ERF-19` makes a bare date a violation. `ERF-41` does not say what the
disposition computation does with the offending entry.

**Readings.** (A) keep it and order it as best you can (I sort unparseable
stamps earliest, and a bare date at the start of its day). (B) exclude it, on
the `ERF-41` principle that a producer error is left out "as though the entry
were absent" — but that clause is written about `stance`, not `timestamp`.
(C) refuse to compute a disposition for the claim.

**Chosen: (A)**. `tests/erf41-disposition/claims/d9-bare-date.md` still
reports `active`. Under (B) it reports `proposal`. Under (C) nothing.

### AMBIGUITY 3.3 — who is "each person"?

> each person's newest entry

Person identity is the `by` string, and `ERF-21` requires it to be a `human:`
actor. When `by` is absent or malformed — already an `ERF-39` / `ERF-21`
violation — every such entry collapses into one pseudo-person, or each becomes
its own, or they are excluded. Not addressed. I collapse them. Low stakes,
but it changes `contested` to `rejected` on a corpus with two malformed
entries of opposite stance.

---

## §4 — `ERF-31`, narrative bindings

The passage definition is unambiguous at three of the four edges the brief
names, and not at the fourth.

- **First binding** — DETERMINED. "or the start of the body where there is
  none". The body is what follows the frontmatter (binding §1).
- **Last binding** — DETERMINED. A passage is defined only as running *up to*
  a marker, so text after the last marker belongs to no passage and is checked
  by nothing. `tests/erf31-narrative-passage`, CASE M.
- **Two bindings with nothing between them** — DETERMINED in outcome. The
  passage is the empty string and no non-empty anchor can occur in it, so the
  second binding is always flagged. CASE B. The spec's rationale paragraph
  ("Nothing wider serves") never considers this case, but the definition
  decides it.
- **A malformed candidate between two bindings** — NOT DETERMINED. Below.

### AMBIGUITY 4.1 — does a malformed candidate close the passage above it?

> A binding's passage is the text from the end of the previous binding's
> marker, or the start of the body where there is none, to the start of its
> own marker

with

> A comment opening `<!--` followed by `claims:` IS a narrative binding:
> recognizing one and validating one are separate acts, and a consumer
> performs them in that order.

**Readings.**

- **(A)** A *recognized* candidate is a narrative binding, full stop, so it
  closes the passage above it whether or not it parses. The second quoted
  sentence says so in as many words.
- **(B)** Only a *valid* binding closes a passage. The first quoted sentence
  is followed by "a binding closes the passage above it (section 2), and the
  previous binding closed the one before" — a description of bindings that
  actually do closing work. A malformed comment closes nothing, so the next
  binding's passage reaches back past it.

**Chosen: (A).**

**What breaks under (B).** Opposite verdicts on the same file, for a check
whose entire output is a flag that tells a human to look. CASE E in
`tests/erf31-narrative-passage/narratives/edges.md` is built to separate them:
its anchor occurs only in the malformed candidate's own paragraph, so under
(A) the anchor is flagged broken and under (B) it is fine. Two validators, one
narrative, contradictory reports.

### AMBIGUITY 4.2 — how are comments found: raw text, or a CommonMark tree?

The grammar is stated over characters, and nothing says how to locate the
`<!--` in the first place. But `ERF-67` requires the body to be valid
CommonMark, and `ERF-31` requires the marker to be "an HTML comment".

**Readings.** (A) scan the raw text for `<!--`. (B) parse the body as
CommonMark and take only the nodes that are actually HTML comments — which
excludes a `<!--` inside a code span, a fenced code block, or an indented code
block.

**Chosen: (A)**, because a validator with no CommonMark parser is the obvious
build and because `ERF-51`'s "A validator therefore never converts" sets the
tone.

**What breaks under (A) — and this is a defect, not just a divergence.** A
document that mentions `` `<!--` `` in an inline code span, which any document
*explaining* narrative bindings will do, opens a comment that a raw scanner
never sees closed until the *next* `-->`, which is the closing marker of the
next real binding. That binding is then consumed as comment text and
disappears entirely. CASE O in the test narrative does exactly this: the file
holds fifteen markers and `recognize_bindings()` returns fourteen. The claims
that binding named vanish from the narrative silently — which is precisely the
failure the paragraph introducing "recognize then validate" exists to stop:

> Without this rule a required part does not make a binding invalid, it makes
> it invisible, because a comment failing the grammar is indistinguishable
> from any other HTML comment and the claims it named simply vanish from the
> narrative.

The new rule closes that hole for malformed bindings and leaves it wide open
for well-formed ones sitting after a code span.

### AMBIGUITY 4.3 — `ws` is never defined

```
narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
                      ws+ "bound-at=" date ws* "-->"
```

`ids`, `id`, `anchor`, `char` and `date` all have productions. `ws` has none.

**Readings.** (A) Unicode whitespace (`\s`). (B) ASCII space and tab only —
in which case a binding wrapped across two lines, which is the normal shape
once it names four claims, does not parse. (C) CommonMark whitespace.

**Chosen: (A).** Under (B), every multi-line binding in a real corpus becomes
a violation. The `id` production says "one or more characters, none of them
whitespace or `'"'`", which leans on the same undefined word.

### AMBIGUITY 4.4 — are the escapes decoded before the fold?

> `char ::= any character other than '"' and '\', or one of the two-character
> escapes '\"' and '\\'`

and

> **The anchor occurs in its passage under `ERF-51`**

**Readings.** (A) unescape the anchor (`\"` → `"`, `\\` → `\`) and then fold
and match, so the anchor's *value* is compared against the passage. (B) fold
and match the anchor's raw source text, backslashes included.

**Chosen: (A).** Under (B), an anchor lifted from a passage containing a
quotation mark can never match, which destroys the escape mechanism's stated
purpose ("a passage whose own words are in quotation marks would otherwise
have no anchor at all"). (A) is clearly intended and equally clearly unstated.
CASE G tests it.

### AMBIGUITY 4.5 — an empty anchor is legal and vacuous

`anchor ::= '"' char* '"'` admits `""`. "Every part is required" is satisfied:
the anchor is present. The occurrence test then passes against every passage,
including an empty one.

**Readings.** (A) legal, and the check is vacuous — flag it or say nothing.
(B) `char*` must match at least one character in spirit, so `""` violates the
grammar.

**Chosen: (A)** with a flag of my own invention, which no requirement
authorises. Under (B) it is a violation. A producer that wants a binding
exempt from the anchor check writes `""` and no conforming validator can
object. CASE C.

### AMBIGUITY 4.6 — where does an unterminated candidate end?

`<!-- claims: c1 "x" bound-at=2026-08-01` with no `-->` anywhere after it.
It is recognized, so it must be reported. But its *extent* is undefined, and
the extent is what the next binding's passage starts from.

**Readings.** (A) it runs to the end of the body, swallowing everything after
it. (B) it ends at the end of its line. (C) it has no extent, so it delimits
nothing.

**Chosen: (A).** CASE L. Under (B) or (C), any bindings after it are still
seen; under (A) they are not — the same silent-vanishing failure as 4.2.

### AMBIGUITY 4.7 — must a bound id be a *claim*?

The keyword is `claims:`. `ERF-33` says only:

> A consumer encountering a narrative binding whose id resolves to no record
> MUST report it

**Readings.** (A) an id resolving to an atom or a survey is an error, because
the field is named `claims`. (B) it resolves to *a record*, which is all
`ERF-33` asks, so it is fine.

**Chosen: (A).** CASE I binds a survey id and I report it. Under (B) that
report is a false positive.

### Also open, carried from §1

Does the anchor test use `ERF-52`'s whole-words rule? `ERF-31` says "under
`ERF-51`, the same fold the quote check uses" — naming only the fold, then
saying "This format answers *does this string occur in that text* exactly
once". Reading (A): plain substring after the `ERF-51` fold; an anchor
`"cat"` matches a passage saying `catapult`. Reading (B): the whole-words rule
applies too, because it is part of "the quote check". Chosen: (A).

---

## §5 — `ERF-65`, the quoting obligation

> A validator MUST report a string-typed field that arrived as any other type.

### Which fields are string-typed: mostly yes, three gaps

For the record types the answer is clear enough to implement: section 3's
TypeScript mirror types nearly every field as `string`, and
`erf_validate.py`'s `ATOM_SPEC` / `CLAIM_SPEC` / `SURVEY_SPEC` transcribe it
directly. Three gaps:

1. **`families: FamilyName[]`.** Section 3 states outright that it "omits the
   file's [...] identifier alias definitions (`AtomId`, `ClaimId`, `SurveyId`,
   `SourceId`, `CorpusId`, `FamilyName`, `CSL`)". `FamilyName` is therefore
   undefined in the document I was given. `ERF-65` then uses "a family name
   such as `"012"` or `"no"`" as an example of a string-typed field, which
   settles it by example rather than by type. Same for source ids, which are
   mapping *keys*, and which the same sentence settles.
2. **`citation?: CSL`.** Entirely undefined here, and `ERF-53`'s own example
   — "a store that returns `chapter-number: 36.0` for `36` has lost" — says a
   CSL field is legitimately a *number*. So a validator cannot type-check
   inside `citation` at all. I skip it (`'opaque'`), which means an unquoted
   `title: 2018` inside a citation block passes.
3. **Mapping keys generally.** The example `"012"` establishes that source ids
   count. Nothing says whether any other key does.

A cold implementer with no access to `types/erf.ts` — which is the situation
this trial constructs — cannot close 1 or 2 from the prose.

### AMBIGUITY 5.1 — "arrived as any other type" under *which* schema?

> Where the model types a field as a string and its bare spelling would
> resolve to another type **under this schema**, a producer MUST quote it:
> `as_of_date: "2018"`, `hits_reported: "0"`, `spec_version: "0.9.0"`, and a
> source id or family name such as `"012"` or `"no"`.

The condition and the examples describe different sets. Under the JSON schema
the sentence just mandated:

| Example | Resolves to another type under the JSON schema? |
|:--|:--|
| `as_of_date: 2018` | yes, `int` |
| `hits_reported: 0` | yes, `int` |
| `spec_version: 0.9.0` | **no** — two dots, not a JSON number |
| source id `012` | **no** — leading zero, not a JSON number |
| family name `no` | **no** — not a JSON literal |

Three of five do not satisfy the stated condition. Two of those three are
hazards only for a reader that ignores the pinned schema. The parenthetical
that follows ("A bare year is JSON number grammar, so the schema that stops
the timestamp hazard does not stop this one") explains `2018` and then the
`spec_version: 1.0` case, and never explains `012` or `no` at all.

**Readings.**

- **(A)** A validator reports only what its own JSON-schema loader retypes.
  Then `source: 012` unquoted is conforming, and the binding's own example of
  a MUST is not enforceable.
- **(B)** A validator reports anything a plausible reader would retype, which
  requires it to carry a second, unspecified resolution table — YAML 1.1's,
  presumably, though the binding never names it as normative.

**Chosen: both, split by severity** — (A) as a violation, (B) as a flag. That
split is mine; no text authorises it.

**What breaks.** Two validators disagree about whether `families: [no]` is a
violation, a flag, or silence. `tests/erf65-yaml-typing/` shows all three
categories side by side.

### AMBIGUITY 5.2 — is "MUST report" a violation or a flag?

`ERF-65` says only "MUST report". §1 defines two kinds of report with sharply
different consequences: a violation means the corpus does not conform, a flag
means "a corpus carrying flags and no violations conforms". The rule does not
say which it is. `ERF-41` uses the same phrasing ("MUST be reported") for
another producer error, also without saying.

**Chosen: violation.** Under the flag reading, a corpus full of retyped
scalars conforms.

### AMBIGUITY 5.3 — a retype the binding creates and does not mention

`1e3` is a string under PyYAML's default and a **float** under the JSON schema
the binding requires. `hits_reported: 1e3` is a plausible spelling of a search
yield. So the pin does not only narrow; in this one place it widens, and a
producer that quotes only the five spellings `ERF-65` lists is caught. Full
register in `yaml-behaviour.md` §2a. Related: `v: =` and `v: <<` raise a
constructor error under PyYAML's default and load as ordinary strings under
the JSON schema — a file a legacy reader *cannot open* is fine under the
binding.

### AMBIGUITY 5.4 — the empty scalar

YAML 1.2's JSON schema has no production for the empty scalar; JSON has no
such token. `why:` with nothing after it must resolve to something.

**Readings.** (A) `null`. (B) the empty string `''`, so a string-typed field
stays a string. (C) a parse error, since the schema does not resolve it.

**Chosen: (A).** Under (B), `why:` is a string and trips `ERF-39`'s
non-empty test rather than `ERF-65`'s type test — same outcome, different
requirement cited. Under (C) the file does not load at all.

### Which fields actually arrive retyped under PyYAML

Full table in `yaml-behaviour.md` §2. In summary, with PyYAML's default
loader and no schema replacement: every unquoted `timestamp` (both `created`
and `standings`) arrives as `datetime.date` or `datetime.datetime`; every
unquoted `as_of_date` that is a bare year or a full date arrives as `int` or
`date`; `hits_reported: 0` arrives as `int`; `spec_version: 1.0` arrives as
`float`; a source id or family name spelled `012` arrives as `int 10`
(octal), and one spelled `no`, `yes`, `on` or `off` arrives as `bool`.
Twenty-eight distinct spellings diverge.

---

## §6 — `ERF-53` and §7's opening: bindings and loss

### Is "loss" precise enough to test? Partly, and it does not cover what it says it covers.

> Loss is any difference, after loading, in a value the model types or in a
> narrative's text: two forms are equivalent when they load to the same model
> instance, and a store that returns `chapter-number: 36.0` for `36` has lost,
> whatever its own types say.

That is testable — load both forms, compare model instances — and it is a real
improvement over "without loss". Four things fall outside it.

### AMBIGUITY 6.1 — a narrative's frontmatter is not covered

`ERF-34`: "It therefore has no interface in the data model of section 3."
`ERF-53` protects "a value the model types" and, separately, "a narrative's
*text*". A narrative's `title`, `corpus` and `created` are neither. A binding
that drops `created.by` from every narrative loses nothing by this definition
— while `ERF-34` spends a paragraph explaining that `by` "earns its place here
more than it does on a record".

**Readings.** (A) literal: narrative frontmatter is losable. (B) "a
narrative's text" means the whole file. Chosen: (B) in my loader, because (A)
is plainly not intended — but (A) is what it says.

### AMBIGUITY 6.2 — unknown and extension fields are losable, and `ERF-57` says they are not

An `x_` field (`ERF-72`) or an unknown field from a later minor version is not
"a value the model types". So a binding may drop it without "loss". But
`ERF-57` says a consumer "MUST preserve unknown fields and unknown record
types as opaque data", and `ERF-60` forbids "silently dropping what it does
not understand". Two requirements, opposite answers, for the same bytes.

### AMBIGUITY 6.3 — the normalized texts are outside the definition, and they carry the verdicts

§7: "Every binding MUST round-trip a corpus through the model without changing
any record, any field, **or any verdict**". A quote-check verdict depends on
the *bytes of a normalized text file*. The model types `normalized` as a
path string, not as content. A binding that preserves every path and none of
the files preserves the model instance exactly and changes every verdict from
pass to unavailable.

`ERF-53` half-anticipates this — "'Every file' and not 'every record': the
source list carries the digests, the licence judgments and the normalized-text
paths, the whole verifiability chain" — but the sentence protects the *source
list*, which is a set of paths, not the texts those paths point at. The
verifiability chain named in that sentence is exactly the part the loss
definition does not reach.

### AMBIGUITY 6.4 — list order

`atoms_for: [a, b]` and `[b, a]`: same model instance or not? The model types
it `AtomId[]`, an ordered array, so a careful reading says order is typed and
must be preserved. That answer matters more than it looks: my `ERF-41`
tie-break (§3.1) depends on `standings` order, and a store with no ordering
column would load a different model instance. Determined by "the model types",
but the spec never says it out loud, and a relational implementer would have
to derive it.

### Is it clear what conformance is a property of? No.

> Conformance is a property of a corpus as loaded into the model, and is the
> same in every binding.

Four requirements contradict this directly:

- `ERF-65`: "a string-typed field that **arrived** as any other type" — a fact
  about parsing, invisible once loaded.
- `ERF-66`: no duplicate key, anchor, alias or explicit tag — all four vanish
  into an ordinary loaded structure.
- `ERF-67`: UTF-8, LF, no BOM — bytes.
- `ERF-55`: "Empty lists MUST be omitted" — but `ERF-56` says a reader
  materializes an omitted list as an empty list, so the omitted and the
  present-and-empty forms load *identically*. `ERF-55` is a rule about a
  serialization that `ERF-56` guarantees is invisible in the model.

So conformance is a property of the loaded model **plus** four properties of
the bytes, and §1 assigns those bytes-level rules to the Validator class. The
sentence as written is false, and an implementer who believes it will not
write the `ERF-66` check at all — it is unwritable from a loaded structure.

---

## §7 — the Validator conformance class

> Validator: a tool that checks. Binds every machine-checkable MUST that
> applies to the input it accepts, including section 6 in full, the
> record-type requirements of section 4 (the quote check, the verdict and
> stance vocabularies, ids, dates, search acts, narrative bindings), the
> serialization rules of section 7, and the declaration and source list named
> under the Corpus class. The list illustrates the duty and does not bound it:
> a tool that never opens a normalized text or parses a narrative binding is
> not a validator.

The last sentence is a real improvement: it closes the two specific escapes
(never opening a text, never parsing a binding) that a "list illustrates"
formulation would otherwise leave open. It does not close the class.

**Yes, you can still build a conforming validator that skips something
important.** Four ways.

### AMBIGUITY 7.1 — "machine-checkable" is self-assessed and undefined

No list, no criterion. `ERF-8` ("`citation_text` MUST be rendered from
[`citation`]") is machine-checkable given a CSL processor and not otherwise;
`ERF-9` and `ERF-10` (grading rules) are not machine-checkable at all;
`ERF-70`'s determinism requirement is not; `ERF-71`'s digest is checkable only
with the network. Each implementer draws the line and each line is defensible.
My tool declares its own line with `--show-unperformed`, which no requirement
asks for.

### AMBIGUITY 7.2 — "applies to the input it accepts" is a general escape

`ERF-36` and `ERF-38` are about **deployment**-wide id uniqueness. A validator
that accepts one corpus directory at a time never has the deployment as input,
so the invariant never applies, and the tool is still a validator — the
closing sentence names only normalized texts and narrative bindings. Mine has
this hole and says so.

Worse: `ERF-40`, standings append-only, is "verified against the substrate's
history". A validator whose input is a directory has no history, so the one
invariant protecting the append-only ledger — the format's own headline
element, "the standings ledger (append-only, per-person, reasoned,
human-only)" — is skippable by choosing an input shape.

### AMBIGUITY 7.3 — Consumer MUSTs are not Validator MUSTs

Several rules central to the format are written as consumer duties and are
therefore outside the Validator class:

- `ERF-33`: report a narrative binding whose id resolves to no record.
- `ERF-32`: show a binding whose staleness cannot be computed as
  `indeterminate`.
- `ERF-42`: do not conflate `rejected` and `retired`.
- `ERF-57`, `ERF-60`: preserve and report the unrecognized.

`ERF-35`'s enumeration of references that must resolve — `atoms_for`,
`atoms_against`, `edges.to`, `surveys`, `prior_survey`, `notable_results.atoms`
— **does not include narrative binding ids**. So a conforming validator may
parse every narrative binding (satisfying the closing sentence), check every
anchor, and never check that the claims named exist. That is `ERF-33`'s
"broken citation hidden is a confident sentence" failure, permitted by the
class definition. I check it anyway, as a violation, and cannot point to a
requirement that makes me.

### AMBIGUITY 7.4 — nothing binds a validator's output shape

§1 spends four paragraphs on flags versus violations, and every operative
sentence is about a *consumer*: "A consumer MUST NOT present a flag as
conformance failure, and MUST NOT hide one either." A validator that reports
every flag as a violation — failing corpora over a stale narrative binding or
a retired premise — is not obviously non-conforming, and the distinction the
format cares most about is unenforced at the tool that produces it.

---

## Appendix: ambiguities outside the seven, met while building

Recorded because they blocked the build, not because they were in scope.

- **Where a `normalized:` path is resolved from.** `ERF-3`'s example writes
  `normalized/pacioli-1494-geijsbeek.md`, a relative path, and `ERF-54` says
  "no meaning lives in a path". Relative to the corpus root, to the source
  list file, or to the record quoting it? I try the source list's directory,
  then the root.
- **Telling a frontmatter file from a bare YAML document.** Binding §1 says
  the declaration and the source list "are YAML documents with no body" while
  records are "YAML frontmatter, then a markdown body". A YAML document may
  legally begin with `---`, so `---\ntype: sources\n...\n---\n` is both shapes
  at once. I try the frontmatter form first and fall back.
- **Normalized texts cannot carry `type`.** `ERF-54`: "Every file a corpus
  holds MUST self-describe... A file carrying no `type` is not part of the
  corpus; a consumer MUST ignore it and MUST report that it did." A normalized
  text is a file the corpus holds, is plainly part of it, and cannot carry a
  `type` key without ceasing to be the text quotes are checked against. I
  special-case files named by `normalized` or `received.path`.
- **`body` in the model versus the body in the file.** The model types
  `body: string` on `Claim` and `Survey`; the binding puts it after the
  frontmatter. A file carrying `body:` as a frontmatter key is then both a
  defined field and a binding violation. I accept the key and prefer the
  markdown body.
