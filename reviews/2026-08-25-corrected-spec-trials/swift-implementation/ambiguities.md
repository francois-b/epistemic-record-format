# Ambiguities remaining in the seven re-written requirements

Cold Swift implementation, 2026-08-25. Sources read: `SPEC-as-tried.md` and
`BINDING-as-tried.md`, nothing else in the repository.

For each requirement: the exact text, the readings it admits, the one I built,
and what breaks under the other. Where a requirement is now unambiguous I say
so by id, because that is a result too.

Summary:

| # | requirement | verdict | readings |
|:--|:--|:--|:--|
| 1 | ERF-51 / ERF-52, the quote check | **OPEN** | 8 |
| 2 | ERF-43, the premise closure | **OPEN** | 5 |
| 3 | ERF-41, disposition with an outside stance | **OPEN** | 5 |
| 4 | ERF-31, narrative bindings | **OPEN** | 9 |
| 5 | ERF-65, the quoting obligation | **OPEN** | 4 (§5e is a note, not a reading) |
| 6 | ERF-53 / section 7, bindings and loss | **OPEN** | 4 |
| 7 | the Validator conformance class | **OPEN** | 4 |

---

## 1. ERF-51 and ERF-52 — the quote check

**The normalization form is named, and it is NFC.** ERF-51 step 1 is "Unicode
NFC", and the requirement spends a paragraph arguing against NFKC, which was
the earlier choice. That much is settled and I implemented it directly.

**Also determined, and worth recording as settled:** the ordering of the three
steps; splitting the quote on `[...]` *before* normalization; that case is not
folded; that `[...]` is the only wildcard and bare `...` / `…` are literal;
that a quote whose spans are all empty must fail; that spans must occur in
order and without overlap; that a validator facing a non-text normalized text
reports the check unavailable rather than passing or failing it.

### 1a. The prose is not the authority, by the requirement's own statement

> "The prose above names each transformation; the conformance case files
> (`conformance/cases/normalization.txt` and `conformance/cases/quote-check.yaml`,
> this repository) are normative for its exact behavior: where a reading of the
> prose and a case disagree, the case governs, and a conforming implementation
> reproduces every pair."

This settles the trial question for requirement 1 before any of the readings
below are reached. ERF-51 declares that where prose and case disagree the case
wins, so by construction the prose cannot determine one implementation: it can
only propose one that a file I am not permitted to open may overrule. A cold
implementer working from a shipped specification without the repository is in
the same position I am.

Same shape, one level up, for the whole data model: section 3 says "The
normative data model is the file `types/erf.ts` [...] where the two differ, the
file governs."

I did not read either. I want to be plain that this was the one place the
temptation was real, and per the brief I am writing it down instead:
`conformance/cases/quote-check.yaml` is the file that would have told me
whether the seven readings below are the intended ones.

**Chosen:** implement the prose. **What breaks:** unknown, and unknowable from
the prose, which is the point.

### 1b. "whitespace" in step 3 is not defined

> "3. Collapse whitespace runs to a single space, then trim."

Readings: (i) ASCII `[ \t\n\r\f\v]`; (ii) the Unicode `White_Space` property,
which adds U+00A0 NO-BREAK SPACE, U+202F, U+3000 IDEOGRAPHIC SPACE and eleven
others; (iii) `White_Space` plus the invisible format characters.

