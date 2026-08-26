---
id: F-020
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "Building top-down, three rules fought the workflow for one reason: a claim that needs evidence not yet found has no state, ERF-49 is silent in a corpus of proposals, and ERF-47 ages every audit as evidence arrives"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-55, ERF-56, ERF-49, ERF-47"
  claim: null
verifications: []
outcome: promoted
promoted_to: "ERF-49, ruled directly 2026-08-26"
---

# F-020 · The format assumes evidence-first and never says so

Narrative to claims to atoms is the order the author works in, and three
rules resist it for one cause.

**No state for "evidence needed, not yet found".** An empty `atoms_for` is
omitted (`ERF-55`) and omission means none (`ERF-56`), so a claim awaiting
its search is indistinguishable from one whose search found nothing. The
survey side has a vocabulary for the second; the claim side has none for
the first.

**`ERF-49` cannot fire in a corpus of proposals.** It flags an unbacked
observation someone stands on, and a corpus an LLM builds for a person to
rule on has no standings, so the one check that says "this claim has no
evidence at all" is silent exactly when the author most needs it. The
trial tracked unbacked claims outside the format.

**`ERF-47` ages every audit as evidence arrives.** `ERF-20` gave the
standings side `evidence_at_stance` for this unrecoverable-context problem
and gave audits nothing equivalent.

## Candidate resolutions, none ruled

- State the assumption, and what changes when working the other way.
- Let `ERF-49` fire on a proposal too, as a weaker flag ("no evidence
  yet") distinct from "unbacked and stood on".
- An audit-time evidence stamp, the audit analogue of `evidence_at_stance`.

## Resolution

Ruled 2026-08-26 by the operator, whose workflow is the top-down one and
who declined the first candidate outright: the format must not state that
evidence precedes assertion, because that is false of how it is used. The
rules describe a corpus's state, whatever order it was built in, and
`ERF-49` now says so.

Two of the three collisions dissolve on the operator's second point, that
the interval is derivable. A claim with no atoms and no surveys has not
been searched; one with a survey and no atoms was searched and nothing was
found; that is what surveys record, and no claim-side state is needed. The
audit stamp is declined: a standing is a person's act and cannot be re-run,
which is why `ERF-20` stamps it, while an audit is an LLM call and can, and
`ERF-47`'s stale flag is the instruction to run it again.

The one change is a reading, not a state, and not a duty either. The
operator declined "a validator MUST flag" as presuming a reader who wants
telling: an unbacked claim conforms. `ERF-49` now says what backing is and
how it is read from the corpus, that unbacked is a state and not a fault, and
that a consumer MAY show the list, saying whether anyone stands on each. A
corpus written from its narrative down is mostly unbacked for most of its
life, and the list the trial kept outside the format is now something any
consumer can compute.
