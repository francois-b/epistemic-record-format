# Ambiguities found building `erfval` cold

Built from `SPEC-as-tried.md`, `SCHEMA-as-tried.json` and `BINDING-as-tried.md`
and nothing else. No reference implementation, no fixtures, no conformance
cases, no git history were opened.

Twenty-nine places where two careful implementers could build different
things. Each states the exact text, the readings, the one I took, and what
breaks under the other. The three at the top are the ones that decide whether
two implementations agree at all.

A closing section names the requirements that are **not** ambiguous, and a
section before it works the seam the brief asked about specifically: rules
that live in the prose but not the schema, in the schema but not the prose, or
in both with different force.

---

## A1. ERF-51 step 2 — one pass, or a fixed point? (decisive)

> 2. Remove a marker `*`, `_` or `` ` `` that has a word character on
>    exactly one side; keep one that has word characters on both sides
>    (`MAX_LEN`, `3*4`) or on neither (`a * b`, a lone footnote star).

And the reason given below it:

> The marker rule because the normalized text is markdown and the quote is
> the prose inside it; keeping a marker between two word characters stops
> `3*4` folding to `34`.

**Readings.**

1. **One simultaneous pass.** Decide every marker against the string as it
   entered step 2, then remove them all at once.
2. **One left-to-right pass**, each removal changing what the next character
   sees.
3. **Iterate to a fixed point.**

The three differ the moment a marker run is longer than one character, which
in markdown means every strong emphasis:

| input | reading 1 | reading 2 | reading 3 |
|:--|:--|:--|:--|
| `*italic*` | `italic` | `italic` | `italic` |
| `**bold**` | `*bold*` | `*bold` | `bold` |
| `***both***` | `**both**` | `**both` | `both` |
| `**MAX_LEN**` | `*MAX_LEN*` | `*MAX_LEN` | `MAX_LEN` |

Reading 2 is not even symmetric: the leading run keeps a marker and the
trailing run does not, because by the time the scan reaches the closing run
the opening one has already shrunk. A fidelity check whose output depends on
scan direction is broken on its face, so reading 2 is out on internal grounds
alone. That still leaves 1 and 3, and the requirement's wording ("Remove a
marker that...", one imperative, one step in an ordered sequence) reads more
naturally as 1.

**Chosen: 3, the fixed point.** `src/fold.rs`, `fold()`, marked `HERE`.

**What breaks under reading 1.** Everything. A normalized text is markdown by
construction ("These assume text or markdown, which is what normalized text
always is"). Any passage a normalizing tool emphasized with `**` becomes
unquotable: the folded text carries `*bold*` and the quote, which is the prose
a person reads, carries `bold`. The conforming corpus in `tests/conforming`
turns on exactly this — `atoms/led-002.md` quotes "the debit side" against a
normalized text reading "the **debit** side" — and under reading 1 it is a
violation. A corpus and a validator that disagree here disagree about almost
every atom.

**Why this is the worst one.** The requirement ends by saying the conformance
case files govern: "where a reading of the prose and a case disagree, the case
governs, and a conforming implementation reproduces every pair." I was told
not to read them, and that instruction is the finding: **the prose alone does
not determine the fold.** A cold implementer's only defence is to pick the
reading that makes the stated purpose true, which is what I did, and to say
so loudly.

---

## A2. ERF-52 — is an elision marker a word boundary? (decisive)

> Every non-empty span MUST occur in the normalized text, in order, without
> overlap, and as whole words: where a span begins or ends with a word
> character, the character beside it in the text MUST NOT be a word character
> or a word-internal one.

**Readings.**

1. The boundary test always looks at the character beside the span **in the
   text**, whatever sits beside it in the quote.
2. An elision marker ends the previous span and opens the next one, so a span
   adjacent to `[...]` is unconstrained on that side — the marker is the
   boundary, the way "A span opening or closing on any other character is
   unconstrained on that side, that character being the boundary" says of an
   ordinary punctuation mark.

**Chosen: 1.** The requirement says "in the text" in as many words, and
reading 2 has no textual support beyond the sentence about *characters* being
boundaries, which is about characters inside a span and not about the marker
that separates two.

**What breaks under reading 2.** The whole-words rule becomes optional. Prefix
any quote with `[...]` and the left boundary stops being checked; suffix it
and the right boundary goes too. `[...]binding, and management did not
recommend` would then match `the plan was non-binding, and management did not
recommend it`, which is the exact fabrication ERF-52's own worked example
exists to forbid. This is attack A5 in `tests/fabrication`; it is the sharpest
thing in the suite because reading 2 is the *natural* implementation — you
split on the marker, you hand each span to a matcher, and the matcher no
longer knows whether its span was at the start of the quote.

The requirement never mentions the interaction. It should.

---

## A3. Must `atoms_for` name an atom? (decisive, and the one I may have wrong)

> **ERF-35** A reference asserting a *current* relationship MUST resolve
> within the deployment, the corpora read and cited together: `atoms_for`,
> `atoms_against`, `edges.to`, `surveys`, `prior_survey` and each
> `notable_results` entry's `atoms` name existing records, and ids are
> deployment-unique (`ERF-36`), so **one lookup serves every type**.

**Readings.**

1. Each field names a record of the type its name says: `atoms_for` names
   atoms, `surveys` names surveys, `edges.to` names claims.
2. Each field names *an existing record*, full stop. "One lookup serves every
   type" says the lookup is untyped; nothing anywhere states a type
   constraint, and the schema types every one of them as a bare `Id`.

**Chosen: 1**, reported as a violation. `src/checks.rs`, `references_pass`.

**Grounds.** ERF-23 ("Evidence MUST live on the claim, in both directions:
`atoms_for` and `atoms_against`") only makes sense if those lists hold atoms.
ERF-43 traverses `edges` as a claim-to-claim relation and would otherwise have
to walk through atoms. Section 4.5 says a claim "carries one `surveys` list".

**What breaks under reading 2.** `surveys: [some-atom-id]` conforms, an
argument may assume an atom, and ERF-43's premise closure has to define what
it means to reach a non-claim. Nothing in the format would catch a corpus that
put atom ids in `surveys` and survey ids in `atoms_for`.

**Why I may be wrong.** "One lookup serves every type" is the only sentence in
the requirement that speaks to typing, and it points the other way. The schema
— which section 3 calls normative and which "carries the shape rules this
document once stated in prose" — expresses no type constraint on any of these
fields, and it *could* have (a `$ref` to a per-type id definition, a
`$comment`, anything). A reference implementation built from the schema will
take reading 2. **My validator will fail a corpus that a schema-first
implementation passes.** If exactly one thing in this document should be
settled by an errata, it is this sentence.

---

## A4. Are the declaration and the source list frontmatter files or bare YAML?

Binding, section 1, two sentences apart:

> One record per file: YAML frontmatter, then a markdown body, **for every
> record type**. [...] The declaration and the source list are YAML documents
> with no body.

The declaration and the source list are not records ("A source is not a
record"; the declaration is "the declaration"), so the first sentence does not
reach them, and the second says "YAML documents". But `corpus.yaml` written
with `---` fences and an empty body is also "a YAML document with no body",
and `---` is a legal YAML document-start marker.

**Chosen:** accept both. `split_frontmatter` treats a file that opens `---`
and holds a closing `---` as frontmatter-plus-body, and anything else as one
YAML document. A non-empty body on either file is a violation of ERF-53's
one-record-per-file shape.

**What breaks under a stricter reading:** a corpus written the other way is
rejected on a technicality that changes nothing about the data.

---

## A5. ERF-13's id shape: a MUST in the prose, absent from the schema

> **ERF-13** An atom's `id` MUST be permanent: a mint-time prefix and a
> sequence number (`kwg-117`), never renamed and never reused. *Shape: `Id`.*

The schema's `Id` is `^[^\s"<>]+$`: any non-empty run without whitespace,
quote, or angle bracket. The prose puts "a mint-time prefix and a sequence
number" inside a MUST and then points at a schema that does not enforce it.

**Readings.** (1) The shape is normative and `an-atom-without-a-number` is a
violation. (2) The parenthetical is an illustration of what permanence looks
like in practice; the enforceable form is the schema's, as section 3 says
("*Shape* — the schema holds the enforceable form and the requirement holds
the reason").

**Chosen: 2, reported as a flag.** Section 3's own rule about *Shape* markers
decides it: the requirement holds the reason (permanence), the schema holds
the form. A flag says a person should look without failing a corpus over a
sentence the normative model contradicts.

**What breaks under reading 1:** every corpus that names atoms by slug rather
than by sequence is non-conforming, which is a large behavioural difference
resting on a parenthetical.

---

## A6. ERF-2: which sources are "mutable at their location"?

> A source whose raw file is mutable at its location, a web page above all,
> MUST record `received.timestamp`, the date it arrived.

Mutability at a location is not decidable from the corpus. ERF-71 concedes as
much from the other side: "a page that differs on every fetch cannot be
pinned, and its source simply carries no digest."

**Readings.** (1) Any `received.url` is a mutable location, so a url without a
timestamp is a violation. (2) It is a judgment, so a validator flags.

**Chosen: 2.** Section 1 defines the validator's duty over MUSTs that are
"decidable from the corpus and the files it holds alone, without a network, a
judgment, or a second party", and this one is not. Under reading 1 an
archived, digest-pinned PDF at a stable url is non-conforming for lacking a
date that would tell a reader nothing.

---

## A7. ERF-49: what is "an `observation` someone stands on"?

> A validator MUST flag as unbacked an `observation` someone stands on with
> empty `atoms_for` and empty `surveys`, and such an `argument` with no
> premises.

**Readings.** (1) any standing entry exists at all; (2) some person's current
stance is `for`; (3) the computed disposition is not `proposal` and not
`retired` — that is, somebody currently holds a position either way.

**Chosen: 3.** A `proposal` is explicitly "a claim nobody has taken a stance
on", and a `retired` claim is one "every current holder has left" — nobody
stands on either. An `against` stance is still standing on the claim in the
sense that matters: a person is on record about it and a reader will want to
know it is unbacked.

**What breaks:** reading 1 flags a claim whose only entries are withdrawals;
reading 2 misses a rejected claim that nobody ever backed, which is the case
where "unbacked" is most worth saying.

---

## A8. An unknown `type`: ERF-55's violation or ERF-57's tolerated unknown?

> **ERF-57** A consumer MUST preserve unknown fields and unknown record types
> as opaque data, MUST report them, and MUST NOT reject a corpus solely
> because it contains them. **Strictness belongs to the producer and detection
> to the validator.**

> **ERF-55** a producer MUST NOT originate a field the declared
> `spec_version` does not define, outside the `x_` namespace.

ERF-55 speaks of fields, not types. A file carrying `type: hypothesis` is a
record type version 0.9.0 does not define.

**Chosen: violation, under ERF-55**, on ERF-57's own last sentence: detection
is the validator's job, and a validator that stays silent about an undefined
record type is not detecting.

**What breaks:** under the other reading, a corpus can carry any number of
undefined record types and still be certified, and forward compatibility
becomes indistinguishable from a producer bug. Note the asymmetry this creates
with a *consumer*, which must load the same corpus without complaint. That is
the design, but it means "conforming" is not a property of the corpus alone —
it is a property of the corpus and the declared version together.

---

## A9. Does ERF-66 bind the declaration and the source list?

> **ERF-66** A **record's** frontmatter MUST NOT contain a duplicate key, an
> anchor, an alias, or an explicit tag.

The declaration and the source list are not records (section 2, section 4.1).
Read literally, a source list may hold a duplicate source id, or an anchor and
an alias, and two conforming parsers may legally disagree about the licence
and the digest of a source — the exact hazard the requirement exists to remove,
applied to the file that "carries the digests, the licence judgments and the
normalized-text paths, the whole verifiability chain" (ERF-53).

**Chosen:** apply it to every file the corpus holds, and say so here.

**What breaks under the literal reading:** nothing detects a source list with
two entries under one key.

---

## A10. `normalized_digest` has no requirement at all

The schema defines `Source.normalized_digest` as a `Digest`. No numbered
requirement in the specification mentions it. ERF-71 is about
`received.digest` only.

So: a `normalized_digest` that does not match the bytes on disk violates
nothing. **Chosen:** report the mismatch as a flag, under ERF-53 (whose "the
bytes of a held raw or normalized file, which is where every quote-check
verdict lives" is the nearest thing to a home). A schema field with no
requirement behind it is a gap, and I would rather name it than quietly
promote it.

---

## A11. What are `normalized` and `received.path` relative to?

The schema's description of `normalized` says "relative to the source list".
Nothing says what `received.path` is relative to; the example writes
`raw/pacioli-1494-geijsbeek.pdf`.

**Chosen:** both resolve against the directory holding the source-list file.
Any other choice (the corpus root, the current directory, the declaration's
directory) is equally defensible and produces a different corpus, and ERF-54's
"no meaning MAY live in a path" makes the whole question slightly awkward:
these two fields *are* paths that carry meaning.

---

## A12. A narrative binding naming a claim that does not exist: violation or flag?

ERF-31: "every id MUST resolve to a claim". ERF-33: a consumer "MUST report it
and MUST NOT drop it silently", framed as fidelity rather than conformance.
ERF-35's enumeration of references that must resolve does **not** include
narrative bindings.

**Chosen: violation.** ERF-31's MUST is unqualified, and ERF-31 goes out of
its way to say which of its clauses is a flag ("A validator MUST flag an
anchor that does not occur in its passage, a flag and not a violation"). The
one it singles out is the anchor; the id clause is left as written.

**What breaks under the flag reading:** a narrative can cite records that were
never minted and the corpus still certifies. The counter-argument is section
1's principle: a claim *deleted* elsewhere would make an untouched narrative
non-conforming. But records in this format are never deleted — retirement is a
computed disposition, not a deletion — so the principle does not reach here.

---

## A13. ERF-51 step 3: what is "a run holding a blank line"?

> Collapse each whitespace run (Unicode `White_Space`) to a single space,
> except a run holding a blank line, which is a paragraph boundary and
> collapses to U+2029 PARAGRAPH SEPARATOR; then trim.

A blank line is not defined. **Chosen:** a run containing two or more line
terminators, where CR LF counts once, and where a literal U+2028 or U+2029 in
the source forces the paragraph reading.

Open under other readings: `\n   \n` (a line of spaces between two newlines) —
same answer under mine, different if "blank line" means a line of length zero.
A file with CR LF line endings would produce four terminators per blank line
under a naive count; that is moot here only because ERF-67 bans CR.

## A14. "then trim" — does the trim eat a leading U+2029?

U+2029 has the `White_Space` property, so a normalized text that opens with a
blank line folds to a leading paragraph separator that `trim` then removes —
or does not, if "trim" means "trim the whitespace that was there before step 3
replaced it". **Chosen:** trim strips leading and trailing U+2029 as well.
Consequence either way is small; the two implementations differ on a quote
that opens or closes with a blank line.

## A15. ERF-52's apostrophe: which characters?

> an apostrophe between letters (`board's`)

The example is a typewriter apostrophe, U+0027. Extracted text overwhelmingly
carries U+2019. **Chosen:** both, which is the stricter reading (more
positions count as word-internal, so more fabrications fail). An implementer
who reads the example literally will pass quotes I reject, on any source that
uses curly quotes — which is most of them.

## A16. ERF-52's matching strategy — an ambiguity that dissolves

"in order, without overlap" states no search strategy, and leftmost-greedy can
in general fail where an ordering exists. Here it cannot: every span is a fixed
string, so the end of a match is monotone in its start, and the earliest valid
occurrence always leaves the most room for the next span. Greedy is optimal and
backtracking is redundant. `erfval` backtracks anyway, because the proof is
mine and not the specification's. **Not actually ambiguous.**

## A17. ERF-47: what did an `evidence_audit` judge?

> a `finding_audit`, `evidence_audit`, or narrative binding older than the
> last change to what it judged is flagged stale

Section 4.4 says when to re-run one — "an atom added to either list, a cited
atom modified, the statement edited" — and ERF-28 adds "Staleness of a claim's
survey backing is computed from `conducted` timestamps". Neither is phrased as
the definition of "what it judged".

**Chosen:** the maximum over the claim's own `last_modified`/`created`, every
cited atom's, and every cited survey's `conducted` and `last_modified`.
A narrower reading (the claim alone) misses the case section 4.4 names first.

## A18. ERF-48 at instant precision: is an equal instant "later"?

> Any change to a record MUST set `last_modified` to a timestamp later than
> its `created` [...] At date precision "later" admits the same day.

The carve-out is stated for date precision only, which implies strictness at
instant precision. But an edit within the same second is physically possible.
**Chosen:** a `last_modified` strictly earlier than `created` is a violation;
an identical instant is a flag. Neither reading is forced.

## A19. ERF-41: standings present, every entry inadmissible

Inadmissible entries are "treated as never written". If every entry is
inadmissible, is the claim a `proposal` (no standings) or `retired` (standings
with nothing remaining)? **Chosen: proposal**, since treating them as never
written means the ledger is empty. The alternative would make a producer bug
read as a deliberate withdrawal, which is worse.

## A20. ERF-3: may a corpus hold more than one source-list file?

"A corpus MUST keep a source list, one entry per work, keyed by a source id
unique within the corpus." Singular, and the binding shows one file. But
ERF-54 says a corpus is discovered by walking files and dispatching on `type`,
and nothing forbids two. **Chosen:** flag the multiplicity, enforce source-id
uniqueness across all of them. A validator that rejected the second file would
be inventing a rule; one that ignored it would miss duplicate ids.

## A21. ERF-70: how does a validator know the raw file's format?

"Where normalized text was produced from a raw file in another format, the
source MUST name the extracting tool and its exact version." The corpus does
not record the raw file's media type. **Chosen:** the extension of
`received.path`, else the extension of `received.url` with query and fragment
stripped, else the question is not decidable and the check is named as
unperformed for that source. A source with no `received` at all — legal, per
ERF-7's "A file received by hand has no locator and no `received`" — can never
be checked against ERF-70.

## A22. ERF-69: how much adjacent text is "enough"?

> It MUST contain the quoted passage together with enough adjacent text for
> the passage's place in the work to be legible: a text holding the quote
> alone proves nothing.

The only sharp edge is "the quote alone". **Chosen:** a normalized text whose
fold equals a quote it carries is a violation; one under 1.5× the quote's
length is a flag. The 1.5 is mine and has no warrant in the text, which is why
it is a flag and not a violation. Every other implementer will pick a
different number or none at all.

## A23. Three normative passages carry MUSTs and no requirement number

- Section 2: "Every actor id MUST follow this convention."
- Section 3: "it is normative: a file conforms to the model when it validates
  against the schema."
- Section 5: "Closed sets. A value outside them is a validation failure, not a
  dialect."

A validator that must put a requirement id on every line has nowhere to point.
`erfval` invents `SPEC-2`, `SPEC-3` and `SPEC-5` and says so in its output.
The versioning section says "Requirement ids are a flat sequence and carry no
meaning beyond identity" — these three passages should have numbers.

## A24. ERF-7 in the prose is stronger than ERF-7 in the schema

Prose: "`citation_text` MUST NOT contain a URL." Schema:
`"not": {"pattern": "://"}`.

`Acme, Report (2026), www.acme.com/report` contains a URL and passes the
schema. `See https://…` fails it. The schema is a proxy for the rule, not the
rule. **Chosen:** enforce the schema's test as a violation, and flag the
bare-domain cases separately under the same id. An implementer who treats the
schema as the whole of ERF-7 will disagree.

## A25. Rules in the schema and nowhere in the prose

- `Survey.searches` carries `"minItems": 1`. No requirement says a survey must
  record at least one search act. It is a reasonable rule and it exists only in
  the JSON.
- `Source.normalized_digest` (see A10).
- `Received` has no required properties, so `received: {}` validates and
  asserts "a fetch happened" with no locator, no digest and no date.
- `CorpusDeclaration.owner` is an `Actor`, so `process:nightly` can own a
  corpus while section 2 defines *owner* as "the corpus's responsible person"
  and ERF-21 reserves judgment for `human:`.
- `Claim.body` is required with no `minLength`, so a claim with an empty body
  validates while ERF-18 says the body "carries the working notes".

## A26. Rules in the prose that the schema cannot hold, and one it holds by accident

Expected and stated: everything about more than one record, everything
computed, every obligation on an act. But two are worth naming:

- **ERF-22** ("A claim MUST NOT store a state field") is enforced only as a
  side effect of `additionalProperties: false`. It is reported as ERF-55, not
  ERF-22, because the schema cannot tell a stored disposition from any other
  undefined field. A reader of the report gets the right verdict under the
  wrong number.
- **ERF-55** ("Empty lists MUST be omitted") is invisible to the schema: not
  one of the total lists carries `minItems`, so `atoms_for: []` validates
  cleanly. This is the one place where the schema could have carried the rule
  and does not.

## A27. `owner` — see A25. A `process:` may own a corpus.

## A28. Does a narrative binding's anchor get elision markers?

ERF-31: "the anchor MUST occur in its passage under the test a quote meets
(`ERF-52`), the fold and whole words." ERF-52 is the whole span check,
including the `[...]` split. **Chosen:** apply all of it, so an anchor may
contain `[...]`. The parenthetical "the fold and whole words" names only two
of the three parts, which suggests the elision half was not intended. Nothing
turns on it unless someone writes an anchor with a marker in it.

## A29. ERF-53 says list order is part of the corpus. What about mapping order?

> Loss is any difference, after loading, in anything a file carried: [...] the
> order of any list

`sources` is a mapping in the model. A store that returns its entries in
another order has lost nothing under this rule, and `erfval` does not treat
source order as meaningful. If it is meant to be, the rule needs to say so;
if it is not, a round-trip through a hash map is lossless and the source list
is the one file where a reader might expect an order to survive.

---

## The seam the brief asked about: schema, prose, and the gap between

| Rule | In the prose | In the schema | Same force? |
|:--|:--|:--|:--|
| Closed vocabularies (stance, verdict, kind, relation, quality, status) | section 5 | `enum` on six defs | yes |
| Actor forms and their disjointness | section 2, unnumbered | three patterns under a `oneOf` | yes |
| A source that ships names its normalized text | ERF-4 | `if`/`then`/`else` on `status` | yes |
| Standings carry a full instant | ERF-19 | `StandingEntry.timestamp` is `Instant` | yes |
| A standing's `by` is human | ERF-21 | `HumanActor` | yes |
| `citation_text` carries no URL | ERF-7 | `not: {pattern: "://"}` | **schema is weaker** (A24) |
| An atom id is prefix-plus-sequence | ERF-13 | `Id` accepts anything | **schema is weaker** (A5) |
| A claim stores no state field | ERF-22 | `additionalProperties: false` | schema catches it under the wrong id (A26) |
| Empty lists are omitted | ERF-55 | nothing | **prose only** (A26) |
| A survey has at least one search act | nothing | `minItems: 1` | **schema only** (A25) |
| `normalized_digest` means anything | nothing | typed `Digest` | **schema only** (A10) |
| An owner is a responsible person | section 2 | any `Actor` | **schema is weaker** (A25) |
| Every reference resolves, to the right type | ERF-35, arguably | bare `Id` | **prose only, and contested** (A3) |
| Ids are deployment-unique | ERF-36, ERF-38 | a description string | prose only, unavoidably |
| `x_` extension fields | ERF-72 | `patternProperties: ^x_` on every def | yes |
| The elision marker `[...]` | ERF-6, ERF-52 | nothing | prose only, unavoidably |

---

## Requirements that are not ambiguous

Stated once, in one place, with one reading. I built each of these without
hesitating, and I do not believe a second implementer would build them
differently:

**ERF-1, ERF-4, ERF-5, ERF-11, ERF-12, ERF-14, ERF-17, ERF-19, ERF-21,
ERF-23, ERF-26, ERF-27, ERF-34, ERF-36, ERF-38, ERF-39, ERF-40, ERF-42,
ERF-44, ERF-50, ERF-54, ERF-56, ERF-58, ERF-59, ERF-60, ERF-61, ERF-62,
ERF-63, ERF-65, ERF-66, ERF-67, ERF-72.**

Two deserve specific praise, because they are the kind of rule that is
normally ambiguous and here is not:

- **ERF-41** enumerates its own admissibility test, its own tie-break, and
  every combination of remaining stances, and then says "Every input then has
  exactly one reading." It does. The disposition function in `src/model.rs` is
  a total match over three booleans with one arm the compiler can prove
  unreachable, and the exhaustiveness came from the requirement rather than
  from me.
- **ERF-43** anticipates the vacuous case ("a premise-less argument has an
  empty closure and satisfies this vacuously"), the unresolved-premise case
  ("absent from the relation"), the termination case ("a claim reached twice
  visited once, so that a validator terminates on any input"), and says
  explicitly that the cycle prohibition holds "whether or not any closure
  reaches the cycle". Every question I had while writing the graph pass was
  already answered in the paragraph.

**YAMLB-1** is nearly in this list. Its grammar, its recognition rule, its
delimiting rule and its unterminated-candidate rule are all stated. The one
thing it leaves open is A28.
