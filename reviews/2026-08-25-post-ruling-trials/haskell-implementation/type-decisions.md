# Type decisions

What the type system found when it was pointed at the specification.

Each entry: what the spec says, what `erfval` encoded, what alternative encoding
was equally defensible, what differs downstream. The last two sections are the
ones the trial was really for: the illegal states that could **not** be made
unrepresentable, and the places where a total function could not be written.

---

## 1. The `Maybe`-versus-empty axis

### 1.1 `evidence_at_stance` — the one field where the spec gets it exactly right, and the stock idiom destroys it

**What the spec says.**

> **ERF-55** "This governs **lists**, and a producer MUST NOT generalize it to an
> optional mapping: a mapping that is present and empty asserts existence, per
> section 3, and MUST be written. `ERF-20`'s `evidence_at_stance` is why the
> distinction is worth a sentence. **Absent, it says the ruler stamped nothing;
> present and empty, it says the ruler stamped, and faced no evidence.** Those
> are different facts, and `ERF-20` calls the second the one thing about a
> ruling's context that cannot be recovered later, so a producer tidying `{}`
> away destroys it and makes never-stamped and stamped-facing-nothing the same
> bytes."

**What was encoded.**

```haskell
data Presence a = Missing | ExplicitNull | Given a

data StandingEntry = StandingEntry
  { ...
  , seEvidence :: Presence EvidenceAtStance }

data EvidenceAtStance = EvidenceAtStance
  { easFor :: TList Id, easAgainst :: TList Id }
```

so the three facts are three inhabitants:

| wire | Haskell | fact |
|:--|:--|:--|
| key absent | `Missing` | the ruler stamped nothing |
| `evidence_at_stance: {}` | `Given (EvidenceAtStance [] [])` | the ruler stamped, and faced no evidence |
| `evidence_at_stance: {atoms_for: [kwg-1]}` | `Given (EvidenceAtStance [kwg-1] [])` | the ruler faced kwg-1 |

**The alternative that is equally defensible and is what almost everyone will
write.** `Maybe EvidenceAtStance`, populated with aeson's `.:?`. That is the
idiomatic Haskell, it is what every `FromJSON` tutorial shows, and **it collapses
the first two states**, because `.:?` maps both a missing key and an explicit
`null` to `Nothing`, and because a `Maybe` of a record with two empty lists is
indistinguishable from `Nothing` for anyone who then pattern-matches on
"has any evidence". The same collapse happens in Python (`d.get("evidence_at_stance")`
→ `None` for both), in Go (a nil map for both), and in TypeScript
(`evidence_at_stance?: {...}` → `undefined` for both).

**What differs downstream.** ERF-20 says which evidence the ruler faced is "the
one fact about a ruling's context that cannot be recovered later, because
attachment events are recorded nowhere". Under the collapsing encoding, a
round-trip through the reader turns *stamped, faced nothing* into *never
stamped*, and the fact ERF-20 exists to preserve is lost by the reader rather
than by the producer ERF-55 warns about. `erfval` reports the two cases with
different messages on purpose (`flagging/fl-ERF-20-evidence-at-stance-absent`
versus `fl-ERF-20-evidence-at-stance-present-and-empty`), which is the observable
consequence of the encoding.

**And here is the gap the spec left.** There is a **third** wire state:

```yaml
evidence_at_stance:
```

which YAML resolves to `null`, not to `{}`. It is neither absent nor present-and-
empty. The specification's vocabulary has exactly two words for this field and
YAML offers three states. `erfval` reports it as an ERF-55 violation and says the
spec never names it; a reader using `.:?` silently files it under "the ruler
stamped nothing", which is a claim about a person's conduct that nobody made.

### 1.2 Optional lists: `Maybe [a]` is never right, and section 3 writes it anyway

**What the spec says.**

> **ERF-56** "A reader MUST materialize an omitted list-typed field as an empty
> list. An omitted list means none, never unknown, so a record that omits one is
> complete rather than partial. [...] The data model types these fields as
> required because they are always present in a loaded record; the serialization
> omits them because a file should not spend a line saying nothing."
>
> **ERF-55** "Empty lists MUST be omitted: a field's absence means none."

Together these say: a list field has type `[a]`, absence means `[]`, and writing
`[]` is a producer error. Three statements about three different layers.

**But section 3's own type mirror contradicts ERF-56 in four places:**

