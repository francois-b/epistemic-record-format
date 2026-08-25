# Changelog

Newest first. Requirement ids are stable once published: a new requirement
takes the next unused number, ids carry no positional meaning, retired ids
are never reused, and every change lands here with a date.

## Unreleased

### 2026-08-24 — the source becomes a corpus artifact

The format's section 4.1 was titled "The source" and defined no source:
a work's identity lived on each atom (`citation_text`, `citation`,
`fetched_url`) and its capture lived in a mapping keyed by atom id, so a
work quoted by three atoms was described three times and the descriptions
were free to disagree. The live practice showed the symptom (one page
graded differently by two atoms, byte-identical capture entries repeated
per atom, "same source and same reason as kwg-014" written in prose
because the structure had no way to say it), and the classical diagnosis
is an update anomaly: an attribute stored off its entity.

The source is now the fourth corpus artifact, beside the declaration and
the capture entry. `sources.yaml` lists each work once (`ERF-3`):
citation, retrieval locator, and capture together, keyed by a source id
unique within the corpus. The atom names its source (`source`, `ERF-4`)
and keeps `source_quality`, deliberately: the grade is a judgment about
how much weight the attester's word carries for this finding (`ERF-9`,
`ERF-10`), so two atoms may legitimately grade one source differently,
and the spec now says so where it says what the atom carries. `ERF-7`
and `ERF-8` move to the source with their ids and their meaning intact;
`ERF-5`, `ERF-68`, and `ERF-71` reword from "entry" to "source". The
`CaptureEntry.source` prose note is gone, made redundant by the source's
own citation.

The example corpus's nine atoms now share five sources, which is the
deduplication demonstrated rather than asserted; its four shipped
captures carry `shipped-as-quotation` with `excerpt: true`, exercising
2026-08-24's capture requirements. Standalone examples gain
`source-book.yaml` (a scanned public-domain PDF converted by a named
deterministic tool, locator and digest pinned, the full ERF-69/70/71
chain) and `source-web.yaml` (a withheld capture with its reason);
`atom-book.yaml` and `atom-web.yaml` slim down to match. Every fixture
migrates; `atom-absent-from-mapping` now asserts an atom naming a source
the list does not hold, and the URL fixture asserts `ERF-7` on the
source. The backlog gains the three re-add triggers the pare-down owed:
cross-deployment identity, the classification wall, and the registry.

### 2026-08-24 — the container layer pares down to the corpus

Realm, the corpus registry, and the classification wall leave v1, by
operator ruling, so the version that publishes is the version a reader
can hold: every concept that remains is one a first corpus needs. The
coverage map had already said this quietly: of six uncovered requirements,
two were the wall and the registry's ordered levels, and the one
untestable-for-want-of-an-implementation requirement was multi-realm
identity. Structure nothing exercises is anticipation, and the backlog
rule (a thing earns its place by demonstrated need) now applies to the
container layer as it always applied to fields.

**`ERF-45` is retired.** The wall (a record must not cite a record whose
classification is narrower) is a rule about who may see what, which is a
policy, and v1 struck policies on 2026-08-23. The security section now
says plainly that a deployment mixing open and sensitive corpora needs
such a rule and that this version gives it no vocabulary and no check.

**`ERF-64` is retired.** The corpus registry, with its ordered
classification levels, becomes deployment practice the format no longer
specifies. The reference deployment keeps its registry file; the spec
stops requiring one.

**`ERF-16` is retired and realm leaves the vocabulary.** Ids are scoped
to the deployment, said plainly: the corpora read and cited together
(`ERF-35` through `ERF-38` reworded). Cross-deployment identity goes to
the backlog with its trigger, two parties sharing records whose ids may
collide.

**The manifest becomes the corpus declaration (`ERF-59`).** A manifest
lists contents and this document never did; a declaration declares what
the corpus is and what version it speaks. `classification` survives as
an optional opaque label the format records and does not read, so a
travelling corpus can still name its sensitivity without the format
pretending to enforce it; the manifest-versus-registry tie-breaker goes
with the registry. `CorpusManifest` becomes `CorpusDeclaration` in the
model; `RegistryEntry` is deleted.

