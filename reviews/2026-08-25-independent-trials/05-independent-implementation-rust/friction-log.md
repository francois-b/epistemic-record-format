---
title: "ERF v0.9 independent Rust implementation: friction log"
trial: "05-independent-implementation-rust"
built_from: "SPEC.md alone (no reference implementation, no conformance fixtures, no example corpus)"
date: 2026-08-25
---

# Friction log

Every point in the build where I guessed, re-read, or made a choice the specification did
not settle. One line each, dated, with the requirement id involved and what I decided.
Entries marked **[A]** are also in `ambiguities.md` as judged spec defects; the rest are
ordinary under-specification that a second implementer would probably resolve the same way.

## The shape of a corpus on disk

1. 2026-08-25 — **[A]** No requirement names a file, a directory, or a filename convention for anything. ERF-53 says one record per file, ERF-59 says the declaration travels with the corpus, and that is the whole layout. Decided: a corpus root is any directory holding `corpus.yaml` (or `corpus.yml`, `corpus-declaration.yaml`, `declaration.yaml`).
2. 2026-08-25 — ERF-3 says the source list's "interchange form is a YAML document" and never names the file. Decided: `sources.yaml` / `sources.yml` / `source-list.yaml` beside the declaration.
3. 2026-08-25 — ERF-3 does not say whether the source list document *is* the map of sources or *contains* one under a `sources:` key; the section 4.1 example shows the latter. Decided: accept both, preferring the nested form when the document's only key is `sources`.
4. 2026-08-25 — The base for a capture `path` comes from a comment in section 3 ("relative to the list"), not from a requirement. Decided: resolve against the directory holding the source list file, and record that no numbered requirement carries this.
5. 2026-08-25 — **[A]** ERF-35 and ERF-36 are deployment-scoped but the tool is handed a directory. Decided: the directory given is the deployment; it may contain one corpus root or many, and uniqueness and reference resolution run across all of them.
6. 2026-08-25 — Nothing says how to tell a record file from a capture file, and both are markdown. Decided: read the source lists first, exclude every file named as a capture, then treat remaining `*.md` as candidate records.
7. 2026-08-25 — ERF-53 shows `---` fences in examples but never states the delimiter. Decided: a file whose first line is `---`, closed by a line of `---` or `...`.
8. 2026-08-25 — ERF-54 says no meaning lives in a path, so a record's `corpus` field may disagree with the directory it sits in. Decided: the field wins everywhere, including when resolving an atom's `source` against "the corpus's source list" (ERF-4).
9. 2026-08-25 — ERF-3 is unconditional ("a corpus MUST keep a source list") but a corpus with no atoms has nothing to resolve. Decided: violation when the corpus has atoms, notice when it does not.
10. 2026-08-25 — ERF-62 ("exactly one authoritative home") reads as a storage rule, but two declarations carrying one corpus id is the checkable case. Decided: report the second declaration as an ERF-62 violation.

## Requirement ids that do not exist

11. 2026-08-25 — **[A]** No requirement covers "a required field of section 3 is missing or ill-typed". Section 1 binds the Record class to the data model, so it is a MUST with no number. Decided: cite `§3`.
12. 2026-08-25 — **[A]** The actor grammar (`human:<id>` / `<producer>/<version>` / `process:<id>`) is stated in section 2's definitions with a MUST and no number. Decided: cite `§2`.
13. 2026-08-25 — ERF-16, ERF-29, ERF-30, ERF-45, ERF-46 and ERF-64 do not appear; the versioning section says retired ids are never refilled, so no action, but a diff tool reading the id sequence will notice the gaps.
14. 2026-08-25 — 3.1's field table maps `finding` to ERF-11 and ERF-12, which are about audit storage and verdict values, not about the finding. Decided: not usable as the citation for a missing `finding`.

## Timestamps and ordering

