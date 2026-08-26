---
title: "Rubric review of SPEC-as-tried, SCHEMA-as-tried and BINDING-as-tried"
reviewer: claude-opus-5
status: non-normative
last_updated: 2026-08-26
---

# Rubric review: every numbered requirement, then the section prose

Scope: `SPEC-as-tried.md` (62 requirements), `BINDING-as-tried.md` (4).
Sixty-six rows, in id order. Nothing else in the repository was read, so
every "the schema forces this" judgment is made against
`SCHEMA-as-tried.json` as shipped and against the two documents' own text.

Column key for the six questions:

1. **Nec** = necessity (delete it; does the schema, a cited standard, or
   another requirement still force the behaviour?)
2. **Locus** = shape / computation / act / class-duty / definition
3. **Dir** = does it assume an order of work, a substrate, or a tool?
4. **St/Der** = does every "MUST NOT store" name a field the model could
   hold, and every "computed" a real computation over stored fields?
5. **Dec** = can a validator decide it from the corpus and its held files?
6. **Sent** = is every sentence a MUST/SHOULD/MAY, a definition, or the
   reason for one?

Verdict counts: **keep 3 · rewrite 42 · move 2 · merge 4 · retire 15**.

## The table

| # | 1 Nec | 2 Locus | 3 Dir | 4 St/Der | 5 Dec | 6 Sent | Verdict | Fails | Why |
|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|
| ERF-1 | mostly forced | definition + act | **order of work** | ok | no | no | **merge** | 1, 3, 6 | "MUST exist before any check runs against it" is an order-of-work claim, and "checks MUST run against that text, never the live web" is already the section 2 definition of *normalized text* word for word ("the only thing checks run against, never the live web"); only "Normalized text is CommonMark" survives. |
| ERF-2 | not forced | act + shape | ok | ok | **no** | mixed | **rewrite** | 2, 5 | "A source whose raw file is mutable at its location ... MUST record `received.timestamp`" turns on a fact no validator can establish, and the path-versus-url-and-digest disjunction is a schema conditional the schema does not carry. |
| ERF-3 | mostly forced | **shape** | ok | **no** | partly | no | **rewrite** | 1, 4, 6 | "A source's citation, locator and normalized text live on the source and never on the atom" forbids fields `Atom` cannot hold (closed object, no such properties), source-id uniqueness is forced by JSON object keys plus `ERF-66`, and "one entry per work" is undecidable. |
| ERF-4 | two of three forced | **invariant, not record type** | ok | ok | yes | reason ok | **merge** | 1, 2 | "Every atom MUST name its source" is `Atom.required`, the normalized-text conditional is the schema's `if/then/else`, and the one surviving clause ("the named id MUST exist in the source list") is a resolution rule that belongs in `ERF-35`, whose list does not currently name `source`. |
| ERF-5 | **fully forced** | **definition** | ok | ok | yes | glosses only | **retire** | 1, 2 | Every word of the MUST is in the schema (`status` required, closed enum, `else: required: [reason]`); what is left is three enum glosses and an editorial policy ("The set grows by demonstrated instance"). |
| ERF-6 | duplicated | act | **"a substring operation performed by a tool"** | ok | no | "The check exists to say so." | **rewrite** | 1, 3, 6 | The omission-marker rule is stated again in full by `ERF-52` (which cites `ERF-6` back), and "A producer MUST take a quote from the normalized text by copying, a substring operation performed by a tool" prescribes a mechanism no corpus records. |
| ERF-7 | **fully forced** | shape | ok | ok | yes | no | **retire** | 1, 6 | The schema puts `"not": {"pattern": "://"}` on `citation_text`, and "A file received by hand has no locator and no `received`" is a case description that is neither rule, definition, nor reason. |
| ERF-8 | not forced | computation | ok | ok | **no** | ok | **rewrite** | 5 | "`citation_text` MUST be rendered from it" is checkable only against a pinned style, and the same requirement's "a deliverable MAY override it" removes the pin, so the MUST can never be decided. |
| ERF-9 | enum forced | definition | ok | **no** | **no** | table ok | **rewrite** | 4, 5 | "It MUST NOT encode audit state ... or excerpt fidelity" forbids what a three-value enum (`high`/`medium`/`low`) cannot express, and "MUST grade one axis ... the weaker of two inputs governing" is a judgment no validator can check. |
| ERF-10 | continuation of ERF-9 | definition | ok | ok | **no** | ok | **merge** | 1, 5 | It is the second half of `ERF-9`'s grading definition living under its own number, and "A finding whose subject *is* discourse itself ... MUST say so in its own words" is undecidable. |
| ERF-11 | half forced | act + **use rule** | ok | **no** | no | commentary | **rewrite** | 1, 4, 5 | "its result MUST NOT be stored" names no field `Atom` has (closed object; the only writable slot is the `x_` namespace, which the rule does not mention), and "Verdicts ... MUST NOT be read as like for like" is a rule about use, which section 1 puts out of scope. |
| ERF-12 | enum forced; rest is ERF-40's | act | ok | ok | **no** | guidance | **rewrite** | 1, 5, 6 | The vocabulary is `Verdict` in the schema, "Disagreeing with a verdict is a standing on the claim, never an edit" is `ERF-40`'s append-only rule, and "a failed, unparseable or abandoned audit MUST NOT be written as one" cannot be checked from a corpus. |
| ERF-13 | not forced | shape claim that is false | **prescribes a minting scheme** | ok | **no** | ok | **rewrite** | 3, 5 | "*Shape: `Id`*" is untrue: the schema's `Id` is `^[^\s"<>]+$` and checks no prefix and no sequence number, so "a mint-time prefix and a sequence number (`kwg-117`), never renamed and never reused" is an unchecked mechanism that `ERF-37` elsewhere declines to specify. |
| ERF-14 | pattern forced | act | ok | ok | **no** | last sentence off-topic | **rewrite** | 5, 6 | "at the precision the source gave and no finer" requires reading the source, and "`limitations` records the caveat about the evidence, whatever its kind" is a sentence about a different field already covered in 4.2. |
| ERF-15 | not forced | shape the schema cannot express | ok | ok | **no** | ok | **rewrite** | 5 | "MUST NOT encode location" names no testable property: the `Id` pattern admits `/` and `:`, so `corpus-a/claim-7` is a conforming id and no validator can tell it from a bare one. |
| ERF-17 | mostly forced | mixed | ok | **no** | partly | guidance | **rewrite** | 1, 4, 6 | "MUST be written on every record" is `required` in four definitions, "stamps `last_modified` (`ERF-48`)" repeats `ERF-48`, "is explained in working notes" is unenforceable advice, and "it MUST NOT be written as a standing" forbids what `StandingEntry` (closed, three-value `stance`) cannot express. |
| ERF-18 | not forced | **definition** | ok | ok | **no** | meta-commentary | **rewrite** | 5, 6 | "`title` MUST state the claim" defines the field rather than constraining it, and "whether an opening in other words still states the same claim is a reading, so no rule numbers it" is a sentence about the absence of a rule. |
| ERF-19 | **fully forced** | shape + invariant | ok | ok | yes | reason ok | **retire** | 1 | `StandingEntry.timestamp` is `$ref: Instant` in the schema and `ERF-40` states "Standings MUST be append-only; an edit or deletion of an existing entry is a violation"; both halves already exist. |
| ERF-20 | SHOULD survives | act | ok | **no** | no | rejected-alternative note | **rewrite** | 4, 6 | "Drift MUST NOT be stored there" and "Counts are not an acceptable digest either" both forbid what `EvidenceAtStance` cannot hold (closed object, two arrays of `Id`), and the second is not a MUST/SHOULD/MAY at all. |
| ERF-21 | **fully forced, twice** | shape | ok | ok | yes | reason ok | **retire** | 1 | `StandingEntry.by` is `$ref: HumanActor`, and `ERF-39` states the same MUST again in section 6; the reason ("An LLM proposes; only a person takes a stance") is 4.3 prose. |
| ERF-22 | **fully forced** | shape + computation | ok | **no** | yes | imperative advice | **retire** | 1, 4, 6 | `Claim` is closed and defines no state field, `ERF-41` already says disposition "MUST be computed, never stored" and "No standings: `proposal`", and "take it, normalize it, and cite atoms" is advice. |
| ERF-23 | half forced | shape + act | ok | ok | **no** | ok | **rewrite** | 1, 5 | "Evidence MUST live on the claim" is the schema's shape (`Atom` has no claim reference and is closed), and "Evidence against a claim MUST NOT be modeled as a rival claim" is undecidable and sits badly beside `conflicts-with`, whose whole definition is two claims in tension that both stand. |
| ERF-24 | premise definition stated three times | **definition** | ok | ok | **no** | "auditability is computable from the kind" | **rewrite** | 1, 2, 5, 6 | The premise definition here is repeated verbatim in `ERF-43` and a third time in section 5's `argument` bullet, "MUST ask the question the epistemic kind sets" cannot be checked, and the closing clause states neither rule nor definition nor reason. |
| ERF-25 | not forced | act / guidance | ok | ok | **no** | reason ok | **rewrite** | 2, 5 | "A universal negative ... MUST be audited as scoped" has no machine trigger: nothing in a record marks a claim as a universal negative, so this is auditor guidance wearing a MUST. |
| ERF-26 | presence forced | shape + judgment | ok | ok | **no** | last sentence guidance | **rewrite** | 1, 5, 6 | `tool` and `query` are `required` and `scope` is optional, so "MAY name the `scope`" restates the schema's optionality; "A category ('web search') is not an instrument" is the real content and no validator can apply it. |
| ERF-27 | "as text" forced | mixed | ok | ok | **no** | `notable_results` sentence | **rewrite** | 1, 2, 5 | `hits_reported` is already `type: string`, "MUST NOT state precision the instrument did not give" is undecidable, and the `notable_results` sentence defines a different field with no keyword and belongs in 4.5 guidance. |
| ERF-28 | two clauses forced | **five rules in one id** | ok | ok | partly | mixed | **rewrite** | 1, 2 | "any such edit stamps `last_modified` (`ERF-48`)" is `ERF-48` and "Staleness ... is computed from `conducted` timestamps, never stored" is `ERF-47`; what remains is immutability, a naming convention ("its id SHOULD end with the conducted date", which contradicts `ERF-13`'s prefix-and-sequence form), a title rule, and a timestamp-inheritance computation, under one number. |
| ERF-31 | not forced | definition + SHOULD + two class duties | ok | ok | partly | ok | **rewrite** | 2, 5 | "the anchor MUST occur in its passage" and then "A validator MUST flag an anchor that does not occur in its passage, a flag and not a violation" state a MUST and immediately declare its breach conforming, which contradicts section 1's "MUST (violation means non-conformance)". |
| ERF-32 | duplicated and contradicted | computation | ok | ok | yes | first sentence not a rule | **merge** | 1, 6 | `ERF-47` already computes narrative-binding staleness, and the two disagree on the same input: `ERF-32` says show it "as staleness `indeterminate` and MUST NOT show it as current", `ERF-47` says "the comparison MUST resolve to stale". |
| ERF-33 | not forced | class duty | ok | ok | act, honestly | ok | **keep** | none | It is a consumer-fidelity duty of exactly the kind section 1 admits, stated in three sentences that are two rules and one reason. |
| ERF-34 | **fully forced** | **definition** | ok | **no** | **no** | ok | **retire** | 1, 2, 4, 5 | `Narrative` is closed on `type`, `title`, `corpus`, `created`, `body`, so "It has no evidence, no standings and no disposition" is unviolatable, and "A narrative MUST NOT be modelled as a record" is the definition of *narrative*, which section 2 is missing. |
| ERF-35 | not forced | invariant | ok | ok | yes | last sentence editorial | **rewrite** | 2, 6 | The enumerated list is incomplete (`Atom.source`, `corpus`, `families` and narrative-binding ids all carry ids and are not named), and "The test for any later id-bearing field is whether it asserts something now or records something then" is instruction to the spec's editors. |
| ERF-36 | not forced | invariant | ok | ok | yes (deployment-wide) | colon restates the clause | **keep** | none | The one statement of the uniqueness invariant; `ERF-37` and `ERF-38` are the same rule aimed at two conformance classes and should fold into it. |
| ERF-37 | **fully forced** | act | **"before writing a record"** | ok | **no** | examples + meta | **retire** | 1, 3, 5, 6 | `ERF-36` makes a duplicate id non-conforming whoever wrote it, so this adds only an unobservable pre-write duty, three examples of mechanism, and a sentence about what the format declines to specify. |
| ERF-38 | **fully forced** | class duty | ok | ok | yes | ok | **retire** | 1 | Section 1's Validator class already "Binds every machine-checkable MUST that applies to the input it accepts, including section 6 in full", and `ERF-36` is a machine-checkable MUST in section 6. |
| ERF-39 | **fully forced, twice** | shape | ok | ok | yes | ok | **retire** | 1 | `StandingEntry` requires `by` (`HumanActor`) and `why` (`minLength: 1`); `ERF-21` states the actor half a second time. |
| ERF-40 | not forced | invariant | **substrate history** | ok | **not from the corpus** | reason ok | **rewrite** | 3, 5 | "verified against the substrate's history" makes this undecidable under section 1's own definition ("decidable from the corpus and the files it holds alone"), yet it sits in section 6 under the heading "All machine-checkable." |
| ERF-41 | not forced | computation | ok | ok | yes | three assertions about the rule | **rewrite** | 4, 6 | The admissibility test defines behaviour over entries the schema cannot hold (`stance` enum, `Instant`, `HumanActor` are all enforced), and "Every input then has exactly one reading" asserts a property of the rule rather than stating one. |
| ERF-42 | definitions duplicated | class duty + definition | ok | ok | **no** | slogan | **rewrite** | 1, 5, 6 | "A rejected claim is one every current holder judges false; a retired claim is one every current holder has left" restates `ERF-41`'s computation, and "MUST NOT be conflated" is a slogan; only the last clause is an applicable duty. |
| ERF-43 | not forced | **five invariants in one id** | ok | ok | yes | termination note | **rewrite** | 2, 6 | Acyclicity over a finite corpus already gives termination in non-argument leaves, so the first MUST is implied by the third, and "so that a validator terminates on any input" is an implementation note about the checker, not a statement about the corpus. |
| ERF-44 | not forced | invariant | ok | ok | yes | ok | **keep** | none | One sentence, one decidable rule; the reciprocal-derivation gloss lives once, in section 5's relation list. |
| ERF-47 | contradicted by ERF-32 | computation | assumes same-day re-audit | **no** | yes | ok | **rewrite** | 3, 4 | "Staleness MUST be computed, never stored" forbids a field no record type can hold, and "because the re-audit that follows an edit lands on the same day" builds an assumed order of work into a comparison rule. |
| ERF-48 | not forced | act | ok | ok | **mostly no** | "correctly" | **rewrite** | 5, 6 | Only "later than its `created`" is decidable from a corpus: "later than any prior `last_modified`" needs history the corpus does not hold, and no validator can see that a change happened at all. |
| ERF-50 | **fully forced** | act | **"a gate at minting"** | ok | **no** | ok | **retire** | 1, 3, 5 | `ERF-6` states the invariant ("The `quote` MUST be verbatim from the source's normalized text"), `ERF-51` and `ERF-52` define the check; what is left is "it MUST run as a gate at minting and after any transform that moves atoms between homes", which is a pipeline instruction no corpus records. |
| ERF-51 | not forced | computation | ok | ok | yes | **self-contradicting** | **rewrite** | 6 | The same requirement says the case files "test an implementation and bind nothing" and, twelve lines later, that they "are normative for its exact behavior: where a reading of the prose and a case disagree, the case governs"; section 1 takes the first side. |
| ERF-52 | not forced | computation | ok | ok | yes | **a sentence that is not a sentence** | **rewrite** | 6 | It contains a broken duplicated fragment, "(`ERF-51`) unless the quote holds the same blank line.", orphaned outside the list item, which also states a second and different paragraph-boundary test from the line above it ("unless the quote holds the same break"). |
| ERF-53 | not forced | serialization | ok | ok | **needs two forms** | self-gloss | **rewrite** | 5, 6 | "'Every file' and not 'every record'" is commentary on the requirement's own wording, "How records are grouped in a store carries no meaning" repeats `ERF-54`, and round-trip equality cannot be decided from one corpus, which is the only input section 1 gives a validator. |
| ERF-54 | half forced | shape + class duty | ok | ok | partly | **malformed 2119** | **rewrite** | 5, 6 | "no meaning MAY live in a path" is not a 2119 prohibition and is undecidable; the `type` half is the schema's `const` discriminators, and only "exactly one file MUST carry `type: corpus`" is new. |
| ERF-55 | half forced | **binding, not model** | **assumes a wire** | ok | binding-only | reason ok | **move** | 2, 3 | "Empty lists MUST be omitted" is a statement about bytes with no meaning for the SQL store section 7 explicitly contemplates, and the undefined-field half is `additionalProperties: false` in every definition. |
| ERF-56 | not forced | reader duty | ok | ok | act | **factually false** | **rewrite** | 6 | "The data model types these fields as required because they are always present in a loaded record" is untrue of the normative schema: no list field appears in the `required` array of `Atom`, `Claim` or `Survey`. |
| ERF-57 | **fully forced** | class duty | ok | ok | act | ok | **retire** | 1 | Section 1's Consumer class already states all three duties: "a consumer MUST NOT reject a corpus over unknown fields, unknown types, or records it cannot interpret. It reads what it understands and preserves the rest as opaque data, reporting what it did not recognize." |
| ERF-58 | **fully forced** | **naming convention** | ok | ok | yes | ok | **retire** | 1, 2 | Every schema definition carrying an event time (`ActorStamp`, `AuditEntry`, `SearchAct`, `StandingEntry`, `Received`) names the key `timestamp` and sets `additionalProperties: false`, so no other spelling can be written; the convention binds editors and belongs in 3.2. |
| ERF-59 | **fully forced** | shape + definition | ok | ok | yes | states an absence | **retire** | 1, 6 | `CorpusDeclaration` requires exactly `type`, `id`, `title`, `spec_version` and permits `owner` and `classification`, `ERF-54` already says "exactly one file MUST carry `type: corpus`" and "a validator MUST reject two declarations", and "The declaration declares no bars or gates" states what the format does not do. |
| ERF-60 | mostly not forced | class duty | **"before anything else"** | ok | act | repeats change control | **rewrite** | 3, 6 | "A validator therefore reads `spec_version` before anything else" prescribes an order of work (and one it cannot follow, since finding the declaration means parsing files first), and "Migrations between majors are explicit" repeats the Versioning section verbatim. |
| ERF-61 | syntax forced | **definition** | ok | ok | yes | ok | **move** | 1, 2 | The `SemVer` pattern and the cited standard hold the syntax; what is left is this format's own gloss on what MAJOR and MINOR mean, which is a definition belonging in "Versioning and change control". |
| ERF-62 | not forced | definition + principle | ok | ok | **no** | ok | **rewrite** | 5 | No fact visible in a corpus distinguishes one authoritative home from two, and "never consulted as truth" describes an intention, not a state; the useful content is the definition of *projection*. |
| ERF-63 | **fully forced** | permission | **git and databases** | ok | vacuous | examples | **retire** | 1, 6 | It grants a permission nothing withholds (section 7: "Storage is unconstrained"), its only constraint is `ERF-40`'s already-stated need for verifiable history, and its two remaining sentences are examples. |
| ERF-65 | not forced | **six rules in one id** | parser configuration | ok | **leading MUST no** | mangled clause | **rewrite** | 2, 5, 6 | "Frontmatter MUST parse under YAML 1.2 using the **JSON schema**" names a parser setting the binding's own section 8 reports is unavailable ("Two cold implementations on 2026-08-25 found their parsers offered no way to select the JSON schema at all"); the decidable rule is the final sentence. |
| ERF-66 | not forced | binding invariant | ok | ok | yes, via events | **false premise** | **rewrite** | 2, 6 | "A record is a flat structure and needs none of them" is untrue of `citation`, `created`, `searches` and `standings`, and the sentence explaining how to check this rule is stranded inside `ERF-67`. |
| ERF-67 | not forced | binding shape | ok | ok | yes | **carries ERF-66's check** | **rewrite** | 2 | Its last sentence ("`ERF-66` cannot be checked through a YAML library's tree ... a validator reads the parser's event stream") is the checking rule for a different requirement and belongs in `ERF-66`. |
| ERF-68 | enum forced | mixed SHOULD/MUST | ok | ok | **no** | reason ok | **rewrite** | 2, 5 | One sentence carries a SHOULD about SPDX and a MUST about `status`, and both turn on a licence judgment ("a text shipping under no licence as a short quotation") that no validator can make. |
| ERF-69 | not forced | act + duty on no class | ok | ok | **trigger unrecordable** | purpose prose | **rewrite** | 5, 6 | Its condition ("A source's normalized text MAY be an excerpt") is a fact the model never records, so a validator can never require `excerpt`; and "MUST be checked by anyone holding the raw file" places a duty on a party that is not a conformance class. |
| ERF-70 | not forced | act | ok | **no** | **no** | three commentary paragraphs | **rewrite** | 4, 5, 6 | "that tool MUST be deterministic" and "A non-deterministic tool MUST NOT be used" cannot be decided from a corpus, "The extraction's own output is not retained" is a MUST NOT store about a thing with no field, and the last two paragraphs are design commentary. |
| ERF-71 | not forced | act | ok | ok | trigger partly | **self-contradicting inference** | **rewrite** | 5, 6 | "its source simply carries no digest, which itself tells a reader what kind of source it was" reads an absence as informative, which is exactly the inference `ERF-4` rejects ("a validator can tell a recorded absence from an omission and cannot tell an omission from an oversight"). |
| ERF-72 | **fully forced** | shape | ok | ok | yes | **fragment** | **retire** | 1, 6 | `patternProperties: {"^x_": ...}` on every definition grants the permission, `ERF-55` already excepts the namespace and `ERF-57` already handles the consumer side; "Rigid by default and extensible in one place" has no verb. |
| YAMLB-1 | not forced | grammar + computation | ok | ok | yes | restates its own grammar | **rewrite** | 6 | "Ids are separated by whitespace and never by commas" restates `ids ::= id (ws+ id)*` directly above it, and "a grammar that cannot express a legal value is a defect in the grammar" is commentary on grammar design, not a rule about a binding. |

## The fifteen retires, with deletion tests

| # | What still forces the behaviour after deletion |
|:--|:--|
| ERF-5 | The schema: `Source.required` includes `status`, the enum is closed on the five values, and the `else` branch requires `reason`. The three enum glosses are definitions and move to section 5. |
| ERF-7 | The schema: `Source.citation_text` carries `"not": {"pattern": "://"}`, which is the whole rule. |
| ERF-19 | The schema (`StandingEntry.timestamp` is `$ref: Instant`) for the precision half; `ERF-40` ("Standings MUST be append-only; an edit or deletion of an existing entry is a violation") for the append-only half. |
| ERF-21 | The schema (`StandingEntry.by` is `$ref: HumanActor`) and `ERF-39`, which states the same MUST in section 6. |
| ERF-22 | The schema (`Claim` is `additionalProperties: false` with no state field) and `ERF-41` ("Disposition MUST be computed, never stored ... No standings: `proposal`"). |
| ERF-34 | The schema (`Narrative` is closed on `type`, `title`, `corpus`, `created`, `body`, so no standings, evidence or disposition can be written). The residue is the definition of *narrative* and moves to section 2. |
| ERF-37 | `ERF-36` makes a duplicate id non-conforming regardless of who wrote it, and `ERF-38` (or, after its own retirement, section 1's Validator class) forces detection. |
| ERF-38 | `ERF-36` plus section 1's Validator class, which "Binds every machine-checkable MUST that applies to the input it accepts, including section 6 in full". |
| ERF-39 | The schema: `StandingEntry.required` is `[timestamp, stance, by, why]`, `by` is `HumanActor`, `why` is `minLength: 1`. |
| ERF-50 | `ERF-6` states the invariant, `ERF-51` and `ERF-52` define the check, and section 1's Validator class binds it; only the minting-gate instruction disappears, and it was never checkable. |
| ERF-57 | Section 1's Consumer class states all three duties (do not reject, preserve as opaque, report) in the same words. |
| ERF-58 | The schema: every definition carrying an event time names the key `timestamp` and forbids additional properties, so no other key can be written. |
| ERF-59 | The schema (`CorpusDeclaration` required and optional fields) and `ERF-54` ("exactly one file MUST carry `type: corpus`", "a validator MUST reject two declarations"). The `classification` gloss moves to section 2. |
| ERF-63 | Section 7's "Storage is unconstrained" grants the permission; `ERF-40`'s "verified against the substrate's history" is the only constraint this states. |
| ERF-72 | The schema's `^x_` `patternProperties` on every definition, plus `ERF-55`'s existing exception and `ERF-57`'s (or the Consumer class's) unknown-field handling. |

Note on citation churn: `ERF-57` is cited by `ERF-53`, `ERF-54`, `ERF-55`,
`ERF-60`, `ERF-72` and section 1, and `ERF-72` by `ERF-55` and by every
schema `patternProperties` description. Retiring either means re-pointing
those citations at the Consumer class and at the schema, not leaving them
dangling.

## Section prose

Every paragraph that is not a numbered requirement, a section 2
definition, or a passage marked `*Note (non-normative)*`. Listed below are
the ones that fail the test "every sentence states a rule, defines a term,
or gives the reason for one".

### `SPEC-as-tried.md`

| Where | Failing sentence | Why it fails |
|:--|:--|:--|
| Opening, after the title | "Specification, v0.9 (draft)." | Not a sentence, and the rest of the paragraph is a table of contents for other files. |
| **What is normative** | "Everything else in this repository, the reference implementation, the conformance suite and its case files, the type rendering, the trials and the history, is an instrument or a record and binds nothing." | It is a rule, and `ERF-51` contradicts it: "the case files beside this document ... are normative for its exact behavior ... the case governs". |
| 1, para 1 | "a neighboring system may consume these records, and an activated bet plus its standing entries covers the common case." | Reassurance about a use case; states no rule, defines no term. |
| 1, para 2 | "The specification is written to be handed to an implementer (human or LLM) to build from, or diffed against an existing system requirement by requirement." | A statement about the document's intended use. |
| 1, para 3 | "SHOULD (default with legitimate exceptions; a departing system should know and say so)" | A rule stated in lowercase inside a gloss on the 2119 keywords, and the whole paragraph duplicates section 2's BCP 14 paragraph in different words. |
| 1, Validator bullet | "The list illustrates the duty and does not bound it: a tool that never opens a normalized text or parses a narrative binding is not a validator." | Leaves the Validator class deliberately unbounded, so no tool can establish that it conforms. |
| 1, after the class list | "Strict producers, tolerant consumers: divergence is caught by validators and surfaced, never by consumers refusing to read." | A slogan restating the four bullets above it. |
| 1, **A flag is not a violation** | "the whole point is that someone looks." | Rhetoric appended to a MUST NOT. |
| 1, **What a consumer rule may say** | "That line is why this version specifies no gates and no policies: the format states what a record means and how records refer to each other, and every decision about what to do with them is deliberately left to the reader." | States what the format does not do, which is `docs/non-goals.md`; and it is contradicted by `ERF-11`'s "MUST NOT be read as like for like" and `ERF-50`'s minting gate. |
| 3, para 2 | "Those are the format's argument, and they are prose because no notation checks them." | Rhetoric about the document's structure. |
| 3, para 3 | "`types/erf.ts` is a TypeScript rendering of the schema for the reference implementation, held to it by a gate, and is not normative." | Repository bookkeeping inside the normative data-model section. |
| 3.1, closing paragraph | "The mint-time evidence sweep runs a claim's `semantic_query` against the deployment's atom and source indexes in both directions: candidates for `atoms_for` and `atoms_against` alike." | The single worst paragraph in the document: it describes a retrieval pipeline (embeddings), a tool, and an order of work ("mint-time"), states no rule, and sits inside a normative section. "(this retrieval path is what replaced atom tags)" is changelog. |
| 3.2 | "Field names are `snake_case`\nalike: serialization fidelity outranks TypeScript idiom, so every example stays copy-pasteable between this document and a file." | Ungrammatical: "alike" is orphaned, a clause has been deleted, and the sentence no longer parses. This is the `ERF-49` failure mode verbatim. |
| 3.2 | "The conventions that govern how future names are chosen are in `docs/history.md`; they bind whoever edits this specification, not an implementer reading it." | Editorial process inside a normative section. |
| 4, intro | "Each record type is stated the same way: what it is for, then how to write one well, then the numbered promises the format makes about it." | Document-structure commentary. |
| 4.1, para 2 | "Where a source has no `citation` block, write `citation_text` as 'Author, Title (venue, year), locator when it matters'; the upgrade path to exactness is the citation block." | An unnumbered imperative rule in a normative section. |
| 4.1, para 3 | "Take the raw file when you first read something. Legacy material is taken the next time it is read or used, and its atoms are minted then; a corpus is not retrofitted wholesale ..." | Imperative, and an assumed order of work stated as fact about corpora. |
| 4.2, Writing one well | "Compression is a defect." | A rule stated in guidance, unnumbered and undecidable. |
| 4.2, para on the name | "The caveat field is named `limitations` rather than 'warrant' deliberately: in Toulmin's vocabulary a warrant is the licence from evidence to claim, the opposite role, and the borrowed name guaranteed misreading by trained readers." | Naming history; `docs/history.md` is where the document itself says this lives. |
| 4.2, last para | "Only the atom has this field, and the asymmetry is the rule rather than an oversight: **a record with a body carries its caveats there.**" | A rule, in bold, with no number, inside guidance the section says "binds nothing". |
| 4.3, para 2 | "The spec invents no standing entries in its examples: a stance is a real person's recorded judgment, and there is none to show yet." | Commentary about the document's own examples, which live in a different document. |
| 4.3, para 4 | "it is read by machines only, is exempt from the prose standard by construction, and may be regenerated freely." | Three rules about `semantic_query` with no number and no keyword. |
| 4.3, para 5 | "A stance that decides something, meaning one that activates or contests a claim, is worth taking through a show-both-sides review individually. The cold-reader test applies to standings as much as to prose ..." | Unnumbered process advice using two terms ("show-both-sides review", "cold-reader test") the document never defines. |
| 4.4, para 2 | "Run it on change rather than on a schedule: an atom added to either list, a cited atom modified, the statement edited." | An unnumbered imperative about when to run an audit; an order of work. |
| 4.5, Writing one well | "A complete search of a closed corpus correctly has nothing to state." | "correctly" smuggles a rule into a descriptive sentence; the surrounding "Describe the search in the body: what you were after, what surprised you" is imperative guidance. |
| 4.6, para 1 | "Prose alone has a problem: assertions live inside sentences, so nothing marks what a passage commits to; the writer re-derives old reasoning; readers argue with impressions; and when the thinking underneath changes, the prose keeps saying what it said." | Motivational essay; `docs/purpose.md` is its home. The same paragraph's "It is prose, authored by a person and never generated." is a MUST-shaped rule with no number and no possible check. |
| 5, intro | "Closed sets." | Not a sentence. |
| 5, closing | "Operational meaning: read the lows and mediums harder." | Advice to a reader, in the vocabulary section. |
| 6, intro | "All machine-checkable." | Not a sentence, and false: `ERF-40` is decidable only against substrate history and `ERF-48` only against values the corpus does not retain, both of which section 1 excludes from "machine-checkable". |
| 7, intro | "A corpus held in a SQL store conforms if it loads to a conforming model instance, and its export to the default binding is guaranteed to give every verdict the store did." | Asserts a guarantee rather than requiring one; nothing establishes it. |
| 7, para 2 | "`ERF-65`, `ERF-66`, `ERF-67` and the file half of `ERF-53` moved there on 2026-08-25 keeping their ids, and the narrative binding's spelling as an HTML comment is the binding's own `YAMLB-1`." | Change history inside a normative section; the document's own front matter says `CHANGELOG.md` holds it. |
| Versioning, bullet 3 | "The discipline the specification's own editors work under (forcing instances, the decision register, the changelog) is stated in `docs/history.md`; it binds whoever amends this document, not an implementer reading it." | A pointer to editorial process; no rule for a conforming implementation. |
| Security, bullet 1 | "this version gives that rule no vocabulary and no check, so a deployment that needs the wall must build it where its other policies live." | States what the format does not do, then issues an instruction to a deployment the format does not govern. |
| Security, bullet 4 | "Public cuts exclude working notes by default; the record's epistemic fields are what travel." | A rule about "public cuts", a thing the document never defines. |

Paragraphs that pass: section 2's definition list (except that it omits
*narrative*, *claim*, *atom*, *survey* and *classification*, all of which
are defined instead inside requirements); the four `*Note
(non-normative)*` passages, which are correctly labelled; the conformance
class bullets, apart from the two sentences named above; section 8's two
requirements; the References lists.