**`ERF-72` adds the extension namespace.** A field named `x_*` is legal
on any record or corpus artifact, never an unknown-field violation, and
is where a practice grows vocabulary before the spec admits it; a field
graduates by entering a later version under its bare name. Everywhere
else `ERF-55`'s strictness stands, deliberately: rigid by default,
extensible in one designated place, against the decay that general
tolerance invites. The `licence_note` field this morning's audit removed
is the motivating instance: as `x_licence_note` it would have been legal
experimentation rather than a defect.

Sixty-six live requirements; the retired set is 16, 29, 30, 45, 46, 64,
all guarded against refill. The viewer honors `x_`, requires only id,
title, and spec_version of a declaration, and renders classification
only where one is present. A new valid fixture carries an extension
field and a declaration with no classification.

### 2026-08-24 — the freeze lifts for captures: excerpts, converters, source identity

The operator lifted the 2026-08-23 freeze for one batch: the capture layer
was too thin to carry the example corpus that is actually wanted (the
knowledge-work essay and its 147 atoms, most of whose sources permit
quotation but not republication). Three requirements added, two amended,
one note rewritten; all landed with their implementation, their model
changes, and their coverage rows in the same pass.

**A capture may be an excerpt (`ERF-69`).** A capture holding the quoted
passage plus enough adjacent text to make its place in the source legible
is a conforming capture, and must identify itself as one. The excerpt
route exists because the format needs verifiability and not
republication: a short quotation with attribution is available where
republishing the work is not.

**A converted capture names its converter (`ERF-70`).** Where the capture
text was produced from a PDF, a web page, or an EPUB, the capture records
the tool and its exact version, and the tool must be deterministic; a
non-deterministic converter may be used but must be declared, which marks
that check as reproducible by nobody but its author. Naming the
instrument rather than specifying the conversion is ERF-26's move,
applied to extraction, and for the same reason: no standard defines a
faithful text projection of a PDF or an HTML document.

**Source identity travels as a locator and a digest (`ERF-71`).** An
excerpt or converted capture should record an immutable locator for the
source artifact and its digest, algorithm named. Together they close the
step the format cannot otherwise check: a reader who fetches the artifact
confirms it is the one the author held, then re-runs the conversion and
the containment check themselves.

**`ERF-5` splits copyright from contract.** `not-redistributable` now
means copyright forbids republication, and a new `access-restricted`
means an agreement accepted to obtain the source forbids extraction. They
fail differently: the first leaves ERF-69's quotation route open, the
second closes it, since a term of access is not answered by a passage
being short.

**`ERF-68` gains the quotation basis.** A capture may ship under no
licence at all, as a short quotation for verification and comment, and
the entry must say so (status `shipped-as-quotation`) rather than leaving
the permission unstated. The example corpus's four W3C captures were
mislabelled with an SPDX id for a different licence precisely because the
vocabulary had no honest option.

**The ERF-51 media-type note is rewritten.** Captures are authored, not
converted at check time, so the deferred per-media-type extraction
profile is no longer a successor design: the conversion happens once, in
the capture author's hands, under ERF-70. The note now records why no
extraction standard exists (reading order, table cells, alt text, and
footnotes are editorial questions), and two findings from converting a
real scanned source: an OCR layer already embedded in a hashed artifact
is not a source of nondeterminism, and OCR's irregular spacing is exactly
what normalization step 11 absorbs — the Pacioli 1494/1914 quote fails a
raw substring search and passes normalized.

The `CaptureEntry` shape grows accordingly (two statuses, `excerpt`,
`converter`, `source_locator`, `source_digest`, and a `Converter` shape)
in `types/erf.ts` and the section 3 mirror; the viewer asks one
`shipsWithCorpus` predicate instead of comparing to the `shipped`
literal; ERF-69/70/71 enter the coverage map as uncovered, honestly, with
their fixtures owed.

### 2026-08-24 — an audit of the satellites: five fixes, no spec change