15. 2026-08-25 — **[A]** `ActorStamp.timestamp` is commented "RFC 3339" but every example writes a bare `2026-07-19`, which is not an RFC 3339 date-time. Decided: accept both precisions everywhere, and enforce the full instant only where ERF-19 demands it.
16. 2026-08-25 — RFC 3339 permits `T`, `t` and (by its own note) a space separator. The spec says nothing. Decided: accept all three.
17. 2026-08-25 — A time with no offset (`2026-08-23T14:02:00`) is not RFC 3339. Decided: `Malformed`, not a third precision, because a stamp without a zone cannot be ordered against one with a zone and ERF-19 exists precisely to make ordering possible.
18. 2026-08-25 — ERF-47 covers date-vs-instant on the same day but not instant-vs-instant equality. Decided: equal instants read as current (nothing changed after the check).
19. 2026-08-25 — **[A]** ERF-48 says `last_modified` must be "later than" `created` and admits the same day "at date precision". Two equal full instants are not later. Decided: violation when both are instants and they are equal or inverted; admitted when either is a bare date on the same day.
20. 2026-08-25 — ERF-48's real content ("any change MUST set `last_modified`") needs the substrate's history. Decided: not machine-checkable from a directory snapshot; only the ordering half is checked.
21. 2026-08-25 — ERF-47 for `evidence_audit` says "the last change to what it judged"; section 4.4 says the trigger is the statement edited *or* a cited atom modified. Decided: compare against the maximum of the claim's own last change and every cited atom's last change, and name which one drove the flag.
22. 2026-08-25 — For a narrative binding ERF-32 says stale when the claim "carries a `last_modified` later than that date", which ignores `created`. Decided: follow ERF-32 literally; a claim never edited never staleness-flags its bindings.
23. 2026-08-25 — ERF-28 says survey-backing staleness is computed from `conducted`, but states no threshold. Decided: not checkable, nothing emitted.

## Standings and dispositions

24. 2026-08-25 — ERF-41 says "each person's newest entry" and gives no tie-break for one person filing two entries at the same instant. Decided: later file position wins, on the ground that ERF-19 makes the ledger append-only so file order is evidence of sequence.
25. 2026-08-25 — Person identity is the `by` string; the spec never says whether `human:fbouet` and `human:f.bouet` are one person. Decided: exact string match.
26. 2026-08-25 — **[A]** ERF-49 says "an `observation` someone stands on". Two readings: any standing entry ever, or a current stance of `for`. Decided: current `for` (disposition `active` or `contested`), because a claim everyone has withdrawn from is not one anybody stands on.
27. 2026-08-25 — ERF-20 is a producer SHOULD. Decided: do not report a missing `evidence_at_stance` (it would fire on nearly every entry in a young corpus); do report ids inside one that resolve to nothing, as a notice.
28. 2026-08-25 — ERF-20 forbids storing drift in `evidence_at_stance` but the type admits only `atoms_for` and `atoms_against` anyway. Decided: the unknown-key check carries it.
29. 2026-08-25 — ERF-42 binds a consumer's rendering, not a corpus. Decided: not checkable; `--dispositions` prints the five readings under distinct names so a caller cannot conflate them.
30. 2026-08-25 — ERF-40 (append-only, "verified against the substrate's history") cannot be checked from a snapshot. Decided: not implemented, stated in the README.

## The claim graph

31. 2026-08-25 — **[A]** ERF-43: an argument with no premises has an empty closure, so "MUST terminate in non-argument leaves" is vacuous for it. Decided: an argument with no premises of its own is ERF-49's flag, not an ERF-43 violation; an argument reached *through* another argument's closure and having no premises is an ERF-43 violation for the closure that reached it.
32. 2026-08-25 — ERF-43 says "`assumes` and `decomposes-into` MUST admit no cycles" without saying whether the two relations are checked separately or as one graph. Decided: separately, plus a third check over the premise relation (assumes plus incoming supports) whose termination ERF-43 requires.
33. 2026-08-25 — "Self-edges MUST NOT exist" does not name a relation. Decided: any edge whose `to` equals the carrying claim's id, whatever the relation.
34. 2026-08-25 — ERF-44 says `conflicts-with` is "stored once per pair" and does not say which of the two records is at fault. Decided: report against the later-encountered holder, naming both ids.
35. 2026-08-25 — Duplicate identical edges of other relations are not forbidden anywhere. Decided: notice under `§3`.
36. 2026-08-25 — ERF-35 says references "name existing records" and the types say `AtomId`, `ClaimId`, `SurveyId`. Decided: check both existence and the target's record type, and cite ERF-35 for both.
37. 2026-08-25 — ERF-24 defines an argument's premises as its outgoing `assumes` targets plus the claims carrying `supports` edges into it. Re-read three times: `supports` is subject-first, so the *carrier* is the premise and the *target* is the conclusion. Decided accordingly.
38. 2026-08-25 — ERF-43's retired-leaf rule says flag rather than violation, and ERF-49 likewise. These are the only two requirements that name the distinction; ERF-47 says "is flagged stale" and ERF-33/ERF-57 say "report". Decided: three severities, with SHOULD departures and section-4 guidance kept in a third bucket (`NOTICE`) so the two spec-named flags stay legible.

