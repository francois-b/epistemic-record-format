---
title: Rubric review
reviewer: gpt-5.6-sol via mods
status: non-normative
last_updated: 2026-08-26
---

# Requirement-by-requirement review

**Column shorthand:** **N** necessity; **L** locus; **D** direction; **S/D** stored or derived; **V** decidability; **S** sentences. “Independent” means deletion would remove behaviour not otherwise forced.

## ERF requirements

| ID | N | L | D | S/D | V | S | Verdict | Failing question | Why |
|---|---|---|---|---|---|---|---|---|---|
| ERF-1 | Independent | Mixed rule/definition | Workflow-ordered | Real check | Partly decidable | Functional | rewrite | Q3 | “MUST exist before any check runs” and the ordered “raw file… then extraction… then… normalization” specify workflow rather than the corpus state needed for a check. |
| ERF-2 | Independent | Mixed act/shape | Arrival-ordered | Stored provenance | History-dependent | Functional | rewrite | Q2, Q3, Q5 | It bundles an immutable-history duty, schema alternatives, and an unverifiable judgment that a remote location is mutable. |
| ERF-3 | Independent | Mixed shape/semantic | State-based | Stored | “One work” undecidable | Functional | rewrite | Q2, Q5 | The schema should own the source-list shape, while “one entry per work” requires an unformalized identity judgment no validator can make. |
| ERF-4 | Partly duplicated | Mixed schema/relation | State-based | Stored | Decidable | Functional | rewrite | Q2 | Reference resolution belongs in relational validation, while the source-status conditional is already said to be enforced by the schema. |
| ERF-5 | Partly duplicated | Definition | State-based | Stored | Legal meanings undecidable | Functional | move | Q2 | The schema owns the closed set and required reason; the remaining text defines the status values and belongs in section 5. |
| ERF-6 | Independent | Computation plus producer act | Tool-prescriptive | Real check | Act honestly attributed | Functional | rewrite | Q3 | Requiring “copying, a substring operation performed by a tool” assumes a particular production method when conformity only needs a quote that passes the defined test. |
| ERF-7 | Schema-forced | Schema shape | State-based | Stored | Decidable | Functional | retire | Q1 | **Deletion test:** `Source.citation_text` in the section-3 schema, marked here as *Shape*, still forbids the URL form; the rest is rationale. |
| ERF-8 | Independent | Semantic/rendering rule | State-based | Stored/rendered | Underspecified | Functional | rewrite | Q5 | “Everything the rendered string shows” and “Chicago, via CSL” do not identify a CSL style, locale, or deterministic comparison a validator can apply. |
| ERF-9 | Independent | Definition/judgment | State-based | Stored judgment | Not machine-decidable | Functional | move | Q2, Q5 | Most of the paragraph and table define `source_quality`; the MUST to assess two qualitative inputs is not a validator-decidable invariant. |
| ERF-10 | Independent | Assessment guidance | State-based | Stored judgment | Not machine-decidable | Functional | move | Q2, Q5 | It instructs a human how to grade discourse evidence and should be guidance attached to the vocabulary, not a machine-checkable MUST. |
| ERF-11 | Independent | Mixed storage/audit definition | State-based | Dubious prohibition | Partly undecidable | Functional | rewrite | Q4, Q5 | “Its result MUST NOT be stored” names no schema field, while whether an audit is a recomputable mechanism or a judgment cannot be inferred from the stored entry. |
| ERF-12 | Partly schema-forced | Mixed shape/act | Run-ordered | Stored judgment | Failures not observable | Contains surplus | rewrite | Q2, Q5, Q6 | The schema already owns the verdict enum, and “an audit that produced nothing did not happen” is neither verifiable nor a sound definition of an attempted audit. |
| ERF-13 | Independent | Identity/history rule | Mint-oriented but attributable | Stored id | History-decidable | Functional | keep | — | Permanence and non-reuse are legitimate historical obligations beyond the schema’s `Id` syntax. |
| ERF-14 | Independent | Semantic field rule | State-based | Stored | Not machine-decidable | Functional | rewrite | Q5 | A validator cannot determine when a fact was “true of” or whether the source supplied finer precision, so the MUST must be attributed to an authoring act or softened. |
| ERF-15 | Partly schema-forced | Mixed shape/identity | Move-oriented | Stored reference | Partly decidable | Functional | rewrite | Q2, Q3 | Bare-id syntax belongs to the schema, while “a claim moved between corpora” assumes a migration sequence and silently extends permanence beyond ERF-13’s atoms. |
| ERF-17 | Independent | Mixed shape/transfer policy | Change-oriented | Stored | Working-note claim undecidable | Functional | rewrite | Q2, Q3, Q5 | It mixes required corpus resolution with a transfer workflow and an unverifiable demand that the transfer be “explained in working notes.” |
| ERF-18 | Independent | Definition plus guidance | State-based | Stored prose | Semantic judgment | Contains unnumbered escape | move | Q2, Q5, Q6 | “Title states the claim” is definitional, the body restatement is writing guidance, and “no rule numbers it” is specification commentary rather than a rule or reason. |
| ERF-19 | Schema plus ERF-40 | Duplicate invariant | State-based | Stored | Decidable with history | Functional | retire | Q1 | **Deletion test:** the section-3 `StandingEntry` schema still forces a full instant, and ERF-40 still forces append-only history. |
| ERF-20 | Independent core | Producer guidance plus prohibitions | Ruling-time workflow | Prohibits undefined data | Partly historical | Functional | rewrite | Q3, Q4 | Keep the producer SHOULD, but remove “drift MUST NOT be stored there” and the count prohibition because the schema already fixes what `evidence_at_stance` can contain. |
| ERF-21 | Schema plus ERF-39 | Duplicate shape | State-based | Stored | Decidable | Functional | retire | Q1 | **Deletion test:** `StandingEntry.by` in the section-3 schema and ERF-39 still require a `human:` actor. |
| ERF-22 | Schema plus ERF-41 | Duplicate/definition | Mint-oriented | Names no field | Decidable only by guessed name | Functional | retire | Q1, Q4 | **Deletion test:** the closed claim schema has no disposition/state field and ERF-41 still requires disposition to be derived; the remaining minting text is definition or guidance. |
| ERF-23 | Independent core | Mixed model/semantic ban | State-based | Stored links | Rival-model ban undecidable | Functional | rewrite | Q2, Q5 | The claim fields are schema shape, while a validator cannot determine whether some separately authored claim was “modeled as” evidence against another. |
| ERF-24 | Independent | Mixed definitions/audit procedure | Audit-oriented | Real computation plus judgment | Mostly judgmental | Functional | rewrite | Q2, Q5 | It combines the definition of premise inputs with qualitative audit questions such as “does the conclusion follow?” that no corpus-only validator can decide. |
| ERF-25 | Independent | Audit guidance | State-based | Stored survey links | Claim-form judgment | Functional | rewrite | Q5 | Detecting a “universal negative” and deciding whether an audit treated it “as scoped” are semantic judgments, not machine-checkable MUSTs. |
| ERF-26 | Independent semantic rule | Mixed shape/guidance | Act-oriented | Stored search act | “Concrete” undecidable | Functional | rewrite | Q2, Q5 | Required fields belong to the schema, and whether `tool` names a sufficiently “concrete instrument” should be an attributed producer duty or SHOULD. |
| ERF-27 | Independent | Search-act obligation | Past-report oriented | Stored result | Not corpus-decidable | Functional | rewrite | Q5 | The corpus cannot prove that text is “as the instrument reported it” or that no unsupported precision was introduced. |
| ERF-28 | Independent | Several mixed rules | Re-run/edit oriented | Stored plus derived | Partly decidable | Broken wording | rewrite | Q2, Q3, Q6 | It combines immutability, naming advice, inheritance, editing and staleness, and “a re-run of the same sought” is not a grammatical sentence. |
| ERF-31 | Independent | Mixed binding grammar/relation/UI | State-based | Derived anchor check | Internally inconsistent | Functional | rewrite | Q2, Q5 | It first makes anchor occurrence a MUST, then orders validators to treat failure as only a flag, so the same condition is both non-conformance and conformance. |
| ERF-32 | Independent | Computation plus consumer duty | State-based | Real computation | Decidable when inputs defined | Functional | keep | — | The staleness comparison and the consumer’s explicit `indeterminate` presentation are attributable and testable from the available records. |
| ERF-33 | Independent | Consumer fidelity duty | State-based | No invented storage | Decidable | Functional | keep | — | A consumer can detect unresolved ids and can be tested for reporting, preservation and fabrication. |
| ERF-34 | Schema plus definitions | Shape/definition | State-based | Prohibits inapplicable fields | Decidable by schema | Functional | retire | Q1, Q4 | **Deletion test:** the section-3 `Narrative` schema and section-2 definition of `record` still distinguish narratives and exclude evidence, standings and disposition. |
| ERF-35 | Independent | Cross-record invariant | State-based | Stored references | Decidable | Functional | keep | — | It gives a usable current-versus-historical reference rule and a deterministic type-and-resolution test. |
| ERF-36 | Independent | Deployment invariant | State-based | Stored ids | Decidable over deployment | Functional | keep | — | Deployment-wide uniqueness is not expressible by the per-document schema and is directly checkable. |
| ERF-37 | Final state already forced | Producer workflow | Pre-write ordered | No new state | Act not observable | Functional | retire | Q1, Q3, Q5 | **Deletion test:** ERF-36 still requires the resulting deployment to have unique ids and ERF-38 still requires duplicate detection, regardless of what pre-write lookup was attempted. |
| ERF-38 | ERF-36 plus validator class | Duplicate validator duty | State-based | Stored ids | Decidable | Functional | retire | Q1 | **Deletion test:** ERF-36 supplies the machine-checkable MUST and the Validator conformance class already binds validators to every such MUST. |
| ERF-39 | Schema plus ERF-21 | Duplicate shape | State-based | Stored | Decidable | Functional | retire | Q1 | **Deletion test:** the `StandingEntry` schema still requires non-empty `why`, and ERF-21 plus that schema still require a `human:` actor. |
| ERF-40 | Independent | Historical invariant | State-based | Stored history | Decidable with held history | Functional | keep | — | Append-only status is a legitimate cross-version invariant, and ERF-63 requires sufficient history to check it. |
| ERF-41 | Independent core | Computation plus error handling | State-based | Real computation | Reporting subject unclear | Functional | rewrite | Q5 | The disposition algorithm is useful, but malformed entries cannot exist in a schema-valid model and “MUST be reported” does not say which conformance class reports them. |
| ERF-42 | Independent | Consumer semantic duty | State-based | Derived states | Testable presentation | Functional | keep | — | It defines the semantic distinction and imposes a concrete non-conflation duty on consumers. |
| ERF-43 | Independent | Graph invariant/flag | State-based | Real graph computation | Decidable | Functional | keep | — | Despite its density, closure, cycle, self-edge and retired-premise tests are all computable from a deployment. |
| ERF-44 | Independent | Graph storage invariant | State-based | Stored edge | Decidable | Functional | keep | — | A validator can canonicalize an unordered pair and detect a second stored `conflicts-with` edge. |
| ERF-47 | Independent | Derived-state rule | State-based | Real but underspecified | Not fully decidable | Functional | rewrite | Q5 | “The last change to what it judged” does not specify the dependency set for each audit, especially evidence audits over claims, atoms, surveys and premises. |
| ERF-48 | Independent | History/timestamp invariant | Edit-oriented | Stored timestamps | Contradictory ordering | Functional | rewrite | Q3, Q5 | Saying `last_modified` must be “later” while allowing the same date makes the ordering relation self-contradictory and dependent on an edit sequence. |
| ERF-50 | Result partly forced | Gate/workflow duty | Mint/transform ordered | Real quote check | Gate execution unobservable | Functional | rewrite | Q3, Q5 | Re-runnability can be a corpus-state rule, but whether a gate ran “at minting” or after a move cannot be decided from the resulting corpus. |
| ERF-51 | Independent | Computation plus authority policy | State-based | Real computation | Algorithm decidable | Authority contradiction | rewrite | Q6 | It says the conformance suite “bind[s] nothing” and later makes two case files normative and superior to the prose. |
| ERF-52 | Independent | Computation | State-based | Real computation | Decidable after repair | Sentence fragment/conflict | rewrite | Q6 | The stray sentence “(`ERF-51`) unless the quote holds the same blank line” duplicates and contradicts the preceding paragraph-separator rule. |
| ERF-53 | Independent core | Binding/store equivalence | State-based | Model versus bytes confused | Not fully decidable | Functional | rewrite | Q2, Q5 | Raw and normalized file bytes are not part of the section-3 JSON instance, so they cannot literally “round-trip through the model” as this rule requires. |
| ERF-54 | Independent core | Mixed model/file rule | State-based | Impossible for raw files | Contradictory scope | Functional | rewrite | Q2, Q4, Q5 | “Every file a corpus holds MUST self-describe with `type`” also covers held PDFs and normalized texts under section 7’s definition of file, which cannot carry ERF metadata. |
| ERF-55 | Partly schema-forced | Binding serialization | State-based | Stored wire details | Decidable per binding | Functional | move | Q2 | Empty-list omission is a wire-format choice and cannot be a model-wide rule for every possible binding; place its YAML spelling in the YAML binding. |
| ERF-56 | Independent | Binding-to-model mapping | State-based | Derived default | Decidable | Functional | keep | — | Materializing omitted list fields is a precise loading rule that reconciles wire omission with the total model. |
| ERF-57 | Independent | Consumer duty | State-based | Opaque preservation | Testable by round trip | Functional | keep | — | The tolerant-consumer obligations are attributable and can be checked with unknown-field and unknown-type examples. |
| ERF-58 | Schema-forced | Schema naming | State-based | Stored key | Decidable | Functional | retire | Q1 | **Deletion test:** the section-3 schema defines all event-time properties under the name `timestamp`; undefined bare alternatives are rejected by the closed definitions. |
| ERF-59 | Schema plus ERF-54 | Duplicate shape | State-based | Stored declaration | Decidable | Functional | retire | Q1 | **Deletion test:** `CorpusDeclaration` in the section-3 schema forces its required and optional fields, while ERF-54 still forces exactly one `type: corpus` file. |
| ERF-60 | Independent core | Consumer/validator version policy | Read-order assumption | Stored version | Mostly decidable | Functional | rewrite | Q2, Q3 | “Reads `spec_version` before anything else” assumes parser order, and the validator-specific branch should be separated from the consumer’s preservation/refusal rules. |
| ERF-61 | Independent semantics | Version policy plus shape | State-based | Stored version | Meaning-change test undecidable | Functional | rewrite | Q5 | SemVer syntax is schema-checkable, but no corpus validator can decide whether a release changed meaning enough to deserve a major increment. |
| ERF-62 | Independent | Deployment governance | Substrate-oriented | Derived projections | Not corpus-decidable | Functional | rewrite | Q3, Q5 | Neither “exactly one authoritative home” nor whether an index was “consulted as truth” is observable from an exchanged corpus. |
| ERF-63 | Independent core | Permission/guidance | Substrate-oriented | Stored history | Vague | Functional | move | Q2, Q5 | The examples are storage guidance, while the only normative point—availability of enough history for ERF-40—should be stated as a validator-input precondition. |
| ERF-65 | Independent | YAML parsing rule | State-based | Parsed scalar types | Decidable | Functional | keep | — | YAML 1.2 JSON-schema parsing and the mandatory quoting cases define an implementable byte-level binding. |
| ERF-66 | Independent | YAML syntax rule | State-based | Byte syntax | Decidable | False rationale | rewrite | Q6 | The prohibition is sound, but “a record is a flat structure” is false because the binding contains nested mappings and lists. |
| ERF-67 | Independent | Encoding/body binding | State-based | Byte syntax | Decidable | Functional | keep | — | UTF-8, LF, no BOM and CommonMark are precise binding-level requirements. |
| ERF-68 | Independent | Licence metadata/judgment | State-based | Stored | MUST legally undecidable | Functional | rewrite | Q5 | A validator cannot determine that text ships “under no licence as a short quotation,” while the SPDX recommendation is already honestly a SHOULD. |
| ERF-69 | Independent | Mixed source act/content/check | Pipeline-oriented | Stored plus real check | “Enough context” undecidable | Functional | rewrite | Q2, Q3, Q5 | It bundles excerpt metadata, an untestable sufficiency judgment, selector attribution, local raw-file checking and network retrieval into one requirement. |
| ERF-70 | Independent | Provenance plus tool-property rule | Pipeline-oriented | Stored steps | Determinism not corpus-decidable | Contains bare assertion | rewrite | Q3, Q5, Q6 | A source cannot prove that a named tool is deterministic or that omitted steps never happened, and “the extraction’s own output is not retained” is an unnumbered prohibition-like assertion. |
| ERF-71 | Independent | Provenance recommendation | State-based | Stored digest | Predicate mostly decidable | Functional | keep | — | It is appropriately a SHOULD and gives a concrete digest syntax and a reason for omission where bytes are unstable. |
| ERF-72 | Partly schema/ERF-57 | Extension policy | Version-lifecycle oriented | Stored extension | Decidable core | Contains editor process | rewrite | Q2, Q3, Q6 | Keep the `x_` producer/validator semantics, but remove duplicated shape and the unnormed “graduates” lifecycle for future specification editors. |