An audit of `types/erf.ts`, `viewer/`, and `examples/corpus/` against the
specification. The model and the viewer passed: the section 3 inline mirror
is field-for-field identical to the file across all fifteen declarations,
every type the viewer declares locally is a derived reading or a loader
shape the model correctly does not define, and the committed render matched
a fresh run. Five fixes in the corpus and the suite, none of them touching
a requirement.

**`spec_version` is a quoted SemVer string (`ERF-61`).** The example
manifest and every fixture declared `spec_version: 1.0`, which is not
Semantic Versioning and, under the YAML 1.2 JSON schema that `ERF-65`
mandates, loads as the number 1 where the model types the field `string`.
The viewer's major-version check survived by accident and the minor version
was silently destroyed, which is exactly the information `ERF-60`'s
minor-version rule reads. The rendered corpus page said "conforms to ERF 1"
and now says "conforms to ERF 1.0.0". Twenty files, `"1.0.0"` throughout
and `"2.0.0"` in the unsupported-major fixture.

**The example captures carry no SPDX identifier, correctly (`ERF-68`).**
The four shipped captures paired `licence: W3C-20150513` with
`licence_name: "W3C Document License 2023"`, which are two different
licences: SPDX's `W3C-20150513` is the *Software* Notice and Document
License of 2015, and SPDX has no identifier for the W3C Document License at
all (verified against the published list). The capture headers invoke the
2023 document licence, so the identifier was simply wrong. It is removed
and the plain name kept, which is what `ERF-68` prescribes where no
identifier applies.

**`licence_note` is gone (`ERF-55`).** The mapping originated a field
`CaptureEntry` does not define, and neither the viewer's unknown-field
check nor the suite reached capture entries to catch it. Its content was
licence terms and a note on shared captures, both of which now sit in the
file's comment header where they explain without pretending to be data.

**The retired-id guard covers `ERF-30`.** It checked `ERF-29` and `ERF-46`
but not `ERF-30`, retired the same week, so a refilled `ERF-30` would have
passed the suite.

**A coverage note stopped citing a retired id as live.** `ERF-18`'s row
said "the mechanical half is `ERF-46`" after `ERF-46` was retired into that
very guidance; the guard test reads row keys, not note prose.

### 2026-08-24 — two reviews adjudicated: eighteen external findings, fourteen internal

A cross-vendor adversarial review (GPT-5.6 sol) and an internal pass ran
against `c648804`; both are archived verbatim with per-finding rulings in
`reviews/`, a new top-level home for disposition-of-comments records. The
external reviewer was handed the decision register and re-raised nothing
already ruled — the register working as designed. Every accepted finding
below is implemented in the commits carrying this entry.

**Serialization made total (`ERF-53`).** The canonical interchange form is
one record per file, frontmatter plus body, the atom's body empty; a store
may group records or hold bodies as fields provided lossless round-trip.
The section 4.2 atom example is now a conforming record (it lacked `type`
and `corpus` and its citation block violated `ERF-8`; `publisher-place`
and `chapter-number` added).

**Surveys can be kept (`ERF-28`).** Immutability now binds what cannot
have been otherwise, the conducted acts and their yields; a transfer, a
body note, or an atom link landing in `notable_results` stamps a new
`last_modified` like every other record.

**Captures ship on their licences.** Operator ruling: what data travels is
outside the spec. The security section's blanket MUST NOT is now
licence-conditional description; `ERF-5` records the withholding judgment,
`ERF-68` names the licence when a capture ships.

**Arguments know their premises (`ERF-24`, `ERF-43`, `ERF-49`).** A
premise arrives from either side of the graph: the argument's outgoing
`assumes` edges, or another claim's `supports` edge pointing at it. The
closure is directed accordingly; the retired-leaf condition became a
validator flag (a legal withdrawal elsewhere cannot retroactively make a
corpus non-conforming); the unbacked warning consults both sides.

**Ordering is honest about precision (`ERF-47`, `ERF-48`).** A staleness
comparison the stamps' precision cannot order (bare date against same-day
instant) resolves to stale; equal bare dates read as current; `ERF-48`
says what "later" means at date precision. `ERF-19`'s argument, applied to
the rest of the format.