```ts
surveys?: SurveyId[];                    // Claim
atoms?: AtomId[];                        // Survey.notable_results[]
evidence_at_stance?: { atoms_for: AtomId[]; atoms_against: AtomId[] }  // StandingEntry
families: FamilyName[];  atoms_for: AtomId[];  ...                     // required
```

`surveys?: SurveyId[]` is `Maybe [SurveyId]`, which has *two* representations of
emptiness (`Nothing` and `Just []`) where ERF-56 says there is one. `atoms_for`
next to it is `[AtomId]`, with one. Nothing distinguishes them semantically —
both mean "the claim cites none" when absent — and ERF-56 explicitly explains why
the required ones are required. The `?` on `surveys` and on `notable_results.atoms`
is unexplained and, under ERF-56, wrong.

**What was encoded.**

```haskell
data Arrival = Omitted | Written
data TList a = TList { tlItems :: [a], tlArrival :: Arrival }
```

The *value* is total (`[a]`, per ERF-56); `Arrival` is a separate serialization
fact carried alongside so ERF-55 can still be enforced. `surveys` and `atoms_for`
get the identical type, because the spec's prose says they behave identically.

**The alternative.** `Maybe [a]`, matching section 3 literally. Defensible — the
spec says "where the two differ, the file governs" about `types/erf.ts`, so the
`?` is normative and the prose is not.

**What differs downstream.** ERF-49 flags "an `observation` someone stands on
with empty `atoms_for` and **empty `surveys`**". Under `Maybe [a]`, an
implementer must decide whether `Nothing` counts as "empty" — and if they decide
it does not, an observation with no surveys at all never triggers the flag,
which inverts the requirement. Under `TList`, the question does not arise. This
is the same `Maybe`-versus-empty hazard as §1.1, pointing the opposite way: there
the spec insists the two be distinguished, here it insists they be identified,
and the two fields sit four lines apart in the same interface.

### 1.3 `Presence` for optional scalars, and why `Maybe` was still wrong

Every optional scalar (`short_name`, `limitations`, `reason`, `licence`,
`prior_survey`, `classification`, `normalized`, …) is `Presence Text`, not
`Maybe Text`, for one reason: `ExplicitNull`. The spec has no null. Section 3
says "Optional fields (`?`) assert existence when present: a `citation` means
structure exists, a `received` means a fetch happened, a `last_modified` means an
edit happened." A `null` asserts existence of nothing, which is not one of the
two states the sentence allows. `Maybe` cannot say that; `Presence` can, and
`erfval` reports every one it finds.

---

## 2. The record sum, and the sums the spec refused to write

**What the spec says.**

> §3 "Object-shape unions are deliberately absent; the only unions are
> string-literal value sets."
>
> §5 note: "kinds vary the validation contract, never the record shape. A kind
> that demands its own shape is a record type announcing itself, which is the
> test that keeps this vocabulary at four."

**What was encoded.** `data Record = RAtom Atom | RClaim Claim | RSurvey Survey`
— a sum the data model does not contain, forced by ERF-54's dispatch ("reads each
file's `type`, and dispatches on it"). And a wider sum for what a *file* can be,
which is not in the data model either:

```haskell
data Loaded = LRecord .. | LDeclaration .. | LSourceList .. | LNarrative ..
            | LUnknownType FilePath Text Value | LNoType FilePath
            | LUnreadable FilePath Text
```

The last three exist only because ERF-54 and ERF-57 impose obligations on files
that are *not* part of the data model: "A file carrying no `type` is not part of
the corpus; a consumer MUST ignore it and MUST report that it did", and "A
consumer MUST preserve unknown fields and unknown record types as opaque data".
`LUnknownType` carries the whole `Value`, not a summary, because "MUST preserve"
is a data-retention obligation and a validator that keeps only the type name has
not preserved anything.

**The alternative.** Three separate loaders, one per record type, with the file
walk done three times. Defensible and simpler, but it cannot satisfy ERF-38
(duplicate ids "regardless of record type") without a fourth pass, and it makes
`LNoType` invisible.

**The three record types do NOT share a common field set**, which is worth
recording because it is the first thing a Haskell implementer reaches for:

| | atom | claim | survey |
|:--|:--|:--|:--|
| `id`, `type`, `corpus` | ✔ | ✔ | ✔ |
| creation stamp | `created` | `created` | **`conducted`** |
| `last_modified` | ✔ | ✔ | ✔ |
| body | **always empty** (ERF-53) | ✔ | ✔ |

