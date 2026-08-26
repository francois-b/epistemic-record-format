---
title: Rubric review
reviewer: Gemini 3.1 Pro (High) via agy
status: non-normative
last_updated: 2026-08-26
---

Here is the adversarial review of the specification, applying the rubric to every numbered requirement and evaluating the section prose for non-normative language.

### 1. Requirement Review

| # | 1. Necessity | 2. Locus | 3. Direction | 4. Stored/derived | 5. Decidability | 6. Sentences | Verdict | Failing Question | Why / Deletion test |
|---|---|---|---|---|---|---|---|---|---|
| `ERF-1` | No | Act | Order | N/A | Undecidable | Yes | rewrite | 3 | Assumes "before check runs" timeline; rewrite as a property of corpus state. |
| `ERF-2` | No | Act | Substrate | N/A | Undecidable | Yes | downgrade | 5 | Validator without substrate history cannot verify a file was "never an overwrite." |
| `ERF-3` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The JSON schema fully defines and forces the `SourceList` structure. |
| `ERF-4` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's `Atom` definition forces the source and absence conditional. |
| `ERF-5` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema forces the exact `status` vocabulary and required `reason`. |
| `ERF-6` | No | Act | Tool | N/A | Undecidable | Yes | rewrite | 5 | A validator can check verbatim match, but cannot check if it was "copied" vs generated. |
| `ERF-7` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The JSON schema's regex constraints prevent URLs in this field. |
| `ERF-8` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot decide if a citation "carries everything" canonically. |
| `ERF-9` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot evaluate the human judgment of a grading axis. |
| `ERF-10` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot computationally decide if judgment evaluated substance over utterance. |
| `ERF-11` | Schema | Computation | No | N/A | Yes | Yes | retire | 1 | A strict schema (`additionalProperties: false`) already forbids storing undeclared check fields. |
| `ERF-12` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's `Verdict` enum strictly enforces this exact set of values. |
| `ERF-13` | No | Shape | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot know if an ID was reused without historical deployment records. |
| `ERF-14` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot verify the historical real-world date a fact was true. |
| `ERF-15` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema specifies IDs as bare strings, structurally preventing encoded paths. |
| `ERF-17` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema strictly forces the `corpus` field on every record. |
| `ERF-18` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot computationally judge semantic alignment between title and claim. |
| `ERF-19` | `ERF-40` | Shape | No | N/A | Undecidable | Yes | merge | 1 | The append-only constraint is duplicated by `ERF-40`; timestamps are enforced by schema. |
| `ERF-20` | No | Act | Tool | N/A | Yes | Guidance | rewrite | 3 | Assumes a producer tool creates the stamp rather than defining the corpus state. |
| `ERF-21` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema regex pattern inherently enforces the `human:` string prefix. |
| `ERF-22` | Schema | Computation | No | Could store | Yes | Yes | retire | 1 | A strict schema lacking a state field completely forbids storing one. |
| `ERF-23` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot determine author intent (modeling evidence as a rival). |
| `ERF-24` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot verify the mental logic or question an auditor applied. |
| `ERF-25` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot evaluate if a human auditor properly scoped the negative. |
| `ERF-26` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's `SearchAct` completely enforces the `tool` and `query` fields. |
| `ERF-27` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot determine the precision the original search instrument yielded. |
| `ERF-28` | No | Act | Order | N/A | Undecidable | Yes | downgrade | 5 | A validator without history cannot verify immutability of past search acts. |
| `ERF-31` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator can verify anchors exist, but cannot detect missing bindings on assertions. |
| `ERF-32` | No | Duty | No | N/A | Yes | Yes | move | 2 | This is a display obligation on consumers, not a format property. |
| `ERF-33` | No | Duty | No | N/A | Yes | Yes | move | 2 | Duty on consumers regarding missing records belongs in a consumer section. |
| `ERF-34` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's definition of `Narrative` already functionally isolates it from records. |
| `ERF-35` | No | Duty | No | N/A | Yes | Yes | move | 2 | The requirement to "flag" instead of "fail" is a duty on the validator. |
| `ERF-36` | No | Computation | No | N/A | Yes | Yes | keep | None | This is a machine-checkable deployment-wide invariant. |
| `ERF-37` | No | Duty | Order | N/A | Yes | Yes | move | 2 | This is a strict operational duty on the producer class. |
| `ERF-38` | `ERF-36` | Duty | No | N/A | Yes | Yes | merge | 1 | Duplicates the invariant established in `ERF-36` as a validator duty. |
| `ERF-39` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema enforces human strings and non-empty arrays/lengths natively. |
| `ERF-40` | No | Computation | Substrate | N/A | Undecidable | Yes | rewrite | 3 | Directly assumes a substrate with history exists to verify append-only rules. |
| `ERF-41` | Schema | Computation | No | Could store | Yes | Yes | retire | 1 | A strict schema with no `disposition` field already forces it to never be stored. |
| `ERF-42` | No | Duty | No | N/A | Yes | Yes | move | 2 | This dictates presentation rules for consumers, not format validity. |
| `ERF-43` | No | Computation | No | N/A | Yes | Yes | keep | None | Computable graph invariant checking closure and cycles. |
| `ERF-44` | No | Computation | No | N/A | Yes | Yes | keep | None | Checkable structure constraint on bidirectional edge recording. |
| `ERF-47` | Schema | Computation | No | Could store | Yes | Yes | retire | 1 | A strict schema without a staleness field inherently forces it to be computed. |
| `ERF-48` | No | Computation | Order | N/A | Undecidable | Yes | downgrade | 5 | A validator without file history cannot verify correctly advancing modification stamps. |
| `ERF-50` | No | Act | Order | N/A | Yes | Yes | rewrite | 3 | Enforces process ("run as a gate at minting") rather than a state invariant. |
| `ERF-51` | No | Computation | No | N/A | Yes | Yes | keep | None | Highly specific and checkable baseline for text normalization. |
| `ERF-52` | No | Computation | No | N/A | Yes | Yes | keep | None | Objective mechanical omission check constraint. |
| `ERF-53` | No | Definition | Substrate | N/A | Yes | Yes | rewrite | 3 | Assumes database storage and mappings outside the canonical interchange bounds. |
| `ERF-54` | No | Duty | No | N/A | Yes | Yes | move | 2 | Mixes structural constraints with explicit consumer duties ("MUST ignore it"). |
| `ERF-55` | Schema | Serialization | No | N/A | Yes | Yes | retire | 1 | Schema `additionalProperties: false` fully blocks undefined fields. |
| `ERF-56` | No | Duty | No | N/A | Yes | Yes | move | 2 | Instructing readers to materialize lists is a consumer/reader duty. |
| `ERF-57` | No | Duty | No | N/A | Yes | Yes | move | 2 | Instructing consumers to preserve unknown fields is a consumer duty. |
| `ERF-58` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema dictionaries natively restrict this key solely to `timestamp`. |
| `ERF-59` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's `CorpusDeclaration` inherently requires and types these properties. |
| `ERF-60` | No | Duty | No | N/A | Yes | Yes | move | 2 | Regulates how consumers and validators handle versions. |
| `ERF-61` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | The schema's regex fully validates standard Semantic Versioning. |
| `ERF-62` | No | Definition | Network | N/A | Yes | Yes | rewrite | 3 | Prescribes network topology and index behavior rather than corpus structure. |
| `ERF-63` | No | Definition | Substrate | N/A | Yes | Guidance | move | 2 | This is non-normative advice on infrastructure choices. |
| `ERF-65` | No | Serialization | Tool | N/A | Yes | Yes | move | 2 | Directly mixes serialization rules with producer behavior and validator responses. |
| `ERF-66` | No | Serialization | No | N/A | Yes | Yes | keep | None | Checkable file parsing requirement. |
| `ERF-67` | No | Serialization | No | N/A | Yes | Yes | keep | None | Checkable file encoding requirement. |
| `ERF-68` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | Schema conditionally correlates the shipped status and licence fields. |
| `ERF-69` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator without the original raw file cannot verify substring fidelity. |
| `ERF-70` | No | Act | No | N/A | Undecidable | Yes | downgrade | 5 | A validator cannot verify if a named external extraction tool is deterministic. |
| `ERF-71` | No | Shape | No | N/A | Yes | Yes | keep | None | Checkable hash recording standard. |
| `ERF-72` | Schema | Shape | No | N/A | Yes | Yes | retire | 1 | Schema natively permits and enforces `^x_` extension properties. |
| `YAMLB-1`| No | Serialization | No | N/A | Yes | Yes | keep | None | Strict rendering rule for markup encoding. |

