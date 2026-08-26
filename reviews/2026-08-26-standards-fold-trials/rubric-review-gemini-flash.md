---
title: Rubric review
reviewer: gemini-3.5-flash via mods
status: non-normative
last_updated: 2026-08-26
---

# Cold Review: The Epistemic Record Format Specification

This is a cold-reader review of the Epistemic Record Format (ERF) specification and its YAML/Markdown binding. The analysis applies the rubric to each requirement in numerical ID order, evaluates the section-prose paragraphs for narrative and structural drift, and lists ten critical changes to harden the specification.

---

## 1. Requirement Review Table

| ID | Necessity (Q1) | Locus (Q2) | Direction (Q3) | Stored / Derived (Q4) | Decidability (Q5) | Sentences (Q6) | Verdict | Failing Q | Why & Deletion Test (for Retire) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ERF-1** | Necessary | Act | Assumes workflow | Stored | Decidable | Normative | **rewrite** | 3 | "MUST exist before any check runs" dictates process ordering rather than corpus state. |
| **ERF-2** | Necessary | Shape/Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | External raw file immutability cannot be verified from the current static file state alone. |
| **ERF-3** | Redundant | Shape | State | Stored | Decidable | Mixed | **retire** | 1 | *Deletion test:* Enforced by the `sources` mapping definition in `erf.schema.json`. |
| **ERF-4** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Schema enforces existence of `Atom.source`, and `ERF-35` validates referential integrity. |
| **ERF-5** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Enforced by schema nested validation properties on `Source` types. |
| **ERF-6** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | A validator cannot check whether a human/tool used copy-paste or recompiled/typed a quote. |
| **ERF-7** | Necessary | Shape | State | Stored | Decidable | Fluff | **rewrite** | 6 | The final sentence is an informative statement about real-world conditions rather than a rule. |
| **ERF-8** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | A validator cannot verify if a citation block covers "everything" present in a rendered text string. |
| **ERF-9** | Redundant | Guidance | State | Stored | Undecidable | Mixed | **move** | 2 | These qualitative cognitive criteria for human grading belong in Section 2 (Definitions) or Section 4.1 guidance. |
| **ERF-10** | Necessary | Guidance | State | Stored | Undecidable | Normative | **rewrite** | 5 | Evaluative assertions about grading "against substance" are completely undecidable by a validator. |
| **ERF-11** | Necessary | Act | State | Derived | Decidable | Fluff | **rewrite** | 6 | Contains non-normative consumer guidance on comparing model versions and a definition for "auditor". |
| **ERF-12** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* The `Verdict` closed enum is strictly validated directly by `erf.schema.json` under `finding_audit.verdict`. |
| **ERF-13** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Format is validated by the client’s regex patterns on the `Id` definition in `erf.schema.json`. |
| **ERF-14** | Redundant | Shape | State | Stored | Decidable | Guidance | **retire** | 1 | *Deletion test:* Date patterns and boundaries are fully validated under the schema’s `AsOfDate` definition. |
| **ERF-15** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-17** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Field presence is checked directly by `erf.schema.json` validating individual record types. |
| **ERF-18** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | A validator cannot programmatically determine whether a title or body text accurately "states a claim." |
| **ERF-19** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Timestamps format is checked by schema (`format: date-time`); append-only validation is governed by `ERF-40`. |
| **ERF-20** | Necessary | Act | State | Derived | Undecidable | Fluff | **rewrite** | 6 | Contains design-rationale justifications explaining why count digests are unacceptable. |
| **ERF-21** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* The schema strictly limits the structural prefix of the `by` field using `human:` regex rules. |
| **ERF-22** | Redundant | Shape | State | Derived | Decidable | Fluff | **retire** | 1 | *Deletion test:* Schema limits record structures and allows no arbitrary state fields (`additionalProperties: false`). |
| **ERF-23** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-24** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | A validator cannot programmatically determine what a human reviewer or AI model "asked." |
| **ERF-25** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | Evaluative guidelines on how a negative claim is framed and audited is a matter of practice, not file syntax. |
| **ERF-26** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | Assertions about "concreteness" of a tool name cannot be syntactically verified. |
| **ERF-27** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | Checking whether `hits_reported` has false precision is impossible without backend query engine integration. |
| **ERF-28** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | The requirement for the title to state what was sought is semantic and not decidable. |
| **ERF-31** | Necessary | Shape/Act | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-32** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-33** | Necessary | Class Duty | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-34** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* The allowed fields on Narratives are strictly governed by the validation schema. |
| **ERF-35** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-36** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-37** | Necessary | Act | Assumes workflow | Stored | Undecidable | Normative | **rewrite** | 3 | Prescribes a process workflow ("verify ... before writing") instead of specifying output corpus state. |
| **ERF-38** | Redundant | Computation | State | Derived | Decidable | Normative | **retire** | 1 | *Deletion test:* Duplicate detection is already fully covered by Validator conformance requirements under `ERF-36`. |
| **ERF-39** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Imposed directly by patterns and minimum length keys on the schema's `StandingEntry`. |
| **ERF-40** | Necessary | Act | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-41** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-42** | Necessary | Class Duty | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-43** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-44** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-47** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-48** | Necessary | Act | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-50** | Redundant | Act | Assumes workflow | Stored | Decidable | Normative | **rewrite** | 3 | Dictates that tests must be run during events ("at minting" or "after any transform") rather than validating the final corpus. |
| **ERF-51** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-52** | Necessary | Computation | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-53** | Necessary | Shape | State | Stored | Decidable | Fluff | **rewrite** | 6 | Contains explanatory comments about why "every file" is required. |
| **ERF-54** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-55** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Enforced by `additionalProperties: false` structures and minimum array parameters in `erf.schema.json`. |
| **ERF-56** | Necessary | Class Duty | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-57** | Necessary | Class Duty | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-58** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* The JSON schema forces the exact field keys across all objects. |
| **ERF-59** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* Enforced by design patterns inside the schema defining `CorpusDeclaration`. |
| **ERF-60** | Necessary | Class Duty | State | Derived | Decidable | Normative | **keep** | None | |
| **ERF-61** | Redundant | Shape | State | Stored | Decidable | Normative | **retire** | 1 | *Deletion test:* The schema bounds spec_version formatting using standard semver regex properties. |
| **ERF-62** | Necessary | Substrate | State | Derived | Undecidable | Normative | **rewrite** | 5 | Validator cannot identify if its target represents the logical "authoritative home." |
| **ERF-63** | Necessary | Substrate | State | Derived | Decidable | Guidance | **move** | 2 | Discusses database/git architectures and belongs in Section 8 intro. |
| **ERF-65** | Necessary | Shape | State | Stored | Decidable | Fluff | **rewrite** | 6 | Contains explanatory history about YAML 1.1 timezone objects and weekdays. |
| **ERF-66** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-67** | Necessary | Shape | State | Stored | Decidable | Fluff | **rewrite** | 6 | Includes explanatory arguments advocating for CommonMark and discussing JSON schema constraints. |
| **ERF-68** | Redundant | Act | State | Stored | Undecidable | Normative | **rewrite** | 1 | *Deletion test:* The schema already implements `Source.licence` and limits `Source.status` validations conditionals. |
| **ERF-69** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | Programmatic analysis cannot evaluate semantic concepts of clarity like "legibility." |
| **ERF-70** | Necessary | Act | State | Stored | Undecidable | Normative | **rewrite** | 5 | The runtime determinism of foreign binaries is undecidable from the corpus directory tree. |
| **ERF-71** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **ERF-72** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |
| **YAMLB-1** | Necessary | Shape | State | Stored | Decidable | Normative | **keep** | None | |