## Vocabularies, fields, serialization

39. 2026-08-25 — ERF-5 calls its status vocabulary "provisional and grows by a demonstrated instance", while section 5 says a value outside a closed set is a validation failure and section 3 types it as a five-member union. Decided: closed, per section 3 and section 5.
40. 2026-08-25 — ERF-13 describes an atom id as "a mint-time prefix plus a sequence number" inside a MUST about permanence. Decided: notice rather than violation for an atom id not in that shape, because permanence is the requirement and the shape is its example.
41. 2026-08-25 — ERF-55 forbids originating undefined fields; the list of defined fields is only the section 3 mirror. Decided: unknown key is a violation, including inside nested shapes (`ActorStamp`, `AuditEntry`, `SearchAct`, `Fetched`, `Converter`, edge, notable result, `evidence_at_stance`).
42. 2026-08-25 — ERF-72 says a producer may originate an `x_` field "on any record, declaration, or source" and does not mention nested objects. Decided: allowed anywhere, reported as a notice everywhere.
43. 2026-08-25 — ERF-22 forbids a stored state field without naming one. Decided: a name list (`disposition`, `state`, `status`, `granted`) gets the ERF-22 citation; anything else unknown falls through to ERF-55.
44. 2026-08-25 — ERF-11 forbids storing the mechanical check's result without naming a field. Decided: same approach, name list (`verified`, `quote_check`, `check`, `quote_verified`, `capture_ok`).
45. 2026-08-25 — ERF-58 says the event-time key MUST be `timestamp` everywhere; a wrong key is indistinguishable from an unknown field. Decided: a name list (`date`, `time`, `when`, `datetime`, `ts`, `at`, `on`) gets the ERF-58 citation.
46. 2026-08-25 — ERF-55 ("empty lists MUST be omitted") and ERF-56 ("a reader MUST materialize an omitted list as empty") together mean an empty list in a file is a producer error. Decided: violation, cited to ERF-55.
47. 2026-08-25 — **[A]** ERF-65 requires the YAML 1.2 JSON schema, under which everything not `null`/`true`/`false`/a JSON number is a string. The spec's own examples write unquoted dates, which are legal strings under that schema but timestamps under YAML 1.1. Decided: notice (ERF-65's producer SHOULD) for plain scalars that resolve differently under a legacy schema; violation only when a string-typed field carries something the JSON schema resolves to a non-string.
48. 2026-08-25 — ERF-66 needs duplicate-key, anchor, alias and tag detection, which a deserializer hides. Decided: parse frontmatter through yaml-rust2's event stream and build the tree by hand; this also bought line numbers for every finding.
49. 2026-08-25 — ERF-67 requires a body to be "valid CommonMark". CommonMark has no invalid documents: every byte string is a conforming document. Decided: not checkable; UTF-8, LF and BOM are checked.
50. 2026-08-25 — ERF-57's tolerance is a consumer duty, but a validator meeting an unknown `type` has to do something. Decided: flag, not violation, and skip further validation of that record.
51. 2026-08-25 — ERF-27 says `hits_reported` is text; YAML will happily resolve `0` to a number. Decided: violation when the scalar is plain and matches JSON's number grammar.
52. 2026-08-25 — ERF-61's SemVer requirement: decided to reject leading zeros and two-part versions (`0.9`), per SemVer 2.0.0 proper.
53. 2026-08-25 — ERF-60 lets a consumer refuse an unsupported MAJOR and requires it to say so. Decided: this validator implements 0.x and emits a notice rather than refusing, because refusing would hide every other finding in the corpus.