### `BINDING-as-tried.md`

| Where | Failing sentence | Why it fails |
|:--|:--|:--|
| 1, para 1 | "One record per file: YAML frontmatter, then a markdown body, for every record type." | This is the binding's central rule and it carries no id, in a document whose own frontmatter says `status: normative` and which numbers everything else. |
| 1, para 3 | "The nesting is written out because an earlier wording named both keys without saying which contained which, and an independent implementation read the entries as further top-level keys beside `type`." | Trial history; belongs in the changelog. |
| 1, para 4 | "That the form is this one is this section." | States that an unnumbered paragraph is normative, which is exactly the thing an id exists to do. |
| Headings | "## 5. The narrative binding's spelling" is followed by "## 7. Worked examples" | Section 6 does not exist; either a section was deleted without renumbering or one is missing. |
| 7, worked examples | `timestamp: 2026-08-23`, `created: {timestamp: 2026-07-19, ...}`, `conducted: {timestamp: 2026-08-22, ...}` | Every timestamp in the binding's own examples is unquoted, against `ERF-65`'s "A producer SHOULD quote a timestamp regardless, so that a reader on a legacy schema still receives a string." |
| 8 (labelled non-normative, but noted) | "Two cold implementations on 2026-08-25 found their parsers offered no way to select the JSON schema at all." | Not a prose failure, but it records that `ERF-65`'s leading MUST is unsatisfiable by known implementations, which no requirement acknowledges. |

