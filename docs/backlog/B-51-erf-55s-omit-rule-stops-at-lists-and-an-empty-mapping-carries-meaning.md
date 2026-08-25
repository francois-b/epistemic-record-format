---
id: B-51
kind: defect
status: open
priority: P1
priority_because: "The distinction is expressible today and undefended, and losing it silently destroys the one fact about a ruling's context that ERF-20 says cannot be recovered later."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
  - by: "gemini-3.5-flash via mods, adversarial refutation prompt"
    on: 2026-08-25
    verdict: accurate
    note: >
      Returned `inaccurate` against the title, and its reasoning confirms the
      entry's actual claim. It argues the distinction IS expressible today,
      because ERF-55 says lists and nothing authorizes omitting an empty
      mapping, so `{}` present asserts existence under section 3. That
      refutes "inexpressible", which the entry never claimed: its
      priority_because reads "expressible today and undefended". Recorded
      accurate on the narrower claim, and the refutation narrows the fix from
      a new representation to one clause.
---

# B-51 · `ERF-55`'s omit rule stops at lists, and one empty mapping carries meaning

`ERF-55` requires empty **lists** to be omitted and says nothing about an optional mapping whose contents are all empty. `ERF-20`'s `evidence_at_stance` is an optional field holding two required lists, and section 3 says an optional field present asserts existence. So a ruling that was stamped and faced no evidence serializes as `evidence_at_stance: {}`, and that is genuinely different from the field being absent, which means the ruler never stamped anything. Nothing says so. A producer reading `ERF-55` as "empty means omit" destroys the distinction, at which point "never stamped" and "stamped, faced nothing" become the same bytes.

## Proposed resolution

State that `ERF-55` governs lists and that an optional mapping present-but-empty is meaningful, or give `evidence_at_stance` an explicit representation for the faced-nothing case.