## Sources and captures

54. 2026-08-25 — **[A]** ERF-2 requires a web page's capture to be dated, and the `Source` shape defines no field for a capture date. Decided: emit a notice on every shipped web capture saying the check cannot run, rather than silently passing it.
55. 2026-08-25 — Nothing distinguishes a received file from a web page except the presence of `fetched`, and ERF-7 only says a received file "carries no `fetched`". Decided: treat a source with an `http`-scheme `fetched.url` as the mutable case.
56. 2026-08-25 — **[A]** ERF-68's licence naming is a SHOULD, but its last sentence is a MUST: a capture shipping under no licence MUST carry `shipped-as-quotation`. Decided: `status: shipped` with neither `licence` nor `licence_name` is an ERF-68 violation (the permission is left unstated); an SPDX-shaped complaint about the value is a notice.
57. 2026-08-25 — ERF-4 says a source gives its path *or* records that no capture is held and why; it does not forbid both. Decided: an absence status carrying a `path` is an ERF-5 violation (it is not recording an absence), and neither one present is an ERF-4 violation.
58. 2026-08-25 — ERF-71's digest is inside a SHOULD but states a form. Decided: absence is a notice, a malformed value is a violation, and `sha256:` is length-checked at 64 hex characters.
59. 2026-08-25 — ERF-70 asks for "the tool and its exact version" in one free-text field. Decided: notice when the string contains no digit, which is the only mechanical proxy for "a version is named".
60. 2026-08-25 — ERF-8 requires `citation_text` to be rendered from `citation`, which needs a CSL processor. Decided: implement one partial check (an `issued` year that does not appear in the rendered string) as a notice, and record the rest as not machine-checkable.
61. 2026-08-25 — ERF-7's "MUST NOT contain a URL" needs a URL detector. Decided: `://`, `www.`, `http:`, `https:`. A bare domain (`example.org`) is not caught.
62. 2026-08-25 — ERF-69's real content (an excerpt contains enough adjacent text) is a judgement about a capture. Decided: not checkable; only `excerpt: true` with no capture path is reported.
63. 2026-08-25 — `citation: CSL` refers to an alias the inline mirror deliberately omits. Decided: hold it as an opaque node and do not apply ERF-55's unknown-key rule inside it.

## The quote check

