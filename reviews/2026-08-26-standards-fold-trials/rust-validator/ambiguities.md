# Ambiguities

Every place where two careful implementers, working from `SPEC.md`,
`erf.schema.json` and `bindings/yaml-markdown.md` and nothing else, would build
different things. For each: the exact text, the readings, the one this
implementation took, and what breaks under the other.

Written cold. I had no sight of any other implementation, of the conformance
suite, of the reference implementation, or of the repository's history.

Ordered by consequence within each section, not by requirement number.

---

## Part 1 — the three most serious

### A-1. `ERF-51` step 3 destroys the block separator step 1 inserts, and `ERF-52` depends on it

**Text.** `ERF-51`:

> 1. Render the text as CommonMark (`ERF-1`, `ERF-67`) to its plain text: […]
>    each leaf block (a paragraph, a heading, a list item's content, a code
>    block) separated from the next by U+2029 PARAGRAPH SEPARATOR.
> […]
> 3. Collapse each run of Unicode `White_Space` to a single space, and trim.

and `ERF-52`:

> No span crosses a paragraph separator (`ERF-51`) unless the quote holds the
> same break.

**The problem.** U+2029 PARAGRAPH SEPARATOR carries `White_Space=Yes` in the
Unicode Character Database. Step 3 says to collapse *each* run of `White_Space`
to a single space. Applied literally, step 3 replaces every separator step 1
inserted with an ordinary space, and by the end of the sequence there are no
paragraph separators in the normalized text at all. `ERF-52`'s clause then has
nothing to refer to, and the note under `ERF-51` explaining that "the block
separator stops a quote splicing the end of one paragraph, or a heading, to the
prose after it as if the source had said them in one breath" describes a
protection the sequence has just removed.

**Readings.**

1. *Literal.* Step 3 means what it says. Separators are collapsed to spaces.
   `ERF-52`'s paragraph clause is a dead letter and every cross-block splice is
   a passing quote.
2. *Separator-preserving.* Step 3's "White_Space" is read as "White_Space other
   than the separator step 1 just inserted", and a run touching a separator
   collapses to the separator. The boundary survives to the end of the fold.

**Chosen: reading 2**, and reading 1 is available behind `--erf51-literal` so
the difference is demonstrable rather than asserted. Reading 2 is the only one
under which step 1's separator, `ERF-52`'s clause, and `ERF-51`'s own note all
mean something.

**What breaks under reading 1.** `tests/fabrication.rs::h01` is the proof: the
splice `"management did not recommend it. Revenue fell 12.5 percent"`, which
joins two different paragraphs of the source into one sentence, **fails** under
reading 2 and **passes** under reading 1. Every cross-paragraph and
cross-heading fabrication in the `f01`/`f02` family becomes a conforming quote.
Two conforming validators would return opposite verdicts on the same atom,
which is precisely what the sequence exists to prevent: "so that two conforming
tools reach the same verdict on the same pair".

---

### A-3. `ERF-43`: must a closure terminate in a non-argument leaf, or does the vacuity clause swallow the rule?

**Text.**

> An argument's premise closure, followed transitively through its outgoing
> `assumes` edges and the incoming `supports` edges of other claims (`ERF-24`),
> MUST terminate in non-argument leaves. The closure is what the edges reach and
> excludes the argument itself, so a premise-less argument has an empty closure
> and satisfies this vacuously; it is unbacked (section 2), which a consumer may
> show.

**The problem.** Take `A` an argument that assumes `B`, where `B` is an argument
with no premises of its own. Is `A` conforming?

**Readings.**

1. *Leaf-typed.* `A`'s closure is `{B}`; `B` is a leaf of that closure and `B`
   is an argument; the closure therefore does not terminate in non-argument
   leaves and `A` violates. The vacuity clause is about the *empty* closure
   only, which is the case of an argument with no premises being judged on its
   own account.
