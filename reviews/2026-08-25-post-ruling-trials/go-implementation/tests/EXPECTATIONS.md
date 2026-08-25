# Test corpora and their expected verdicts

Every corpus under `corpora/` is authored from `SPEC-as-tried.md` alone.
Rebuild with `bash build-corpora.sh`; check with `bash run-tests.sh`.

The expectation column records **which requirement id I believe the corpus
violates**, and at which severity. `V:` means at least one VIOLATION carrying
that id. `F:` means no violations at all, and at least one FLAG carrying that
id — the spec's own distinction (section 2: "a corpus carrying flags and no
violations conforms").

## Conforming

| Corpus | Expect | Notes |
|:--|:--|:--|
| `conforming` | conform | Declaration, source list with a shipped source, three atoms (one plain quote, one with an elision, one `medium` with `limitations`), an observation claim with a standing and `evidence_at_stance`, an argument claim assuming it, a survey, and a narrative with two bindings. Zero violations, zero flags, zero advisories. |
| `tolerant-unknown-type` | conform | Carries a `type: question` record and a file with no `type` at all. Per `ERF-57` and `ERF-54` both are reported and neither makes the corpus non-conforming. |

## The source list

| Corpus | Expect | What is wrong |
|:--|:--|:--|
| `nc-erf3-extra-top-key` | V:ERF-3 | Source list has a third top-level key. `ERF-3` says exactly two. |
| `nc-erf3-duplicate-source-id` | V:ERF-66 | One source id declared twice. Reported under `ERF-66` (duplicate key) rather than `ERF-3`, because the structural layer sees it first — and under a literal reading of `ERF-66` ("a record's frontmatter") a source list is not covered at all. See ambiguities A-08. |
| `nc-erf4-no-normalized-no-absence` | V:ERF-4 | No `normalized`, and `status: shipped` is not an absence status. Also reports `ERF-5` (no reason). |
| `nc-erf4-unknown-source` | V:ERF-4 | An atom names a source that is not in the list. |
| `nc-erf5-absence-no-reason` | V:ERF-5 | `status: not-redistributable` with no `reason`. |
| `nc-erf5-status-outside-set` | V:ERF-5 | `status: paywalled`. Closed set, so a validation failure and not a dialect. |
| `nc-erf68-ships-no-licence` | V:ERF-68 | Text ships, `status: shipped`, no `licence`. Under my reading `ERF-68` then requires `shipped-as-quotation`. See A-12. |
| `nc-erf7-url-in-citation-text` | V:ERF-7 | A URL inside `citation_text`. |
| `nc-erf70-extraction-no-version` | V:ERF-70 | `extraction: "pdftotext"` names the tool without its exact version. |
| `nc-erf71-bad-digest-shape` | V:ERF-71 | A digest that is not `<algorithm>:<hex>`. |
| `nc-erf71-digest-mismatch` | V:ERF-71 | `normalized_digest` does not match the file on disk. This is the one source check that verifies something rather than checking a shape. |
| `nc-erf1-dangling-normalized` | V:ERF-1 | `normalized` names a file that is not there. Contested reading — see A-21. |

## The quote check

| Corpus | Expect | What is wrong |
|:--|:--|:--|
| `nc-erf6-not-verbatim` | V:ERF-6 | One word changed. |
| `nc-erf51-case-mismatch` | V:ERF-6 | Differs only in case. `ERF-51`: "Case MUST NOT be folded." |
| `nc-erf52-bare-ellipsis-not-a-wildcard` | V:ERF-6 | Uses a bare `...` where an elision was meant. `ERF-52` makes it a literal. |
| `nc-erf52-all-empty-spans` | V:ERF-52 | The quote is exactly `[...]`. Must fail rather than trivially pass. |
| `nc-erf52-spans-out-of-order` | V:ERF-6 | Both spans occur in the text, but not in order. |

## Narrative bindings

| Corpus | Expect | What is wrong |
|:--|:--|:--|
| `nc-erf31-no-bound-at` | V:ERF-31 | `bound-at=` absent. "Every part is required." |
| `nc-erf31-no-anchor` | V:ERF-31 | No anchor. |
| `nc-erf31-illegal-escape` | V:ERF-31 | `\n` inside the anchor; the grammar defines only `\"` and `\\`. |
| `nc-erf31-bad-date` | V:ERF-31 | `bound-at=24-08-2026` is not `YYYY-MM-DD`. |
| `nc-erf31-comma-separated-ids` | **V:ERF-33** | Written to test `ERF-31` and it does not fail `ERF-31`: the grammar admits a comma inside an id, so `a-real-claim,` parses and then fails to resolve. The prose says ids are "never" comma-separated; the grammar disagrees. See A-09. |
| `nc-erf31-anchor-not-in-passage` | F:ERF-31 | The anchor is nowhere in the prose. `ERF-31` says flag, explicitly, not violate. |
| `nc-erf32-stale-binding` | F:ERF-32 | The claim's `last_modified` is later than `bound-at`. |
| `nc-erf33-unresolved-id` | V:ERF-33 | The binding names a claim that does not exist. Also raises the `ERF-32` indeterminate flag, since staleness cannot be computed against a record that is not there. |
| `nc-erf34-created-bare-string` | V:ERF-34 | `created: "2026-08-23"` rather than the `{timestamp, by}` stamp — the exact reading `ERF-34` was written to close. |

## Records and invariants

