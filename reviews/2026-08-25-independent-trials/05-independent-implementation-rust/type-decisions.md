---
title: "ERF v0.9 in Rust: every place the prose did not determine a type"
trial: "05-independent-implementation-rust"
date: 2026-08-25
---

# Type decisions

The distinctive output of this trial. Rust has sum types, exhaustive matching and no
implicit nullability, so a field's optionality, a value's nullability, a vocabulary's
totality and a shape's variance all have to be decided before the code compiles. This is
every place the specification's prose left the decision to me.

Format: what the prose says, what I chose, what a different implementer might have chosen.

---

## 1. `timestamp` (ERF-19, ERF-47, ERF-58)

**Prose.** `interface ActorStamp { timestamp: string; by: Actor } // RFC 3339`. Examples
write `2026-07-19`. ERF-19 requires a full instant for standings only. ERF-47 legislates
comparing "a bare date against a full instant".

**Chosen.**
```rust
enum Timestamp {
    Date { y: i32, m: u32, d: u32 },
    Instant { y: i32, m: u32, d: u32, secs: i64, offset_secs: i64 },
    Malformed(String),
}
```
A three-armed sum type. `Malformed` is a variant rather than a parse error because a
validator must report an unparseable stamp and keep going, and because ERF-47's comparison
has to return "indeterminate" rather than panic.

**Alternative.** `String`, with parsing pushed into each comparison. That is what the spec
literally says and what a TypeScript implementation gets for free; it makes ERF-47's
precision rule a string-length test at every call site, and makes it easy to compare two
timestamps lexically and get the right answer for the wrong reason.

**Second alternative.** `chrono::DateTime<FixedOffset>` with a separate `NaiveDate`, or a
single `DateTime` with a `has_time: bool`. Both leak: the first duplicates every
comparison, the second invents a midnight that the record does not assert.

---

## 2. Comparison result (ERF-47)

**Prose.** "Where the two stamps differ in precision and the coarser one cannot order them
[...] the comparison MUST resolve to stale [...] Two bare dates that are equal read as
current."

**Chosen.**
```rust
enum Freshness { Current, Stale, Indeterminate }
```
Deliberately not `Ordering`. ERF-47's rule is not a total order: a bare date and an instant
on the same day are neither less, greater nor equal, they are *stale*, which is an answer
about a check and not about time. Typing it as `Ordering` would have invited
`if a < b { stale }`, which is wrong on exactly the case the requirement is about.

**Alternative.** `Option<Ordering>`, with `None` for the incomparable case and the stale
decision at each call site. Same information, three call sites to get right instead of one.

---

## 3. `Actor` (§2, ERF-21, ERF-39)

**Prose.** `type Actor = \`human:${string}\` | \`${string}/${string}\` | \`process:${string}\``,
and "Every actor id MUST follow this convention".

**Chosen.**
```rust
enum ActorId { Human(String), Process(String), Machine { producer, version }, Malformed(String) }
```

**What forced the decision.** The TypeScript union is not disjoint and is nearly open: the
middle arm matches any string containing a slash, so `human:a/b` satisfies two arms and
`nonsense/x` satisfies one. Rust made me pick an order (human, process, producer/version)
and decide what happens to a string matching none. I also had to decide that a
`<producer>/<version>` whose producer contains a colon is malformed, so that `human:a/b`
does not silently become a machine actor.

**Alternative.** A newtype over `String` with a validity predicate, which is what the
template-literal type really is. Then `ERF-21`'s "MUST be a `human:` actor" becomes a
`starts_with` at the call site, and nothing in the type stops a machine id being written
into a standing.

**Third alternative.** Model `StandingEntry.by` as a distinct `HumanActor` type, mirroring
the spec's `by: \`human:${string}\``. I did not, because then a non-human `by` is a decode
failure that drops the whole standing, and ERF-21 wants it reported as a violation with the
rest of the entry still checked.

---

## 4. Closed vocabularies (section 5)

**Prose.** "Closed sets. A value outside them is a validation failure, not a dialect."

**Chosen.** Six `enum`s with no `Other(String)` arm: `EpistemicKind`, `Stance`, `Relation`,
`SourceQuality`, `Verdict`, `SourceStatus`. Parsing returns `Option`, and a `None` is a
violation naming the requirement and listing the legal values.

**The one that fought back.** `SourceStatus`. ERF-5 says "The vocabulary is provisional and
grows by a demonstrated instance rather than by anticipation", which reads like an open set,
while section 3 types it as a five-member union and section 5 says closed. I chose closed.
An implementer reading ERF-5 first could reasonably ship `Other(String)` with a warning.