**The corpus artifacts have shapes.** `CorpusManifest`, `RegistryEntry`,
and `CaptureEntry` join the normative model; the registry governs where it
and a manifest disagree about classification (`ERF-59`); the conformance
classes now bind them (Corpus) and every machine-checkable MUST
(Validator).

**`ERF-46` is retired**, folded into `ERF-18`'s guidance. Three of the six
real corpus claims open in other words than their titles; whether an
opening in other words states the same claim is a reading, and the
2026-08-23 ruling already held that authoring judgment is not numbered.
The id is not reused.

**Smaller closures:** references resolve in the realm namespace, stated
once (`ERF-35`); a corpus transfer is never recorded as a standing entry,
which would move the disposition as a side effect (`ERF-17`); binding ids
got a lexical grammar (`ERF-31`); MAJOR means unreadable *or read with
changed meaning* (`ERF-61`); the `high` source-quality anchor is
disclosure under accountability, removing its overlap with vendor
self-claims (`ERF-9`); `auditor` is a bare instrument id, deliberately not
an `Actor` (`ERF-11`); the audit lists are append-only like standings
(`ERF-40`); the date-coercion war story is correctly blamed on YAML 1.1
legacy defaults, not the 1.2 Core schema (`ERF-65`); the conformance case
files are normative for normalization's exact behavior (`ERF-51`); the
change-control bullets that bind editors moved to the design history; the
3.1 field tables became a compact field-to-requirement index.

**The satellites were swept.** Pre-flatten ids, the retired survey
`limitations` field, a Questions row surviving the type's cut, wrong
counts, a stale normalization disclaimer in the viewer README, and four
atoms violating the actor convention — all corrected, and the conformance
suite now validates the shipped examples and greps the repository for
pre-flatten ids, so the drift class fails a run instead of waiting for the
next reviewer. Requirement coverage rose from 25 to 41 of 65, with
thirteen new invalid fixtures and four new suites.

### 2026-08-23 — three rulings: standing precision, ERF-30 cut, normalization order

**A standing carries a full RFC 3339 instant** (`ERF-19`), with a time and an
offset, never a bare date. Precision is mandatory here and nowhere else
because the standings ledger is the only ordered structure in the format: a
bare date and a full instant on the same day cannot be ordered against each
other, so a consumer selecting the newest stance would settle a claim's
disposition by accident. A bare date stays correct for `as_of_date` and a
survey's `conducted`, where nothing is ordered.

Implementing it found a larger defect underneath. YAML coerces an unquoted
timestamp into a date value, so the reference consumer was comparing
stringified dates, which sort alphabetically by weekday name. Newest-stance
selection, and therefore every computed disposition, turned on the day of the
week. `currentStances` now compares parsed instants, and the precision check
reads the raw frontmatter, since a parsed value cannot tell the two forms
apart.

**`ERF-30` is cut.** It required a narrative to comprise prose plus a
claims-tree document. A claims-tree is an artifact of one practice's doc
class, not something the format needs; a narrative carrying bindings already
points at its claims; and requiring a companion document is the format
reaching into use, which this version does not do. It was also the only
requirement the example corpus broke. The id is retired and not reused.

**Normalization is idempotent again** (`ERF-51`). Straight-quote removal ran
in the unwrapping steps, before the fold of typographic quotes into straight
ones, so nothing removed the results of the fold: `"straight"` normalized to
`straight` while a curly pair normalized to `"curly"`, and one quotation typed
two ways produced two strings. Quote removal is now step 5, immediately after
the fold, matching the working implementation the 19-versus-9-percent
measurement came from. No verdict changed on the example corpus.

### 2026-08-23 — the reference consumer is made to obey the specification

A conformance trace over all 63 requirements asked, for each one, whether
any code actually implements it. Two earlier passes had not: the spec audit
asked whether a requirement should stay, and the external review asked
whether requirements contradicted each other. Neither opened the viewer.

The trace found 24 gaps, of which these mattered most, all now fixed.

**Every narrative binding rendered as raw markup.** The grammar was
implemented twice, and only the parser gained `bound-at`. The renderer's
copy matched nothing, so six escaped HTML comments were visible in the
published page and no "rests on" link rendered at all, in direct violation
of `ERF-33`. There is now one grammar, defined once and imported.

