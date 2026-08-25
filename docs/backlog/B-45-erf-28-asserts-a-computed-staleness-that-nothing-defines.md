---
id: B-45
kind: defect
status: open
priority: P1
priority_because: "`ERF-28` asserts a computed survey staleness that nothing in the format defines, which is the specification stating something about itself that is not true; provisional pending verification by someone other than the raiser."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-45 · `ERF-28` asserts a computed staleness that nothing defines

"Staleness of a claim's survey backing is computed from `conducted` timestamps, never stored." `ERF-47` enumerates only `finding_audit`, `evidence_audit` and narrative bindings; surveys are absent, and no threshold exists against which a `conducted` date could be stale. The reference implements three staleness readings and none for surveys.

## Proposed resolution

Either `ERF-47` covers surveys, or `ERF-28` stops claiming it.