**Alternative for all six.** `enum ... { ..., Unknown(String) }`, which is what a tolerant
consumer needs (ERF-57) and what a validator does not. The Consumer and Validator
conformance classes want different types here, and the spec does not say so.

---

## 5. `Disposition` (ERF-41)

**Prose.** "Never a stored field." "Disposition MUST be computed, never stored."

**Chosen.** An enum with no `parse` function at all, only `as_str`. The absence of a
constructor from text is the type-level statement of ERF-41: nothing in the codebase can
turn a file's characters into a `Disposition`.

**Alternative.** The same enum with `FromStr` derived for convenience, which would make it
one careless line to read a stored `disposition:` field and believe it.

---

## 6. Lists: `Vec<T>`, never `Option<Vec<T>>` (ERF-55, ERF-56)

**Prose.** "Lists are total in the type and MAY be empty; empty lists are omitted in
serialization." ERF-56: "A reader MUST materialize an omitted list-typed field as an empty
list. An omitted list means none, never unknown."

**Chosen.** Every list is `Vec<T>`, including `surveys`, which section 3 marks `surveys?`.
The `?` there is a serialization fact, not a semantic one, and ERF-56 says so in as many
words.

**Alternative.** `Option<Vec<SurveyId>>` for `surveys` alone, faithful to the interface.
That would give three states (absent, empty, populated) where the format defines two, and
ERF-49's "empty `surveys`" test would then have two spellings.

**Where the difference is visible.** An empty list *in a file* is an ERF-55 violation, so the
distinction the type refuses still gets reported: it is caught in the raw YAML layer, before
the typed model exists.

---

## 7. Required-but-omittable fields (ERF-56)

**Prose.** "The data model types these fields as required because they are always present in
a loaded record; the serialization omits them because a file should not spend a line saying
nothing."

**Chosen.** Two layers. A raw YAML tree with line numbers, where absence is visible, and a
typed model where `finding_audit: Vec<AuditEntry>` is unconditionally present. Every check
that cares about the file (ERF-55, ERF-66, ERF-65, ERF-58) runs on the raw layer; every
check that cares about meaning runs on the typed one.

**Alternative.** One layer with `#[serde(default)]`, which is the obvious move and which
loses ERF-55, ERF-66 and every line number.

---

## 8. What a record is when decoding fails

**Prose.** Nothing. The spec does not contemplate a record that half-parses.

**Chosen.** `decode_atom(...) -> Option<Atom>`: a record missing a required field is
reported and dropped from the typed set, but its id is still registered in a separate
`id_sightings` list so ERF-36/ERF-38 duplicate detection and ERF-35 reference resolution
still see it.

**What forced it.** Rust would not let me build an `Atom` with a missing `quote`. A
permissive language would default it to `""` and then report a "quote not found in capture"
violation downstream, which is a second, false finding about a record that was already
broken. The split was forced by the type and is better behavior.

**Alternative.** `struct PartialAtom { quote: Option<String>, ... }` threaded through every
check, which turns every downstream rule into a nest of `if let`.

---

## 9. `Source.status`: required, not optional

**Prose.** `status: "shipped" | ... ;` with no `?`. But ERF-5 phrases it conditionally: "A
source recording an absence MUST carry a `status`".

**Chosen.** Required. A source that ships must still say which of `shipped` and
`shipped-as-quotation` it is, since ERF-68 hangs a MUST on that distinction.

**Alternative.** `Option<SourceStatus>` defaulting to `shipped` when a `path` is present,
which reads naturally from ERF-5 alone and would silently exempt every unlabelled source
from ERF-68.

---

## 10. `Source.excerpt`: `Option<bool>`, not `bool`

**Prose.** `excerpt?: boolean; // the capture is a passage, not a whole copy (ERF-69)`.

**Chosen.** `Option<bool>`. Absent and `false` mean the same thing today, but the format's
own principle (section 3: "Optional fields assert existence when present") is that saying
nothing and saying no are different acts, and ERF-4's "Absence MUST be explicit" is the same
idea one field over.

**Alternative.** `bool` with `#[serde(default)]`, which is what almost everyone will write
and which makes `excerpt: false` unrepresentable as a distinct state.

**Cost of my choice.** A three-state boolean is a smell, and I had to write
`s.excerpt == Some(true)` at every use.

---

## 11. `Converter.deterministic`: required `bool`, no default

**Prose.** ERF-70: the converter "MUST be deterministic [...] A non-deterministic converter
MAY be used, and the source MUST then say so".

**Chosen.** `deterministic: bool`, required, and a missing key is a violation. The
requirement is that the source *says* which it is; a default would answer for it.