**The reference consumer did not implement its own mandatory
normalization.** `ERF-51` makes six unwrapping steps equally mandatory and
carries the measurement that made them so, and the viewer implemented none
of them, computing verdicts under exactly the configuration the
specification says diverges and printing them as "Quote check passes". All
six are implemented in the specified order.

**The highlight and the check disagreed by construction**: the check
compared normalized text while the highlight searched raw text, so a quote
passing only after normalization showed a green box and no highlight, with
no explanation. The highlight now tries a literal then a whitespace-flexible
match, both exact in the raw text, and says so plainly when neither lands.

**Duplicate ids were undetected and destructive.** A `Map.set` on an
existing key discarded the first record silently, so a duplicated atom id
made one atom vanish and redirected every claim citing it. The loader now
reports and keeps the first. The [private-repo alias] validator checked claims only, leaving
741 atom ids and every survey unguarded; it now covers all three types.

**A non-verdict could load as a verdict**, since the union is compile-time
only and YAML is cast straight through. `ERF-12`'s three values are checked
at load, which is the failure that put 32 `PARSE_ERROR` values in a real
corpus.

Also: the capture mapping is checked for completeness, so an omission is
distinguishable from a recorded absence, which is what `ERF-4` is for;
`ERF-47` staleness extends to a claim's evidence audit; `ERF-32` binding
staleness is computed and surfaced, reporting `indeterminate` where
`bound-at` is absent rather than reassuring; a claim's conflicts now include
the half stored on the other side of the pair, per `ERF-44`; the manifest's
four required fields are validated; and `rejected` claims render styled.


### 2026-08-23 — a survey states its coverage bounds in its body

`limitations` leaves the survey record and stays on the atom, and the
asymmetry becomes a stated rule: **a record with a body carries its caveats
there.** Claims and surveys have bodies and use them. The atom has none, so
its `limitations` is not a caveat slot bolted onto existing prose, it is the
atom's only prose. A survey carrying both a body and a caveat field was
saying the same thing in two places.

`ERF-29` is retired and its id is not reused. The substance survives as
guidance in the survey section: a survey cited for an absence or a
sparseness reading should close by stating what its acts did not cover and
how deeply hits were inspected, and a complete search of a closed corpus
correctly has nothing to state. The three surveys in the reference practice
and the example corpus had their bounds folded into their bodies verbatim.

### 2026-08-23 — the v1 pare-down

The specification is cut to what an implementer needs. 1,306 lines to
1,129; 85 requirements to 64; 22 non-normative notes to 9.

**Section 4 regrained.** It held 52 of the 85 requirements and almost none
of them were checked by anything, so most of the document's normative
weight was authoring advice wearing MUST. Each record type now reads as
one unit: what it is for, how to write one well as prose, then the
numbered promises the format makes about it. A promise is a statement
about what a record *means*; advice about writing a good one is no longer
numbered. Section 4 fell to 34 requirements.

**Requirement ids flattened.** `ERF-<section>.<sequence>` with letter
suffixes became `ERF-1` through `ERF-64`, a flat sequence carrying no
meaning beyond identity. The old scheme had already rotted: section 4's
numbers ran backwards once, one base appeared in the order c, d, a, e, f,
b, g, and two ids were retired silently. Ids are stable only once
published, so this was the last free moment. The old-to-new mapping is in
`DESIGN-HISTORY.md`, which is what keeps historical citations readable.

**Three things that were broken.** The manifest's governing key was
`schema_version` in one place and `spec_version` in four others, so a
producer could not tell which to write; `spec_version` throughout now. A
requirement described a `locator` field that never existed in the data
model, and is cut. A requirement asked an audit verdict to name the atoms
that carried the weight, which no field could hold and a strict producer
could not satisfy, and is cut.

**Vocabulary.** `canonical store` and `collection document` are gone as
terms of art, the first said plainly in one rule and the second admitting
outright that it carried no meaning. `substrate` is redefined without
leaning on the term that left. `realm` is now mechanical, the set of
corpora one corpus registry lists, which removes a circular definition.
`binding` is `narrative binding` everywhere, because the short form reads
as a programming term. Section 8 is renamed *Storage*: it was called a
conformance class and is not one.