---

## 2. Section Prose Review

The following section-prose paragraphs contain sentences that neither state a rule, define a term, nor give the reason for one. They contain historical commentary, best-practice recommendations, rhetorical coaching, or fragments that are not sentences.

### SPEC.md

1. **Introductory Paragraph**:
   * *Quoted Sentence:* "The abstract and status are in `README.md`; how the format got this way is `docs/history.md`, the fields it draws on are `docs/influences.md`, what it deliberately does not do is `docs/purpose.md`, what was ruled out is `docs/non-goals.md`, and what it does not do yet is `docs/backlog/`."
   * *Why:* This is a directory reference sheet explaining where non-normative repository history files sit; it states no rules.
2. **"What is normative" Paragraph**:
   * *Quoted Sentence:* "Everything else in this repository, the reference implementation, the conformance suite and its case files, the type rendering, the trials and the history, is an instrument or a record and binds nothing."
   * *Why:* This is an advisory negative disclaimer about external repository directories rather than a ruleset or a definition.
3. **Section 1 (Scope and conformance) - Paragraph 1**:
   * *Quoted Sentence:* "What was done about any of it (decisions, actions, outcomes) is out of scope: a neighboring system may consume these records, and an activated bet plus its standing entries covers the common case."
   * *Why:* Explains neighboring systems and spec borders instead of defining properties, rules, or reasons for the data format.
