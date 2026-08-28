---
id: B-45
kind: defect
status: closed
priority: closed
priority_because: "Fable: the dangling clause has nothing to implement and no two implementations diverge on it."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed: ERF-47 enumerates three staleness readings and surveys are in none of them."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-45 · `ERF-28` asserts a computed staleness that nothing defines

"Staleness of a claim's survey backing is computed from `conducted` timestamps, never stored." `ERF-47` enumerates only `finding_audit`, `evidence_audit` and narrative bindings; surveys are absent, and no threshold exists against which a `conducted` date could be stale. The reference implements three staleness readings and none for surveys.

## Proposed resolution

Either `ERF-47` covers surveys, or `ERF-28` stops claiming it.

## Resolution

Ruled 2026-08-27 (operator): surveys age, they do not go stale. `ERF-28`
no longer speaks of staleness; `ERF-47` gains a fourth reading, survey
age, the `conducted` timestamp of the newest survey a claim lists,
reported as a date and never judged against a threshold, because no fixed
interval makes an old search wrong. The reference implements it as
`surveyAge`; fixture `valid/survey-age-is-reported` pins it (two surveys of
one sought, the newer is the age). This also settles the `B-69` line that
listed the struck sentence as a restatement.

## Consolidation note (2026-08-26)

Still live at HEAD. `ERF-28` still closes with "Staleness of a claim's
survey backing is computed from `conducted` timestamps, never stored",
and `ERF-47`, rewritten on 2026-08-26 to name what each audit kind
judged, enumerates a `finding_audit`, an `evidence_audit` and a narrative
binding, with surveys in none of them. `B-69` (definitions repeated) lists
the same sentence as a restatement of `ERF-47`; one ruling on the
sentence settles both, and this entry is the one that asks for it.