**Notes.** History left the specification for the design history, which
gained a fourth part holding it: the flatten's mapping table, the naming
conventions that govern whoever edits the spec, the personal-corpus
disclosure, the multi-operator sketch, and the retirements the spec used
to narrate. Notes that help someone build, or that prevent a specific
misreading, stayed.


Everything below is pre-publication iteration. The format has not shipped a
version yet, so these dated entries record how the design moved rather than
what changed between releases; at first publication they become **v1.0** and
version numbers start meaning something. The durable record of what was
decided, and why, is the register in `DESIGN-HISTORY.md`.

### 2026-08-23 — the example corpus gains real captures

The example corpus shipped no captured copies, so the reference viewer's
best screen, a verbatim quote highlighted inside its source, was implemented
and never exercised. Four atoms now quote two W3C Recommendations, PROV-DM
and PROV-O, whose Document License permits redistributing portions of a
document provided the original link, the copyright notice, and the status
travel with the copy. The captures carry all three, the quote check runs
green on all four, and the capture pages show the highlight.

The five atoms whose sources cannot be republished keep their explicit
absence entries. The mixed state is deliberate: it is what the format looks
like in the ordinary case, where some evidence travels and some does not,
and the viewer says which is which. `captures.yaml` now records a licence
alongside each shipped path.

### 2026-08-23

The question record type is removed. A minor-version change rather than a
patch, because a record type leaving is a change to what the format is.

The measurements behind the decision, from the reference practice: 25
question records across five corpora, every one `status: open`, not one ever
marked answered or parked, `answered_by` never written once in a year, two
with sub-questions, four cited by compiled documents. The lifecycle
machinery was unexercised, but the records themselves were real and in use.
This is a scope decision taken to keep v1 shippable, not a finding that
questions were useless: the 25 questions still exist, carried as prose in
per-corpus `open-questions.md` documents beside the corpora they belong to.

Removed with it: `Question`, `QuestionId`, `QuestionStatus`, `ERF-4.22`,
`ERF-4.23`, section 4.5, the question rows in the field reference, and the
question status vocabulary. Sections 4.6 through 4.8 renumber to 4.5 through
4.7; no requirement id is renumbered and no retired id is reused.

`Claim.bears_on` and `ERF-6.7a` go too, and the honest account is that they
were four hours old. `bears-on` was admitted as a fifth relation in v1.0.3,
moved to a field in v1.0.7 because `edges` is claim-to-claim, and removed
here because its only possible target was a question. The link it carried is
preserved: each of the 18 claims that bore on a question now says so in its
working notes, in prose, naming the question and where it lives. The relation
vocabulary stays at four.

### 2026-08-23

`bears-on` becomes the `bears_on` field and stops being a relation. This
partially reverts v1.0.3 from earlier the same day.

The evidence that admitted it was sound and stands: 18 live edges recorded
that a claim bears on an open question, and nothing else in the format could
say that. The placement was wrong. `edges` is the claim-to-claim structure,
and every other record type a claim reaches already has its own typed field,
so `atoms_for`, `atoms_against`, and `surveys` were the pattern and a
question id inside `edges` was the anomaly. That anomaly is what made the
normative prose contradict the data model: `ERF-6.7a` demanded a question
target while `edges` was typed `to: ClaimId`, so the model forbade the legal
case and permitted the illegal one.

A field fixes it with no union and no widened target type. `Claim` gains
`bears_on: QuestionId[]`, the `Relation` union returns to the ratified four,
and `ERF-6.7a` now says plainly that edges are claim-to-claim and a tie to a
question lives in `bears_on`. The reverse direction, which claims bear on a
question, is computed rather than stored, like the reciprocal of
`conflicts-with`.

The external reviewer caught the placement rather than the evidence, and
said so explicitly: admitting the relation was not shown to be a mistake,
adding a heterogeneous target to a claim-only interface was.

### 2026-08-23

