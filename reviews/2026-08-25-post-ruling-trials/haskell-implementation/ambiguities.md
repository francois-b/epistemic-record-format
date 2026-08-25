# Ambiguities

Every place where two careful implementers, reading only `SPEC-as-tried.md`,
would build different things. Each entry quotes the exact spec text, enumerates
the readings, states which `erfval` took, and says what breaks under the other.

Ordered roughly by how much damage the divergence does.

---

## A1. "its passage" is never delimited

> **ERF-31** "**The anchor occurs in its passage under `ERF-51`**, the same fold
> the quote check uses, applied to the anchor and to the passage alike."
>
> **ERF-31** "**A validator MUST flag an anchor that does not occur in its
> passage.**"

The specification requires an occurrence test whose right-hand operand it never
defines. §2 says a narrative binding is "an HTML comment **closing a passage** of
prose", and ERF-31 says "A passage that asserts something SHOULD end with a
narrative binding" — so a passage ends at its marker. Where it *starts* is
stated nowhere.

Readings, all defensible:

1. **From the end of the previous narrative binding.** Consistent with "closing
   a passage": consecutive markers partition the prose.
2. **The preceding markdown block** (paragraph). "A passage that asserts
   something" is most naturally a paragraph, and markers in the example sit on
   their own line after a blank line.
3. **The preceding markdown section** (since the last heading).
4. **The whole document.** The anchor just has to occur *somewhere* in the
   narrative; the marker's job is to point at prose, and prose moves.

**Chosen:** reading 1. It is the only one that makes the check meaningfully
local without inventing a block model the format never mentions, and it degrades
to reading 4 for a narrative with one binding.

**What breaks under the others.** Reading 4 never fires the flag when a passage
is *moved* (only when the words are *changed*), which defeats the stated purpose
("The anchor is how software finds the spot after the prose moves"). Reading 2
fires a flag on a perfectly good binding whose anchor spans a sentence broken
across two paragraphs by an editor. Readings 1 and 3 disagree the moment someone
inserts a heading between two markers. In our `flagging/fl-ERF-31-anchor-does-not-occur`
corpus, readings 1, 2 and 3 agree; reading 4 does not, because the second
binding's anchor still occurs elsewhere in the document.

This is the single worst gap in the three areas the trial asked to implement
deeply. Two of the format's own requirements (`ERF-31`'s flag and `ERF-32`'s
staleness) hang off a test whose operand is undefined.

---

## A2. ERF-52's empty-span test: before normalization or after?

> **ERF-52** "The quote MUST be split on `[...]` BEFORE normalization [...]
> each span is then normalized independently. Every non-empty span MUST occur in
> the normalized text, in order and without overlap. A quote whose spans are all
> empty MUST fail rather than trivially pass."