**Alternative.** `#[serde(default = "true_")]`, reading "MUST be deterministic" as the
default. That inverts the requirement: an author who forgets the field gets a silent
assertion of reproducibility.

---

## 12. `Source.citation`: an opaque node, not a struct

**Prose.** `citation?: CSL`, and section 3 says the inline mirror "omits [...] identifier
alias definitions (`AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId`, `FamilyName`,
`CSL`)".

**Chosen.** `Option<RawNode>`: the parsed YAML, unvalidated. `CSL` is defined in a file this
trial does not have, so applying ERF-55's unknown-key rule inside it would invent a schema.

**Alternative.** A `HashMap<String, serde_json::Value>` (same thing, less line information)
or a hand-written CSL-JSON struct, which would be inventing a normative schema for CSL and
reporting violations against it.

---

## 13. Identifiers: `String`, not a newtype

**Prose.** `AtomId`, `ClaimId`, `SurveyId`, `SourceId`, `CorpusId` are aliases the mirror
omits. ERF-15: "References MUST be bare ids and MUST NOT encode location". ERF-36: unique
across the deployment "regardless of record type".

**Chosen.** Plain `String` everywhere, with the target's record type checked at resolution
time.

**What forced the decision.** ERF-36 makes one namespace for all three kinds, so newtypes
would be three wrappers over one namespace: `AtomId("x")` and `ClaimId("x")` denote the same
record and must not both exist. Newtypes would express a distinction the format denies.

**Alternative.** `struct RecordId(String)` as a single newtype, which I would take in a
production build for the compile-time guarantee that a corpus id never reaches a record
lookup. It buys nothing for the requirements as written.

**What I lost.** Nothing in the type stops `atoms_for` holding a survey id; the check is at
runtime (ERF-35), which is where the spec puts it too.

---

## 14. `StandingEntry.ordinal`: a field the data model does not have

**Prose.** ERF-41: "each person's newest entry". ERF-19: append-only.

**Chosen.** I added `ordinal: usize`, the entry's position in the file, to the type. It is
not in section 3. It exists because ERF-41 needs a tie-break for one person's two entries at
one instant, and file order in an append-only ledger is the only evidence of sequence the
format holds.

**Alternative.** Compute the disposition over the slice in order without a stored index
(possible, and marginally cleaner), or report a violation on the tie instead of resolving
it. Adding a field to a normative interface is the sort of thing an implementer should
declare, so it is declared here.

---

## 15. `Record`: an enum, not a trait object

**Prose.** Section 3 gives three separate interfaces and says "Object-shape unions are
deliberately absent; the only unions are string-literal value sets."

**Chosen.** `enum Record { Atom(Atom), Claim(Claim), Survey(Survey) }`, with exhaustive
matching everywhere.

**The tension.** The spec forbids object-shape unions in the *format*, which is about what
goes in a file. In the loaded model something has to hold three kinds in one index, because
ERF-36 puts them in one namespace and ERF-35 does "one lookup [that] serves every record
type". An enum is that union. A tolerant consumer would need a fourth arm
(`Unknown(RawNode)`, per ERF-57); a validator does not, and erfval reports unknown types
without materializing them.

---

## 16. `Record::last_change()`: a computed accessor over three shapes

**Prose.** ERF-47: "older than the last change to what it judged". ERF-48: a record never
edited "correctly carries no `last_modified` at all". A survey has `conducted` where the
others have `created`.

**Chosen.** One method returning `&Timestamp`, falling back from `last_modified` to
`created`, and to `conducted` for surveys. Exhaustive matching over the enum made the survey
asymmetry impossible to forget.

**Alternative.** A `Record` trait with a `last_change` method, which is the same thing with
dynamic dispatch and no exhaustiveness check when a fourth record type arrives.

---

## 17. Severity: a three-armed enum, not a boolean

**Prose.** ERF-43 and ERF-49 say "flag" and explain why it is not a violation. ERF-47 says
"is flagged stale". ERF-33 and ERF-57 say "MUST report". Everything else is MUST or SHOULD.

**Chosen.** `enum Severity { Violation, Flag, Notice }`. `Flag` is reserved for what the
spec calls a flag (ERF-43, ERF-47, ERF-49) plus the "check unavailable" outcome ERF-51
mandates; `Notice` carries SHOULD departures and section-4 guidance. Exit code keys on
violations only.

**Alternative.** Two levels (error and warning), collapsing SHOULD departures into the
spec's flags. That loses the distinction ERF-43 goes out of its way to make: a flag is
"an act the format permits", a SHOULD departure is a producer not doing its job.

---

## 18. Owned `String` everywhere, no borrowing from the source text