### Two defects that belong to no single paragraph

- **Retired ids are invisible.** `ERF-16`, `ERF-29`, `ERF-30`, `ERF-45`,
  `ERF-46`, `ERF-49` and `ERF-64` appear nowhere in either document, not
  even as a list. The change-control section says "retired ids are never
  reused and are never refilled", and section 1 says the document is meant
  to be "diffed against an existing system requirement by requirement". A
  reader doing that diff cannot tell a retired id from a lost one.
- **A schema field no requirement constrains.** `Source.normalized_digest`
  exists in the model and is listed in 3.1 under `ERF-1`, `ERF-4`, `ERF-5`
  and `ERF-71`, none of which mentions it: `ERF-71` governs
  `received.digest` only. `Source.licence_name` is likewise only reachable
  through a clause of `ERF-68` ("with the plain name alongside").

## The ten changes I would make first, ranked

1. **Settle whether the case files bind.** `ERF-51` says both, in one
   requirement: "they test an implementation and bind nothing, since the
   standards named here do" and, twelve lines later, "are normative for
   its exact behavior: where a reading of the prose and a case disagree,
   the case governs". Section 1 takes the first side and names three
   normative artifacts "and nothing else". This is the highest-stakes
   contradiction in the document, because the normalization fold is the
   one thing two implementations must agree on exactly. Pick one, and if
   the cases govern, add them to section 1's list.