**Chosen:** (ii), Unicode `White_Space`. **What breaks under (i):** test
`fab-014`. A quote typed with an ordinary space matches a source holding a
no-break space under my reading and fails under ASCII. This is not exotic:
NBSP is what word processors and most HTML-to-markdown extractors emit, and
ERF-70 permits any named deterministic extractor. The requirement's own
rationale cuts the other way ("an author who retypes rather than copies is
guessing at their own evidence, and a failure telling them to copy is the
correct answer"), which argues for the narrow ASCII set.

### 1c. The scope of step 2

> "2. Remove the markdown emphasis and code markers `*`, `_`, and `` ` ``."

Readings: (i) remove every occurrence of those three characters; (ii) remove
them only where CommonMark parses them as emphasis or code delimiters.

**Chosen:** (i). It is the only reading that is a *sequence* rather than a
parse, and "applied identically to the quote and to the normalized text" makes
(ii) incoherent — a quote is a fragment and does not parse as CommonMark in the
context the text does. **What breaks under (ii):** `fab-017` and `fab-018`,
both of which currently PASS, would fail. Under (i) a footnote marker
(`40%*`) and a multiplication sign (`3*4`) are silently deleted from the
source, and a quote that reads `40%` or `34` certifies as verbatim.

### 1d. "letter, digit, or combining mark" — which categories, and what about Cf

> "where a span begins with a letter, digit, or combining mark, the character
> before its occurrence MUST NOT be one, and where it ends with one, the
> character after MUST NOT be one."

Readings: letter = L\* or only Lu/Ll/Lt; digit = Nd only or Nd+Nl+No; mark =
Mn+Mc+Me. And decisively: characters in category **Cf** (U+00AD SOFT HYPHEN,
U+200B ZERO WIDTH SPACE, U+200D ZWJ, bidi controls) are in none of the three
sets, so under any of these readings they are free boundaries.

**Chosen:** L\* + Nd + M\*, with Cf treated as a boundary character like any
other non-word character. **What breaks under a reading that makes Cf
transparent** (skip format characters when looking at "the character before"):
`fab-003` and `fab-004` stop passing. Both currently pass, and both are working
fabrications — see the fabrication results below.

### 1e. "character" — scalar, grapheme cluster, or code unit

**Chosen:** Unicode scalar. Evidence for it: the clause names combining marks
separately, and an extended grapheme cluster absorbs its combining marks, which
would make that clause dead text. Not stated.

### 1f. Which occurrence, when the first one fails the boundary test

Readings: (i) take the leftmost occurrence and boundary-test it, failing if it
fails; (ii) take the leftmost *valid* occurrence; (iii) accept if any valid
assignment of spans exists.

**Chosen:** (ii), which is provably equivalent to (iii) here — the only
constraint a later span carries is "start at or after the previous span's end",
so the earliest legal match is never the wrong greedy choice. **What breaks
under (i):** `fab-019` fails, though the source plainly contains the quoted
words. I call this closed by argument rather than open, but an implementer who
reads "occurs" as "the first occurrence" will get it wrong, and nothing in the
text stops them.

### 1g. Zero-length gaps between spans

> "The text between two spans is unbounded by design: an elision marker is the
> author's assertion that they removed material"

Readings: gap ≥ 0; gap ≥ 1, since the marker asserts material was removed.
**Chosen:** ≥ 0. **What breaks:** `fab-012` — `The[...]cat` against "The cat
sat" — passes with nothing elided. The prose bounds the gap at the top end and
never at the bottom.

### 1h. Where the normalized text lives (this gates the whole check)

ERF-1 requires the normalized text to exist before any check runs; `Source.normalized`
is a path string; ERF-54 says "no meaning lives in a path". Relative to **what**
is `normalized: normalized/pacioli-1494-geijsbeek.md` resolved? The corpus root?
The source-list document's directory? The substrate's business? Not stated
anywhere in either document.

**Chosen:** try the source-list document's directory, then the corpus root.
**What breaks:** a corpus that passes for me reports every quote check as
UNAVAILABLE for an implementer who picked the other base — and still calls
itself a Validator, since ERF-51 makes "unavailable" a legitimate outcome.

---

## 2. ERF-43 — the premise closure

**Determined, and this is the improvement:** the orientation is stated
outright — "its outgoing `assumes` edges and the incoming `supports` edges of
other claims" — so `assumes` is followed forward and `supports` backward, with
no guessing. And termination is both guaranteed and authorised: "The closure is
followed over distinct claims, a claim reached twice being visited once, so
that a validator terminates on any input, conforming or not." That sentence is
exactly the authorisation the brief asks about, and it is sufficient. My
validator terminates on every input in `tests/03-premise-closure`, cycles
included.

One wrinkle worth naming: a visited set gives *termination* but not *cycle
detection*. Detecting the cycles the same requirement prohibits needs per-path
colouring, which the text does not mention. Both are implementable and they do
not disagree on verdicts, so this costs effort, not correctness.

### 2a. The cycle clause's own example is not a cycle

> "The premise relation MUST admit no cycles, where `X assumes Y` and `Y
> supports X` both make `Y` a premise of `X` (`ERF-24`): a chain of premises
> that returns to its own argument grounds nothing."

Under the orientation ERF-24 and section 5 give, `X assumes Y` makes Y a
premise of X, and `Y supports X` **also** makes Y a premise of X. Both clauses
name the same oriented fact. The pair the sentence exhibits is a redundant
double edge, not a cycle.

Readings: (i) the clause *defines* the relation — both edge kinds feed one
oriented premise-of — and the prohibition is over that relation; (ii) the
clause *exhibits a prohibited configuration*, which requires reading `supports`
in the opposite direction from ERF-24 and from section 5's "`supports`: this
claim argues for the target".

**Chosen:** (i). **What breaks under (ii):** `tests/03/c2-*` becomes a
violation, and any corpus that records a premise edge alongside its reciprocal
support edge — a natural belt-and-braces habit, and one this format's
machine-proposal-plus-human-ruling workflow would produce — becomes
non-conforming.

This is the sentence that carries the orientation, and its illustration does
not illustrate what it says it does. That is a bad place for the only worked
example to be wrong.

### 2b. Scope of the cycle prohibition

"The premise relation MUST admit no cycles" carries no scope qualifier, while
every sentence around it is about "an argument's premise closure".

Readings: (i) globally, over every claim carrying or receiving `assumes` /
`supports`; (ii) only within some argument's premise closure.

**Chosen:** (i). **What breaks under (ii):** `tests/03/c9-*` — two
`observation`s in a mutual `assumes` cycle that no argument's closure ever
reaches — is legal, and my validator's violation is a false positive.

### 2c. An argument leaf inside another argument's closure

> "MUST terminate in non-argument leaves."

A premise-less `argument` sitting inside another argument's closure is a leaf
and is an argument, so the outer argument violates ERF-43. But ERF-49 makes
that same record's premise-lessness only a **flag**, and section 1 states the
governing principle: "Making any of those a violation would let one person's
permitted act make another person's untouched corpus non-conforming."
Retiring the last premise of *my* argument is a permitted act, and it turns
*your* untouched argument into a violation. ERF-43 anticipates precisely this
problem for retired leaves — "a flag rather than a violation, like `ERF-49`,
because a withdrawal elsewhere can create the condition without any edit to
the argument" — and does not extend the reasoning to argument leaves.

Readings: (i) violation, as written; (ii) flag, by parity with the retired-leaf
sentence and section 1's principle.

**Chosen:** (i). **What breaks under (ii):** `tests/03/c5-outer` drops from
violation to flag, and the corpus's conformance verdict flips.

### 2d. A closure with no leaves at all

Inside a cycle the closure terminates in nothing. Is "MUST terminate in
non-argument leaves" separately violated? Immaterial in practice, since the
cycle rule fires, but the text does not say.

### 2e. Does the closure cross corpus boundaries?

ERF-35 resolves references "within the deployment"; this validator is handed
one corpus. An incoming `supports` edge from a sibling corpus is a premise the
validator never sees, so the same argument's closure — and its cycles, and its
leaves — differ by input. Not addressed.

---

## 3. ERF-41 — disposition with a stance outside the vocabulary

> "A standing whose `stance` is outside that vocabulary is a producer error
> (`ERF-55`), MUST be reported, and MUST be left out of this computation as
> though the entry were absent: `ERF-57` obliges a consumer to load such a
> record, and a reading it cannot compute is one it would otherwise invent.
> **With that, every input has exactly one reading.**"

The last sentence is not true, and the reason it is not true is the sentence
before it.

### 3a. "as though the entry were absent" — absent from what?

Readings:

(i) The entry is removed from the ledger **before** "each person's newest
entry" is selected. A person whose newest entry is bad falls back to their
previous valid entry.
(ii) The entry is removed **after** per-person selection, so a person whose
newest entry is bad has no current stance at all.
(iii) The person is dropped entirely.

**Chosen:** (i) — "as though the entry were absent" is most naturally read as
absent from the record, and absent entries were never selected from.

**What breaks:** `tests/04/d07-bad-stance-newest` (Alice: `for` on 08-01,
`maybe` on 08-02) computes:

- `active` under (i) — what my validator prints;
- under (ii) and (iii), Alice has no current stance, so either "nothing
  remaining" → **`retired`** or "no standings at all" → **`proposal`**.

`active`, `retired` and `proposal` for the same bytes, and the first and second
of those are as far apart as the vocabulary goes.

The related fork, on the same words: `tests/04/d08-all-bad-stances`, where every
entry is out of vocabulary. If absent means never-existed, there are "no
standings at all" → **`proposal`**. If the entries still count as standings that
were then discarded, "nothing remaining" → **`retired`**. ERF-41 gives both
phrases and does not say which state the discarded entries leave behind.

### 3b. Two entries by one person at the identical instant

"each person's newest entry" does not order a tie. Readings: ledger position
(append-only ⇒ later position is later append); first wins; report and exclude
both; hard error.

**Chosen:** ledger position. **What breaks:** `tests/04/d09-same-instant-tie`
reads `rejected` under mine and `active` under first-wins.

Worth noting because ERF-19 justifies its full-instant requirement by exactly
this hazard — "a consumer selecting the newest stance would settle a claim's
disposition by accident" — and then leaves unhandled the one case full instants
do not prevent.

### 3c. Is ledger order even available?

ERF-40 makes `standings` append-only and section 3 types it as an array, so
order survives loading in this binding. ERF-53 permits "rows in a database",
where insertion order is not inherent, and section 7 promises a store's export
"is guaranteed to give every verdict the store did". If the tie-break is ledger
position, that guarantee does not hold for the SQL binding the binding document
says is already drafted.

### 3d. A standing whose `by` is not a `human:` actor

ERF-21 and ERF-39 make it a violation. Does it participate in the disposition?
ERF-41 excludes only out-of-vocabulary *stances*. **Chosen:** it participates,
keyed by its `by` string, and is reported. Not addressed.

### 3e. A standing with a missing or unparseable timestamp

Cannot be ordered against anything. **Chosen:** a parseable instant beats an
unparseable one, ties by ledger position, plus an ERF-19 violation. Not
addressed.

**Determined:** the four terminal readings and the withdrawal rule are clean;
"no standings at all → proposal" is clean for the case where there are
genuinely none; the no-tie-break statement ("`contested` is the terminal
reading of a disagreement, not a state resolved by arithmetic") is clear.

---

## 4. ERF-31 — narrative bindings

**Determined, and these were worth fixing:** the two escapes and their meanings;
that the anchor is compared under ERF-51 and **not** ERF-52, so a sub-word
anchor legitimately matches (`tests/05/n10`, anchor `cat` in "catapult") — a
deliberate asymmetry with the quote check, not an ambiguity; that a broken
anchor is a flag and not a violation; that a candidate failing the grammar must
be reported rather than skipped; and the passage's start (previous marker's
end, or the body's start) and end (its own marker's start).

The passage definition is **unambiguous at three of the four edges the brief
asks about**: the first binding, the last binding, and two bindings with
nothing between them. It is **not** unambiguous at the fourth.

### 4a. How far does a binding's marker extend? (the serious one)

> `id       ::= one or more characters, none of them whitespace or '"'`

`-->` contains no whitespace and no `"`. So `-->` is a legal `id`. So is
`bound-at=2026-08-25`. So is `<!--`. So is `claims:`. The `ids` production is
therefore greedy to the first `"` **in the remaining document**, not in the
comment.

Demonstrated in `tests/05/n4-malformed-between.md`. A binding that omits its
anchor does not fail the grammar. It consumes the rest of its own comment, the
following paragraph of prose, the *next* binding's `<!--` and `claims:` tokens,
and adopts that binding's anchor and `bound-at` as its own — reporting
**success** with eleven claim ids, nine of which are ordinary English words
("Gamma", "territory:", "sources", "are", "listed", "once."). The next binding,
with its real claim id, **disappears from the document entirely**.

That is exactly the failure the same requirement says it exists to prevent:

> "Without this rule a required part does not make a binding invalid, it makes
> it invisible, because a comment failing the grammar is indistinguishable from
> any other HTML comment and the claims it named simply vanish from the
> narrative."

Readings:

(i) **Literal.** Apply the ERF-31 production to the document text; it finds its
own `-->`. *(implemented, default)*
(ii) **Comment-first.** ERF-31 says "The marker MUST be an HTML comment" and
ERF-67 requires the body to be valid CommonMark, where a comment ends at the
first `-->`. Delimit the comment, then require the grammar to match that slice
exactly. *(implemented, `--comment-first`)*

Measured on the same corpus: **17 violations and 18 flags under (i); 9 and 9
under (ii).** Different bindings exist, different claims are cited, different
anchors are checked, and the corpus is non-conforming for different reasons.

**Chosen:** (i), because the grammar block is the normative production and it
is stated without reference to comment delimitation. (ii) is the better
engineering answer and I would ship it if the text said so. The fix is one
sentence: either exclude `-` and `>` from `id`, or say the grammar applies to
the contents of an HTML comment delimited first.

### 4b. A malformed candidate's marker extent, and therefore the next passage

This is the brief's question, and it is the one edge where the passage
definition does not determine an answer. Under reading (ii) above it is
settled: the marker is the comment. Under reading (i) it is not — the grammar
failed, so the production says nothing about where the marker ends, yet "the
text from the end of the previous binding's marker" needs an end.

Readings: first following `-->`; end of body; the recognition token alone
(`<!--` … `claims:`); malformed candidates do not delimit passages at all.

**Chosen:** first following `-->`, else end of body. **What breaks under
"malformed candidates do not delimit":** the next passage swallows the
malformed text and everything back to the last *valid* binding, so anchors that
fail under my reading pass under that one.

### 4c. Commas are forbidden in prose and permitted by the grammar

> "Ids are separated by whitespace, never by commas, because a comma inside an
> unquoted list invites a parser to guess."

A comma is neither whitespace nor `"`, so `p-alpha,` is a well-formed `id`.
`tests/05/n11` binding #1 (`claims: p-alpha, p-beta "…"`) is grammatically
**valid** and fails only downstream, at ERF-33, as "the claim `p-alpha,`
resolves to no record". The guess the sentence forbids has moved from the
separator into the identifier.

Readings: (i) as written, a comma is an id character; (ii) add `,` to the id
exclusion set and report an ERF-31 grammar violation. **Chosen:** (i).

### 4d. `ws` is never defined

Readings: space only; space and tab; ASCII whitespace; Unicode `White_Space`.
**Chosen:** Unicode `White_Space`, so a binding may span lines. **What breaks
under "space and tab":** a binding an editor hard-wrapped becomes malformed.

### 4e. An empty anchor

`anchor ::= '"' char* '"'` permits zero characters. The empty string occurs in
every passage, including an empty one, so `""` is a legal binding whose anchor
check can never fail. ERF-52 closed this exact hole for quotes — "A quote whose
spans are all empty MUST fail rather than trivially pass" — and ERF-31 does
not.

Readings: vacuously satisfied; treat the empty string as not occurring; reject
at the grammar with `char+`. **Chosen:** vacuously satisfied, plus a flag
saying the check is vacuous — and that flag is my invention, not the spec's.
`tests/05/n3b-empty-anchor.md`.

Note this is also where two implementations diverge by accident rather than by
reading: Swift's `String.contains("")` returns `false`, Python's `"" in ""`
returns `True`. An implementer who never thinks about the empty anchor gets
whichever answer their standard library happens to hold.

### 4f. A binding inside a fenced code block

> "A comment opening `<!--` followed by `claims:` IS a narrative binding"

Inside a CommonMark code fence that text is not an HTML comment at all.
Readings: textual scan (recognizes it); CommonMark-aware scan (does not).
**Chosen:** textual. **What breaks:** `tests/05/n7-in-code-fence` loses a
binding and its spurious anchor flag. Any document that documents the binding
syntax — this specification's own section 4.6, for one — hits this.

### 4g. `-->` inside an anchor

Grammar-legal (a run of `char`), CommonMark-illegal (the comment ends there).
`tests/05/n6-arrow-in-anchor`: well-formed under (i), "unterminated anchor"
under (ii). Same bytes, opposite verdicts. And ERF-31's own justification for
the escapes — "a grammar that cannot express a legal value is a defect in the
grammar" — applies verbatim here: an anchor is a verbatim run of the passage,
and a passage containing `-->` has no expressible anchor.

### 4h. `date ::= YYYY "-" MM "-" DD` — shape or calendar?

`2026-13-45` matches the shape. **Chosen:** shape at the grammar, plus an
ERF-32 violation for a non-calendar date, since the staleness comparison cannot
run. Under "calendar validity is part of the grammar" it is an ERF-31
violation instead: different requirement cited, different remedy.

### 4i. Is ERF-33 a violation or a flag?

ERF-33 says "MUST report it and MUST NOT drop it silently" and names neither.
Section 1's flag rationale — a condition that "can arise without anyone editing
the record that carries them" — fits a claim deleted elsewhere exactly.
**Chosen:** violation. **What breaks under flag:** `tests/05` drops from 17
violations to 5, and a corpus with only unresolved bindings conforms.

---

## 5. ERF-65 — the quoting obligation

> "A validator MUST report a string-typed field that arrived as any other type."

**Is the text clear enough about which fields are string-typed to implement
this? No.** Not by a margin, and the gap falls on exactly the fields the format
is built out of.

### 5a. The model does not state the types of any id field

> "The TypeScript below is an inline mirror of that file, kept in sync by hand;
> it omits the file's header comments and its identifier alias definitions
> (`AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId`, `FamilyName`,
> `CSL`); where the two differ, the file governs."

Every id-bearing field in the format is typed by one of those seven aliases:
`Atom.id`, `Atom.source`, `Atom.corpus`, `Claim.id`, `Claim.corpus`, every
element of `atoms_for`, `atoms_against`, `surveys`, `families`, `edges.to`,
`Survey.id`, `prior_survey`, `CorpusDeclaration.id`, and every key of the
source list. The document that ERF-65's duty hangs on does not say whether
`id` is a string.

**Chosen:** infer `string` for the six identifier aliases. It is a safe
inference. It is still an inference, and ERF-65 is a MUST whose subject the
specification does not enumerate.

`CSL` is worse than an inference — it is a nested structure of unknown shape,
and ERF-53's worked example shows it carrying numbers legitimately
(`chapter-number: 36`). **Chosen:** treat everything under `citation` as
untyped-by-the-model and report nothing inside it. An implementer who reads
`CSL` as "CSL-JSON, imported by the normative reference" gets a different
program, because CSL-JSON types several fields as string-or-number.

### 5b. Three of ERF-65's five worked examples are wrong under the schema ERF-65 mandates

> "Where the model types a field as a string and its bare spelling would
> resolve to another type under this schema, a producer MUST quote it:
> `as_of_date: "2018"`, `hits_reported: "0"`, `spec_version: "0.9.0"`, and a
> source id or family name such as `"012"` or `"no"`."

Under the YAML 1.2 **JSON schema** that the same requirement pins — "only
`null`, the literals `true` and `false`, and JSON's own number grammar resolve
to non-string scalars":

| example | resolves to | needs quoting? |
|:--|:--|:--|
| `2018` | integer | **yes** — example correct |
| `0` | integer | **yes** — example correct |
| `0.9.0` | string (two decimal points; not a JSON number) | **no** — example wrong |
| `012` | string (JSON forbids a leading zero) | **no** — example wrong |
| `no` | string (only `true`/`false` are literals) | **no** — example wrong |

`tests/06-scalar-types` contains all five. `erfval` reports the two real ones
and is correctly silent on the three others, including a source id spelled
`012` and a family name spelled `no`.

Readings: (i) the schema governs and the examples are illustrative and partly
wrong (**chosen**); (ii) the examples state a further obligation, namely
"quote anything a YAML 1.1 parser would mistype", which the paragraph's stated
purpose supports ("A producer SHOULD quote a timestamp regardless, so that a
reader on a legacy schema still receives a string"). Under (ii) a validator
must implement YAML 1.1 resolution *as well*, and report on files that are
perfectly well-formed under the mandated schema. That is a different program.

### 5c. The requirement can only fire when it is disobeyed

ERF-65 mandates JSON-schema resolution and then requires the validator to
report fields that "arrived as any other type". Under a conforming parser the
hazards the paragraph describes — `no` becoming a boolean, a bare timestamp
becoming a date object — cannot occur. So a conforming validator reports the
empty set of precisely the failures the rationale is about, and reports instead
a different, smaller set (bare years, bare integers, `true`).

Readings: (i) report what a JSON-schema parse yields (**chosen**); (ii) run a
1.1 resolver alongside as a producer linter and report the difference. The
normative sentence supports (i); the whole rationale supports (ii).

### 5d. Violation or flag?

ERF-65 says "MUST report" without saying which. **Chosen:** violation. Under
flag, `tests/06` conforms.

### 5e. A practical confirmation, not an ambiguity

Section 6 of the binding document says "Two cold implementations on 2026-08-25
found their parsers offered no way to select the JSON schema at all." Make it
three. Yams, the standard Swift choice, is libyaml-backed and exposes no schema
selection, so I wrote the resolver by hand. A requirement that no available
library can satisfy is worth knowing about even where the prose is clear.

---

## 6. ERF-53 and section 7's opening — bindings and loss

**Is "loss" now defined precisely enough to test?** For the typed core, yes,
and I built the test: `erfval --model-dump` emits a canonical model instance,
and two forms are equivalent exactly when their dumps are byte-identical.
`tests/07-round-trip` holds the same corpus written two ways inside one binding
(block vs flow, quoted vs plain vs folded, block sequence vs flow sequence) and
the dumps are identical.

At the edges, no — and the first edge is the definition's own example.

### 6a. The definition does not reach its own worked example

> "Loss is any difference, after loading, in a value the model types or in a
> narrative's text: two forms are equivalent when they load to the same model
> instance, and a store that returns `chapter-number: 36.0` for `36` has lost,
> whatever its own types say."

`chapter-number` lives inside `citation`, typed `CSL`, and section 3 says it
omits the `CSL` alias definition. `36` is therefore **not "a value the model
types"**, and the sentence's own example falls outside the definition the
sentence gives.

Demonstrated: `tests/07/variant-a` writes `chapter-number: 36`,
`tests/07/variant-b` writes `36.0`, both conform, and the model dumps are
byte-identical. Under my reading nothing was lost. Under ERF-53's example
something was.

Readings: (i) the model types only what section 3 spells out (**chosen**);
(ii) `CSL` imports CSL-JSON by reference and everything under `citation` is
typed. Under (ii) a validator needs a CSL-JSON schema the specification names
only in its reference list.

### 6b. Extension and unknown fields are outside "loss"

ERF-72 makes `x_` fields legal on any record; ERF-57 says a consumer "MUST
preserve unknown fields and unknown record types as opaque data". Neither is a
value the model types, so **dropping every extension field in a round-trip is
not loss under ERF-53**. `tests/07/variant-a` carries `x_reviewer`,
`variant-b` does not, dumps identical, both conform.

So a binding can satisfy ERF-53 in full while destroying exactly the data
ERF-57 exists to protect. Readings: (i) as written (**chosen**); (ii) read
"round-trips through the model without loss" as covering everything the file
held, in which case the "a value the model types" clause is doing no work.

### 6c. A narrative's frontmatter is outside "loss"

ERF-34 requires `title`, `corpus` and `created` on a narrative and then says
"It therefore has no interface in the data model of section 3." ERF-53 covers
"a narrative's **text**". A binding may lose a narrative's author and date
without losing anything. And are the narrative bindings themselves part of "its
text"? They are HTML comments inside it: yes under a byte reading, no under a
rendered-prose reading. Not stated, and it decides whether a binding may
normalize a narrative's markdown.

### 6d. What conformance is a property of — the document answers twice

> §7: "Conformance is a property of a corpus as loaded into the model, and is
> the same in every binding."

> §1: "Conformance is claimed per class, not against the whole document" —
> Record, Corpus, Producer, Consumer, Validator.

Three of those five classes are tools, not corpora, and a fourth (Record) is a
single record, not a corpus. Readings: (i) §7's sentence is scoped to the
corpus-level classes and means "a corpus's conformance does not depend on its
binding" (**chosen** — the only reading under which both sentences are true);
(ii) §7 is the general statement and §1's tool classes are something other than
conformance.

**So: is it clear what conformance is a property of? No.** It is a property of
a corpus, of a record, and of a tool, in three sentences, and the §7 sentence
reads as though it settles the question on its own.

---

## 7. The Validator conformance class

> "Validator: a tool that checks. Binds every machine-checkable MUST that
> applies to the input it accepts, including section 6 in full, the
> record-type requirements of section 4 (the quote check, the verdict and
> stance vocabularies, ids, dates, search acts, narrative bindings), the
> serialization rules of section 7, and the declaration and source list named
> under the Corpus class. The list illustrates the duty and does not bound it:
> a tool that never opens a normalized text or parses a narrative binding is
> not a validator."

**What it now binds:** a capability floor (open normalized texts; parse
narrative bindings), a named core (section 6 in full, section 4's record
requirements, section 7's serialization rules, the declaration and the source
list), and an open-ended residue ("every machine-checkable MUST").

**Could you still build a conforming validator that skips something important?
Yes.**

### 7a. "the input it accepts" is self-declared, and it is the whole hole

A tool declares its input and thereby declares away every MUST outside it.
`erfval` accepts a directory snapshot with no substrate history, and therefore
does not check:

- **ERF-40** — "Standings MUST be append-only; an edit or deletion of an
  existing entry is a violation, **verified against the substrate's history**."
  The append-only standings ledger is one of the two things the spec's own
  Related-formats section says appears in none of the systems it surveyed. A
  validator skips it by accepting an input without history, and the requirement
  names the mechanism being skipped in its own sentence.
- **ERF-69**'s fidelity check — "MUST be checked by anyone holding the raw
  file". Not holding raw files, I do not.
- **ERF-2** (raw-file immutability), **ERF-70** (extractor determinism),
  **ERF-71** (digest confirmation) — all need artifacts outside the corpus.
- **ERF-36 / ERF-38** — deployment-wide id uniqueness, skipped by accepting one
  corpus. I check uniqueness within what I am handed and cannot do more.
- **ERF-8** — `citation_text` "MUST be rendered from" `citation`. Machine-checkable
  with a CSL processor; skipped by not having one.

The floor clause names two capabilities and stops. Two more sentences of the
same shape — a tool that never reads a substrate's history, or never resolves a
digest, is not a validator — would close most of this, at the cost of making
most real validators non-conforming, which is presumably why they are not
there.

### 7b. The 2026-08-25 move took the binding document out of the enumeration

Section 7 records the move: "Rules that hold only for YAML, markdown and files
moved to the binding document on 2026-08-25 (`ERF-65`, `ERF-66`, `ERF-67`, and
the YAML half of `ERF-53`), keeping their ids."

The Validator class binds "the serialization rules of section 7". ERF-65,
ERF-66 and ERF-67 are no longer in section 7. And ERF-65 contains a duty
addressed to a validator in as many words: "A validator MUST report a
string-typed field that arrived as any other type." The word "binding" does not
appear anywhere in section 1's conformance-class list.

Readings: (i) "every machine-checkable MUST that applies to the input it
accepts" is general enough to reach a normative binding document (**chosen** —
I implement ERF-65, ERF-66 and ERF-67); (ii) the class binds *this
specification*, and binding-document requirements bind a tool only when it
claims conformance to that binding, which no class in section 1 defines. Under
(ii), a validator that never checks a scalar's arrival type is fully
conforming, and ERF-65's validator duty binds nobody.

### 7c. No output obligation

Nothing requires a validator to distinguish violations from flags in its
output, to exit non-zero, or to name the requirement it is reporting. Section 1
tells a **consumer** not to present a flag as a conformance failure and not to
hide one; it says nothing to a validator, which is the tool that produces them.
Two conforming validators can report the same corpus incomparably.

### 7d. "machine-checkable" is undefined

ERF-9 and ERF-10 (grade against one axis, assess the substance not the
utterance), ERF-26 ("A category ('web search') without the instrument does not
satisfy this") and ERF-27 ("MUST NOT state precision the instrument did not
give") are MUSTs whose checkability is a judgment call. I check their presence
and vocabulary and not their substance, and I can defend that as "not
machine-checkable" without the text contradicting me.
