---
generated: 2026-08-25
model: claude-fable-5
---

# Friction log: cold-building an ERF validator from SPEC.md

One line per point where I guessed, re-read, or made a choice the spec did
not settle. All entries 2026-08-25. Entries promoted to genuine spec
defects are cross-marked [→ Ax] and expanded in `ambiguities.md`.

- F01 (ERF-59) Declaration filename and location unspecified; chose content-based discovery: any YAML doc with `spec_version` (or `id`+`title`) anywhere in the tree is a declaration. [→ A4]
- F02 (ERF-3) Source-list filename and location unspecified; chose: any YAML doc with a top-level `sources` mapping; tolerated `sources` living inline in the declaration file without an ERF-55 unknown-field violation there. [→ A4]
- F03 (ERF-3) Attaching a source list to a corpus when several corpora share a tree is unspecified; chose nearest-ancestor-declaration, with a single-corpus fallback.
- F04 (ERF-65) PyYAML implements YAML 1.1; rebuilt the implicit-resolver table by hand to the JSON schema (null / true / false / JSON number grammar only). Chose to let an empty plain scalar resolve to the empty string, though strict JSON schema has no empty scalar; the spec's "everything else stays a string" reading won.
- F05 (ERF-66) Duplicate keys: parse last-wins while reporting the violation, so later checks still run; anchors/aliases/explicit tags detected from the raw event stream.
- F06 (ERF-53) "An atom's body is empty": chose whitespace-only counts as empty (`strip()`), since the frontmatter close plus a trailing newline is unavoidable.
- F07 (§3 ActorStamp) The type comment says RFC 3339 but every example writes a bare date; accepted bare date OR full instant for `created` / `conducted` / audit timestamps, full instant only for standings (ERF-19 settles that one explicitly).
- F08 (§2) The actor-id convention is a MUST with no requirement number; minted pseudo-id S2.ACTOR so findings can cite it. Same move for data-model shape (S3.DM) and section 5 closed sets (S5.VOCAB).
- F09 (ERF-13) "Mint-time prefix plus a sequence number" is not a grammar; chose `^\S+-\d+$`. A prefix containing a hyphen-digit run would false-negative.
- F10 (ERF-15) "MUST NOT encode location" is not operationalized; chose: `/`, `\`, or leading `.` in an id or reference is location-encoding.
- F11 (ERF-7) "Contains a URL" undefined; chose scheme `://` or `www.` as the detector. `example.com/report` without a scheme passes.
- F12 (ERF-35) "Every reference MUST resolve" vs the enumerated four fields: `prior_survey`, `notable_results[].atoms`, and `evidence_at_stance` ids are unlisted; chose violations for the enumerated four, flags for the rest. [→ A2]
- F13 (ERF-35) A reference that resolves to a record of the wrong type (an `atoms_for` entry naming a claim) is nowhere addressed explicitly; chose violation under ERF-35 since the data model types are normative.
- F14 (ERF-49) "An observation someone stands on": chose "at least one person's current stance is `for`"; a claim held only `against` is not stood on. [→ A5]
- F15 (ERF-43) Premise-closure semantics: chose closure excludes the root; only arguments extend the chain; an argument leaf inside another argument's closure is a violation while a standalone premise-less argument is only the ERF-49 flag; cycles are violations. [→ A3]
- F16 (ERF-43) "assumes and decomposes-into MUST admit no cycles": read as the union graph of both relations is acyclic, not each separately.
- F17 (ERF-24) An `evidence_audit` recorded on a `bet` or `commitment` ("nothing to audit"): chose FLAG, not violation. [→ A6]
- F18 (ERF-32) MUST record `bound-at`, yet the ERF-31 grammar marks it optional and ERF-32 defines reporting for its absence; chose: absence is a VIOLATION whose message also carries the required "staleness indeterminate" reading. [→ A1]
- F19 (ERF-31) "The anchor is a verbatim substring of the passage": a passage has no mechanical boundary; chose: substring of the file text preceding the marker.
- F20 (ERF-31/34) Nothing marks a file as a narrative; chose: any non-record `.md` containing a `<!-- claims:` comment. Record bodies are not scanned for bindings (narratives are documents, not records).
- F21 (ERF-51 step f) "A space before punctuation is removed": chose any whitespace run including newlines, so a line break before punctuation cannot flip a verdict; a literal one-space reading is equally defensible. [→ A8]
- F22 (ERF-51 step d) Nested blockquote markers (`> > `): chose to strip repeated markers, though the prose says "markers at the start of a line" without depth.
- F23 (ERF-51 step a) Image syntax `![alt](url)` leaves a stray `!` after link unwrapping; the spec never mentions images; accepted the artifact (it applies to both sides identically only if both contain it).
- F24 (ERF-51) "A capture that is not text or markdown": detected by file extension (`.md`, `.markdown`, `.txt`); a misnamed binary would be caught only by decode failure.
- F25 (ERF-4/51) A declared capture `path` whose file is absent from this copy: chose UNAVAILABLE (the spec's "a capture it does not hold" language), not a violation; a corpus can travel without its captures per the security section.
- F26 (ERF-55) Empty-list omission applied at record top level only; a nested `evidence_at_stance: {atoms_against: []}` is tolerated (the ERF-20 shape declares both keys). [→ A7]
- F27 (ERF-17) The corpus-must-be-declared rule names claims (and the field table adds surveys); for atoms an undeclared corpus is demoted to a FLAG. [→ A10 in ambiguities, folded under A2's scope theme]
- F28 (ERF-47/48) "The last change to what it judged" read as `last_modified` when present, else `created`; a record never edited has nothing to be stale against.
- F29 (ERF-48) Equal full instants on `last_modified` and `created`: chose violation ("later than" read strictly at instant precision).
- F30 (ERF-41) Two entries by one person with equal or unparseable timestamps: spec supplies no tie-break for "newest"; chose later-in-file wins. [→ A9]
- F31 (ERF-51) The prose names `conformance/cases/normalization.txt` and `quote-check.yaml` as NORMATIVE over the prose, and neither is in the working directory; the want for them is this log entry. The implementation is prose-only and may diverge exactly where the cases would have governed.
- F32 (ERF-27) An unquoted `hits_reported: 0` parses as an int under the JSON schema and is reported as a violation ("as text"); a lenient implementer might coerce.
- F33 (ERF-2/28/40) Received-file immutability, search-act immutability, and standings append-only all need the substrate's edit history; a directory-level validator cannot see edits, so these are uncheckable here (a git-aware mode would close this).
- F34 (ERF-60) On a major `spec_version` other than 0, the validator refuses to certify with an explicit diagnostic but still reports best-effort findings; the spec governs consumers and leaves a validator's stance open.
- F35 (ERF-67) "A record body MUST be valid CommonMark" is vacuous as a check: CommonMark defines a parse for every text; nothing to implement.
- F36 (ERF-8) "citation_text MUST be rendered from citation" needs a CSL/Chicago renderer to check; only the citation's mapping shape is checked.
- F37 (ERF-31) A binding id resolving to an atom or survey: the grammar says "claims"; chose FLAG (the reference resolves, so ERF-33 does not fire).
- F38 (ERF-59) Two declarations claiming one corpus id: unaddressed; chose violation under ERF-59.
- F39 (ERF-71) Digest grammar: chose exactly `sha256:` + 64 hex when present; the field comment names only sha256, so other algorithms are rejected rather than accepted unnamed.
- F40 (ERF-70) `deterministic: false` is legal but the spec says it "marks its check as reproducible by no one but its author"; chose to surface that as a FLAG on the source.
- F41 (ERF-22) "A claim MUST NOT store a state field": checked by name (`state`, `status`, `disposition`) on top of the general ERF-55 unknown-field net, so the finding cites the sharper rule.
- F42 (ERF-14) `as_of_date` has no stated format; chose: must parse as a bare date or instant. The spec's "bare date remains correct where nothing is ordered" hints date, but never binds it.
- F43 (ERF-5) An absence status accompanied by a capture `path` (contradiction): unaddressed; chose violation under ERF-5.
- F44 (deployment scope) The spec validates deployments ("the corpora read and cited together") but the tool takes one directory; chose: the directory IS the deployment, all declarations inside included.