`[...]`-splitting is explicitly ordered before normalization. But "non-empty" and
"all empty" are not tied to either side of that boundary, and normalization can
turn a non-empty span into an empty one: ERF-51 step 2 removes `*`, `_` and
`` ` `` unconditionally, so the span `*` normalizes to `""`.

Readings:

1. **After normalization.** Spans are normalized, then emptiness is judged.
   `quote: "*[...]*"` has two empty spans → all empty → **FAIL**.
2. **Before normalization.** Emptiness is judged on the raw spans. `"*[...]*"`
   has two non-empty spans, each of which normalizes to `""`, and `""` occurs in
   any text → **PASS**, trivially, which is exactly the outcome the last sentence
   of ERF-52 exists to forbid.

**Chosen:** reading 1, because reading 2 makes the rule's own stated purpose
unenforceable.

**What breaks under the other.** A quote consisting only of emphasis markers
passes a fidelity check. More realistically: a quote of a single italicised word,
`quote: "*however*"`, normalizes to `however` and passes under both readings —
but a *malformed* quote reduced to markers by an extractor bug passes silently
under reading 2 and is caught under reading 1.

Note also what ERF-52 does **not** say: it never states a matching algorithm for
"in order and without overlap". It does not have to — leftmost-earliest matching
is optimal for sequential non-overlapping substring search, so every correct
implementation agrees — but the spec does not say that either, and an implementer
who reaches for backtracking is not wrong, only slower.

---

## A3. Is a validator's input a corpus or a deployment?

> **ERF-54** "Exactly one file in a corpus MUST carry `type: corpus`, and a
> validator MUST reject a corpus carrying two, because a corpus that declares
> itself twice cannot say which declaration governs."
>
> **ERF-38** "A validator MUST reject a **deployment** containing duplicate
> record ids, regardless of record type."
>
> **ERF-36** "Every record id MUST be unique across every corpus in the
> deployment."

The Validator conformance class says a validator "Binds every machine-checkable
MUST that applies to **the input it accepts**", and then never says what input a
validator accepts. ERF-54 is corpus-scoped and rejects two declarations. ERF-38
and ERF-36 are deployment-scoped and presuppose several corpora being read
together. A deployment of three corpora holds three files with `type: corpus`.

Readings:

1. **The input is one corpus.** Then two declarations is a violation (ERF-54),
   and ERF-36/ERF-38 can only be checked by pointing the tool at something the
   spec has no name for.
2. **The input is a deployment.** Then ERF-36/ERF-38 are checkable and ERF-54's
   "exactly one" has to be re-scoped per corpus — which requires knowing which
   files belong to which corpus, which ERF-54 forbids inferring from paths ("no
   meaning lives in a path") and which the declaration does not state either: a
   declaration names its own `id` but never enumerates its records. The only
   binding is each record's own `corpus` field, which points *up*, not down.
3. **The input is a directory that may be either**, disambiguated by counting
   declarations.

**Chosen:** reading 1, with the two-declaration case reported as an ERF-54
violation carrying an explicit note that reading 2 would call the same tree
legal. `erfval` computes id-uniqueness (ERF-36/38) over whatever it was handed,
which under reading 1 is a corpus and therefore a stricter check than ERF-36
requires.

**What breaks under the others.** Under reading 2, `nonconforming/nc-ERF-54-two-declarations`
conforms. Under reading 1, no deployment can ever be validated as such, so
ERF-36 and ERF-38 have no conforming invocation at all.

---

## A4. `normalized` is a path relative to nothing

> **Source** `normalized?: string;  // the text quotes are checked against (ERF-1)`
>
> Example: `normalized: normalized/pacioli-1494-geijsbeek.md`

A relative path with no stated base. Candidates: the source-list file's own
directory, the corpus root, the declaration's directory, the current working
directory. These coincide only when the source list sits at the root, which the
example silently assumes.

Worse, ERF-54 says "no meaning lives in a path" and "A store may arrange its
files however it likes, or hold no files at all" — yet `received.path` and
`normalized` are paths whose resolution the format depends on for its only
mechanical check.

**Chosen:** try corpus-root-relative, then as given. `erfval` reports both
candidates when neither exists, rather than silently reporting the check
unavailable.

**What breaks under the others.** A corpus whose source list lives in
`meta/sources.yaml` and whose texts live in `meta/normalized/` validates under
source-list-relative resolution and reports every quote check as unrunnable
under root-relative resolution. Since ERF-1 makes a missing normalized text
block the check entirely, the two implementations disagree about whether every
atom in the corpus is verifiable.

---

## A5. ERF-2 and ERF-7 contradict each other for a received file the corpus holds

> **ERF-2** "A corpus that holds the raw file records where, in `received.path`;
> a corpus that does not holds `received.url` and `received.digest` instead."
>
> **ERF-7** "A received file has no retrieval locator, so its source carries no
> `received`."

Take an emailed vendor report, saved into the corpus at `raw/acme-2026.pdf`.
ERF-2 says the corpus records `received.path`. ERF-7 says the source "carries no
`received`" — and `path` lives inside `received`, so under ERF-7 there is
nowhere to put it.

Readings:

1. ERF-7's "no `received`" means "no `received.url`", loosely worded.
2. ERF-7 governs: a received file's location is not recorded at all, and ERF-2's
   `received.path` sentence applies only to files that also have a URL.