## YAML binding requirements

| ID | N | L | D | S/D | V | S | Verdict | Failing question | Why |
|---|---|---|---|---|---|---|---|---|---|
| YAMLB-1 | Independent | Binding grammar | State-based | Parsed marker | Grammar inconsistent | Functional prose | rewrite | Q5 | The grammar permits anchor content containing `-->`, while recognition terminates at the first `-->`, so some strings the grammar accepts can never be parsed as specified. |

# Section-prose sentences that are neither rules, definitions, nor reasons

The following are outside numbered requirements and do not state a rule, define a term, or explain the reason for a rule. Explicit worked-example content and code blocks are not repeated individually.

## SPEC.md

| Location | Sentence |
|---|---|
| Opening | “Specification, v0.9 (draft).” |
| Opening | “The abstract and status are in `README.md`; the change history is in `CHANGELOG.md`; how the format got this way is `docs/history.md`, the fields it draws on are `docs/influences.md`, what it deliberately does not do is `docs/purpose.md`, what was ruled out is `docs/non-goals.md`, and what it does not do yet is `docs/backlog/`.” |
| §1 | “The specification is written to be handed to an implementer (human or LLM) to build from, or diffed against an existing system requirement by requirement.” |
| §1, conformance | “Strict producers, tolerant consumers: divergence is caught by validators and surfaced, never by consumers refusing to read.” |
| §3.1 | “An index from field to the requirements that constrain it, by record type.” |
| §3.1, retrieval | “How records are found: atoms are retrieved by embedding `finding` and `quote`.” |
| §3.1, retrieval | “The finding is written to be checkable away from its source, which makes it the intended embedding target (this retrieval path is what replaced atom tags).” |
| §3.1, retrieval | “Claims are retrieved by `semantic_query`.” |
| §3.1, retrieval | “The mint-time evidence sweep runs a claim’s `semantic_query` against the deployment’s atom and source indexes in both directions: candidates for `atoms_for` and `atoms_against` alike.” |
| §3.2 | “The conventions that govern how future names are chosen are in `docs/history.md`; they bind whoever edits this specification, not an implementer reading it.” |
| §4 | “Each record type is stated the same way: what it is for, then how to write one well, then the numbered promises the format makes about it.” |
| §4 | “The guidance is advice and binds nothing; the numbered requirements are what conformance means.” |
| §4.1 | “A worked source entry is in the binding document (section 7).” |
| §4.1 guidance | “Where a source has no `citation` block, write `citation_text` as ‘Author, Title (venue, year), locator when it matters’; the upgrade path to exactness is the citation block.” |
| §4.1 guidance | “Take the raw file when you first read something.” |
| §4.1 guidance | “Legacy material is taken the next time it is read or used, and its atoms are minted then; a corpus is not retrofitted wholesale, because a file taken long after the reading is evidence about today’s page rather than about what was read.” |
| §4.2 | “One piece of evidence: a verbatim quote, a finding, and the trail.” |
| §4.2 | “A worked atom is in the binding document.” |
| §4.2 guidance | “The schema checks structure; it cannot check craft.” |
| §4.2 guidance | “A good finding is one sentence a stranger could check: it states what the quote shows rather than restating the quote, it names the actor and the time scope, and it hedges exactly as hard as the source does (‘states’, not ‘proves’).” |
| §4.2 guidance | “Compression is a defect.” |
| §4.2 guidance | “Redundancy that makes a finding checkable away from its context is doing work, not padding.” |
| §4.2 guidance | “Where `source_quality` is `medium` or `low`, put the reason in `limitations`, so a reader learns what is thin rather than only that something is.” |
| §4.3 | “A worked claim is in the binding document.” |
| §4.3 example commentary | “The example ships as a proposal: no one has stood behind it, so its `standings` ledger is empty and therefore omitted from the file (`ERF-55`), and its computed disposition is *proposal*.” |
| §4.3 example commentary | “The spec invents no standing entries in its examples: a stance is a real person’s recorded judgment, and there is none to show yet.” |
| §4.3 guidance | “A good claim statement reads as true-or-false standing alone: if a reader cannot disagree with the sentence, it is not a claim yet.” |
| §4.3 guidance | “Scope belongs in the title, which is why a claim needs no caveat field of its own.” |
| §4.3 guidance | “Three optional fields earn their place by use rather than by rule.” |
| §4.3 guidance | “For a bet, record the decision it licenses in the `why` of the `for` entry that backs it, and the outcome in the `why` of the `withdrawn` entry that ends it.” |
| §4.3 guidance | “A stance that decides something, meaning one that activates or contests a claim, is worth taking through a show-both-sides review individually.” |
| §4.3 guidance | “The cold-reader test applies to standings as much as to prose: does the recorded why survive the evidence on record?” |
| §4.4 guidance | “Run it on change rather than on a schedule: an atom added to either list, a cited atom modified, the statement edited.” |
| §4.4 guidance | “Staleness is computed (`ERF-47`), and between changes there is nothing to re-run.” |
| §4.5 | “A worked survey is in the binding document.” |
| §4.5 guidance | “How often a fruitful survey is re-run is a question for whoever runs the practice, not for the format.” |
| §4.5 guidance | “Describe the search in the body: what you were after, what surprised you, what you would search differently next time.” |
| §4.5 guidance | “A survey cited for an absence or a sparseness reading should close by stating its coverage bounds, what the acts did not cover and how deeply hits were inspected, because that is what a reader weighs when an absence is doing work.” |
| §4.5 guidance | “A complete search of a closed corpus correctly has nothing to state.” |
| §4.6 | “Whether a second document is also compiled from the bound claims, as a structured list a collaborator can dispute line by line, is a matter for whoever writes the narrative.” |
| §5 note | “Prior art goes the other way (CiTO defines forty citation relations); the working experience is that small vocabularies get used and large ones get skipped.” |
| §6, ERF-51 note-adjacent prose | “The 2026-08-25 trials then showed the three steps were necessary and not sufficient, which is where the format characters, the marker rule and the paragraph boundary came from; `CHANGELOG.md` has the measurements.” |
| §6 default-lenses note | “Tools are advised to return claims whose disposition is `active` unless a wider lens (proposals, contested, rejected, retired) is explicitly requested, so that consumers of one corpus share a worldview.” |
| §7 | “The YAML/Markdown binding, version 1 ([`bindings/yaml-markdown.md`](bindings/yaml-markdown.md), normative), is the interchange default: a producer that does not know its recipient’s binding ships that one.” |
| §7 history | “Rules that hold only for the default binding’s files live in its document: `ERF-65`, `ERF-66`, `ERF-67` and the file half of `ERF-53` moved there on 2026-08-25 keeping their ids, and the narrative binding’s spelling as an HTML comment is the binding’s own `YAMLB-1`.” |
| Related formats | “A five-territory survey of adjacent formats, with what each does and what it lacks, is in the companion document `docs/influences.md`; the systems it covers are listed in the informative references below.” |
| Related formats | “Two elements of this format appear in none of the surveyed systems: the standings ledger (append-only, per-person, reasoned, human-only, with dispositions computed), and the evidence primitive of a verbatim quote checked against an immutable copy of its source.” |
| Related formats | “One imported caution: CiTO’s forty typed citation relations failed of manual-annotation burden; this format’s four relations rely on machine proposal with human ruling to stay below that threshold.” |
| Security/privacy | “Process provenance is the leak-prone layer.” |
| Security/privacy | “Public cuts exclude working notes by default; the record’s epistemic fields are what travel.” |

