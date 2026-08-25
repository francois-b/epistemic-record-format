---
id: B-48
kind: defect
status: open
priority: P1
priority_because: >
  Both reviewers: the class opens with every machine-checkable MUST that
  applies, and ERF-50 to 52 sit in section 6; the fix is an "including".
basis: demonstrated
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "Go trial, independently, 2026-08-25 post-ruling trials"
    on: 2026-08-25
    verdict: accurate
    note: >
      A cold implementer put this first of twenty-nine ambiguities. Its
      reading: under the exhaustive-list reading, ERF-6, ERF-9, ERF-12,
      ERF-13, ERF-14, ERF-19, ERF-26, ERF-27 and all of section 4.6 fall
      outside the Validator class, so "a tool that never opens a normalized
      text and never parses a narrative binding is a fully conforming
      validator". It also noted the reading is internally strained: ERF-31
      states a validator duty in a section the class list does not name.
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed: every sibling conformance class uses the same colon-then-list form exhaustively. ERF-6 dropped from its examples, since ERF-50 to 52 already sit in section 6."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-48 · The Validator conformance class omits section 4

Section 1 binds a validator to "section 6 in full, the serialization rules of section 7, and the declaration and source list", leaving `ERF-6` (verbatim quote), `ERF-12`'s closed verdict set and `ERF-19`'s precision outside a validator's declared duty, though all three are machine-checkable and the reference checks them. Trial 4's fixture i01 and reference bug R1 both landed in that unbound area.

## Proposed resolution

Widen the Validator class to every machine-checkable MUST wherever it sits.