4. **Section 1 (Scope and conformance) - Paragraph 2**:
   * *Quoted Sentence:* "The specification is written to be handed to an implementer (human or LLM) to build from, or diffed against an existing system requirement by requirement."
   * *Why:* Purely meta-narrative speculation on target audience workflows.
5. **Section 1 - Conformance Classes, "Consumer" Item**:
   * *Quoted Sentence:* "(the same stance the Open Knowledge Format takes)"
   * *Why:* Non-normative citation pointing to historical external influences.
6. **Section 1 - Conformance Classes, "Validator" Item**:
   * *Quoted Sentence:* "The list illustrates the duty and does not bound it: a tool that never opens a normalized text or parses a narrative binding is not a validator."
   * *Why:* Implements conversational rhetoric to coach implementers on programmatic obligations.
7. **Section 1 - Conformance Classes, "Validator" Item (again)**:
   * *Quoted Sentence:* "Strict producers, tolerant consumers: divergence is caught by validators and surfaced, never by consumers refusing to read."
   * *Why:* This is a slogan and a grammatical fragment that acts as a heading rather than a sentence.
8. **Section 3 (Data model) - Paragraph 1**:
   * *Quoted Sentence:* "Those are the format's argument, and they are prose because no notation checks them."
   * *Why:* This is historical and philosophical commentary explaining why sections are drafted in prose.
9. **Section 3 (Data model) - Paragraph 3**:
   * *Quoted Sentence:* "`types/erf.ts` is a TypeScript rendering of the schema for the reference implementation, held to it by a gate, and is not normative."
   * *Why:* Refers to a specific language-binding file helper inside the surrounding directory.
10. **Section 3.1 (Field Reference) - Header**:
    * *Quoted Sentence:* "An index from field to the requirements that constrain it, by record type."
    * *Why:* This is a structural heading phrase, completely lacking a finite verb.
11. **Section 3.1 - Post-Table Paragraph**:
    * *Quoted Sentence:* "(this retrieval path is what replaced atom tags)."
    * *Why:* Explains historical design migrations that occurred in older drafts of the specification.
12. **Section 4.1 (The Source) - Paragraph 1**:
    * *Quoted Sentence:* "The format never reads a raw file at check time."
    * *Why:* Assumes execution-behavior profiles for compliant validator software.
13. **Section 4.1 (The Source) - Paragraph 3**:
    * *Quoted Sentence:* "A corpus is not retrofitted wholesale, because a file taken long after the reading is evidence about today's page rather than about what was read."
    * *Why:* Design-process tips directing developers on manual archival timing.
14. **Section 4.2 (The Atom) - Guidance Paragraph**:
    * *Quoted Sentence:* "The schema checks structure; it cannot check craft."
    * *Why:* Narrative prose advising on text quality; no definitions or rules are stated.
15. **Section 4.3 (The Claim) - Guidance Paragraph**:
    * *Quoted Sentence:* "A good claim statement reads as true-or-false standing alone: if a reader cannot disagree with the sentence, it is not a claim yet."
    * *Why:* Editorial advice warning claims authors about semantic phrasing style.
16. **Section 4.3 (The Claim) - Guidance Paragraph (again)**:
    * *Quoted Sentence:* "The cold-reader test applies to standings as much as to prose: does the recorded why survive the evidence on record?"
    * *Why:* This is a rhetorical prompt inviting the reader to self-evaluate.
17. **Section 4.4 (Backing Audit) - Paragraph 2**:
    * *Quoted Sentence:* "Run it on change rather than on a schedule: an atom added to either list, a cited atom modified, the statement edited."
    * *Why:* Standard operations scheduler recommendation, not linked to validating corpus state.
18. **Section 4.6 (Narrative and its narrative bindings) - Paragraph 1**:
    * *Quoted Sentence:* "Prose alone has a problem: assertions live inside sentences, so nothing marks what a passage commits to; the writer re-derives old reasoning..."
    * *Why:* Problem definition statement explaining why the format introduced bindings, rather than setting bounds on the format itself.
19. **Section 5 (Vocabularies) - Guidance after first bullet list**:
    * *Quoted Sentence:* "`edges` means claim-to-claim and carries no other record type, which is what keeps the vocabulary honest: a relation that would need a different kind of target is a different field, not a fifth relation."
    * *Why:* Philosophical design justifications justifying field isolation decisions.

### bindings/yaml-markdown.md

20. **Section 7 (Worked Examples) - Paragraph 1**:
    * *Quoted Sentence:* "The records `SPEC.md` describes, as this binding writes them."
    * *Why:* Fragment sentence serving as a guide to code snippets without a main verb.