2. **Repair the broken text in `ERF-52`.** The requirement currently ends
   with an orphaned, unindented fragment: "(`ERF-51`) unless the quote
   holds the same blank line." It is not a sentence, it breaks out of the
   list item, and it states a paragraph-boundary test ("the same blank
   line") different from the one on the line above it ("the same break").
   The quote check is the format's core computation and it currently
   ships with two answers and a truncation.

3. **Retire the fifteen requirements the schema or another requirement
   already forces** (`ERF-5`, `-7`, `-19`, `-21`, `-22`, `-34`, `-37`,
   `-38`, `-39`, `-50`, `-57`, `-58`, `-59`, `-63`, `-72`), moving their
   definitional residue to section 2 and section 5 and re-pointing the
   citations. That is 23 percent of the requirement count carrying no
   independent obligation, which is what made `ERF-49` survivable in the
   first place.

4. **Resolve `ERF-32` against `ERF-47`.** The same condition (a staleness
   comparison that cannot be run) gets two answers: "MUST show the binding
   as staleness `indeterminate` and MUST NOT show it as current" versus
   "the comparison MUST resolve to stale". Two conforming tools will
   disagree about the same narrative.

5. **Fix `ERF-56`'s statement about the schema.** "The data model types
   these fields as required because they are always present in a loaded
   record" is false: no list field appears in the `required` array of
   `Atom`, `Claim` or `Survey`. Either add them to `required` in the
   schema, which is what the requirement assumes, or delete the sentence.
   A specification whose prose misdescribes its own normative schema will
   be diffed against by someone who trusts the prose.

6. **Stop `ERF-31` from declaring its own MUST non-binding.** It says "the
   anchor MUST occur in its passage" and then "A validator MUST flag an
   anchor that does not occur in its passage, a flag and not a violation".
   Section 1 defines MUST as "violation means non-conformance". Make the
   anchor test a SHOULD with a flag duty, or make it a violation, but not
   both.

7. **Correct section 6's "All machine-checkable."** `ERF-40` is decidable
   only "against the substrate's history" and `ERF-48` only against prior
   values a corpus does not retain, while section 1 defines
   machine-checkable as "decidable from the corpus and the files it holds
   alone". Either move those two out of section 6 or widen the definition
   and say what a validator without history reports.

8. **Give the excerpt and conversion MUSTs a recordable trigger.**
   `ERF-69` ("A source's normalized text MAY be an excerpt ... and MUST
   then record who selected the passage"), `ERF-70` ("Where normalized
   text was produced from a raw file in another format") and `ERF-71` all
   condition obligations on facts the model never stores, so no validator
   can ever apply them. Add a field that records the fact, or state them
   as obligations on the act and stop calling them checkable.

9. **Cut the guidance and commentary out of the normative sections.** In
   priority order: 3.1's retrieval paragraph (embeddings, "the mint-time
   evidence sweep"), 4.1's "Take the raw file when you first read
   something", 4.3's `semantic_query` rules and its "show-both-sides
   review", 4.4's "Run it on change rather than on a schedule", section
   7's changelog paragraph, and 3.2's ungrammatical "Field names are
   `snake_case` alike:". Each is either an unnumbered rule, an order of
   work, or repository bookkeeping.

10. **Publish the retired-id list and fix the false *Shape* pointers.**
    `ERF-16`, `-29`, `-30`, `-45`, `-46`, `-49` and `-64` are simply
    absent, which defeats the requirement-by-requirement diff the document
    advertises. In the same pass, correct `ERF-13`'s "*Shape: `Id`*" (the
    pattern `^[^\s"<>]+$` checks no prefix and no sequence) and
    `ERF-15`'s implied shape (the same pattern admits `/` and `:`, so an
    id that encodes location is conforming), since a *Shape* marker that
    names a check the schema does not perform is the most misleading
    sentence a requirement can carry.