`ERF-4.5` reserved `[...]` for an omission and said a bare `...` was a
literal source character. `ERF-6.12b`, written the same day, treated any
ellipsis as a wildcard. The two rules contradicted each other, and the
looser one could pass a quotation the source never contained: quoting
"Wait... what?" matched a capture reading "Wait, despite the warning,
what?", and the mechanical check whose only job is fidelity blessed it.

Only `[...]` elides now. Bare `...` and `…` are matched literally. The
quote is split on `[...]`, every non-empty span must occur in the capture
in order and without overlap, and a quote of nothing but elisions fails
rather than trivially passing.

The gap between spans stays unbounded, stated explicitly with its reason:
an elision marker is the author's assertion that they removed material,
and whether the removal misleads is a judgment for the audit rather than a
distance a validator can measure.

Both working implementations had the same defect and are corrected. The
pilot checker had a second one that the fix removes: it split on bare dots,
which left stray brackets in every span of a `[...]` quote and would have
failed all of them.

### 2026-08-23

`ERF-6.5` was not a total function. A claim whose current stances are all
`against` matched none of its four branches, so the format's central
computed state was undefined for a legal input and two validators could
legitimately disagree about it. Found by a cross-vendor adversarial review.

The rule now discards withdrawn stances before computing, because
withdrawal is exit rather than opposition, and reads what remains: nothing
is `retired`, all `for` is `active`, all `against` is `rejected`, a mix is
`contested`. No standings at all remains `proposal`. Every input has exactly
one reading, and there is still no tie-break.

`rejected` is a fifth disposition, and `ERF-6.5a` forbids conflating it with
`retired`: a rejected claim is one every current holder judges false, a
retired one is one every current holder has left. The vocabulary grew
because a function was partial, not because a state was wanted, and it grew
without a forcing instance because totality is a property of a rule rather
than a feature.

The earlier rule also read one `for` and one `withdrawn` as disagreement,
reporting a contest that was not happening. That is fixed by the same
discard.

### 2026-08-23

Six areas the reference consumer could not implement from the text alone.
Every one was found by building `erf-view` against the specification rather
than against the existing tooling, which is what a reference consumer is
for.

**Omitted lists are not missing fields** (`ERF-7.4a`). The data model types
list fields as required and the serialization omits them when empty, and
until now nothing said what a reader does with the gap. A reader
materializes an omitted list as an empty one, and an omitted list means
none rather than unknown. This covers `finding_audit`, so an atom nobody
has audited is a complete record with an empty audit list. The model
describes a record in memory; the serialization rules describe the file;
the two differ on purpose. The viewer reported 28 divergences from this
alone, and reports none now.

**Quote normalization is defined** (`ERF-6.12a`, `ERF-6.12b`), as a ten-step
ordered sequence applied identically to quote and capture, taken from the
working implementation rather than invented. Case is explicitly NOT folded,
because case is part of a verbatim quote and folding it lets a mis-cased
quote pass a check whose whole job is fidelity. Elision markers are
wildcards, spans must occur in order, and a quote that is nothing but
elisions fails rather than trivially passing.

**Binding syntax has a grammar** (`ERF-4.25`). Ids are whitespace-separated,
never comma-separated, and the anchor is required, because it is how
software finds the passage after edits. A binding whose id resolves to
nothing MUST be reported and MUST NOT be dropped silently (`ERF-4.26a`):
hiding a broken citation turns it into a confident sentence.

**The manifest has a schema** (`ERF-7.7`): `id`, `title`, `spec_version`,
and `classification` required, a `policy` block and an `owner` optional. A
consumer MUST refuse a corpus whose `spec_version` it does not support
(`ERF-7.7a`), because reading one under the wrong version fails silently.

**The capture mapping has a shape, and absence is explicit** (`ERF-4.4a`,
`ERF-4.4b`). Every atom has an entry, giving either a path or a recorded
absence with a reason from a closed set: `not-redistributable` and
`licence-unverified`. A missing entry is a defect rather than a signal,
because `ERF-6.8a` cannot otherwise tell "no capture exists" from "nobody
wrote it down".