---

### 2. Section-Prose Review (The "Sentence" Test)

The following paragraphs contain sentences that fail the prose test: they neither state a rule, define a term, nor give a reason for one. They contain un-enforceable guidance, meta-text, or sentences that are structurally not sentences.

**From the Abstract:**
> "Specification, v0.9 (draft). The abstract and status are in README.md; the change history is in CHANGELOG.md; how the format got this way is docs/history.md, the fields it draws on are docs/influences.md, what it deliberately does not do is docs/purpose.md, what was ruled out is docs/non-goals.md, and what it does not do yet is docs/backlog/."
*(Fails test: Navigational metatext; the first phrase lacks a verb).*

**From Section 1 (Scope and conformance):**
> "Strict producers, tolerant consumers: divergence is caught by validators and surfaced, never by consumers refusing to read."
*(Fails test: Conversational rhetoric masquerading as a rule; missing a primary verb in the first clause).*

**From Section 3 (Data model):**
> "What a schema cannot say lives in sections 4 to 7: anything about more than one record (references resolving, ids unique, the premise relation acyclic), anything computed rather than stored (disposition, staleness, the quote check), and every obligation on an act (verbatim, as the instrument reported it, only a person takes a stance). Those are the format's argument, and they are prose because no notation checks them."
*(Fails test: Editorial justification for the document's layout, not a rule).*

**From Section 3.2 (Naming):**
> "Field names are snake_case alike: serialization fidelity outranks TypeScript idiom, so every example stays copy-pasteable between this document and a file."
*(Fails test: An editorial rule for the authors of the specification, not a format requirement).*

**From Section 4 (Record types):**
> "Each record type is stated the same way: what it is for, then how to write one well, then the numbered promises the format makes about it. The guidance is advice and binds nothing; the numbered requirements are what conformance means."
*(Fails test: Metatext explaining the document structure).*

**From Section 4.1 (The source):**
> "Where a source has no citation block, write citation_text as "Author, Title (venue, year), locator when it matters"; the upgrade path to exactness is the citation block."
*(Fails test: Subjective authoring guidance).*

> "Take the raw file when you first read something. Legacy material is taken the next time it is read or used, and its atoms are minted then; a corpus is not retrofitted wholesale, because a file taken long after the reading is evidence about today's page rather than about what was read."
*(Fails test: Prescribes human workflow and timeline choices).*

**From Section 4.2 (The atom):**
> "Writing one well. The schema checks structure; it cannot check craft. A good finding is one sentence a stranger could check: it states what the quote shows rather than restating the quote, it names the actor and the time scope, and it hedges exactly as hard as the source does ("states", not "proves"). Compression is a defect. Redundancy that makes a finding checkable away from its context is doing work, not padding."
*(Fails test: First phrase is not a sentence. The rest is pure subjective authoring advice).*

> "Where source_quality is medium or low, put the reason in limitations, so a reader learns what is thin rather than only that something is."
*(Fails test: Operational authoring guidance).*

**From Section 4.3 (The claim):**
> "A statement that can be true or false, one a person could stand behind or dispute. One record per claim."
*(Fails test: Neither are complete sentences).*

> "The example ships as a proposal: no one has stood behind it, so its standings ledger is empty and therefore omitted from the file (ERF-55), and its computed disposition is proposal. The spec invents no standing entries in its examples: a stance is a real person's recorded judgment, and there is none to show yet."
*(Fails test: Metatext discussing the specification's own example files).*

**From Section 4.4 (The backing audit):**
> "Run it on change rather than on a schedule: an atom added to either list, a cited atom modified, the statement edited."
*(Fails test: Unenforceable operational guidance, missing a subject).*

**From Section 4.5 (The survey):**
> "Writing one well. How often a fruitful survey is re-run is a question for whoever runs the practice, not for the format. Describe the search in the body: what you were after, what surprised you, what you would search differently next time."
*(Fails test: "Writing one well" is not a sentence. The rest is operational guidance/best practices).*

**From Section 5 (Vocabularies):**
> "Closed sets. A value outside them is a validation failure, not a dialect."
*(Fails test: "Closed sets." is not a sentence).*

**From Section 6 (Invariants):**
> "All machine-checkable. Types express what types can express; the validator checks the relations no type can see."
*(Fails test: "All machine-checkable." is not a sentence. The rest is a philosophical statement).*

**From YAMLB-1 Section 7 (Worked examples):**
> "The records SPEC.md describes, as this binding writes them."
*(Fails test: Not a sentence).*

---

### 3. Top Ten Changes (Ranked)

1. **Purge schema redundancies:** Retire all MUST/MUST NOT clauses that are already guaranteed by a strict JSON schema (`additionalProperties: false`, required arrays, specific enums). If the schema enforces it, repeating it in prose creates synchronization hazards.
2. **Isolate conformance classes:** Move all "MUST reject", "MUST preserve", and "MUST flag" rules out of the format model entirely and into dedicated `Consumer` and `Validator` sections. The format defines what bytes mean; the classes define how software behaves.
3. **Downgrade cognitive MUSTs to SHOULDs:** Demote untestable mental acts (e.g., "MUST be assessed against the substance", "MUST ask the question") to SHOULDs or move them to an Authoring Guide. Validators cannot read minds.
4. **Remove timeline/order assumptions:** Rewrite constraints that assume a specific sequence of work (e.g., "before any check runs", "gate at minting"). A format validator can only evaluate the exact state of the bytes in front of it.
5. **Decouple from substrates:** Remove rules that mandate "immutability", "append-only history", or "authoritative homes" (e.g., `ERF-40`, `ERF-62`). A portable text format cannot enforce properties of the database or version control system hosting it.
6. **Move guidance to a separate document:** Extract all "Writing one well" headers, subjective definitions of craft, and workflow recommendations into a non-normative best practices guide.
7. **Merge duplicate invariants:** Combine duplicated structural constraints (e.g. `ERF-36` and `ERF-38`, `ERF-19` and `ERF-40`) into single, clear data-model requirements.
8. **Fix sentence fragments and metatext:** Strip navigational metatext, conversational filler, and non-sentences out of normative sections to satisfy the specification's own prose standards.
9. **Remove "never stored" rules for undeclared fields:** Stop explicitly forbidding the storage of computed properties (like `staleness` or `disposition`). If the format is strictly defined, whatever is not allowed is already forbidden.
10. **Formally define flag severity:** Explicitly codify the operational difference between "violations" and "flags" in the validator return type, as the text currently relies on flags for normal lifecycle events (like breaking bindings) but lacks a structural error-reporting model.