## `bindings/yaml-markdown.md`

| Location | Sentence |
|---|---|
| Opening | “This one is the format’s first and its interchange default: a producer that does not know its recipient’s binding ships this one, and every corpus in this repository is held in it.” |
| Opening | “`SPEC.md` section 7 states what every binding must satisfy; this document states what this one does.” |
| ID history | “Rules that moved here from `SPEC.md` on 2026-08-25 keep the `ERF` ids they carried, so that nothing citing them breaks; they retire there and are never reused.” |
| ID history | “Rules that were always this binding’s own carry `YAMLB` ids, a flat sequence under the same discipline.” |
| §1 | “The source list’s top level is exactly `type` and `sources` (`ERF-3`):” |
| §1 history | “The nesting is written out because an earlier wording named both keys without saying which contained which, and an independent implementation read the entries as further top-level keys beside `type`.” |
| §1 | “That a canonical interchange form exists, and that a store may hold a corpus any other way provided it round-trips without loss, is `ERF-53` in `SPEC.md`.” |
| §1 | “That the form is this one is this section.” |
| §7 | “The records `SPEC.md` describes, as this binding writes them.” |
| §8 | “YAML was inherited from the working practice the format was extracted from, not chosen; `docs/history.md` records that no forcing instance stands behind it, alone among the format’s decisions.” |
| §8 | “A sourced survey of the case against it is at `reviews/2026-08-25-post-ruling-trials/yaml-markdown-case-against.md`.” |
| §8 | “Two cold implementations on 2026-08-25 found their parsers offered no way to select the JSON schema at all.” |
| §8 | “A pinned schema is a claim about the document, not about what a consumer will do to it, and a producer that quotes every string-typed scalar (section 3) is the only defence that travels with the file.” |
| §8 | “A second binding, over SQL, is drafted from the 2026-08-25 relational trial and is the proof that the model survives leaving this one.” |

