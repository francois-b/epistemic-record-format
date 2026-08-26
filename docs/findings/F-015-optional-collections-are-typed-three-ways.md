---
id: F-015
raised:
  by: "Haskell trial and Protobuf trial independently, 2026-08-25"
  on: 2026-08-25
  observation: "The data model marks some list fields optional and others required, and ERF-56 gives a reason that applies equally to both"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — ERF-49's flag depends on the answer and two implementations disagree about when it fires"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-55, ERF-56, ERF-49"
  claim: >
    Section 3 writes `atoms_for: AtomId[]` as required and
    `surveys?: SurveyId[]` as optional four lines apart. ERF-56 says an
    omitted list is materialized as empty and explains that the model types
    such fields as required because they are always present in a loaded
    record; that reason covers `surveys` too, and no reason is given for
    the difference.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
      Both trials hit it. Protobuf could not express it at all: proto3
      forbids `optional repeated` outright, so the two readings produce
      schemas that are not wire-compatible at that field.
outcome: closed
resolution_note: >
  Stale at HEAD (closed at the consolidation pass, claude-fable-5,
  2026-08-26). The TypeScript mirror that carried `surveys?:` left section
  3 on 2026-08-25 and is no longer normative; the schema, which is, types
  every list the same way and says so on each: `surveys` is "Total in the
  model; omitted on the wire when empty (ERF-55, ERF-56)", the same words
  as `atoms_for`. ERF-56 at HEAD: "A reader MUST materialize an omitted
  list-typed field as an empty list, because presence means what it says:
  an omitted list means none, never unknown". The rule this decided
  behaviour for, ERF-49, was retired on 2026-08-26; unbacked is now a
  section 2 definition read from the fields ("carries no `atoms_for`, no
  `surveys`"), so the reading that never fired the flag has no `?` left to
  read. `types/erf.ts` still writes `surveys?: SurveyId[]`, a rendering
  held to the schema by a gate that binds nothing.
---

# F-015 · Optional collections are typed inconsistently, and `ERF-49` depends on it

## The inconsistency

`atoms_for: AtomId[]` is required. `surveys?: SurveyId[]` is optional. They
sit four lines apart in one interface, and `ERF-56` supplies a reason for
the required spelling that applies to both.

## Why it decides behaviour

`ERF-49` flags as unbacked an `observation` someone stands on with "empty
`atoms_for` and empty `surveys`". An implementer who reads the `?` as
meaningful — absent means *unknown* rather than *none* — never fires the
flag, because the field is not empty, it is missing.

## What protobuf added

proto3 forbids `optional repeated` outright, so the two readings produce
schemas that are not wire-compatible at that field. One of the two readings
cannot even be written down in that encoding.

## Candidate resolution, not ruled

Drop the `?` from every list-typed field, since `ERF-56` already says an
omitted list is an empty list and gives the reason. The `?` is decoration
that contradicts the rule beside it.
