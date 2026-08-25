---
title: "ERF v0.9: genuine ambiguities found by implementing the spec cold in Rust"
trial: "05-independent-implementation-rust"
date: 2026-08-25
---

# Ambiguities

The subset of `friction-log.md` I judge to be real defects: places where two careful
implementers, reading only this document, would ship validators that disagree about a
conforming corpus. Ordered by how much damage the disagreement does.

Each entry states the requirement, the two readings, what erfval does, and why.

---

## A1. ERF-51, ERF-52: the normative behavior lives in files the specification does not contain

**What the spec says.** "The prose above names each transformation; the conformance case
files (`conformance/cases/normalization.txt` and `conformance/cases/quote-check.yaml`, this
repository) are normative for its exact behavior: where a reading of the prose and a case
disagree, the case governs."

**Reading 1.** The prose is a complete specification of the sequence and the cases are
regression tests over it. An implementer with the prose alone can conform.

**Reading 2.** The prose is a summary and the cases are the specification. An implementer
with the prose alone cannot conform, and cannot know whether they have.

**Chosen.** Reading 1, because it is the only one available in this trial. Eleven of the
seventeen steps required a judgement call that a case file would have settled in one line
(entries 65 to 74 in the friction log). Two examples where I would bet on a disagreement:
whether `![alt](url)` reduces to `alt` or to `!alt`, and whether step (b) removes every
brace pair or only attribute-shaped ones.

**Why it matters more than the other entries here.** ERF-51's stated purpose is that "two
conforming tools reach the same verdict on the same pair". A specification whose exact
behavior is delegated to files outside itself cannot deliver that to a reader who has the
specification. Either fold the cases into the document (a table of input and output pairs
is short) or state in section 1 that the Validator conformance class requires the
conformance suite as well as this document.

---

## A2. Timestamps: the type comment and every example disagree

**What the spec says.** `interface ActorStamp { timestamp: string; by: Actor } // RFC 3339`.
Then every example writes `created: {timestamp: 2026-07-19, ...}`. Then ERF-19 requires a
full instant for standings *only*, and explains that "a bare date remains correct where
nothing is ordered, as in an atom's `as_of_date` or a survey's `conducted`".

**Reading 1.** The `// RFC 3339` comment governs the type: every timestamp is a full
date-time, and the examples are sloppy. A validator rejects `2026-07-19` everywhere.

**Reading 2.** ERF-19's carve-out shows the format admits two precisions, and RFC 3339 is
named loosely (RFC 3339 §5.6 does define `full-date` as a production, just not as a
`date-time`). A validator accepts both, and demands the instant only in `standings`.

**Chosen.** Reading 2. ERF-47 legislates the comparison of "a bare date against a full
instant", which would be dead prose under reading 1, and ERF-19's own justification says
precision "is required here and nowhere else".

**Fix.** Say it in the data model: `timestamp: string // RFC 3339 full-date or date-time;
standings require date-time (ERF-19)`.

---

## A3. ERF-49: what does "someone stands on" mean

**What the spec says.** "A validator MUST flag as unbacked an `observation` someone stands
on with empty `atoms_for` and empty `surveys`."

**Reading 1.** The claim has at least one standing entry, ever. Withdrawals count: someone
did stand on it.

**Reading 2.** Someone currently stands on it: at least one person's newest entry is `for`,
which is exactly the ERF-41 inputs that make a claim `active` or `contested`.

**Chosen.** Reading 2. A claim everyone has withdrawn from (`retired`) is by ERF-41's own
words one "every current holder has left", and flagging it as unbacked would report a
defect nobody is asserting. But reading 1 is defensible and cheaper, and the two readings
differ on every retired or rejected claim in a corpus.

**Fix.** Write it as "a claim whose computed disposition is `active` or `contested`".

---

## A4. ERF-43: an argument with no premises at all

**What the spec says.** "An argument's premise closure, followed transitively [...] MUST
terminate in non-argument leaves." And separately, ERF-49 flags "such an `argument` with no
premises, meaning no outgoing `assumes` edge and no incoming `supports` edge".

**Reading 1.** An argument with no premises has an empty closure with no leaves at all, so
ERF-43 is vacuously satisfied and ERF-49's flag is the whole response.

**Reading 2.** An argument with no premises is a closure that terminates in an argument
(itself), which is exactly what ERF-43 forbids. Every unbacked argument is then both a flag
and a violation.

**Chosen.** Reading 1 for the argument itself, reading 2 for an argument reached through
another argument's closure. That split is defensible but I do not think it is derivable
from the text, and it makes conformance depend on whether anything points at you.

**Why it matters.** The two readings differ on severity, and ERF-43's own note explains why
that matters: "an act the format permits cannot retroactively make a corpus
non-conforming". Under reading 2, deleting one `assumes` edge turns a legal corpus
non-conforming, which is the outcome the note argues against.

