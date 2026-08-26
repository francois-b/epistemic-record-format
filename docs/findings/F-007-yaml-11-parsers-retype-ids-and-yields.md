---
id: F-007
raised:
  by: "claude-opus-5, from a probe written by the stopped Ruby trial"
  on: 2026-08-25
  observation: "Under a YAML 1.1 parser, ids, family names, search queries and hits_reported values silently change type; the `on` key fixed under ERF-58 was one instance of a general class"
basis: demonstrated
priority_note: >
  ship-blocker for 0.9 — confirmed independently by a second trial. The
  protobuf harness failed to load ERF-14's own worked example: `as_of_date:
  2018` is JSON number grammar, so ERF-65 makes it an integer into a string
  field. `spec_version: 1.0` breaks ERF-61 the same way, parsing as a number
  that renders back as `1` with the minor version gone.
specified:
  by: null
  on: null
  requirement: "ERF-27, ERF-65, ERF-14"
  claim: null
verifications:
  - by: "Protobuf trial, independently, 2026-08-25"
    on: 2026-08-25
    verdict: accurate
    note: >
      Reached the same defect from a different direction and found a case
      this finding missed: `spec_version: 1.0` silently loses its minor
      version, which ERF-61's version discipline rests on.
outcome: promoted
promoted_to: "ERF-65, ruled directly 2026-08-25"
---

# F-007 · A YAML 1.1 parser retypes ids, queries and yields

## Provenance

A cold Ruby trial was launched to stress the YAML layer and stopped early on
the operator's judgement that Ruby duplicated the Python trial's lens. It had
already written `probes/psych_probe.rb`, which survives at
`reviews/2026-08-25-post-ruling-trials/ruby-implementation/probes/`. Run under
Ruby 4.0.6 / Psych 5.3.1 / libyaml 0.2.5. The trial was the wrong instrument;
the probe was the right one.

## What it shows

**Ids and names stop being strings when they look like something else.** A
mapping key is retyped exactly as a scalar is:

    no: {}     -> key false     (FalseClass)
    on: {}     -> key true      (TrueClass)
    off: {}    -> key false
    null: {}   -> key nil
    1984: {}   -> key 1984      (Integer)
    012: {}    -> key 10        (Integer)
    1.0: {}    -> key 1.0       (Float)

`ERF-58`'s `on` key, fixed today, was one instance of this class and not the
whole of it. Source ids are mapping keys in the source list (`ERF-3`), and
family names are bare scalars. Nothing in the format constrains either away
from `no`, `off`, `1984`, or `012`. A source id of `012` is the integer 10 in
Ruby and the string `"012"` in JavaScript, and no atom naming it resolves.

**`hits_reported` is worse, because `ERF-27` requires text.** Unquoted:

    0          -> 0 (Integer)          1:30      -> 5400   (sexagesimal)
    012        -> 10                   12:30:00  -> 45000
    0x1F       -> 31                   .inf      -> Infinity
    +3         -> 3                    .nan      -> NaN

`ERF-27` exists to stop a survey inventing precision it did not have. A
survey recording a yield of `12:30:00` gets 45000. And a search `query: no`
becomes boolean `false` — the query itself, destroyed.

**`as_of_date`'s three precisions parse as three different types.** This one
touches a ruling made today (`B-24`):

    as_of_date: 2018      -> 2018 (Integer)
    as_of_date: 2018-06   -> "2018-06" (String)
    as_of_date: 2026-08-23 -> Date, or under Psych's safe defaults an error

## Why it may matter

`ERF-65` requires frontmatter to parse under YAML 1.2's **JSON schema**, and
that is the format's answer to most of this: under it, `no`, `on` and `012`
all stay strings. So a *conforming consumer* is safe.

Three things it does not settle.

**A conforming producer can still write a landmine.** `ERF-65` binds how a
file MUST be parsed; nothing forbids a producer minting a source id of `no`.
Under the required parser it is fine. Under Psych, PyYAML, or any other 1.1
default, the file is silently a different document. `ERF-58` accepted that
this was worth preventing at the schema level rather than delegating to
`ERF-65`; the same argument reaches ids.

**`as_of_date: 2018` is a number even under the JSON schema.** JSON's number
grammar covers `2018`, so `ERF-65` makes it an integer, not the string
`"2018"`. `ERF-14` says the field may be "a year" without saying whether a
year is text or a number, and two implementations will type it differently
while both conform.

**`hits_reported` is typed by prose alone.** `ERF-27` says text; nothing in
the serialization rules requires the quoting that makes it text.

## Candidate directions, none ruled

- Constrain id syntax so an id cannot resolve to a non-string under any
  common schema (the format already requires a prefix plus a sequence number
  in `ERF-13`; making that binding for every id class would close it).
- Say plainly that `as_of_date` is a string in every precision.
- Require quoting for the fields whose type is carried by prose.

## Resolution

Ruled 2026-08-25 after the operator reframed it. The model was never
ambiguous: `as_of_date` is a string in `types/erf.ts`, the specification's
examples quote it, and every corpus in the repository quotes it. The fault
sits at the interchange layer, which the format chose and therefore owns.

One sentence on `ERF-65`: where the model types a field as a string and its
bare spelling would resolve otherwise under the JSON schema, a producer MUST
quote it, and a validator MUST report a string-typed field that arrived as
any other type. The loader now does, for `as_of_date`, `spec_version`, and
each search act's four text fields. Fixture
`invalid/as-of-date-unquoted-year`. The general class of ids and family
names resolving to non-strings is the same rule and the same obligation.