2. *Vacuity generalized.* `B` satisfies the requirement vacuously wherever it
   sits, so `A`'s chain terminating at `B` is fine. On this reading the MUST
   forbids only non-terminating chains, and non-terminating chains are already
   forbidden by the sentence two lines later ("The premise relation over all
   claims MUST admit no cycles"), so the MUST has no independent content
   whatsoever.

**Chosen: reading 1.** Reading 2 makes the sentence pure decoration, and a
requirement that forbids nothing the next sentence does not already forbid is
the less likely drafting.

**What breaks under reading 2.** `tests/corpora/bad-erf43-closure-ends-at-an-argument/`
flips from non-conforming to conforming. More broadly, the corpus shape the
requirement is plainly about — a tower of arguments that never touches an
observation, a bet or a commitment, and so never touches the world — is legal
under reading 2 and illegal under reading 1. That is not a corner case in a
format whose whole subject is where a claim's backing bottoms out.

---

### A-4. `ERF-19` says RFC 3339; the schema's `Instant` pattern admits things RFC 3339 does not

**Text.** `ERF-19`:

> each entry's `timestamp` MUST be a full RFC 3339 instant with time and
> offset, never a bare date. *Shape: `StandingEntry`.* Precision is required
> here alone because this is the format's only ordered ledger: a bare date and
> an instant on the same day cannot be ordered, and a consumer choosing the
> newest stance would settle a disposition by accident.

The schema's `Instant`:

```json
"pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2}(\\.\\d+)?)?(Z|[+-]\\d{2}:\\d{2})$"
```

RFC 3339 `full-time` is `partial-time time-offset` where
`partial-time = time-hour ":" time-minute ":" time-second [time-secfrac]`.
Seconds are mandatory.

**The problem.** `2026-08-22T14:05Z` validates against the normative schema and
is not an RFC 3339 instant. The pattern also admits `2026-13-45T99:99:99Z` and
offsets of `+99:99`, none of which any calendar or RFC 3339 accepts. Three
sources — the schema, the cited standard, and the prose — say three different
things about one field, and section 1 sets the tie-break in only one direction:
"Where a rule leans on a standard, CommonMark, Unicode, RFC 3339, CSL, SemVer,
SPDX, the standard is cited and governs its own ground."

**Readings.**

1. *Schema-first.* The data model is normative (section 3) and a file conforms
   when it validates against it. Seconds-less instants and impossible calendar
   dates conform.
2. *Standard-first.* RFC 3339 governs its own ground, so the pattern is a
   coarse pre-filter and the standard is the rule. Seconds are required and
   fields must be in range.

**Chosen: reading 2**, enforced with `chrono`'s `parse_from_rfc3339`, and
calendar validity is checked on every `Date` too.

**What breaks under reading 1.** Two people's stances written at `14:05Z` and
`14:05:30Z` on one claim cannot be ordered, so the disposition is settled by
whichever the consumer happens to read last. That is verbatim the failure mode
`ERF-19` names as its own reason for existing. A corpus written by a
schema-first producer would be read as non-conforming by a standard-first
validator and vice versa, on a field whose entire point is that everyone agrees
on the ordering.

---

## Part 2 — the rest, by requirement

### A-2. `ERF-52`'s paragraph sentence is textually corrupt in the supplied document

**Text**, exactly as it stands (`SPEC-as-tried.md`, lines 972-974):

```
    the quote. No span crosses a paragraph separator (`ERF-51`) unless the
  quote holds the same break.
(`ERF-51`) unless the quote holds the same blank line. A quote whose spans
  are all empty MUST fail rather than trivially pass.
```

A sentence ends, and then a subjectless fragment repeats its tail with a
different noun: "the same break" against "the same blank line". This is not a
reading difficulty, it is a defect: one of the two is a stale draft that
survived an edit.

**Readings.** "Blank line" names a paragraph boundary and nothing else. "Break"
also covers a CommonMark hard line break, which step 1 renders as one space and
never as a separator — so under a "break" reading the clause would demand that a
quote carry a break the fold has already erased, which is unsatisfiable.

**Chosen:** "blank line", i.e. a paragraph boundary.

**Consequence, and a second finding.** Under either reading the clause turns out
to be non-operative in this implementation, because spans are matched as literal
substrings of the folded text: if the matched region holds a separator then the
span holds one too, necessarily. The clause is asserted in code
(`norm.rs`, a `debug_assert` inside the `Occurs` arm) and cannot fire. An
implementer who instead treated U+2029 as matching any whitespace would need the
clause and would get different verdicts; nothing in the text rules that out.

### A-20. "in order, without overlap" does not say greedy or searching

**Text.** `ERF-52`: "Every non-empty span MUST occur in the normalized text, in
order, without overlap".

**Readings.**

1. *Greedy.* Place each span at its leftmost admissible occurrence after the
   previous one. Simple, and the obvious first implementation.
2. *Searching.* A quote occurs if *any* assignment of spans to occurrences is
   increasing and non-overlapping.

**Chosen: reading 2** (backtracking; `norm.rs::quote_check`).

**What breaks under reading 1.** Text `"aa bb aa cc"`, quote `"aa [...] aa cc"`.
Greedy places the first span at offset 0, then cannot fit `"aa cc"` after it and
rejects a quote that is a truthful elision of the source. Searching accepts it.
Two conforming validators, opposite verdicts, no sentence anywhere to appeal to.
`ERF-51` says the case files `erf-cases-quote-check.txt` are normative for the
exact behaviour and that "where a reading of the prose and a case disagree, the
case governs". Those files were not supplied (see A-38), so this is settled by
an artifact I was told is normative and was not given.

### A-5. `families` uses the `Id` type but names no record

`ERF-35` enumerates the fields that must resolve — `atoms_for`,
`atoms_against`, `edges.to`, `surveys`, `prior_survey`, `notable_results[].atoms`
— and does not include `families`. The schema types family names as `Id`, the
same type record ids use, and `ERF-36` makes *record* ids deployment-unique. So
a family name shares a namespace with record ids, resolves to nothing, and can
legally collide with a claim id with no rule saying anything about it.

**Chosen:** families do not resolve; `ERF-15`'s no-location rule still applies to
them, because they are ids. **Under the other reading** ("`Id` means it names a
record") every family membership is an `ERF-35` violation and the field is
unusable.

### A-6. `ERF-13`: is the id *shape* required, or is it illustration?

> An atom's `id` MUST be permanent: a mint-time prefix and a sequence number
> (`kwg-117`), never renamed and never reused. *Shape: `Id`.*

The `Shape:` pointer goes to `Id`, which is "one or more characters, none
whitespace, `"`, `<` or `>`" — no prefix, no sequence. **Readings:** the MUST
governs permanence and the shape is illustrative; or the shape is required.
**Chosen:** permanence, with the shape reported as a flag. **Under the shape
reading** every content-addressed id is a violation, and the spec's own worked
claim id `citators-disagree-on-negative-treatment` would be illegal if the rule
were ever read across record types.

### A-7. `ERF-7`: "MUST NOT contain a URL" against `not: {pattern: "://"}`

The prose forbids a URL; the schema forbids the three characters `://`.
`www.example.com/x`, `doi:10.1000/182` and `mailto:a@b` are locators that pass
the schema. Conversely a citation whose *title* legitimately contains `://`
fails it. **Chosen:** the schema's test is the violation; a schemeless locator
is a flag.

### A-8. `ERF-2`: when is a raw file "mutable at its location"?

> A source whose raw file is mutable at its location, a web page above all, MUST
> record `received.timestamp`.

Mutability is not in the record. **Readings:** any `http`/`https` `received.url`;
or only where a person judges the bytes unstable; or always, since nothing else
says which version was read. **Chosen:** the first, as a violation, because the
second is unimplementable and the third contradicts "A file received by hand has
no locator and no `received`" (`ERF-7`). **Under the second reading** this
requirement is not machine-checkable at all and belongs in the unperformed list.

### A-9. `ERF-68` against the schema's `if/then` grouping

The schema groups `shipped` and `shipped-as-quotation` in one `then` branch, so
both owe `normalized`. The prose says a licence is a SHOULD for "a source whose
normalized text ships", and that "a text shipping under no licence as a short
quotation MUST carry `status: shipped-as-quotation`" — which makes
`shipped-as-quotation` *definitionally* the licence-less case. Reading the
schema's grouping into the licence rule would demand a licence exactly where the
prose says there is none. **Chosen:** only `shipped` is flagged for a missing
licence.

### A-10. Nothing makes a false digest a violation

`ERF-71` makes `received.digest` a SHOULD and explains what a reader does with
it. `normalized_digest` appears in the schema and in section 3.1's field index
and in no requirement's prose at all. **Readings:** a digest that does not match
bytes the corpus holds is a flag, since no MUST covers it; or it is a violation,
since a digest is an assertion about bytes and this one is decidably false.
**Chosen:** violation, under `ERF-71`. **Under the flag reading** a corpus with a
fabricated digest reports CONFORMS, which makes the whole verifiability chain
`ERF-53` calls "the whole verifiability chain" unenforced.

### A-11. `ERF-41`'s inadmissible entry: "MUST be reported" is not "violation"

> any other entry is a producer error, MUST be reported, and is treated as never
> written

Section 2 defines exactly two report kinds and this sentence names neither.
**Chosen:** violation, since "producer error" is the phrase `ERF-55` also uses
for something a validator catches, and since the same entry is already a schema
failure. **Under the flag reading** a claim whose entire ledger is malformed
conforms.

### A-12. `ERF-31`'s malformed candidate: violation or report?

> A candidate that fails the binding's grammar is not a binding, closes no
> passage, and MUST be reported rather than skipped

The *next* sentence says explicitly of the anchor test that it is "a flag and
not a violation", which is strong evidence that the grammar failure is not one.
But `ERF-31` opens as a SHOULD and says "Every part is required". **Chosen:**
violation, reported under `YAMLB-1` because the grammar is the binding's.
**Under the flag reading** a narrative full of malformed markers conforms while
naming no claims at all.

### A-13. How many source lists may a corpus have?

`ERF-3` says "A corpus MUST keep a source list […] keyed by a source id unique
within the corpus". `ERF-54` says exactly one file carries `type: corpus` and
says nothing about `type: sources`. **Chosen:** any number, with a violation
when a source id appears in two of them. **Under the exactly-one reading** any
corpus that splits its source list by domain is non-conforming, and nothing in
the format says so.

### A-14. The binding's section 1 states MUST-shaped rules under no id

> One record per file: YAML frontmatter, then a markdown body, for every record
> type. An atom's body is empty, so its file is frontmatter alone […] The
> declaration and the source list are YAML documents with no body.

These are the binding's core rules and none of them carries a requirement id, so
nothing can cite them and no validator can report them by number. This
implementation coined `YAMLB-1s` ("section 1") in order to have something to
print. A second implementer coins something else, or checks nothing.

### A-32. `SPEC.md` says the file half of `ERF-53` moved to the binding; it is not there

> `ERF-65`, `ERF-66`, `ERF-67` and the file half of `ERF-53` moved there on
> 2026-08-25 keeping their ids

The binding contains `ERF-65`, `ERF-66`, `ERF-67` and `YAMLB-1`. There is no
`ERF-53` in it. Its section 1 instead says "That a canonical interchange form
exists […] is `ERF-53` in `SPEC.md`. That the form is this one is this section."
So the moved half is the unnumbered section 1 of A-14. A pointer to a rule that
is not where the pointer says it is.

### A-15. `ERF-55` and nested empty lists

"Empty lists MUST be omitted" is unrestricted, so `evidence_at_stance:
{atoms_for: []}` is a violation while `evidence_at_stance: {}` is required to be
written when a ruler stamped and faced nothing. **Chosen:** as written —
violation for the inner empty list. The two clauses sit one sentence apart and
an implementer could easily read the mapping exemption as covering its contents.

### A-16. `ERF-54` makes a validator report every normalized text as ignored

> a file without one is not part of the corpus, and a consumer MUST ignore it and
> report that it did (`ERF-57`)

A corpus's normalized texts and raw files carry no `type`. Followed literally, a
validator prints a line for every one of them. **Chosen:** literal, with the
reason attached. **Under the "exempt files the source list names" reading** a
stray file dropped into `normalized/` is accepted in silence, which is the thing
`ERF-57` is written against.

### A-17. `ERF-51` step 1: "leaf block" is CommonMark's term used with a non-CommonMark meaning

> each leaf block (a paragraph, a heading, a list item's content, a code block)

CommonMark's own leaf blocks are paragraph, ATX/setext heading, thematic break,
indented and fenced code block, and HTML block. "A list item's content" is a
*container's* content, not a leaf block. In a tight list an item holds inline
content directly; in a loose list it holds paragraphs. **Chosen:** flush a block
at every list-item end as well as at paragraph, heading, code-block and
HTML-block ends, which makes a tight list's items separate blocks. **Under the
strict CommonMark reading** a tight list either fuses into one block or splits,
depending on whether the parser synthesizes paragraphs — a parser-dependent fold,
which is the exact outcome naming a dialect was meant to eliminate.

### A-18. Step 1 says nothing about block quotes, thematic breaks, or empty blocks

**Chosen:** a block quote is a container and its paragraphs are the leaf blocks;
a thematic break contributes no text and no separator; a block that produces no
text is dropped rather than emitting adjacent separators. All three are
inventions. A different set of inventions changes where separators land, which
changes `ERF-52`'s verdicts.

### A-19. `ERF-52`'s hyphen departure says "letters or digits", which is not a UAX #29 category

> a hyphen (`-`, U+2010, U+2011) between two letters or digits does not break a
> word

UAX #29's word-boundary rules are written over `ALetter`, `Hebrew_Letter`,
`Numeric`, `Katakana` and `ExtendNumLet`. "Letters or digits" is not one of
them. **Chosen:** `char::is_alphanumeric` (Unicode `Alphabetic` plus `Nd`/`Nl`/
`No`). An implementer using `ALetter ∪ Numeric` gets a different answer for
Katakana, for circled digits, and for several Indic scripts.

### A-21. `ERF-48`'s "later than" at instant precision

> MUST set `last_modified` to a timestamp later than its `created` […] At date
> precision "later" admits the same day

The allowance is granted to date precision only, so equal instants are a
violation. Mixed precision on one day is unaddressed. **Chosen:** any
date-precision participant admits the same day.

### A-22. `ERF-47` for `evidence_audit`: what is "what it judged"?

`ERF-47` says "older than the last change to what it judged". Section 4.4 names
three triggers: "an atom added to either list, a cited atom modified, the
statement edited". The first and third stamp the claim; the second stamps an
atom. So a backing audit is judged against a *set* of records, which `ERF-47`
never says. **Chosen:** the claim's last change and each cited atom's.
**Under the claim-only reading** an atom edited after its claim's audit leaves
the audit reading current, which is `ERF-48`'s note's stated failure mode
("under-stamping shows a current verdict on a finding that has since moved").

### A-23. `ERF-32`'s `indeterminate`: when can the comparison not be run?

Both stamps are structurally always available: `bound-at` is required by the
grammar, and an absent `last_modified` means never edited, which is *current*
rather than indeterminate. **Chosen:** indeterminate exactly when the named
claim does not resolve. If there is another case the specification has in mind,
nothing names it.

### A-24. `ERF-60` and `additionalProperties: false` contradict each other by construction

`ERF-60` says that under a MINOR newer than the validator knows, unknown content
"is expected, and the validator MUST preserve it, report it as unrecognized, and
MUST NOT count it as a violation". The normative schema closes every object, and
a validator holds one copy of it. So the schema says violation and `ERF-60` says
not. **Chosen:** downgrade `additionalProperties` and unknown-`type` findings to
flags when the declared MINOR exceeds this validator's. There is no way to do
this from the schema alone, which means schema conformance and `ERF-60` cannot
both be mechanical.

### A-25. A narrative has no id, so nothing can reference a narrative

`ERF-34` and the schema give `Narrative` no `id`. `ERF-36` covers record ids and
a narrative is not a record. Consistent, and worth stating: a corpus cannot
cross-reference its own prose, and two narratives with the same `title` are
indistinguishable to any consumer.

### A-26. `ERF-17`'s "a declared corpus", in a deployment of several

**Chosen:** membership in the set of declarations found in the corpus being
validated. In a multi-root run this tool still scopes `corpus` per root, since a
record's `corpus` naming a *sibling* corpus's declaration would make the record
homeless.

### A-27. Seven requirement ids are absent with no register of what they were

`ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`, `ERF-46`, `ERF-49` and `ERF-64` never
appear. The versioning section says "retired ids are never reused and are never
refilled", so the gaps are presumably deliberate; but nothing says which were
retired or when, so an implementer diffing against an older copy cannot tell a
retirement from a truncation. Not an ambiguity in a rule; an ambiguity in the
register that the rules' own change control depends on.

### A-28. `ERF-65`'s scope: values, and what about keys?

> String-typed means every field section 3 types as a string, every id and family
> name, and every source id

A source id is a mapping *key*, and YAML resolves keys under the same rules:
`sources: {2026: {…}}` gives an integer key. The schema tests `propertyNames`
with a string pattern, which most loaders reach only after stringifying.
**Chosen:** keys are stringified and tested against the pattern; a numeric key
is not separately reported under `ERF-65`.

### A-29. Section 4.2's `limitations` advice is guidance, and I check it anyway

> Where `source_quality` is `medium` or `low`, put the reason in `limitations`

This sits in "Writing one well", which section 4 says "binds nothing". This tool
flags it under `ERF-9`. An implementer reading only the numbered requirements
checks nothing here, and is right to.

### A-30. Section 2 carries an unnumbered MUST

> *actor*: `human:<id>` for a person, `<producer>/<version>` for a model or
> agent, `process:<id>` for automation. Every actor id MUST follow this
> convention.

A MUST in the definitions section with no requirement id. Reported here as
`SPEC-2` for want of anything to cite.

### A-31. `ERF-6`'s producer duty and what "the check" is

> A producer MUST take a quote from the normalized text by copying, a substring
> operation performed by a tool, and MUST NOT regenerate it […] The check exists
> to say so.

A copied quote and a carefully retyped one are byte-identical when nothing was
tidied, so the act itself is invisible. **Chosen:** report the act as
unperformed, and flag its one visible trace — a quote that matches only once
step 2 of the fold has run, meaning the quote's own code points differ from the
source's. An implementer who reads "the check" as meaning only `ERF-50` checks
nothing extra; one who reads it as licensing a stricter byte comparison rejects
legitimate quotes that cross a soft line break.

### A-34. `ERF-26`: "A category ('web search') is not an instrument" has no test

No list, no rule, one example. This tool ships a hand-written category list and
flags matches. A second implementer ships a different list, or nothing.

### A-35. `ERF-25` gives no test for "a universal negative"

> A universal negative, a claim of the form "no shipped tool does X"

The form of what — the `title`, the `body`, the proposition as a reader
understands it? **Chosen:** a heuristic over the title, flagged as heuristic in
the output. Two implementers will not agree on a single claim.

### A-36. `ERF-69`: nothing in the record says whether a normalized text is an excerpt

`excerpt` present asserts one. Its absence asserts nothing: either the text is a
whole copy, or it is an excerpt in violation of `ERF-69`, and no reader can tell
which. So the fidelity duty ("MUST then record who selected the passage and
when") cannot be enforced even in principle from the corpus.

### A-37. `ERF-70`'s "another format" is undefined

**Chosen:** decided from the raw file's extension, which is a guess, and flagged
rather than violated for that reason.

### A-33. The binding has no section 6

Its sections run 1, 2, 3, 4, 5, 7, 8. Cosmetic, but a citation of "the binding's
section 6" would point at nothing, and the numbering is the only handle those
un-numbered rules have (A-14).

### A-38. The normative conformance case files were not supplied

> the case files beside this document, `erf-cases-normalization.txt` and
> `erf-cases-quote-check.txt`, are normative for its exact behavior: where a
> reading of the prose and a case disagree, the case governs, and a conforming
> implementation reproduces every pair.

They are named normative and were not among the three documents. Every
normalization and quote-check decision above — A-1, A-2, A-17, A-18, A-19, A-20
in particular — is therefore provisional against an artifact that is declared to
outrank my reading of the prose. This is named as UNPERFORMED under `ERF-51`.

---

## Requirements that are unambiguous

Stated by id, as asked. These I read once and implemented without a fork:

`ERF-4`, `ERF-5`, `ERF-12`, `ERF-17`, `ERF-21`, `ERF-22`, `ERF-23`, `ERF-27`,
`ERF-33`, `ERF-34`, `ERF-37`, `ERF-38`, `ERF-39`, `ERF-40`, `ERF-42`, `ERF-44`,
`ERF-50`, `ERF-54`, `ERF-56`, `ERF-57`, `ERF-58`, `ERF-59`, `ERF-61`, `ERF-62`,
`ERF-63`, `ERF-66`, `ERF-67`, `ERF-72`, and `YAMLB-1`'s grammar block, which is
the clearest piece of specification in all three documents: a real BNF, an
explicit statement that recognition precedes validation, an explicit delimiting
rule, and an explicit statement of what an unterminated candidate does. Nothing
else in the format is written that tightly, and it took no interpretation at all
to implement.

`ERF-41`'s computation is unambiguous *given* A-11: the four-way read of the
current stances, the discarding of withdrawals, the same-instant tie-break by
ledger order and the flag on it are all stated exactly, and there is genuinely
"exactly one reading" of every input as the requirement claims.

## Seams between schema, standard and prose

The exercise asked for particular attention here. Collected:

| Fact | Schema | Cited standard | Prose | Resolved as |
|:--|:--|:--|:--|:--|
| Standing instant | seconds optional (A-4) | RFC 3339 requires seconds | "a full RFC 3339 instant" | standard |
| Calendar validity | pattern only, `2026-13-45` passes | RFC 3339 | silent | standard |
| Atom id shape | any non-whitespace string | — | "a mint-time prefix and a sequence number" (A-6) | prose, as a flag |
| `citation_text` locator | `not: "://"` | — | "MUST NOT contain a URL" (A-7) | schema violation + prose flag |
| Shipping status and licence | `shipped` and `shipped-as-quotation` share a branch | SPDX | licence-less quotation is `shipped-as-quotation` (A-9) | prose |
| Unknown field under a newer MINOR | `additionalProperties: false` | — | "MUST NOT count it as a violation" (A-24) | prose, by downgrading |
| U+2029 | — | `White_Space=Yes` (UCD) | step 3 collapses White_Space (A-1) | prose intent over the standard's classification |
| Word boundary | — | UAX #29 categories | "letters or digits" (A-19) | prose, approximated |
| `families` | typed `Id` | — | not in `ERF-35`'s list (A-5) | prose |
| Digest match | `Digest` pattern only | — | no requirement at all (A-10) | invented as a violation |
| Narrative body | `body` required in the model | — | binding says the body is the file body (A-14) | binding, under a coined id |
