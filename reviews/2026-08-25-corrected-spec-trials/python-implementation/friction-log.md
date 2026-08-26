# Friction log

Every re-read, guess and inference made while building `erf_validate.py` from
`SPEC-as-tried.md` and `BINDING-as-tried.md` alone. Kept in the order things
happened, then grouped.

---

## 0. Reading the documents

- **The spec did not fit in one read.** `SPEC-as-tried.md` is 1509 lines and
  came back truncated at line 1051. Section 6, the invariants — which holds
  five of the seven requirements under test (`ERF-41`, `ERF-43`, `ERF-51`,
  `ERF-52`, `ERF-53`) — is entirely in the part that did not arrive first. A
  cold implementer who does not notice the truncation implements `ERF-31` and
  `ERF-65` and believes the disposition and quote-check rules are missing from
  the format.
- **Retired ids are silent.** `ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`,
  `ERF-46` and `ERF-64` do not appear. "Requirement ids are a flat sequence"
  and "retired ids are never reused" explains it, but only after hunting for
  them. No index of live ids exists; §3.1's field reference is the closest and
  it is per-field, not per-id.

## 1. The temptation to peek, and where it came from

The brief says the temptation is the finding. Three places, ranked.

1. **`types/erf.ts`.** Section 3: "The normative data model is the file
   `types/erf.ts` [...] where the two differ, the file governs", and the mirror
   "omits the file's [...] identifier alias definitions (`AtomId`, `ClaimId`,
   `SurveyId`, `SourceId`, `CorpusId`, `FamilyName`, `CSL`)". `ERF-65` — one
   of the seven — requires a validator to report "a string-typed field", and
   the document that says which fields those are is the file I do not have,
   and it explicitly omits from the mirror exactly the aliases I needed
   (`FamilyName`, `CSL`). Strongest pull of the exercise. Resolved by
   inference: `ERF-65`'s own examples (`"012"`, `"no"` as a source id and a
   family name) settle `FamilyName` and source ids by example; `CSL` I left
   untyped, and `ERF-53`'s `chapter-number: 36.0` example confirms a CSL field
   can legitimately be a number.
2. **`conformance/cases/normalization.txt` and
   `conformance/cases/quote-check.yaml`.** `ERF-51` names them normative and
   says "where a reading of the prose and a case disagree, the case governs".
   For the requirement this trial most wants to test, the prose declares
   itself non-determinative. I did not open them, and I recorded the fact as
   the framing item in `ambiguities.md` §1.
3. **`bindings/yaml-markdown.md`.** `SPEC.md` §7 links it. It was supplied as
   `BINDING-as-tried.md`, so no peek was needed — but the spec's own link goes
   to a path I was told not to open, and I checked the supplied file's title
   and `binding_version` to confirm they were the same document before
   trusting it.

Also noticed and not opened: `docs/history.md`, `docs/influences.md`,
`docs/purpose.md`, `docs/non-goals.md`, `docs/backlog/`, `CHANGELOG.md`,
`README.md` — all named in the first paragraph, none needed. And
`reviews/2026-08-25-post-ruling-trials/yaml-markdown-case-against.md`, named
in binding §6, which would have told me what other implementers found. That
one was tempting for a different reason: it is a *review*, and reading it
would have contaminated exactly what this trial measures.

## 2. Re-reads, by requirement

### `ERF-43` — four re-reads, one wrong build

> The premise relation MUST admit no cycles, where `X assumes Y` and `Y
> supports X` both make `Y` a premise of `X` (`ERF-24`)

Read three times as an *example of a cycle*, because it appears in a sentence
about cycles and names two claims in a loop-shaped sentence. It is not: both
clauses orient the same edge the same way, and the pair is a doubled premise
edge. I built a test corpus (`cycle-a` / `cycle-b`) asserting it was a cycle,
the validator disagreed, and re-reading `ERF-24` settled it. The test corpus
now carries the pair under the name `doubled-a` / `doubled-b` with a comment,
precisely because I got it wrong first.

Also re-read to decide whether the closure's cycle prohibition is global or
scoped (`ambiguities.md` §2.1) — still open.