**A narrative is a document, not a record** (`ERF-4.26b`). It has no
evidence, no standings, and no disposition, which is exactly why it stays
out of the data model: nothing about it is adjudicated, and a reader
disputes the claims it binds to rather than the prose.

### 2026-08-23

A fifth relation, `bears-on`, admitted on a forcing instance rather than on
symmetry. It records that a claim bears on a question, it MUST target a
question, and it asserts nothing about whether that question is answered
(`ERF-6.7a`). It is the only relation whose target is not a claim.

It exists because widening validation from documents to whole corpora
surfaced 18 edges still using `answers`, a relation retired months earlier,
every one of them pointing at a question that remains open. Folding them
into each question's `answered_by` would have asserted ten answers nobody
gave, so the relation was readmitted instead, under a name that claims only
what the records support.

The lesson is recorded in the design history as the fourth reversal: a
retirement is only as good as the coverage of the check that confirmed the
disuse.

### 2026-08-23

`ERF-6.5` no longer breaks ties. It said the corpus owner's newest stance
governed when stances differed, which contradicted the format's own
position that quorum and merge resolution are out of scope because what a
disagreement means is a judgment rather than a computation. Disposition now
follows the current stances alone: none is a proposal, disagreement is
contested, agreement gives active or retired. `contested` is terminal, and
which disposition permits a use remains corpus policy. `owner` accordingly
means only the person who sets that policy, and `ERF-6.6` now tests
argument leaves on the computed disposition.

`ERF-6.8a` is new: a consumer must not present a claim as backed to a
reader who cannot resolve that backing. The classification wall constrains
what a record rests on inside a corpus and says nothing about what a reader
sees when a reference crosses a boundary, which is where a backed claim and
a bare assertion become indistinguishable. Resolvability is reader-relative
and computed at read time. A reader-safe summary of hidden evidence was
considered and rejected: it is a second version of the truth to maintain,
and an unfalsifiable claim of backing offered where it can least be checked.

### 2026-08-23 — nomenclature and self-description

Field names now carry the noun that tells a reader the type, the pattern
`fetched_url` and `source_quality` already followed.

| Was | Is |
|:--|:--|
| `modified` | `last_modified` |
| `as_of` | `as_of_date` |
| `handle` | `short_name` |
| `backing_audit` | `evidence_audit` |
| `prior` | `prior_survey` |
| `hits` | `hits_reported` |

`backing_audit` named nothing on the record, since a claim has no
`backing` field. `evidence_audit` names what the audit is about and
survives surveys becoming backing, which `atoms_audit` would not have.

**Atoms self-describe.** Every atom carries its own `type` and `corpus`,
as claims, questions, and surveys already did. `ERF-7.2` now says records
self-describe rather than files, and `ERF-7.3` is rewritten: a collection
document may group records of one type, but carries no meaning of its
own, and a record extracted from one is complete without it. The earlier
inheritance rule was fitted to one file layout, and an atom's corpus had
become its confidentiality boundary, which is not something to leave
implicit in a container.

**Realm.** The word `registry` was doing three jobs: the corpus registry,
the file holding many atoms, and the operator-or-organization scope
introduced a day earlier for cross-party identity. The third is renamed
**realm** and defined in section 2: the set of corpora one operator or
organization governs, and the scope within which ids are unique. The
second is retired as a term of art in favor of *collection document*.
An atom id's leading token is a corpus prefix, not a registry prefix.
`ERF-4.11`, `ERF-4.11b`, `ERF-6.1`, and `ERF-6.2` are reworded; the
corpus registry keeps its name and gains a definition that says it
registers corpora, not sources.

### 2026-08-22

First published version. The format was extracted from a working practice
rather than designed up front: roughly 740 audited atoms and 300 claims
and questions across seven corpora preceded the specification, and a pilot
ran the records on a third-party substrate before it was written. Every
field and vocabulary value in it was admitted on a forcing instance and
several were retired again on measurement.

What was tried, what was retired, and the measurements that decided each
are in `DESIGN-HISTORY.md`. Changes from this version on are recorded
here, one entry per dated change, naming the requirement ids it touched.