The survey's creation stamp is spelled `conducted`, so a shared
`class HasCreated` needs a per-type accessor anyway; and the atom's body is
required to be empty rather than absent, which is a constraint on a shared field
rather than an absent field. The honest encoding is three records and a sum, and
`recCreated :: Record -> ActorStamp` exists purely to paper over the
`created`/`conducted` split.

---

## 3. `Stamp`: one field name, four grammars

**What the spec says.**

> **ERF-58** "The event-time key MUST be `timestamp`, everywhere."

and then, for that one key:

| site | contract |
|:--|:--|
| `StandingEntry.timestamp` | ERF-19: full RFC 3339 instant with time **and** offset; MUST NOT be a bare date |
| `Atom.as_of_date` | ERF-14: MAY be a year, a year-month, or a full date |
| binding `bound-at` | ERF-31 grammar: exactly `YYYY-MM-DD` |
| `created`, `conducted`, `last_modified`, `received.timestamp`, `excerpt.timestamp`, `AuditEntry.timestamp`, `SearchAct.timestamp` | unconstrained; ERF-19: "A bare date remains correct where nothing is ordered" |

**What was encoded.** One `Stamp` sum with five constructors — `SYear`,
`SYearMonth`, `SDate`, `SInstant UTCTime Bool` (the `Bool` records whether an
offset was present, because ERF-19 needs it and nothing else does), and
`SUnparsed`. Each site then re-narrows by pattern match and reports its own
requirement.

**The alternative.** Four distinct newtypes (`Instant`, `PartialDate`,
`BindingDate`, `EventTime`) so that a bare date could not be assigned to a
standing at the type level. Genuinely better — it makes one illegal state
unrepresentable — and rejected because ERF-58 makes them all the same YAML key,
so the parser must accept the union and narrow anyway; the newtypes would move
the check from `parseStamp` to a smart constructor without removing it.

**What differs downstream.** ERF-47's comparison rule needs five outcomes, not
three:

```haskell
data Ord3 = Earlier | Later | SameInstant
          | SameDayEqualPrecision   -- ERF-47: "read as current"
          | SameDayMixedPrecision   -- ERF-47: "MUST resolve to stale"
          | Unorderable             -- the spec has no rule
```

> **ERF-47** "Where the two stamps differ in precision and the coarser one cannot
> order them (a bare date against a full instant on the same day), the comparison
> MUST resolve to stale: a check that cannot tell says look, never rest. Two bare
> dates that are equal read as current."

A three-valued `Ordering` cannot express this and a naive `compare` on a coerced
`UTCTime` silently picks midnight for the bare date, which turns
`SameDayMixedPrecision` into `Earlier` and reports a stale audit as current —
precisely the failure ERF-47 names ("under-stamping shows a current verdict on a
finding that has since moved, which is the failure that matters").

---

## 4. `Actor`: a union whose arms overlap

**What the spec says.**

```ts
type Actor = `human:${string}` | `${string}/${string}` | `process:${string}`;
```
> §2 "Every actor id MUST follow this convention."

**What was encoded.** `data Actor = AHuman Text | AProcess Text | AAgent Text Text
| AActorMalformed Text`, resolved prefix-first.

**Why the fourth constructor is a finding.** The MUST is in §2 and carries no
requirement id — it is not in the §3.1 field index and no `ERF-nn` states it. So
`erfval` emits this violation with an **empty requirement column**, which is the
only such finding in the program. Every other violation cites a number.

**Why the first three are a finding.** They are not disjoint. In TypeScript,
`${string}` matches the empty string, so:

- `"human:"` inhabits arm 1 with an empty id;
- `"/"` inhabits arm 2 with an empty producer and an empty version;
- `"human:claude/fable-5"` inhabits arms 1 **and** 2 simultaneously;
- `"process:etl/v2"` inhabits arms 3 and 2.

ERF-21 ("A standing's `by` MUST be a `human:` actor") depends on the answer.
`erfval` resolves prefix-first and *flags* the overlap; an implementer resolving
slash-first would reject a standing by `human:francois/laptop`.

---

## 5. `Severity`: the spec defines two report kinds and needs three

**What the spec says.**

> §2 "**A flag is not a violation.** A validator reports two kinds of thing, and
> they answer different questions."

Two. But ERF-54 says a consumer "MUST report" every untyped file it ignored,
ERF-57 says it "MUST report" unknown fields and unknown record types, ERF-72 says
an `x_` field "MUST NOT" be reported as a violation, and ERF-41 says the
disposition is computed and therefore has to be shown. None of those is a
violation (the corpus conforms) and none is a flag in §2's sense (a flag means
"an atom withdrawn elsewhere strands the standing that faced it" — an epistemic
condition someone should look at).