**Chosen:** reading 1. `erfval` accepts `received: {path: ...}` with no `url`
and does not report it.

**What breaks under the other.** Under reading 2 every corpus holding an emailed
or hand-delivered source is non-conforming as soon as it records where it put
the file, which is absurd — but that is what the sentence says.

---

## A6. The anchor's escapes are defined but never unescaped

> **ERF-31** `char ::= any character other than '"' and '\', or one of the
> two-character escapes '\"' and '\\'`
>
> "It carries two escapes because a grammar that cannot express a legal value is
> a defect in the grammar: a passage whose own words are in quotation marks would
> otherwise have no anchor at all."

The grammar defines the escapes. Nothing says the anchor is **decoded** before
the ERF-51 occurrence test. Taken literally, the anchor is the character sequence
the grammar matched, backslashes included, and an anchor for prose containing a
quotation mark would then never occur in its passage — the exact failure the
escapes were introduced to prevent.

**Chosen:** unescape `\"` → `"` and `\\` → `\` before normalizing and matching.

**What breaks under the other.** Every binding whose passage contains a quotation
mark is permanently flagged as broken. This is a one-line implementation
difference that silently inverts the result for a whole class of bindings, and
the specification contains no sentence that decides it.

---

## A7. The binding grammar is not closed under HTML-comment lexing

> **ERF-31** `id ::= one or more characters, none of them whitespace or '"'`
>
> `char ::= any character other than '"' and '\', or one of the two-character
> escapes '\"' and '\\'`
>
> "The marker MUST be an HTML comment, so that it is invisible in every render
> and survives any markdown pipeline"

Neither production excludes `-->`. But `-->` terminates an HTML comment. So the
grammar declares legal an id (`a-->b`) and an anchor (`"he said --> that"`) that
cannot be written inside the container the same requirement mandates. The
grammar's own justification for the escapes — "a grammar that cannot express a
legal value is a defect in the grammar" — applies to itself and was not applied.

Readings:

1. **Lexer first.** Scan to the first `-->`; anything after it is outside the
   comment. A binding containing `-->` therefore fails the grammar and is
   reported under ERF-31's report-never-skip rule.
2. **Grammar first.** Scan for the *last* `-->` on the assumption that the
   grammar's productions are authoritative.

**Chosen:** reading 1, because it is what every markdown and HTML pipeline
actually does, and ERF-31's stated reason for choosing an HTML comment is that
the marker "survives any markdown pipeline".

**What breaks under the other.** A document containing two bindings on one line
parses as one binding with a corrupt anchor.

---

## A8. ERF-32 says "the claim", the grammar says "ids"

> **ERF-32** "A narrative binding MUST be checkable: it is stale when **the claim
> it names** carries a `last_modified` later than the binding's `bound-at`"
>
> **ERF-31** `ids ::= id (ws+ id)*`

A binding names one or more claims. ERF-32's staleness rule is written for one.
Nothing says how a binding naming three claims, one of them stale, is reported.

Readings: any-stale-is-stale; all-stale-is-stale; report per claim and let the
consumer decide; the first named claim governs.

**Chosen:** worst-reading-wins (`stale` beats `indeterminate` beats `current`),
by analogy with ERF-32's own principle: "a check that cannot tell says look,
never rest."

**What breaks under the others.** All-stale-is-stale hides the ordinary case
(one premise edited, the rest untouched), which is exactly the case staleness
exists to catch.

---

## A9. ERF-49: what is "someone stands on"?

> **ERF-49** "A validator MUST flag as unbacked an `observation` **someone stands
> on** with empty `atoms_for` and empty `surveys`, and such an `argument` with no
> premises"

Readings:

1. The claim has at least one standing entry, of any stance.
2. The claim has at least one *current* stance that is not `withdrawn`.
3. The claim's computed disposition is `active`.
4. The claim's computed disposition is `active` or `contested`.

**Chosen:** reading 1, because ERF-41 treats `withdrawn` as a stance and ERF-49
does not exclude it, and because a withdrawn stance on an unbacked observation is
still a person's name on a record with nothing under it.

**What breaks under the others.** Reading 3 stops flagging a claim the moment it
becomes contested — i.e. the moment two people are arguing about a claim with no
evidence, which is when the flag is most useful. Reading 1 keeps flagging a claim
long after everyone has withdrawn from it, which is noise. The spec picks
neither.

---

## A10. Is the source list a YAML document or a record file?

> **ERF-3** "A corpus MUST keep a source list: **a document** whose top level is a
> mapping of exactly two keys [...] its interchange form is a YAML document under
> the rules of section 7."
>
> **ERF-53** "The canonical interchange form MUST be one record per file: YAML
> frontmatter plus markdown body, **for every record type**."
>
> **ERF-54** "Every file a corpus holds MUST self-describe [...] it walks what it
> was given, reads each file's `type`, and dispatches on it."

ERF-53 is scoped to record types and a source list is not a record ("Not a
record: nobody asserts a source"). So the source list is "a YAML document under
the rules of section 7" — but section 7's only rule about file shape *is*
ERF-53, which does not apply to it. The declaration (ERF-59) is in the same
position. A narrative is explicitly frontmatter-bearing (ERF-34).

Readings: bare YAML document; frontmatter-plus-empty-body; either.

**Chosen:** either. `erfval` treats a file opening with `---` as
frontmatter-plus-body and any other file as a whole YAML document, and dispatches
on `type` afterwards. This is the only reading under which ERF-54's
"walk what it was given, read each file's `type`" works uniformly.

**What breaks under the others.** A validator that assumes bare YAML cannot read
a source list someone wrote with frontmatter, and reports the whole corpus as
sourceless — which under ERF-4 makes every atom non-conforming.

---

## A11. The frontmatter delimiter is never stated

ERF-53 mandates "YAML frontmatter plus markdown body" and ERF-67 mandates
CommonMark for the body. Neither CommonMark nor the spec defines frontmatter.
`---` appears only in examples. `+++` (TOML), `---`/`...` (YAML's own document
end marker), and a leading YAML document followed by `---` are all in live use.

**Chosen:** a first line of exactly `---`, closed by the next line of exactly
`---`.

**What breaks under the other readings.** A file closing its frontmatter with
`...`, which YAML 1.2 explicitly defines as a document-end marker, is read as
having no body terminator at all and its entire content becomes frontmatter.

---

## A12. ERF-65's JSON schema collides with three fields the spec says are text

> **ERF-65** "Frontmatter MUST parse under YAML 1.2 using the **JSON schema**
> [...] Under it only `null`, the literals `true` and `false`, and JSON's own
> number grammar resolve to non-string scalars; everything else stays a string."

Three fields the spec describes as text are, unquoted, valid JSON numbers:

| field | spec text | unquoted example | resolves to |
|:--|:--|:--|:--|
| `as_of_date` | ERF-14: "It MAY be **a year**, a year and month, or a full date" | `as_of_date: 2018` | number `2018` |
| `hits_reported` | ERF-27: "MUST record each act's yield [...] **as text** (\"0\", \"3\", ...)" | `hits_reported: 0` | number `0` |
| `spec_version` | ERF-61: "MUST follow Semantic Versioning 2.0.0" | `spec_version: 1.0` | number `1.0` |

ERF-65 anticipates exactly this hazard for one field and only that field: "A
producer SHOULD quote a timestamp regardless." It says nothing about years,
yields or versions, and it is a SHOULD, not a MUST.

**Chosen:** report a number arriving in any string-typed field as an ERF-65
violation, name the collision, and keep the coerced string value so the rest of
the checks still run.

**What breaks under the other reading.** A validator that silently coerces
`2018` to `"2018"` conforms to ERF-14 and hides an ERF-65 problem; a validator
that rejects the record outright makes a spec-legal year-precision `as_of_date`
unwritable. Neither is stated. See `yaml-behaviour.md` for what libyaml actually
does with each of these.

---

## A13. ERF-72's `x_` prefix does not cover every file the format defines

> **ERF-72** "A field whose name begins `x_` is an extension field: a producer
> MAY originate one on **any record, declaration, or source**"

The enumeration is closed and omits two things: the **source list document**
(as opposed to a source entry inside it) and a **narrative's frontmatter**. Both
are files the format defines and neither is a record.

Combined with ERF-3 this produces a direct conflict:

> **ERF-3** "a document whose top level is a mapping of **exactly two keys**"

so `x_generator: prism-0.4` at the top of a source list is forbidden by ERF-3
and not permitted by ERF-72 — while the same key on a *source entry* is fine.
A producer writing one generator stamp per file has nowhere to put it on the
source list.

**Chosen:** ERF-3 governs; `erfval` reports a third top-level key as an ERF-3
violation, and says in the message that ERF-72 does not reach here.

---

## A14. `normalized` present alongside an absence status is unforbidden

> **ERF-4** "Every source MUST either give the path of its normalized text or
> record that none is held and why."
>
> **ERF-5** "A source recording an absence MUST carry a `status` from a closed
> set and a human-readable `reason`."

A source with `status: not-redistributable`, a `reason`, **and** a `normalized`
path satisfies both sentences literally: it gives the path *and* records the
absence. Nothing forbids the combination, and the two assertions contradict each
other.

**Chosen:** report it as an ERF-4 violation and say plainly that no requirement
forbids it in as many words.

---

## A15. ERF-13 gives an atom-id shape by example, not by grammar

> **ERF-13** "An atom's `id` MUST be permanent: a mint-time prefix plus a
> sequence number (`kwg-117`), never renamed and never reused."

Is `kwg-117a` legal? `kwg_117`? `117`? `kwg-117-v2`? A slug, as claims use
(`citators-disagree-on-negative-treatment`)? The MUST is about permanence; the
prefix-plus-number clause is descriptive apposition, and it is the only shape
constraint on any id in the format.

**Chosen:** report a *flag*, not a violation, when an atom id is not
`<something>-<digits>`, on the ground that the MUST attaches to permanence
(which a validator cannot check from one snapshot) rather than to shape.

**What breaks under the other reading.** A corpus using content-addressed atom
ids — which the spec's own non-normative note contemplates ("content-addressed
identity in the Trusty URI shape, is deferred behind that trigger") — is
non-conforming today.

---

## A16. ERF-48 across mixed precision

> **ERF-48** "Any change to a record MUST set `last_modified` to a timestamp
> later than its `created` [...] At date precision \"later\" admits the same day,
> because a bare date cannot order within one."

Covers date-vs-date. Silent on `created: 2026-08-23` (bare date) against
`last_modified: 2026-08-23T09:00:00Z` (full instant). ERF-47 has a rule for
exactly this shape — "the comparison MUST resolve to stale" — but ERF-47 is
about staleness, not about ERF-48's ordering obligation, and importing it here
would mean the record violates ERF-48 rather than being flagged stale.

**Chosen:** flag, not violate, and say the spec does not cover it.

---

## A17. ERF-69's excerpt requirements are unfalsifiable

> **ERF-69** "A source's normalized text MAY be an excerpt of the work rather
> than a whole copy, and MUST then record who selected the passage and when
> (`excerpt`). It MUST contain the quoted passage together with **enough adjacent
> text for the passage's place in the work to be legible**"

Nothing marks a normalized text as an excerpt except the `excerpt` field itself,
so the conditional MUST can only fire when it is already satisfied. A source that
ships an excerpt and omits `excerpt` is indistinguishable from a source that
ships a whole copy. And "enough adjacent text [...] to be legible" is a judgment
with no threshold.

**Chosen:** `erfval` reports, as a note, that ERF-69's second MUST is not checked
and cannot be. It does not attempt a heuristic.

Compare ERF-71, which is written the same way — "A source whose normalized text
**is an excerpt or a conversion** SHOULD carry `received.digest`" — but where the
conversion half *is* detectable (`extraction` is present). `erfval` checks the
conversion half and skips the excerpt half.

---

## A18. ERF-2's mutability test does not exist

> **ERF-2** "A source whose raw file is **mutable at its location**, a web page
> above all, MUST record `received.timestamp`, the date it arrived"

A validator holds a URL and a status. There is no field saying "this location
serves stable bytes", and no test that distinguishes a web page from a permalink
to an archived PDF. ERF-71 gestures at the same distinction from the other side
("a page that differs on every fetch cannot be pinned, and its source simply
carries no digest, which itself tells a reader what kind of source it was") but
makes it a SHOULD about the digest, not a test.

**Chosen:** flag any `received.url` without a `received.timestamp`, and state in
the message that the validator cannot tell whether it is a violation.

---

## A19. Do narrative bindings appear anywhere but narratives?

ERF-34 says a narrative's bindings "are the only structured content in it". It
does not say bindings occur *only* in narratives. A claim's `body` is markdown
("the one operator-authored text on the record, and carries the working notes")
and could carry one.

**Chosen:** scan narratives only.

**What breaks under the other reading.** A binding in a claim body is invisible
— which is precisely the failure mode ERF-31's report-never-skip rule was written
to eliminate ("a required part does not make a binding invalid, it makes it
invisible").

---

## A20. ERF-60 under a major version of zero

> **ERF-61** "`spec_version` MUST follow Semantic Versioning 2.0.0 [...] a MAJOR
> increment means a backward-incompatible change"
>
> **ERF-60** "A consumer MAY refuse a corpus whose MAJOR `spec_version` it does
> not support"

The spec's own version is `0.9.0`. SemVer 2.0.0 §4 says that under major version
zero "anything MAY change at any time. The public API SHOULD NOT be considered
stable." So every 0.x corpus shares MAJOR 0 while sharing no compatibility
promise, and ERF-60's whole mechanism carries no content for the only version
that currently exists.

**Chosen:** accept MAJOR 0, and emit a flag saying the compatibility promise is
vacuous at this version.

---

## A21. ERF-51 does not define whitespace

> **ERF-51** "3. Collapse whitespace runs to a single space, then trim."

ASCII whitespace or Unicode? Step 1 (NFKC) already maps U+00A0, U+2000–U+200A
and friends onto U+0020, which makes the two readings agree on almost everything.
They diverge on characters NFKC leaves alone that a Unicode reading might still
call whitespace, and on U+200B ZERO WIDTH SPACE, which NFKC preserves and which
neither reading treats as whitespace — so an extractor emitting zero-width spaces
produces a quote that cannot be matched and no rule addresses it.

**Chosen:** Unicode `isSpace`. See `yaml-behaviour.md` for the measured cases.

---

## A22. Non-emptiness is required in exactly one place

> **ERF-19** "Each entry MUST carry a `timestamp`, a stance, and a **non-empty**
> `why`: an entry without a reason is a toggle, not a judgment."

That is the only non-emptiness rule in the specification. All of the following
conform with an empty string:

`Atom.finding`, `Atom.quote` (though ERF-52 catches it indirectly, since a quote
with no non-empty spans MUST fail), `Claim.title` (despite ERF-18: "`title` MUST
state the claim; it is the normative statement"), `Survey.title` (despite ERF-28:
"The `title` MUST state what was sought"), `AuditEntry.auditor` and
`AuditEntry.protocol` (despite ERF-11 making both essential to reading a
verdict), `Source.reason` (despite ERF-5: "a human-readable `reason`"),
`Source.citation_text`, `SearchAct.tool` and `SearchAct.query` (despite ERF-26:
"MUST name its concrete instrument").

**Chosen:** violations where a MUST names the field's job in words that an empty
string cannot satisfy (`tool`, `query`, `why`); flags elsewhere, with the message
saying the spec never says non-empty.

---

## A23. ERF-67's CommonMark requirement is vacuous

> **ERF-67** "A record body MUST be valid CommonMark [...] Markdown without a
> named dialect is not a format, which is the gap CommonMark was written to
> close"

CommonMark 0.31.2 §2.2: every sequence of characters is a valid CommonMark
document. There is no such thing as invalid CommonMark. The requirement names a
dialect (useful) and states an unfalsifiable MUST (not). `erfval` does not check
it and says so.

---

## A24. ERF-34 cites the wrong requirement for `created`

> **ERF-34** "plus `title`, a string; `corpus`, the id of the corpus it belongs
> to; and `created`, the `{timestamp, by}` stamp every other created thing in
> this format carries (`ERF-19`)."

ERF-19 is the standings requirement. Its content is that a `timestamp` MUST be a
full RFC 3339 instant with an offset and MUST NOT be a bare date. Read literally,
ERF-34 imports that precision rule into every narrative's `created` — which
contradicts ERF-19's own carve-out ("A bare date remains correct where nothing is
ordered"). The intended citation is presumably ERF-58 (the `timestamp` key) or
ERF-48.

**Chosen:** treat a narrative's `created` as an ordinary unconstrained stamp.

---

## A25. The actor convention is a MUST with no requirement id

> §2 "*actor*: `human:<id>` for a person, `<producer>/<version>` for a model or
> agent, `process:<id>` for automation. **Every actor id MUST follow this
> convention.**"

A normative MUST in the definitions section. The requirement index (§3.1) never
lists it, and no `ERF-nn` covers it, so a validator rejecting `alice` has no id
to cite and a corpus author has no requirement to look up. `erfval` emits this
one finding with an empty requirement column and says why.

Separately, the three arms **overlap**, and the TypeScript makes it worse:
`` `human:${string}` `` matches `human:` with an empty id, `` `${string}/${string}` ``
matches `/`, and `human:claude/fable-5` inhabits two arms at once. Nothing says
which governs. `erfval` resolves prefix-first (`human:`/`process:` win) and flags
the overlap.

---

## A26. ERF-40 cannot be checked from the interchange form

> **ERF-40** "Standings MUST be append-only; an edit or deletion of an existing
> entry is a violation, **verified against the substrate's history**."

The Validator class binds "every machine-checkable MUST that applies to the input
it accepts". This one is machine-checkable only against a history the format
defines no interchange representation for — ERF-63 says a substrate "MAY be
anything that preserves [...] an edit history sufficient to verify ERF-40", so
the history's shape is deliberately unspecified. A validator handed a directory
has nothing to compare against.

`erfval` reports, per corpus, that ERF-40 is not checked and why. It does not
silently omit it, because a silently unchecked MUST is indistinguishable from a
passing one.

---

## A27. `sources` when a corpus has none

> **ERF-3** "a mapping of exactly two keys, `type` with the value `sources`, and
> `sources`"
>
> **ERF-55** "Empty lists MUST be omitted: a field's absence means none. This
> governs **lists**, and a producer MUST NOT generalize it to an optional
> mapping."

`sources` is `Record<SourceId, Source>` — a mapping, not a list. So a corpus with
no sources writes `sources: {}` and keeps both keys. That is determinable, and
`erfval` implements it. It is worth stating because it is the one place the
spec's list/mapping distinction produces a non-obvious answer and gets it right.

---

## A28. Where does `type: narrative` fit in ERF-54's dispatch?

ERF-54 enumerates six values: "`atom`, `claim` and `survey` are the record types,
and `corpus`, `sources` and `narrative` name the declaration, the source list and
a narrative". Closed enough. But a seventh value — `type: memo` — is, per ERF-57,
"an unknown record type" the consumer "MUST preserve [...] as opaque data, MUST
report [...] and MUST NOT reject". A *validator*, though, binds every
machine-checkable MUST. Is an unknown `type` a producer violation (ERF-55, "a
producer MUST NOT originate a field the declared `spec_version` does not
define" — but this is a *value*, not a field) or a consumer note (ERF-57)?

**Chosen:** note under ERF-57. ERF-55 constrains field names, not field values,
and no requirement closes the `type` vocabulary.
