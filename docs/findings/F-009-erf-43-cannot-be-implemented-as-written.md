---
id: F-009
raised:
  by: "Haskell trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "ERF-43 requires a transitive traversal to terminate and does not forbid the cycle that makes it non-terminating"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — a requirement that cannot be implemented as written"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-43, ERF-24"
  claim: >
    ERF-43 forbids cycles in `assumes` and `decomposes-into` and says
    nothing about `supports`, while the closure it defines includes the
    incoming `supports` edges of other claims. Two arguments that support
    each other therefore have a premise closure with no leaf.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
    Confirmed in SPEC.md: the cycle prohibition names exactly two
    relations, and the closure definition draws in incoming `supports`.
    The reference implementation terminates only because it carries a
    visited set the specification does not authorise.
outcome: open
---

# F-009 · `ERF-43` cannot be implemented as written

## What the text says

> An argument's premise closure, followed transitively (its outgoing
> `assumes` edges and the incoming `supports` edges of other claims, per
> `ERF-24`), MUST terminate in non-argument leaves. Self-edges MUST NOT
> exist; `assumes` and `decomposes-into` MUST admit no cycles.

The prohibition names `assumes` and `decomposes-into`. The traversal
includes `supports`. Claim A supports B, B supports A: both are permitted
records, and the closure of either has no leaf.

## Why re-reading would never have found it

This was found by writing the function, not by reading the requirement. The
prose is fluent and the omission is invisible until a traversal is actually
implemented and hangs. It is the strongest argument in this repository for
the purity boundary: three earlier trials, a reference implementation, a
conformance suite and two linters all missed it.

## Note on the reference implementation

`premiseClosure` carries a `seen` set, added on 2026-08-25 when the closure
rule was first implemented at all. It terminates. Nothing in the
specification tells an implementer to do that, and the Haskell trial
recorded carrying one as an unauthorised deviation, which is the correct
reading.

## Candidate resolutions, none ruled

1. Add `supports` to the acyclicity prohibition. Simplest; makes a mutually
   supporting pair a violation.
2. Require the traversal to be over distinct claims, authorising the visited
   set explicitly, and flag a revisit rather than reject it. Permits the
   corpus and makes the tool total.
3. Both: forbid the cycle AND require termination, so a validator meeting a
   non-conforming corpus still halts.
