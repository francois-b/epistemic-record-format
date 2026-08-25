# Test corpora

Authored from `SPEC-as-tried.md` alone. Regenerate with `python3 tests/make-tests.py`.

## conforming/

Intended to produce zero violations. `erfval tests/conforming` exits 0.

## nonconforming/

One deliberate defect each. The directory name states the requirement id.

| corpus | requirement | defect |
|:--|:--|:--|
| `nc-ERF-12-verdict-records-a-failure` | ERF-12 | An audit entry records FAILED as a verdict; ERF-12 says a failed audit is an audit that did not happen. |
| `nc-ERF-15-reference-encodes-location` | ERF-15 | A reference is a path rather than a bare id. |
| `nc-ERF-17-undeclared-corpus` | ERF-17 | A claim's `corpus` names a corpus no declaration declares. |
| `nc-ERF-19-standing-bare-date` | ERF-19 | A standing entry's timestamp is a bare date; ERF-19 requires a full instant with an offset. |
| `nc-ERF-19-standing-no-offset` | ERF-19 | A standing entry's timestamp carries a time but no offset. |
| `nc-ERF-21-standing-by-machine` | ERF-21 | A standing is taken by an agent actor; only a person takes a stance. |
| `nc-ERF-22-stored-state-field` | ERF-22 | A claim stores a `disposition` field; the disposition is computed, never stored. |
| `nc-ERF-26-tool-is-a-category` | ERF-26 | A search act's `tool` is empty; ERF-26 requires the concrete instrument named. |
| `nc-ERF-3-third-top-level-key` | ERF-3 | The source list's top level carries a third key beside `type` and `sources`. |
| `nc-ERF-31-binding-missing-bound-at` | ERF-31 | A narrative binding omits `bound-at`; it MUST be reported, never skipped. |
| `nc-ERF-33-binding-comma-separated-ids` | ERF-33 | Ids are comma-separated. ERF-31's PROSE forbids commas but its GRAMMAR admits one inside an id, so the binding parses and the trailing comma makes the id resolve to nothing. The reported violation is ERF-33, not ERF-31. |
| `nc-ERF-33-binding-names-nothing` | ERF-33 | A narrative binding names a claim id that resolves to no record. |
| `nc-ERF-35-atoms-for-dangling` | ERF-35 | `atoms_for` names an atom that does not exist in the deployment. |
| `nc-ERF-38-duplicate-id-across-types` | ERF-38 | An atom and a claim hold the same id; ids are unique regardless of record type. |
| `nc-ERF-39-empty-why` | ERF-39 | A standing entry's `why` is present but empty; an entry without a reason is a toggle. |
| `nc-ERF-4-source-not-in-list` | ERF-4 | An atom names a source id that is not in the source list. |
| `nc-ERF-43-assumes-cycle` | ERF-43 | Two claims assume each other; `assumes` MUST admit no cycles. |
| `nc-ERF-43-self-edge` | ERF-43 | A claim carries an edge to itself. |
| `nc-ERF-44-conflict-stored-twice` | ERF-44 | `conflicts-with` is stored on both members of the pair. |
| `nc-ERF-48-modified-before-created` | ERF-48 | `last_modified` is earlier than `created`. |
| `nc-ERF-5-absence-without-reason` | ERF-5 | A source with an absence status carries no `reason`. |
| `nc-ERF-52-all-spans-empty` | ERF-52 | The quote is nothing but an elision marker, so every span is empty. |
| `nc-ERF-52-spans-out-of-order` | ERF-52 | The two spans of an elided quote occur in the text, but in the wrong order. |
| `nc-ERF-53-atom-with-a-body` | ERF-53 | An atom's file carries a body; an atom's file is frontmatter and nothing else. |
| `nc-ERF-54-two-declarations` | ERF-54 | Two files carry `type: corpus`; a corpus that declares itself twice cannot say which governs. |
| `nc-ERF-55-empty-list-written` | ERF-55 | An empty list is written out rather than omitted. |
| `nc-ERF-55-unknown-field` | ERF-55 | A record carries a field the declared spec_version does not define and which is not under the `x_` prefix. |
| `nc-ERF-58-wrong-event-time-key` | ERF-58 | A stamp uses `date` instead of `timestamp`. |
| `nc-ERF-6-quote-not-verbatim` | ERF-6 | The quote is a paraphrase: 'must' where the source says 'have to'. |
| `nc-ERF-61-not-semver` | ERF-61 | `spec_version` is not a Semantic Versioning 2.0.0 string. |
| `nc-ERF-65-bare-year-resolves-to-number` | ERF-65 | `as_of_date` is an unquoted year, which ERF-14 permits and ERF-65's mandated JSON schema resolves to a number. |
| `nc-ERF-65-hits-reported-number` | ERF-65 | `hits_reported` is an unquoted 0, which ERF-27 says must be text. |
| `nc-ERF-66-anchor-and-alias` | ERF-66 | Frontmatter defines a YAML anchor and uses an alias. |
| `nc-ERF-66-duplicate-key` | ERF-66 | Frontmatter carries a duplicate key; YAML leaves a processor's response at its discretion. |
| `nc-ERF-67-crlf-line-endings` | ERF-67 | A record file uses CRLF line endings and opens with a byte-order mark. |
| `nc-ERF-68-shipped-without-licence` | ERF-68 | A source ships its normalized text under status `shipped` and names no licence. |
| `nc-ERF-7-url-in-citation-text` | ERF-7 | `citation_text` carries a URL; a citation identifies a work, a locator retrieves a copy. |
| `nc-ERF-9-quality-outside-set` | ERF-9 | `source_quality` is `unknown`, which is outside the closed set. |

## flagging/

Corpora that should produce FLAGS and no violations. Section 2: "a corpus
carrying flags and no violations conforms". `erfval` exits 0 on all of these,
and the flags must still be visible.

| corpus | requirement | condition |
|:--|:--|:--|
| `fl-ERF-20-evidence-at-stance-absent` | ERF-20/ERF-55 | `evidence_at_stance` is ABSENT: the ruler stamped nothing. Compare with the previous case; the two MUST be distinguishable in the output. |
| `fl-ERF-20-evidence-at-stance-present-and-empty` | ERF-20/ERF-55 | `evidence_at_stance` is present and EMPTY: the ruler stamped, and faced no evidence. This is a different fact from an absent stamp and erfval must say which it saw. |
| `fl-ERF-31-anchor-does-not-occur` | ERF-31 | The prose was edited so the anchor no longer occurs in its passage. A FLAG, not a violation: editing prose is an act the format permits. |
| `fl-ERF-32-stale-binding` | ERF-32 | A bound claim carries a `last_modified` later than the binding's bound-at. |
| `fl-ERF-35-evidence-at-stance-dangling` | ERF-35 | `evidence_at_stance` names an atom that no longer exists. A past-state reference: flagged, never a violation. |
| `fl-ERF-43-retired-leaf` | ERF-43 | The argument's premise closure terminates in a leaf whose computed disposition is `retired`. |
| `fl-ERF-49-unbacked-observation` | ERF-49 | An observation someone stands on with empty atoms_for and empty surveys. |
| `fl-ERF-72-extension-field` | ERF-72 | A record carries an `x_` extension field, which a validator MUST NOT report as an unknown-field violation. |
