---
id: B-30
kind: defect
status: closed
priority: closed
priority_because: "Whether a closure includes its own root decides whether a premise-less argument is a flag or a violation, so two validators reach opposite conformance verdicts on the same corpus."
basis: reported
raised: "trial 1 ambiguity A3 and trial 4 undecidable 4, 2026-08-25 (S5)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-30 · `ERF-43` and `ERF-49` collide at the flag boundary

A premise-less argument is a flag under `ERF-49` and a violation under `ERF-43` when reached as a closure leaf. Whether a closure includes its own root is unstated and decides which fires. Separately, whether a flag-only corpus is still in the loads-clean class has no answer.

## Proposed resolution

State whether the closure includes its root, and state what a flag means for conformance.

## Resolution

Ruled 2026-08-25, in two parts, because the entry held two questions.

**The closure does not include its own root.** `ERF-43` now says so. An
argument with no premises therefore has an empty closure and satisfies the
rule vacuously; what is wrong with it is that nothing backs it, which is
`ERF-49`'s flag. Reading the root into its own closure made the same record
a violation under one requirement and a flag under the other, and `ERF-49`
plainly contemplates that record as a flag, so the reading that contradicts
it is the wrong one.

The asymmetry this leaves is deliberate and worth naming: a premise-less
argument standing alone is a flag, and the same argument reached as a leaf
of someone else's closure is a violation on the claim built above it. The
defect is the chain that claims to be grounded and is not, and it is
located on the claim that made the claim.

**A flag is not a violation.** Stated once, generally, in section 2 beside
the conformance classes rather than a sixth time in a requirement. Flags
exist because several conditions this format cares about arise without
anyone editing the record that carries them, and three are now named
together as instances of one principle: `ERF-35`'s stranded evidence,
`ERF-32`'s aged binding, `ERF-43`'s hollowed argument. A corpus carrying
flags and no violations conforms; a consumer may neither present a flag as
failure nor hide one.

**Implementation.** Nothing enforced the closure rule at all: the loader
checked self-edges and cycles and stopped. `premiseClosure` and
`argumentLeaves` are new, the violation is wired into the loader, and
`retiredPremises` implements the retired-leaf flag `ERF-43` has required
since it was written and no code performed. Measured before wiring: zero
closure violations and zero unbacked flags across all three live corpora,
so the new check changes no existing verdict.

Fixtures `invalid/closure-ends-in-argument-leaf` and
`valid/premise-less-argument-is-a-flag` are deliberately the same record in
two positions, so the boundary is pinned by contrast rather than asserted.