### `ERF-41` — two re-reads

"MUST be left out of this computation as though the entry were absent" was
re-read to determine whether the offending entry's *author* drops out or only
the entry. "As though the entry were absent" settles it: the person's older
valid entry becomes their current stance. Re-read again to decide the
all-entries-invalid case; the same phrase settles that one too (`proposal`,
not `retired`).

Then re-read a third time hunting for a tie-break, and found the sentence "No
stance outranks another and the format supplies no tie-break" — which is about
`for` versus `against` across *people*, not about two entries by one person at
one instant. That gap is `ambiguities.md` §3.1.

### `ERF-31` — five re-reads, still open

The passage paragraph was re-read once per edge case, and the malformed
candidate never resolved. The two sentences that have to be reconciled are
600 characters apart and each is clear on its own:

> A binding's passage is the text from the end of the previous binding's
> marker [...] a binding closes the passage above it (section 2), and the
> previous binding closed the one before.

> A comment opening `<!--` followed by `claims:` IS a narrative binding

Re-read the grammar block three times looking for a definition of `ws`. There
is none.

### `ERF-65` — four re-reads, then a measurement

The sentence "Where the model types a field as a string and its bare spelling
would resolve to another type under this schema, a producer MUST quote it"
followed by five examples read as coherent until I ran each example through
both resolvers. Three of the five do not satisfy the stated condition. I
re-read it twice more assuming I had misread "this schema" as the JSON schema
rather than YAML 1.1; the previous sentence pins it ("Frontmatter MUST parse
under YAML 1.2 using the JSON schema"), so I had not.

### `ERF-51` / `ERF-52` — three re-reads

Re-read to confirm the split-before-normalize ordering (stated, unambiguous).
Re-read to look for a definition of "letter, digit, or combining mark" — none.
Re-read to look for a whitespace definition — none.

### Section 1, the conformance classes — two re-reads

Re-read to determine whether a Validator is also a Consumer, since several
rules a validator obviously ought to check (`ERF-33`, `ERF-32`, `ERF-42`) are
written as consumer duties. Conclusion: the classes are disjoint, "Conformance
is claimed per class", and the Validator paragraph does not incorporate the
Consumer paragraph. So `ERF-33` is not binding on a validator.
`ambiguities.md` §7.3.

### Section 7 opening and `ERF-53` — two re-reads

Re-read "Conformance is a property of a corpus as loaded into the model"
against `ERF-66` and `ERF-67`, which are byte-level. They cannot both be true.

---

## 3. Guesses and inferences, with what each decides

Each is a place where I wrote code the text does not require. Cross-referenced
to `ambiguities.md` where the reading is enumerated there.

| # | Guess | Decides | Ambiguity |
|:--|:--|:--|:--|
| 1 | "letter, digit, or combining mark" = Unicode `L*` / `N*` / `M*` | every whole-words verdict | §1.1 |
| 2 | step 2 deletes `*`, `_`, `` ` `` unconditionally, not as CommonMark markup | quotes containing identifiers or code | §1.2 |
| 3 | "whitespace" = Python `str.split()` (Unicode) | any source with U+00A0 | §1.3 |
| 4 | a source with no normalized text makes the check *unavailable*, not failed | every withheld-text corpus | §1.5 |
| 5 | the premise-cycle prohibition is global over all claims | observation-only cycles | §2.1 |
| 6 | an unresolved premise is dropped from the relation | `dangling-premise` | §2.2 |
| 7 | "a leaf whose disposition is retired" means leaves only | retired intermediate premises | §2.3 |
| 8 | "Self-edges MUST NOT exist" covers all four relations | `X conflicts-with X` | §2.4 |
| 9 | a standings tie at one instant resolves by document order | `d8-tie` | §3.1 |
| 10 | an unparseable standings timestamp sorts earliest and stays in the computation | `d9-bare-date` | §3.2 |
| 11 | entries with a missing `by` collapse into one pseudo-person | malformed ledgers | §3.3 |
| 12 | a *recognized* candidate closes the passage above it | CASE E | §4.1 |
| 13 | comments are found by raw-text scan, not a CommonMark parse | CASE O | §4.2 |
| 14 | `ws` = `\s` | multi-line bindings | §4.3 |
| 15 | the anchor's escapes are decoded before the `ERF-51` fold | CASE G | §4.4 |
| 16 | an empty anchor is legal; I flag it | CASE C | §4.5 |
| 17 | an unterminated candidate runs to the end of the body | CASE L | §4.6 |
| 18 | a bound id must resolve to a *claim*, not merely a record | CASE I | §4.7 |
| 19 | the anchor check uses `ERF-51` only, not `ERF-52`'s whole words | short anchors | §4 end |
| 20 | `ERF-65` retype = violation; legacy-schema retype = flag | the whole §5 output | §5.1, §5.2 |
| 21 | the empty scalar resolves to `null` | `why:` with no value | §5.4 |
| 22 | `citation` is left untyped | unquoted CSL fields | §5, gap 2 |
| 23 | list order is part of the model instance | cross-binding equality | §6.4 |

Guesses with no ambiguity entry, because they sit outside the seven:

| # | Guess | Why it was needed |
|:--|:--|:--|
| 24 | a `normalized:` path resolves against the source list's directory, then the corpus root | nothing states the base |
| 25 | a file whose YAML fails to parse is only reported when it has `---` frontmatter delimiters | otherwise every normalized text is a parse-error violation |
| 26 | files named by `normalized` or `received.path` are exempt from `ERF-54`'s untyped-file report | a normalized text cannot carry `type` |
| 27 | `ERF-33` is reported as a violation, not a flag | the text says only "MUST report" |
| 28 | `bound-at=2026-13-45` (grammar-legal, not a calendar date) is a violation | the grammar admits it; `ERF-32` needs a real date to compare |
| 29 | a URL in `citation_text` is detected by `https?://` or `www.` | `ERF-7` does not define "URL" |
| 30 | a reference "encodes location" if it contains `/`, `\` or `#` | `ERF-15` does not define location |
| 31 | an atom id matching `prefix-digits` is a flag when it does not | `ERF-13`'s "mint-time prefix plus a sequence number" is prose, not a grammar |
| 32 | `ERF-47`'s precision rule governs `ERF-32`'s `bound-at` comparison | `ERF-32` says "later than" and does not say how to compare a bare date to an instant; `ERF-47` states the rule for exactly that case, one section away |
| 33 | an actor matches `human:.+`, `process:.+` or `<producer>/<version>` | §2 states the convention in prose only |
| 34 | a `body:` key in frontmatter is accepted and the markdown body wins | the model types `body`; the binding puts it after the frontmatter |
| 35 | `ERF-3`'s "exactly two keys" is enforced on the source list file | stated, but only in prose beside a YAML fragment |

---

## 4. Friction that was not ambiguity

- **PyYAML's resolver table is inherited by reference.** Subclassing
  `SafeLoader` and calling `add_implicit_resolver` silently keeps YAML 1.1
  unless `yaml_implicit_resolvers = {}` is written in the class body. Cost:
  one debugging cycle. Recorded in `yaml-behaviour.md` §1.
- **Duplicate keys, anchors, aliases and explicit tags are invisible in loaded
  data.** `ERF-66` cannot be checked from `yaml.load`'s output at all;
  detecting it needs `yaml.compose` for duplicates and `yaml.parse` for the
  other three. Cost: a second and third parse of every file.
- **`AliasEvent` carries `.anchor`.** A naive event loop reports one alias as
  both an alias and an anchor. Cost: one wrong test expectation.
- **My own test generator deleted my hand-written `tests/README.md`.** Not the
  spec's fault; recorded because the corpora are now plain files and the
  generator is not part of the deliverable.
- **The example in `ERF-3` and the example in §4.1 disagree in shape.** §4.1's
  YAML fragment opens with `sources:` at the top level and no `type:` key;
  `ERF-3`'s fragment has both. §4.1's is informative ("YAML examples elsewhere
  are informative") and `ERF-3`'s is the rule, so no real conflict — but the
  first example a reader meets is the incomplete one.