---

## A5. ERF-2: a requirement with no field to satisfy it

**What the spec says.** "A web page is mutable: its capture MUST be dated."

**Reading 1.** The date lives inside the capture file (the section 4.1 prose says "capture
when you first read something"), so this is a rule about capture authoring and a validator
cannot check it.

**Reading 2.** The date belongs on the source. But the `Source` interface has no such field:
`fetched` holds a `url` and a `digest`, `status`, `path`, `reason`, `licence`,
`licence_name`, `excerpt`, `converter`. There is nowhere to put it.

**Chosen.** Reading 1, reported as a notice on every shipped web capture saying the check
cannot run. A validator that silently passed ERF-2 would be claiming to check something it
has no data for.

**Fix.** Add `fetched.retrieved` (a date) to the `Source` shape, or state in ERF-2 that the
date lives in the capture text and is out of a validator's reach.

---

## A6. ERF-68: is `status: shipped` with no licence a violation or a SHOULD departure

**What the spec says.** One requirement holds both "A source whose capture ships SHOULD name
the licence that permits it" and "A capture may also ship under no licence at all, as a
short quotation [...]; such a source MUST carry the status `shipped-as-quotation` rather
than leaving the permission unstated".

**Reading 1.** The whole requirement is advisory about licences; a `shipped` source with no
licence field has merely departed from a SHOULD.

**Reading 2.** The MUST bites: a capture ships under a licence or as a quotation, and those
are the only two bases. `shipped` with no licence names neither, which is precisely
"leaving the permission unstated".

**Chosen.** Reading 2, a violation. The SHOULD governs the *form* of the licence (an SPDX
identifier where one exists, prose otherwise); the MUST governs whether a basis is stated
at all. But the two sit in one paragraph and an implementer could easily read the SHOULD
as covering the whole thing.

---

## A7. ERF-32 and ERF-31: `bound-at` is required and optional in adjacent requirements

**What the spec says.** ERF-31's grammar: `[ws+ "bound-at=" date]`, square-bracketed,
optional. ERF-32: "A narrative binding MUST record `bound-at`, the date it was made, in the
marker itself" and then "A narrative binding without `bound-at` MUST be reported as
staleness `indeterminate`, never as current".

**Reading 1.** The grammar is descriptive of what exists in the wild; ERF-32's MUST is the
rule. A binding without `bound-at` is a violation, and the `indeterminate` sentence tells a
consumer what to do with the non-conforming ones it meets.

**Reading 2.** ERF-32's second sentence defines legitimate behavior for a legitimate state,
so `bound-at` is optional and only its staleness reading is constrained.

**Chosen.** Reading 1, and erfval reports both: the ERF-32 violation and the
`indeterminate` flag. Reporting one without the other loses information under either
reading.

---

## A8. No requirement id covers a missing required field, and none covers the actor grammar

**What the spec says.** Section 1: the Record class "Binds the data model (section 3) and
its record type's requirements (section 4)". Section 2 defines the actor forms and says
"Every actor id MUST follow this convention". Neither carries a number.

**Reading 1.** The data model is normative as a whole, so citing a section is right and the
numbering is simply not exhaustive.

**Reading 2.** Requirements are the unit of conformance ("diffed against an existing system
requirement by requirement"), so anything checkable should have an id, and their absence
means these are not conformance requirements at all.

**Chosen.** Reading 1, citing `§3` and `§2`. But this is the single biggest practical
problem for the specification's stated purpose: a diff tool that walks ERF-1 to ERF-72 will
report full coverage while missing "every record has an `id`", "an atom has a `quote`",
"an actor id is well-formed". Roughly a third of erfval's violations cite a section rather
than a requirement.

**Fix.** Number them. One requirement for "a record carries every field its type declares,
with the declared shape" and one for the actor grammar would close it.

---

## A9. ERF-65: the JSON schema forbids exactly what the examples do

**What the spec says.** "Frontmatter MUST parse under YAML 1.2 using the JSON schema [...]
Under it only `null`, the literals `true` and `false`, and JSON's own number grammar
resolve to non-string scalars; everything else stays a string. [...] A producer SHOULD quote
a timestamp regardless."

**Reading 1.** The requirement constrains the *reader's* resolution schema, not the
document's characters. An unquoted `2026-07-19` is a legal string under it, and the SHOULD
is the only thing the writer owes. No violation.

**Reading 2.** The requirement is on the file: a document that resolves differently under a
common library's default schema does not "parse under the JSON schema" in the sense
intended, since the hazard being excluded is precisely a legacy default.

**Chosen.** Reading 1 with a notice for the divergent cases. Under reading 2 every example
in section 4 of the specification would be non-conforming, which cannot be intended.

**Fix.** Say which side of the wire the requirement binds: "a consumer MUST resolve
frontmatter under the JSON schema" is a different rule from "a producer MUST write
frontmatter that resolves identically under the JSON, Core and YAML 1.1 schemas", and the
current sentence reads as both.

---

## A10. The corpus has no file layout, so "a corpus directory" is not defined

**What the spec says.** ERF-53 (one record per file), ERF-59 ("a corpus travels as a
directory or archive of its records and captures, and the declaration travels with it"),
ERF-3 (the source list's "interchange form is a YAML document"), and section 8's "how the
list is stored is the substrate's business".

**Reading 1.** The layout is deliberately unspecified, so a validator takes its inputs by
configuration and the question does not arise.

**Reading 2.** A validator is handed a directory, so *something* has to define which file is
the declaration and which is the source list. Every implementer will invent the same two
names and they will not match.

**Chosen.** Reading 2 with invented names (`corpus.yaml`, `sources.yaml`, plus aliases),
documented in the README. This is not a defect in the format's model; it is a gap in what
the Corpus conformance class means for a tool that reads a directory, and it makes
cross-implementation testing impossible without a side agreement.

**Fix.** One requirement fixing an interchange layout for a corpus that travels as a
directory, marked as binding on the interchange form only, as ERF-53 already does for
records.

---

## A11. ERF-48: is a second edit at the same instant a violation

**What the spec says.** "MUST set `last_modified` to a timestamp later than its `created`
and later than any prior `last_modified`. At date precision 'later' admits the same day."

**Reading 1.** The carve-out is about precision generally: equal stamps are admitted
whenever they cannot be ordered, instants included.

**Reading 2.** The carve-out names date precision specifically because a full instant can
always be ordered. Two equal instants are a violation.

**Chosen.** Reading 2. The requirement's own next clause ("a producer stamping a second edit
on the same day SHOULD write a full instant, which is what makes the ordering it owes
recoverable") only makes sense if instants are held to strict ordering.

---

## A12. ERF-52: is a span "non-empty" before or after normalization

**What the spec says.** "Every non-empty span MUST occur in the normalized capture [...] A
quote whose spans are all empty MUST fail rather than trivially pass."

**Reading 1.** Before normalization: a span with any characters in it must be found, so a
span of `**` (which normalizes to nothing) fails the check.

**Reading 2.** After normalization: a span that normalizes away has nothing to search for
and is skipped, and only a quote where *all* spans normalize away fails.

**Chosen.** Reading 2. The two differ on real inputs (a quote ending `[...]*` or containing
stray emphasis around an elision), and reading 1 would fail atoms whose quotes are
faithful.

---

## A13. ERF-41: two entries by one person at the same instant

**What the spec says.** "Computed [...] from the current stances alone, meaning each
person's newest entry."

**Reading 1.** File order breaks the tie, because ERF-19 and ERF-40 make the ledger
append-only and order-preserving.

**Reading 2.** Undefined, so a validator reports the ambiguity rather than picking.

**Chosen.** Reading 1. It is almost certainly right, but "newest" is doing load the spec has
not checked: ERF-19's requirement of a full instant reduces the chance of a tie without
eliminating it, and the disposition is the format's most consequential computed value.

---

## A14. ERF-35: must a reference resolve to the right *kind* of record

**What the spec says.** "Every reference MUST resolve within the deployment [...]
`atoms_for`, `atoms_against`, `edges.to`, and `surveys` name existing records. Ids are
deployment-unique (ERF-36), so one lookup serves every record type."

**Reading 1.** Existence is the requirement; the type aliases (`AtomId`, `SurveyId`) are
documentation, and "one lookup serves every record type" says the lookup is untyped.

**Reading 2.** `atoms_for: AtomId[]` means atoms; a survey id in `atoms_for` is a type
error even though the lookup succeeds.

**Chosen.** Reading 2, reported under ERF-35. Under reading 1 a corpus that cites a claim as
evidence for itself is conforming, which cannot be intended given ERF-23's insistence that
evidence against a claim is not modelled as a rival claim.

---

## A15. ERF-3 and ERF-4: a source with both a capture and a recorded absence

**What the spec says.** ERF-4: "Every source MUST either give its capture's path or record
that no capture is held and why." ERF-5: "A source recording an absence MUST carry a
`status` from a closed set and a human-readable `reason`."

**Reading 1.** "Either ... or" is inclusive: a source may ship a capture *and* record a
reason (for instance a partial capture with a note about what could not be retained).

**Reading 2.** The statuses partition: `shipped` and `shipped-as-quotation` mean a capture
ships, the other three mean it does not, and a status from the second group with a `path` is
a contradiction.

**Chosen.** Reading 2, because the status vocabulary is closed and its five values plainly
split into ships and does-not-ship. But nothing says so in as many words, and a validator
built on reading 1 would accept `access-restricted` plus a shipped capture, which is the
exact leak the status exists to prevent.