# First ten changes, ranked

1. **Repair ERF-54’s scope.** Replace “Every file a corpus holds MUST self-describe with `type`” with a rule limited to ERF documents; explicitly exempt raw and normalized source artifacts.
2. **Repair ERF-31’s conformance contradiction.** Decide whether a missing anchor is a violation or a flag, then use that classification consistently.
3. **Delete the duplicated fragment in ERF-52.** Remove “(`ERF-51`) unless the quote holds the same blank line” and retain one exact paragraph-boundary rule.
4. **Fix ERF-51’s normative-authority conflict.** Either list the case files among the normative materials and define their versioning, or make them non-normative tests that cannot override prose.
5. **Rewrite ERF-53 around model data versus artifact bytes.** Define a corpus package or held-artifact manifest instead of claiming raw PDFs round-trip “through the model.”
6. **Split ERF-69 and ERF-70.** Separate metadata shape, producer-act obligations, deterministic checks, human judgments and optional retrieval guidance into independently testable requirements.
7. **Move wire-only omission rules out of ERF-55.** Put YAML empty-list and empty-mapping spelling in the YAML binding and leave only model-level extension policy in SPEC.md.
8. **Specify ERF-47’s dependency graph.** Enumerate exactly which timestamps make each `finding_audit`, `evidence_audit` and narrative binding stale.
9. **Remove workflow gates from ERF-1 and ERF-50.** State the required checkable corpus state and separately define any honestly attributed producer obligation.
10. **Retire the obvious schema and invariant duplicates.** Remove ERF-7, ERF-19, ERF-21, ERF-22, ERF-34, ERF-37, ERF-38, ERF-39, ERF-58 and ERF-59 using the deletion tests above.