**Prose.** Nothing.

**Chosen.** Owned. The raw YAML tree owns its scalars (yaml-rust2's event stream yields
owned `String`s), records own their fields, and findings own their messages.

**Why.** A borrowed model (`&'a str` into the file buffer) would be faster and would tie
every record's lifetime to a buffer that has to outlive the whole validation, including the
capture files read later for the quote check. For a corpus of a few thousand records the
cost is irrelevant and the lifetime plumbing would touch every signature.

**Where it shows.** `Ctx` clones `self.subject` and `self.file` on every finding, because
`&mut self.rep` and `&self.subject` cannot both be borrowed. A borrow-friendly design would
separate the report sink from the context.

---

## 19. `RawMap`: an ordered `Vec` of entries, not a `HashMap`

**Prose.** ERF-66: "A record's frontmatter MUST NOT contain a duplicate key".

**Chosen.** `Vec<(String, usize, RawNode)>` with linear lookup. A map would deduplicate the
very thing ERF-66 forbids, and would lose the key's line number.

**Alternative.** `IndexMap` plus a separate duplicate list, which is the same decision with
a dependency.

---

## 20. Narrative: not a record, and typed as such (ERF-34)

**Prose.** "A narrative MUST NOT be modelled as a record [...] It therefore has no interface
in the data model of section 3."

**Chosen.** A separate `Narrative` struct in its own module, held in its own list on the
`Deployment`, never in the `Record` enum, with `title`/`corpus`/`created` as
`Option<String>` because a validator has to be able to report their absence.

**Alternative.** A fourth `Record` arm for convenience, which the requirement forbids in as
many words and which would have put narratives into id resolution.

---

## 21. `Binding.bound_at`: `Option<Timestamp>` restricted to `Date`

**Prose.** ERF-31's grammar: `[ws+ "bound-at=" date]` where `date ::= YYYY "-" MM "-" DD`.
ERF-32: MUST record it.

**Chosen.** `Option<Timestamp>`, where a present value that is not a bare date is a parse
error for the whole binding. The `Option` is not optionality in the format's sense; it is
the two-outcome state ERF-32 defines (a date, or `indeterminate`).

**Alternative.** A dedicated `enum BoundAt { At(Date), Absent }`, which is the same type with
a name that does not read as "optional". In hindsight that would have been clearer, and I
left `Option` with a comment.

---

## 22. `QuoteVerdict`: three outcomes, not `bool`

**Prose.** ERF-52 names three distinguishable failures: a span that does not occur, spans
out of order or overlapping, and a quote whose spans are all empty. ERF-51 adds a fourth
outcome, "unavailable".

**Chosen.**
```rust
enum QuoteVerdict { Pass, SpanMissing(usize, String), AllSpansEmpty }
```
with "unavailable" handled before the function is called, since it is a property of the
capture rather than of the comparison.

**Alternative.** `bool`, which cannot distinguish the ERF-52 trivial-pass failure from an
ordinary miss, and cannot distinguish either from "no capture held" (a flag, not a
violation). Three different requirements collapse into one `false`.

---

## 23. `SourceStatus::ships_capture()`: a partition the spec implies

**Prose.** Five statuses, split across ERF-5 (three) and ERF-68 (two), never stated as a
partition.

**Chosen.** A method on the enum returning `true` for `shipped` and `shipped-as-quotation`.
Writing it forced me to notice that ERF-4's "either a path or a recorded absence" is really
a statement about this partition, and that the spec never says so (ambiguity A15).

---

## 24. `Deployment` versus `CorpusInfo`: two scopes, two types

**Prose.** ERF-35 and ERF-36 are deployment-scoped. ERF-3, ERF-4, ERF-17 and ERF-59 are
corpus-scoped.

**Chosen.** `Deployment` owns the record index and the id sightings; `CorpusInfo` owns the
declaration and the source list. An atom's source resolves through
`dep.corpus(&atom.corpus)`, using the record's own field and never its directory (ERF-54).

**Alternative.** One flat structure with a `corpus` string on everything, which is what the
files look like, and which makes it easy to write a source lookup that searches every corpus
and quietly resolves across a confidentiality boundary the format explicitly leaves to
deployment policy.

---

## 25. The `by` field on an `AuditEntry` that is not there

**Prose.** ERF-11: "The `auditor` is a bare model or tool identifier (`deepseek-v4-pro`),
deliberately not an `Actor`".

**Chosen.** `auditor: String`, with no actor parsing and no `§2` check. This is the one place
where the specification pre-empted the question, and it is worth recording as the shape the
other under-specified fields could have taken: a sentence saying which type a field is *not*
removed the decision entirely.
