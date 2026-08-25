# MANIFEST

Adversarial conformance fixtures for ERF spec v0.9.0, written cold from
`SPEC.md` alone. Each fixture directory is treated as its own isolated
deployment (record ids are only guaranteed unique within a fixture, not
across the whole `fixtures/` tree — see friction-log).

Layout convention (not spec-mandated; storage is the substrate's
business per ERF-62/63): `declaration.yaml`, `sources.yaml`,
`captures/*.md`, `atoms/*.md`, `claims/*.md`, `surveys/*.md`.

## fixtures/valid/ (6 — MUST load with zero findings)

| Name | Outcome | Probes |
|---|---|---|
| `v1-minimal-commitment-claim` | clean | `commitment` claim owing no backing (ERF-24); every optional/list field legally absent; no sources at all since no atoms exist (ERF-3 edge case — see friction-log). |
| `v2-extension-namespace-fields` | clean | `x_`-prefixed fields (ERF-72) on the declaration, a source, an atom, a claim, and a survey simultaneously — validator MUST NOT report any as unknown-field violations. |
| `v3-unicode-normalization-and-elision` | clean | Full ERF-51 normalization sequence in one atom (typographic quotes both single/double, soft hyphen, em dash w/ spacing, hyphenated line-break join, markdown link unwrap, trademark symbol, space-before-punctuation) verified by script to converge; a second atom exercises legal multi-span `[...]` elision with an unbounded, non-adjacent gap. |
| `v4-contested-disposition` | clean | Two human standings (`for`, `against`) → computed `contested` (ERF-41); one entry carries `evidence_at_stance` (SHOULD, ERF-20), the other correctly omits it; correct `medium` grading with `limitations` stated for a self-interested source, contrasted deliberately against `s4`. |
| `v5-universal-negative-survey-backed` | clean | Universal-negative observation with `atoms_for` absent and `surveys` present (ERF-25) — must NOT trip ERF-49's unbacked flag, unlike a structurally identical claim with `surveys` also empty. |
| `v6-argument-premises-via-edges` | clean | `argument`-kind claim backed only by an outgoing `assumes` edge to a non-argument leaf (ERF-24); premise closure (ERF-43) terminates after one hop, no cycle, no self-edge, leaf disposition not `retired`. |

## fixtures/invalid/ (12 — each violates exactly one requirement)

| Name | Violates | Probes |
|---|---|---|
| `i01-standing-bare-date-timestamp` | ERF-19 | Standing `timestamp` is a bare date, not a full RFC 3339 instant — the one field in the format where that precision is a MUST. |
| `i02-claim-stores-disposition` | ERF-22 | Claim frontmatter stores `disposition: active` directly instead of leaving it computed. Necessarily also collides with ERF-55 (unknown field) — flagged as unavoidable in the expect.yaml and friction-log. |
| `i03-self-edge` | ERF-43 | A claim's edge targets its own id, using relation `supports` (not `assumes`/`decomposes-into`) to probe whether the self-edge ban is read as general across all four relations or scoped to the two cycle-barred ones. |
| `i04-two-node-assumes-cycle` | ERF-43 | Two `argument` claims `assumes` each other — a length-2 cycle, distinct failure mode from the length-1 self-edge in `i03`; a cycle detector tuned only to self-edges would miss this. |
| `i05-conflicts-with-both-directions` | ERF-44 | `conflicts-with` stored on both claims for one pair instead of once with the reciprocal derived. |
| `i06-last-modified-before-created` | ERF-48 | `last_modified` timestamp predates `created` — a purely structural, single-snapshot-checkable half of ERF-48 (the append-only-exception half is not; see friction-log). |
| `i07-cross-type-duplicate-id` | ERF-36 (validator obligation ERF-38) | An atom and a claim share one id — tests whether id-uniqueness is checked across record types or only within a per-type namespace/directory. |
| `i08-missing-reason-on-absence` | ERF-5 | A source recording an absence has a closed-set `status` but no `reason` — the conditionally-required field is easy to skip since the type marks it optional (`?`) rather than showing the conditional requirement in the shape itself. |
| `i09-quote-all-empty-spans` | ERF-52 | Quote is exactly `"[...]"` — every span empty, must fail rather than vacuously pass a "some remaining substring matched" check. |
| `i10-quote-spans-out-of-order` | ERF-52 | Two legitimate, individually-verbatim spans cited in the reverse of their capture order — defeats a per-span "does it occur somewhere" check that doesn't track cursor position between spans. Verified by script: a position-tracking scan correctly fails it. |
| `i11-duplicate-yaml-key` | ERF-66 | `epistemic_kind` written twice in one frontmatter block — legal-looking YAML that many parsers silently resolve (last-key-wins) rather than reject. |
| `i12-bom-crlf-encoding` | ERF-67 | File carries a UTF-8 BOM and CRLF line endings; all data fields parse cleanly, so this only surfaces to a validator that inspects raw bytes rather than handing the file straight to a lenient YAML/Markdown loader. |

## fixtures/spirit/ (4 — MUST pass a correct validator, but hollow)

| Name | Passes because | Hollow because | Machine-checkable? |
|---|---|---|---|
| `s1-excerpt-is-only-the-quote` | Excerpt structurally sound, quote verbatim, status legal. | Capture is the quote and nothing else — ERF-69's own prose ("a capture holding the quote alone proves nothing") is violated by the letter, but the "enough adjacent text... legible" standard has no operational threshold. | Partially — a length/equality heuristic catches this exact shape, not the general case. |
| `s2-thin-survey-backs-sweeping-absence` | Universal-negative claim structurally well-backed per ERF-25/26/27/28. | One unpaginated search-engine page backs a market-wide absence claim; the non-normative world-index-vs-private-sample distinction under ERF-28 is exactly what's being ignored. | Only a shallow structural proxy (act count); matching claimed scope to searched universe is a semantic read. |
| `s3-title-body-mismatch` | `title`, `body`, and stamps are all individually well-formed. | Body's restatement of the title silently narrows an "every office" claim to "most offices" after an edit that didn't touch the title — ERF-18 explicitly declines to number a rule for this ("so no rule numbers it"). | Shallow edit-distance/embedding heuristics exist but the underlying judgment is semantic equivalence of two sentences. |
| `s4-implausible-source-grade` | `source_quality: high` is a legal enum value. | Source is a vendor's unfalsifiable superlative about its own product — ERF-9's own table names this exact shape as the `medium` example, not `high`. | No — the data model deliberately doesn't record the attester-type metadata a check would need. |

## Undecidable (see friction-log.md for full reasoning)

- **`s1-excerpt-is-only-the-quote`** — genuinely ambiguous whether this
  belongs in `invalid` (ERF-69 is MUST-worded) or `spirit` (the
  standard it sets has no machine-computable acceptance test). Filed
  under `spirit` on the reading that "a correct validator" means a
  machine, and a machine cannot evaluate "enough adjacent text... to be
  legible."
- **ERF-40 / the append-only half of ERF-48** — not represented by any
  invalid fixture. Both require diffing against prior substrate state
  (an edit to an existing standing entry; an append that improperly
  advanced `last_modified`), which a single static corpus snapshot
  cannot expose either way. No fixture built; flagged as untestable via
  this fixture format.
- **ERF-43's self-edge scope** (`i03`) — built on the broad reading
  (all four relations); the spec's sentence structure supports a
  narrower reading (only `assumes`/`decomposes-into`) about as well.