| Corpus | Expect | What is wrong |
|:--|:--|:--|
| `nc-erf38-duplicate-id` | V:ERF-38 | An atom and a claim share an id. |
| `nc-erf19-bare-date-standing` | V:ERF-19 | A standing dated `2026-08-22` rather than a full instant. |
| `nc-erf21-nonhuman-standing` | V:ERF-21 | `by: "agent/claude-fable-5"` on a standing. Also `ERF-39` for an empty `why` on the second entry. |
| `nc-erf55-empty-list-and-unknown-field` | V:ERF-55 | `atoms_for: []` written out, plus an undefined `confidence` field. The `x_internal_note` field in the same record is correctly *not* reported (`ERF-72`). |
| `nc-erf22-stored-state` | V:ERF-22 | A stored `disposition`. |
| `nc-erf66-duplicate-key` | V:ERF-66 | `title` twice. |
| `nc-erf66-anchor-alias` | V:ERF-66 | A YAML anchor and an alias. |
| `nc-erf27-hits-reported-numeric` | V:ERF-27 | `hits_reported: 0` unquoted, which is a JSON number and therefore not text. |
| `nc-erf26-unnamed-instrument` | V:ERF-26 | A search act with `tool: "web search"` and no `query` at all. (The category-not-instrument half of `ERF-26` is not machine-checkable; the missing `query` is what fires.) |
| `nc-erf43-assumes-cycle` | V:ERF-43 | `arg-a assumes arg-b assumes arg-a`. |
| `nc-erf43-self-edge` | V:ERF-43 | A claim assuming itself. Fires twice (self-edge, and the resulting cycle). |
| `nc-erf43-argument-leaf` | V:ERF-43 | A premise closure terminating in an argument with no premises of its own. |
| `nc-erf44-reciprocal-stored` | V:ERF-44 | `conflicts-with` stored on both sides of one pair. |
| `nc-erf49-unbacked-observation` | F:ERF-49 | An observation with a standing, no atoms, no surveys. Flag, not violation. |
| `nc-erf35-past-state-flag` | F:ERF-35 | `evidence_at_stance` names an atom that no longer exists. A past-state reference, so a flag: "an act the format permits [...] cannot retroactively make the corpus non-conforming." |
| `nc-erf35-unresolved-current` | V:ERF-35 | `atoms_for` names an atom that does not exist. A current relationship, so a violation. Paired with the row above, this is the distinction `ERF-35` draws. |
| `nc-erf54-two-declarations` | V:ERF-54 | Two files carrying `type: corpus`. |
| `nc-erf13-bad-atom-id` | V:ERF-13 | An atom id with no sequence number. |
| `nc-erf12-failed-audit-as-verdict` | V:ERF-12 | `verdict: ERROR` — a tool failure written into the field that holds a judgment. |
| `nc-erf53-bare-yaml-record` | V:ERF-53 | A record serialized as a bare YAML document. |
| `nc-erf53-atom-with-body` | V:ERF-53 | An atom with a non-empty body. |
| `nc-erf67-crlf` | V:ERF-67 | CRLF line endings. |
| `nc-erf58-wrong-event-time-key` | V:ERF-58 | `created: {date: ...}`. |
| `nc-erf17-undeclared-corpus` | V:ERF-17 | A claim naming a corpus nothing declares. |
| `nc-erf61-bad-semver` | V:ERF-61 | `spec_version: "0.9"` is not SemVer 2.0.0. |
| `nc-actor-convention` | V:ERF-Actor | `by: "claude"` follows none of the three actor forms. Reported under an **invented** id, because the MUST in section 2's Definitions carries no requirement number. See A-22. |

## Ambiguity demonstrators

These are not conforming-or-not. Their verdict changes with a reading the
spec does not settle, which is the point of including them.

| Corpus | Verdict | Demonstrates |
|:--|:--|:--|
| `amb-passage-scope` | clean under `-passage=since-previous` and `-passage=document`; **FLAG ERF-31** under `-passage=paragraph` | **A-02.** The anchor sits two paragraphs above the binding. The spec never defines "its passage", so the same corpus is clean or flagged depending on a choice the implementer had to make. |
| `amb-anchor-contains-comment-terminator` | V:ERF-31 | **A-10.** The anchor's own words contain `-->`. The `ERF-31` grammar permits it; HTML ends the comment there. The passage has no expressible anchor. |
| `amb-elision-matches-mid-word` | **conform** | **A-03.** An atom whose quote is `"The cat[...]sat"` against a text reading "The catapult was heavy. Someone eventually sat on the mat beside it." Both spans occur, in order, without overlap. The quote check passes on a sentence the source does not contain. |

## Requirements not exercised by any corpus

Because they are not machine-checkable, or not checkable from a directory.
Listed so the gaps are visible rather than implied by absence:

`ERF-8` (needs a CSL processor), `ERF-9`/`ERF-10` (a judgment about an
attester), `ERF-11`'s substance, `ERF-15` (partially: bare-id shape is checked,
"a claim moved between corpora keeps its id" is not), `ERF-18`'s "title MUST
state the claim", `ERF-20` (a producer SHOULD), `ERF-24`/`ERF-25` (backing
judgments), `ERF-28`'s immutability, `ERF-37` (a producer duty),
`ERF-40` (needs substrate history), `ERF-42`/`ERF-57`/`ERF-60` (consumer
presentation duties), `ERF-46`-class absent ids, `ERF-50`'s "MUST run as a
gate at minting", `ERF-62`/`ERF-63` (storage), `ERF-69`'s excerpt trigger,
`ERF-71`'s SHOULD.
