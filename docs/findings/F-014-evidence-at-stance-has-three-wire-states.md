---
id: F-014
raised:
  by: "Haskell trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "evidence_at_stance has three wire states, not two, and the idiomatic decoder in every mainstream language collapses two of them"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — the distinction ERF-20 calls unrecoverable is destroyed by the reader, not the producer"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-55, ERF-20"
  claim: >
    The 2026-08-25 ruling on ERF-55 distinguishes absent from present-and-
    empty. A YAML mapping admits a third state, an explicit null. Beyond
    that, aeson's `.:?`, Python's `.get()`, a Go nil map and a TypeScript
    optional field all map missing and null to one value, so the
    distinction survives only if an implementer deliberately abandons the
    standard idiom of their language.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
      The trial modelled it as `Presence a = Missing | ExplicitNull | Given a`
      and demonstrated the three reporting distinctly, which no other
      implementation of this format does.
outcome: closed
resolution_note: >
  Stale at HEAD (closed at the consolidation pass, claude-fable-5,
  2026-08-26). The third wire state is no longer admissible. The schema
  types EvidenceAtStance as an object with additionalProperties false, so
  an explicit null fails ERF-73 ("Every document a corpus holds MUST
  validate against `erf.schema.json`"); ERF-65 says "An empty scalar
  resolves to `null`", so `evidence_at_stance:` with no value is that null
  and is a violation, not a state. YAMLB-2 fixes the spelling of the
  remaining two: "an optional mapping that is present and empty MUST be
  written as `{}`, because presence asserts existence and
  `evidence_at_stance: {}` is a different fact from its absence". Missing
  and `{}` are distinguishable under every idiomatic decoder the finding
  names; only missing and null collapse, and null is now a producer error
  a validator reports before any of the format's rules run.
---

# F-014 · `evidence_at_stance` has three wire states, and readers collapse two

## What today's ruling assumed

`B-51` was ruled on 2026-08-25: absent means the ruler stamped nothing,
present-and-empty means the ruler stamped and faced nothing, and a producer
MUST NOT tidy the second into the first. Two states.

## What the wire actually admits

Three: absent, `evidence_at_stance: {}`, and `evidence_at_stance:` with no
value, which YAML resolves to null.

## The part that matters more

The ruling guards against a **producer** collapsing the distinction. The
trial's finding is that the **reader** collapses it first, by default, in
every mainstream language: `.:?` in aeson, `.get()` in Python, a nil map in
Go, an optional field in TypeScript. All map missing and null to the same
value before any of the format's rules get a chance to run.

So the fact `ERF-20` calls "the one fact about a ruling's context that
cannot be recovered later" survives only where an implementer deliberately
abandons their language's standard idiom, and nothing in the specification
tells them to.

## Candidate resolutions, none ruled

1. Rule that an explicit null is equivalent to absent, reducing three states
   to two, and say so where `ERF-55` makes the distinction.
2. Forbid the null spelling outright in the serialization rules.
3. Keep three states and name all three, which no reader will implement.