**What was encoded.** `data Severity = Violation | Flag | Note`, with `Note`
invented and labelled as invented.

**What differs downstream.** A two-valued reporter has to file an unknown field
under one of the two, and both are wrong: calling it a violation contradicts
ERF-57's "MUST NOT reject", calling it a flag puts a schema fact in a stream a
reader is being told to treat as epistemic. The exit code follows §2 exactly —
violations fail, flags and notes do not — so a corpus with 40 flags still exits 0
and still prints all 40.

**Was the distinction made clear by the spec?** For flag-versus-violation, yes,
unusually clearly, and the reasoning (§2, "Making any of those a violation would
let one person's permitted act make another person's untouched corpus
non-conforming") is the best-argued paragraph in the document. For
report-versus-flag, no — the word "report" is used for both and never defined.

---

## 6. `QuoteCheck` and `Staleness`: three-valued because the spec says so

> **ERF-51** "A validator therefore never converts. Facing a normalized text that
> is not text or markdown it MUST report the check as **unavailable** rather than
> pass or fail it, exactly as it does for a text it does not hold."
>
> **ERF-32** "Where the comparison cannot be run, a consumer MUST show the
> binding as staleness `indeterminate` and MUST NOT show it as current."

```haskell
data QuoteCheck = QPass | QFail Text | QUnavailable Text
data Staleness  = StCurrent | StStale | StIndeterminate
```

Both are places where a `Bool` would be a conformance failure, and both are
places the spec names the third value explicitly. Worth recording as the
counter-example to the rest of this document: where the spec knew a two-valued
answer was wrong, it said so in as many words, twice. The `Maybe`-versus-empty
cases in §1 are the same class of problem left unstated.

`QUnavailable` fires more often than one might expect. Any source with an ERF-5
absence status ships no normalized text, so **every atom quoting it is
permanently unverifiable by anyone holding the corpus** — a fact `erfval` reports
per atom rather than per source, because it is a property of the atom's
checkability, not of the source's licence.

---

## 7. `Recognized` vs `Binding`: recognition and validation as separate types

> **ERF-31** "**A binding that does not match this grammar MUST be reported,
> never skipped.** A comment opening `<!--` followed by `claims:` IS a narrative
> binding: recognizing one and validating one are separate acts, and a consumer
> performs them in that order."

The spec states the two-phase structure and the type system can hold the
implementer to it:

```haskell
recognizeBindings :: Text -> [Recognized]           -- total
parseBinding      :: Recognized -> Either BindingError Binding   -- partial
```

Recognition is total over the document; validation is partial and its failure is
an enumerated `BindingError`, not a dropped element. A single-phase
`parseBindings :: Text -> [Binding]` — the obvious implementation — cannot report
a malformed binding at all, because a comment that fails the grammar is
indistinguishable from any other HTML comment once it has been filtered out. The
spec anticipates exactly this ("a required part does not make a binding invalid,
it makes it invisible") and the two-type split is what makes it structurally
impossible.

`BindingError` is enumerated rather than a string so the report can say *which*
required part was missing. Eight constructors; the spec's grammar has five
productions.

---

## 8. Illegal states that could NOT be made unrepresentable

This is the boundary the trial asked to map. Each of these is a rule the spec
states that no Haskell type can carry, with the reason.

| # | Rule | Why no type holds it |
|:--|:--|:--|
| 1 | **ERF-36/38** ids unique across the deployment | Uniqueness is a property of a collection, not of a value. A `Map Id Record` makes it unrepresentable *after* loading, but the loading step is exactly where the violation must be reported, so the check has to run before the type exists. |
| 2 | **ERF-35** references resolve | A `ClaimId` cannot be a `Ref Claim` because the target lives in another file, possibly another corpus. Only a whole-deployment pass can resolve it. Making `atoms_for :: [Atom]` would also violate ERF-15 ("References MUST be bare ids") by embedding the referent. |
| 3 | **ERF-6/50/51/52** the quote is verbatim | Requires reading a file named by another file. No type. |
| 4 | **ERF-40** standings append-only | Requires the substrate's history, which the interchange form does not carry (see ambiguities A26). Not checkable at all, let alone typeable. |
| 5 | **ERF-19** append-only *ordering* of standings | A list is not append-only in a type; the property is about two versions of the same list over time. |
| 6 | **ERF-43** premise closure terminates in non-argument leaves | A graph property over the whole corpus. |
| 7 | **ERF-44** `conflicts-with` stored once per pair | A property of a pair of records held in different files. |
| 8 | **ERF-48** `last_modified` later than `created` | Expressible in principle with a dependent pair; not in Haskell 2010, and not worth it since the stamps can be mixed-precision and unorderable (§3). |
| 9 | **ERF-55** unknown fields | The absence of extra keys is not a property a record type can assert once the record has been decoded; it must be checked against the raw `KeyMap` before construction. |
| 10 | **ERF-66** no duplicate keys, anchors, aliases, tags | Structurally impossible through `Data.Yaml`. See §9. |
| 11 | **ERF-65** the JSON schema | The resolver has already run by the time a `Value` exists. Only its *consequences* are visible. See §9 and `yaml-behaviour.md`. |
| 12 | **ERF-9/10** the source-quality axis | A judgment. `SourceQuality` makes the *vocabulary* closed and nothing more. |
| 13 | **ERF-69** the excerpt contains enough adjacent text | A judgment with no threshold, and the antecedent is not detectable (ambiguities A17). |
| 14 | **ERF-8** `citation_text` is rendered from `citation` | Requires a CSL renderer and a style. `erfval` does not attempt it. |
| 15 | **ERF-2** the raw file is immutable | A claim about the world across time. |
| 16 | **ERF-13** an id is permanent | Same: a property of a record's whole history, checked from one snapshot. `erfval` degrades it to a shape flag (ambiguities A15). |
| 17 | **ERF-11** the mechanical result is not stored | Checkable only as a blacklist of field names someone might have used. `erfval` checks five. An author who calls it `q_ok` passes. |

Items 9, 10 and 11 are the interesting ones, because they are the cases where
the *parser* is the obstacle rather than the type system: the information needed
to check them is destroyed before any Haskell value exists.

---

## 9. Where the parser, not the type system, is the wall

**ERF-66.**

> "A record's frontmatter MUST NOT contain a duplicate key, an anchor, an alias,
> or an explicit tag. YAML permits all four and leaves a processor's response to
> duplicates at its own discretion, so two conforming parsers may legally
> disagree about the same file."

All four are resolved by libyaml before `Data.Yaml` hands back a `Value`:
duplicates are merged (last wins), aliases are expanded into their anchor's
content, tags are applied. The evidence is gone. The requirement is
well-motivated — it exists precisely *because* processors disagree — and it
cannot be checked by the mainstream Haskell binding at all.

`erfval` therefore runs a **lexical pre-scan** of the frontmatter text before
parsing (`erf66Scan`). It is approximate by construction: it sees top-level
duplicate keys but not duplicates inside a flow mapping on one line, and it can
be fooled by a `&` at the start of an unquoted scalar. That is stated in the
code and here rather than hidden.

A spec that mandates this check should say what a validator is expected to have
access to. Every mainstream YAML binding in every language has the same problem
(PyYAML, go-yaml, serde_yaml, js-yaml all merge duplicates silently by default),
so this is not a Haskell artifact.

**ERF-65.** Same shape. By the time a `Value` exists the resolver has run, and
a validator can only observe that a field the data model types as a string came
back as a `Number` or a `Bool`. `erfval` reports that, names the collision with
ERF-14 / ERF-27 / ERF-61 where it applies, and coerces the value so the remaining
checks still run rather than abandoning the record.

---

## 10. Totality holes

Every catch-all the specification forced. Each is a case the spec never says can
happen and gives no rule for.

### 10.1 `SUnparsed` — a timestamp that is neither shape

No requirement covers a `timestamp` that parses as neither a date nor an instant
nor a year. It cannot be dropped (ERF-57 forbids losing data), it cannot be
ordered, and every comparison in the program needs a branch for it. `cmpStamp`
returns `Unorderable`; ERF-47 has a rule for "cannot tell" in the staleness
context and none anywhere else.

### 10.2 `AActorMalformed` — forced by an unnumbered MUST

See §4. The only violation `erfval` emits with no requirement id.

### 10.3 ERF-41 has no tie-break, and says it has no need of one

> **ERF-41** "Disposition MUST be computed [...] from the current stances alone,
> meaning **each person's newest entry** [...] **Every input has exactly one
> reading.** No stance outranks another and the format supplies no tie-break:
> `contested` is the terminal reading of a disagreement, not a state resolved by
> arithmetic."

"Each person's newest entry" is not a total function. ERF-19 requires a full
instant but does not require instants to be unique, and ERF-40 makes standings
append-only, so a person who appends two entries within the same second — a
scripted producer, an import, a merge of two branches — has two newest entries.
If they carry different stances there is no newest, and "every input has exactly
one reading" is false.

The final sentence is about a disagreement *between people*, which the format
handles well. The hole is a disagreement *within one person's own ledger at one
instant*, which the format does not mention. `erfval` breaks the tie by file
order and **flags** it, because nothing licenses either choice.

Note that the same hole is wider under the weaker precision the spec permits
elsewhere: nothing stops a producer writing a standing with a bare date in
violation of ERF-19, and a validator that reports the ERF-19 violation still has
to compute *something* for ERF-41.

### 10.4 ERF-43 requires termination and does not forbid what breaks it

> **ERF-43** "An argument's premise closure, followed transitively (its outgoing
> `assumes` edges and the incoming `supports` edges of other claims, per
> ERF-24), MUST terminate in non-argument leaves. [...] Self-edges MUST NOT
> exist; **`assumes` and `decomposes-into` MUST admit no cycles.**"

The cycle prohibition names two relations. It omits `supports`. But ERF-24 puts
`supports` **into** the premise closure, from the other side:

> **ERF-24** "An argument's premises are the targets of its own outgoing
> `assumes` edges together with the claims that carry `supports` edges pointing
> at it"

So two arguments A and B, where A `supports` B and B `supports` A, form a
premise closure with no leaf. ERF-43 requires that closure to terminate, and the
only rule that would prevent it does not cover the relation involved. A validator
implementing ERF-43 literally, without a visited set, **does not terminate**.

`erfval` carries a visited set the specification does not authorise, and reports
the revisit as a flag with an explanation. This is the clearest instance in the
document of a requirement that cannot be implemented as written.

### 10.5 `LUnreadable` — a file that is not YAML

> **ERF-54** "A file carrying no `type` is not part of the corpus; a consumer
> MUST ignore it and MUST report that it did"

This presumes every file parses far enough to look for a `type` key. Normalized
texts live in the same tree (ERF-59: "A corpus travels as a directory or archive
of its records **and their normalized texts**") and are prose. `erfval` reports
them under ERF-54 as ignored-and-reported, which is the closest available reading
and is not what ERF-54 describes.

Related: `erfval` only walks `.md`, `.markdown`, `.yaml`, `.yml`. That is a
decision about **filenames**, which ERF-54 says carry no meaning ("A consumer
therefore discovers a corpus by reading, never by guessing at filenames or
directories"). Walking every file including `raw/*.pdf` is the literal reading
and produces a report dominated by binary files reported as ignored. There is no
third option: the spec forbids using the filename and gives no other way to know
what to open.

### 10.6 `ExplicitNull`

Covered in §1.1. Three wire states, two words in the spec.

### 10.7 Unknown `type` values

ERF-54 enumerates six. ERF-57 says an unknown record type is preserved and
reported. No requirement says whether a *validator* treats a seventh value as a
producer error. `erfval` reports a note. See ambiguities A28.

---

## 11. What "parse, don't validate" bought, and what it did not

**Bought.** After `loadFile` returns, every `Atom` in hand has a `SourceQuality`
from the closed set, a `Verdict` from the closed set, a `Stance` from the closed
set, an `EpistemicKind`, a `Relation`, a `SourceStatus`, and a `Stamp` that has
already been classified. Sections 5's "Closed sets. A value outside them is a
validation failure, not a dialect" is entirely absorbed into the types: no
downstream function can see `source_quality: "unknown"`, and no later code needs
to re-check. The `TList`/`Presence` pair means no downstream function can confuse
an omitted list with a written-empty one, or an absent mapping with an empty one.

**Not bought.** Every item in §8 — which is to say every invariant in section 6,
the entire "validator" chapter. That is not a criticism of the format: §6 opens
with "Types express what types can express; the validator checks the relations no
type can see", which is exactly right and better stated than most specifications
manage. The finding is narrower: **the boundary falls in a different place than
section 6 implies.** Section 6 puts the relational checks in the validator and
implies everything else is typeable. In fact three requirements from section 7
(ERF-55 unknown fields, ERF-65 the schema, ERF-66 anchors and duplicates) are
also outside the types — and worse than outside them, since the information they
need is destroyed by the parser before typing begins. A specification that says
"types express what types can express" should say which side of that line each of
its serialization rules falls on.