64. 2026-08-25 — **[A]** ERF-51 names `conformance/cases/normalization.txt` and `conformance/cases/quote-check.yaml` as *normative* for its exact behavior, and those files are not in this trial's input. Every step below is a reading of the prose alone.
65. 2026-08-25 — Step (a) "markdown link syntax reduces to its link text": decided to handle inline `[t](u)` and reference `[t][r]` forms, to strip a leading `!` with the syntax (an image's `!` is part of the syntax, not the text), and to iterate to a fixed point.
66. 2026-08-25 — Step (b) "attribute blobs in braces": decided to remove any `{...}` without nested braces, not only attribute-shaped ones.
67. 2026-08-25 — Step (c) "parenthesized link targets": decided on exactly the four named forms (scheme-absolute, protocol-relative, root-relative, fragment-only); a relative target such as `(notes.md)` is left alone.
68. 2026-08-25 — Step (d) "blockquote markers at the start of a line": decided to allow leading whitespace before the marker and to strip nested markers, each with at most one following space.
69. 2026-08-25 — Step (f) "a space before punctuation is removed": decided to remove a run of spaces or tabs, not a single space, since the artifact it targets can produce several.
70. 2026-08-25 — Step 7 removes the hyphen, the newline, and the next line's leading whitespace. Re-read twice: the newline goes too, otherwise step 11 would leave a space inside the joined word.
71. 2026-08-25 — Step 10 "whitespace either side of a hyphen is removed" applies to every hyphen, so `entries -- that` becomes `entries-that`. Confirmed against step 8's ordering, which turns `--` into `-` first.
72. 2026-08-25 — **[A]** ERF-52 says "every non-empty span" without saying whether emptiness is tested before or after normalization. Decided: after, because a span that normalizes to nothing cannot be searched for.
73. 2026-08-25 — "in order and without overlap" admits several matching strategies. Decided: leftmost-greedy sequential search with the cursor advancing past each match, which is the only strategy that is both order-preserving and non-overlapping without backtracking.
74. 2026-08-25 — ERF-51 says a validator facing a capture that is not text or markdown reports the check as unavailable. Nothing says how to tell. Decided: by file extension (`.md`, `.markdown`, `.txt`, `.text`, or none).
75. 2026-08-25 — A capture path that names a file not on disk: decided ERF-1 violation (a capture MUST exist before any check runs) rather than the ERF-51 unavailable flag, which is reserved for a capture the corpus never claimed to hold.
76. 2026-08-25 — ERF-50's other half ("MUST run as a gate at minting and after any transform") is a process requirement about when the check runs. Not checkable from a snapshot.

## Narratives

77. 2026-08-25 — **[A]** ERF-32's first sentence makes `bound-at` mandatory; ERF-31's grammar brackets it as optional and ERF-32's last sentence defines behavior for its absence. Decided: report both, a violation for the missing MUST and the `indeterminate` staleness flag the same requirement mandates.
78. 2026-08-25 — **[A]** ERF-31 requires the anchor to be "a verbatim substring of the passage" and never defines where a passage begins. Decided: search the whole document with the binding's own comment removed.
79. 2026-08-25 — ERF-33 is written as a consumer duty ("MUST report it"). Decided: a validator reports it as a violation of the narrative, since the requirement calls it a defect in the narrative.
80. 2026-08-25 — ERF-34 states a narrative's frontmatter fields inside a "MUST NOT be modelled as a record" requirement. Decided: treat `title`, `corpus`, `created` as required and cite ERF-34.
81. 2026-08-25 — Nothing says how to recognize a narrative file. Decided: a markdown file with frontmatter and no `type` key; a file with no frontmatter is scanned for narrative bindings anyway, and only reported if it has any.
82. 2026-08-25 — The grammar's `id ::= one or more characters, none of them whitespace or '"'` admits `bound-at=...` as an id. Decided: treat a `bound-at=` token before the anchor as an error rather than as an id, since the grammar orders it after.

## Craft rules that are not machine-checkable

83. 2026-08-25 — ERF-9 and ERF-10 define how to grade a source. Only the vocabulary is checkable; the grade against the substance is a judgement. Section 4.2's "put the reason in `limitations`" is guidance, emitted as a notice.
84. 2026-08-25 — ERF-25's universal negative ("no shipped tool does X") cannot be recognized from a title without natural-language judgement. Not implemented.
85. 2026-08-25 — ERF-18's "the body SHOULD open by restating the title" is checkable in its verbatim form only. Decided: notice when the first paragraph does not begin with the title after whitespace collapsing.
86. 2026-08-25 — ERF-26's "a category without the instrument does not satisfy this" cannot be checked; only presence and non-emptiness are.
87. 2026-08-25 — ERF-12's "a failed audit MUST NOT be written as a verdict" is only checkable as the closed verdict set, which is what is implemented.
88. 2026-08-25 — ERF-37 (a producer verifies an id is unused before writing) collapses, for a validator, into ERF-38. Not separately reported.
89. 2026-08-25 — ERF-63 (a substrate preserves enough history to verify ERF-40) is a property of the store, not of the files. Not implemented.

## Build notes

90. 2026-08-25 — Wanted an example corpus badly enough to notice it: with no fixture to read, the layout conventions above are guesses that a real corpus would have settled in a minute. Logged rather than resolved; three corpora were built by hand instead and live in `tests/`.
91. 2026-08-25 — Dropped serde entirely after ERF-66 forced an event-level parser. Hand-decoding every field turned out to be the point: `Option` versus required had to be typed out sixty times, and each time the prose was consulted rather than defaulted.
