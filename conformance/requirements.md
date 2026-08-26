---
title: "The requirement index"
purpose: "Every numbered requirement in one table: what it says, which conformance class binds it where a document says so, and what defends it."
status: non-normative
generated: 2026-08-26
model: claude-opus-5
---

# The requirement index

**Generated. Never edit this file by hand.** It is derived from `SPEC.md`,
`serialization/yaml-markdown.md` and `coverage.yaml`, which are the three places a
requirement's text, its home and its coverage actually live. Regenerate with:

```
python3 tools/requirements-index.py
```

The gist column is the requirement's opening, trimmed. It is a finding aid and
not the requirement: what binds is the full text, which each id links to.

The class column is filled only where a document names the class, either in
`SPEC.md` section 1 or in the requirement's own wording. A blank means no
document says, not that no class applies. Every requirement binds the
Validator class to the extent it is machine-checkable, which is why that class
is not repeated down the column.

49 requirements.

| id | gist | class | what defends it |
|---|---|---|---|
| [`ERF-73`](../SPEC.md#erf-73) | Every document a corpus holds MUST validate against `erf.schema.json`, with its body attached as `body` where the model has one. |  | `schema`, `fixtures/invalid/absence-without-reason`, `fixtures/invalid/citation-text-carries-url`, `fixtures/invalid/manifest-missing-field`, `fixtures/invalid/narrative-created-is-a-bare-date`, `fixtures/invalid/standing-bare-date`, `fixtures/invalid/standing-bare-date-block-style`, `fixtures/invalid/stored-state-field`, `fixtures/invalid/unknown-field-originated`, `fixtures/invalid/reference-encodes-location`, `fixtures/invalid/source-entries-at-top-level` |
| [`ERF-1`](../SPEC.md#erf-1) | Every check MUST run against a source's *normalized text*, never the live web, so a source without one has no verdict. |  | `quote-check` |
| [`ERF-2`](../SPEC.md#erf-2) | A producer MUST treat a raw file as immutable: a revision arriving later MUST be a new source, never an overwrite. | Producer | untestable by design: how a capture is made and dated is a producer practice, not a property of a loaded record |
| [`ERF-68`](../SPEC.md#erf-68) | A source whose normalized text ships SHOULD name the licence that permits it as an SPDX identifier where one exists… |  | uncovered: no fixture ships a capture without an SPDX identifier |
| [`ERF-69`](../SPEC.md#erf-69) | A producer MAY hold a source's normalized text as an excerpt of the work rather than a whole copy, and MUST then record who selected it and when (`excerpt`). | Producer | `fixtures/valid/excerpt-in-passages`, `fixtures/invalid/quote-crosses-an-excerpt-gap` |
| [`ERF-70`](../SPEC.md#erf-70) | Where normalized text was produced from a raw file in another format, a producer MUST name the extracting tool and its… | Producer | `fixtures/invalid/pdf-without-extraction` |
| [`ERF-71`](../SPEC.md#erf-71) | A source whose normalized text is an excerpt or a conversion SHOULD carry `received.digest`, the cryptographic digest… |  | `fixtures/invalid/digest-mismatch` |
| [`ERF-6`](../SPEC.md#erf-6) | A producer MUST write the `quote` verbatim from the source's normalized text. | Producer | `quote-check` |
| [`ERF-8`](../SPEC.md#erf-8) | A producer that writes `citation` makes it canonical: it SHOULD carry everything the rendered `citation_text` string… | Producer | untestable by design: whether a rendered citation carries everything its structured form holds is a judgment about bibliographic completeness |
| [`ERF-9`](../SPEC.md#erf-9) | An author MUST grade `source_quality` on one axis, how much weight the attester's word carries for the fact the finding… |  | untestable by design: which of two inputs governs a source's grade is an assessment, not a computation |
| [`ERF-10`](../SPEC.md#erf-10) | An author MUST assess the grade against the substance the finding conveys, not against the bare fact that someone uttered it. |  | untestable by design: whether a finding's subject is discourse itself is a reading of the finding |
| [`ERF-11`](../SPEC.md#erf-11) | The judgment (does the quote, in context, support the finding?) is not recomputable and MUST be recorded per auditor in… |  | `fixtures/invalid/stored-mechanical-result` |
| [`ERF-13`](../SPEC.md#erf-13) | An atom's `id` MUST be permanent: never renamed and never reused. |  | `schema` |
| [`ERF-14`](../SPEC.md#erf-14) | A producer writing `as_of_date` MUST record the date the fact is true of, at the precision the source gave and no… | Producer | `schema` |
| [`ERF-17`](../SPEC.md#erf-17) | A record's `corpus` MUST name the corpus the deployment declares. |  | `fixtures/valid/minimal`, `schema` |
| [`ERF-18`](../SPEC.md#erf-18) | An author MUST make `title` state the claim; it is the normative statement. |  | untestable by design: that a title states the claim is the authoring act itself; the mechanical half was ERF-46, retired 2026-08-24 into this guidance |
| [`ERF-20`](../SPEC.md#erf-20) | Producer tools SHOULD stamp each standing entry with the evidence sets attached at ruling time, by id… | Producer | untestable by design: a SHOULD on producer behaviour, and the field's absence is legal |
| [`ERF-23`](../SPEC.md#erf-23) | A producer MUST attach evidence to the claim, in both directions: `atoms_for` and `atoms_against`, and MUST NOT model evidence against a claim as a rival claim. | Producer | untestable by design: modelling counter-evidence as a rival claim is a shape the format asks an author not to build |
| [`ERF-24`](../SPEC.md#erf-24) | An auditor MUST ask the question the epistemic kind sets, because the kind is the backing contract. |  | untestable by design: whether atoms jointly entail a statement is the audit judgment itself |
| [`ERF-25`](../SPEC.md#erf-25) | An auditor MUST audit a universal negative, a claim of the form "no shipped tool does X", as scoped rather than as proved. |  | untestable by design: whether a claim is a universal negative is a reading of the claim |
| [`ERF-27`](../SPEC.md#erf-27) | A producer MUST name each search act's concrete instrument in `tool` and its `query` in that instrument's own terms… | Producer | uncovered: no fixture asserts hits_reported rejects invented precision |
| [`ERF-28`](../SPEC.md#erf-28) | A producer MUST NOT change what a survey conducted: `searches` and each act's reported yield stay as recorded, because… | Producer | uncovered: no fixture covers survey immutability or the title stating what was sought |
| [`ERF-31`](../SPEC.md#erf-31) | A passage that asserts something SHOULD end with a narrative binding: a marker naming the claims the passage rests on… |  | `output`, `fixtures/invalid/binding-without-bound-at`, `fixtures/valid/anchor-spans-a-line-wrap`, `fixtures/valid/anchor-with-escaped-quote`, `fixtures/valid/anchor-broken-by-an-edit`, `fixtures/valid/anchor-in-an-earlier-passage`, `fixtures/invalid/binding-empty-anchor`, `fixtures/invalid/binding-unterminated`, `fixtures/invalid/binding-names-an-atom`, `fixtures/valid/binding-after-a-code-span`, `fixtures/invalid/malformed-candidate-does-not-close-a-passage` |
| [`ERF-32`](../SPEC.md#erf-32) | A narrative binding MUST be checkable: it is stale when the claim it names carries a `last_modified` later than the… |  | `staleness` |
| [`ERF-33`](../SPEC.md#erf-33) | A consumer encountering a narrative binding whose id resolves to no record MUST report it and MUST NOT drop it silently. | Consumer | `output` |
| [`ERF-35`](../SPEC.md#erf-35) | A reference asserting a *current* relationship MUST resolve within the deployment, the corpora read and cited together… |  | `fixtures/invalid/prior-survey-dangling`, `fixtures/valid/evidence-at-stance-outlives-atom`, `fixtures/invalid/atoms-for-names-a-survey`, `fixtures/invalid/atom-absent-from-mapping` |
| [`ERF-36`](../SPEC.md#erf-36) | Every record id MUST be unique across every corpus in the deployment, regardless of record type: one atom, claim, or… | Validator | `fixtures/invalid/duplicate-id-across-types` |
| [`ERF-40`](../SPEC.md#erf-40) | Standings MUST be append-only; an edit or deletion of an existing entry is a violation, verified against the… |  | untestable by design: verified against substrate history, which a loaded corpus does not carry |
| [`ERF-41`](../SPEC.md#erf-41) | Disposition MUST be computed, never stored, from the current stances alone, each person's newest admissible entry. |  | `disposition`, `fixtures/valid/standing-tie-at-one-instant` |
| [`ERF-42`](../SPEC.md#erf-42) | `rejected` and `retired` MUST NOT be conflated. | Consumer | `disposition`, `output` |
| [`ERF-43`](../SPEC.md#erf-43) | An argument's premise closure, followed transitively through its outgoing `assumes` edges and the incoming `supports`… | Validator | `fixtures/invalid/self-edge`, `fixtures/invalid/assumes-cycle`, `fixtures/invalid/assumes-cycle-two-node`, `fixtures/invalid/closure-ends-in-argument-leaf`, `fixtures/valid/premise-less-argument-is-a-flag`, `fixtures/invalid/supports-cycle` |
| [`ERF-44`](../SPEC.md#erf-44) | `conflicts-with` MUST be stored once per pair. |  | `fixtures/invalid/conflicts-stored-twice` |
| [`ERF-47`](../SPEC.md#erf-47) | Staleness MUST be computed, never stored: a `finding_audit`, `evidence_audit`, or narrative binding older than the last… |  | `staleness` |
| [`ERF-48`](../SPEC.md#erf-48) | Any change to a record MUST set `last_modified`, and it MUST NOT precede `created`; that is the whole of what a… | Producer | `fixtures/invalid/last-modified-precedes-created` |
| [`ERF-50`](../SPEC.md#erf-50) | The mechanical quote check (the normalized quote occurs in the source's normalized text) MUST be re-runnable by anyone… |  | `quote-check`, `output` |
| [`ERF-51`](../SPEC.md#erf-51) | Normalization MUST be this sequence, applied identically to the quote and to the normalized text, so that two… |  | `normalization`, `quote-check`, `cases/quote-check` |
| [`ERF-52`](../SPEC.md#erf-52) | Only the exact marker `[...]` MUST be treated as an omission, and it is the only wildcard; a bare `...` or `…` is a literal source character (`ERF-6`). |  | `quote-check`, `fixtures/invalid/quote-all-empty-spans`, `fixtures/invalid/quote-spans-out-of-order`, `erf-cases-quote-check` |
| [`ERF-53`](../SPEC.md#erf-53) | A corpus MUST have a canonical interchange form, given by a serialization (this section's opening). |  | `fixtures/valid/minimal` |
| [`ERF-54`](../SPEC.md#erf-54) | Every document a corpus holds MUST self-describe with `type`, no meaning MAY live in a path, exactly one document MUST… |  | `fixtures/valid/minimal` |
| [`ERF-56`](../SPEC.md#erf-56) | A reader MUST materialize an omitted list-typed field as an empty list, because presence means what it says: an omitted… |  | `fixtures/valid/minimal` |
| [`ERF-57`](../SPEC.md#erf-57) | A consumer MUST preserve unknown fields and unknown record types as opaque data, MUST report them, and MUST NOT reject a corpus solely because it contains them. | Consumer | `serialization` |
| [`ERF-72`](../SPEC.md#erf-72) | A field named with the prefix `x_` is an extension field: a producer MAY originate one anywhere, a validator MUST NOT… |  | `fixtures/valid/extension-field`, `schema` |
| [`ERF-60`](../SPEC.md#erf-60) | A consumer MAY refuse a corpus whose MAJOR `spec_version` it does not support, and MUST say so when it does. | Consumer | `fixtures/invalid/unsupported-major-version`, `fixtures/valid/newer-minor-version-extends` |
| [`ERF-62`](../SPEC.md#erf-62) | A corpus MUST have exactly one authoritative home. | Corpus | untestable by design: which store is authoritative is a deployment fact |
| [`ERF-67`](../serialization/yaml-markdown.md#erf-67) | A record body is CommonMark, and a file MUST be UTF-8 encoded with LF line endings and no byte-order mark. |  | `fixtures/invalid/bom-file`, `fixtures/invalid/bom-and-crlf` |
| [`ERF-65`](../serialization/yaml-markdown.md#erf-65) | Frontmatter MUST parse under YAML 1.2 using the **JSON schema**, the narrowest of the three the specification defines. | Producer, Validator | `serialization`, `fixtures/invalid/as-of-date-unquoted-year` |
| [`YAMLB-2`](../serialization/yaml-markdown.md#yamlb-2) | An empty list MUST be omitted on the wire, and a reader materializes it (`ERF-56`); an optional mapping that is present… |  | `fixtures/valid/evidence-at-stance-faced-nothing`, `hygiene` |
| [`ERF-66`](../serialization/yaml-markdown.md#erf-66) | A document's frontmatter MUST NOT contain a duplicate key, an anchor, an alias, or an explicit tag. |  | `fixtures/invalid/frontmatter-duplicate-key`, `fixtures/invalid/frontmatter-anchor` |
| [`YAMLB-1`](../serialization/yaml-markdown.md#yamlb-1) | A narrative binding MUST be spelled as an HTML comment, so that it is invisible in every render and survives any markdown pipeline: |  | `output`, `fixtures/invalid/binding-without-bound-at`, `fixtures/invalid/binding-empty-anchor`, `fixtures/invalid/binding-unterminated`, `fixtures/valid/binding-after-a-code-span`, `fixtures/valid/anchor-with-escaped-quote` |

## Retired ids

Never reused and never refilled, so that a requirement-by-requirement diff can tell a retired id from a lost one. The rulings are in `../CHANGELOG.md` and `../docs/history.md`.

| Retired id |
|---|
| `ERF-3` |
| `ERF-4` |
| `ERF-5` |
| `ERF-7` |
| `ERF-12` |
| `ERF-15` |
| `ERF-16` |
| `ERF-19` |
| `ERF-21` |
| `ERF-22` |
| `ERF-26` |
| `ERF-29` |
| `ERF-30` |
| `ERF-34` |
| `ERF-37` |
| `ERF-38` |
| `ERF-39` |
| `ERF-45` |
| `ERF-46` |
| `ERF-49` |
| `ERF-55` |
| `ERF-58` |
| `ERF-59` |
| `ERF-61` |
| `ERF-63` |
| `ERF-64` |