21. **Section 8 (What this binding costs) - Paragraph 1**:
    * *Quoted Sentence:* "YAML was inherited from the working practice the format was extracted from, not chosen; `docs/history.md` records that no forcing instance stands behind it, alone among the format's decisions."
    * *Why:* Project legacy justification; explains project baggage instead of formal data mechanics.

---

## 3. Ten Ranked Changes First

These ten changes will make the specification structurally bulletproof, fully decidable, and clear of redundant validation states.

### 1. Decouple Invariant Validation from VCS History (ERF-40 & ERF-48)
* **Problem:** Invariants mandate checking if transactions are append-only or assessing historical edit-timestamps (`created` vs `last_modified`) against Git revision histographies.
* **Solution:** Redefine structural check parameters so they assess only the static folder or database payload passed to the Validator at run time. Remove active analysis of filesystem version control state from the core Validator Class.

### 2. Formally Retire Redundant Prose Schema Validations
* **Problem:** Prose requirements (`ERF-3`, `ERF-4`, `ERF-5`, `ERF-12`, `ERF-13`, `ERF-14`, `ERF-17`, `ERF-19`, `ERF-21`, `ERF-22`, `ERF-34`, `ERF-39`, `ERF-55`, `ERF-58`, `ERF-59`, `ERF-61`) replicate structural parsing rules managed cleanly by schema objects, risking future alignment drift.
* **Solution:** Strip these requirements from the prose specification. Delegate structural validation responsibility strictly to `erf.schema.json` via continuous pipeline rules.

### 3. Downgrade Human Logic Constraints to SHOULDs or Guidance
* **Problem:** Requirements `ERF-6`, `ERF-10`, `ERF-18`, `ERF-24`, `ERF-26`, `ERF-27`, `ERF-28`, and `ERF-69` set machine-undecidable "MUST" rules on whether a text states a claim, whether an excerpt is legible, or what cognitive question an auditor asked.
* **Solution:** Rewrite these rules into structural metrics, transition them to "SHOULD" guidelines, or label them explicitly as offline conceptual review constraints.

### 4. Transition Procedural Warnings to Declarative Static States
* **Problem:** Requirements `ERF-1`, `ERF-37`, and `ERF-50` define time-dependent process steps (e.g. "must exist before checks run", "verify before writing", "run as a gate") rather than checking the final file output.
* **Solution:** Reframe all verification steps as evaluations on the static, compiled file index, checking features regardless of system workflow orchestration or author runtime state.

### 5. Explicitly Solve the YAML Duplicate Key Exploit (ERF-66)
* **Problem:** `ERF-66` correctly bars duplicate keys in frontmatter, but standard parser instances silently merge duplicate YAML keys without triggering execution errors.
* **Solution:** Specify that Validators must process frontmatter using *event-based* YAML streaming parsers that abort execution immediately upon finding matching key nodes.

### 6. Replace DB Typographic Loss Rules with Hard String Casting (ERF-53)
* **Problem:** DB layers with float engine coercion can silently convert standard citation integers into float equivalents (e.g., `36` becomes `36.0`), which fails the literal "no loss" rule.
* **Solution:** Require that any field in the CSL or Citation schema susceptible to numerical precision loss must be evaluated and stored strictly as a JSON string literal.

### 7. Relocate Prose Guide Sections to Informative Appendices
* **Problem:** "Writing one well" blocks and evaluation examples are interleaved within active normative requirement lists, obscuring core system boundaries.
* **Solution:** Extract all writing guidance, non-normative context, and architectural definitions, putting them in an Informative Appendix clearly separated from system logic.

### 8. Translate Custom Hyphenation Boundaries to Regex DFA Specs (ERF-52)
* **Problem:** The word hyphenation exception ("a hyphen between characters does not break a word") is declared in plain text, risking variant implementations across standard word segmentation libraries.
* **Solution:** Provide the exact regex or DFA state transitions matching UAX #29 standard notation to ensure deterministic cross-language output.

### 9. Segregate Narrative Comment Capture Boundaries (YAMLB-1)
* **Problem:** The narrative token captures generic HTML comment markers (`<!-- claims: ... -->`), which can result in greedy parsers consuming subsequent unrelated comments.
* **Solution:** Enforce a strict single-line scan limit or use explicit non-greedy parsing specifications on the comment terminator (`-->`) in narrative scans.

### 10. Abstract SPDX/Licence Existence Validations (ERF-68)
* **Problem:** A validator cannot verify if a license is a valid "SPDX identifier where one exists" without a network request or an embedded, static SPDX identifier list.
* **Solution:** Define an explicit, offline SPDX schema pattern matching array, and downgrade the "SPDX license check" to a validator warning flag rather than a critical violation failure.

