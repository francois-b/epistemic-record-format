---
id: F-002
raised:
  by: "claude-fable-5, backlog review"
  on: 2026-08-25
  observation: "the normative data model file still carries text the specification retired"
basis: demonstrated
specified:
  by: "claude-fable-5, in the same pass"
  on: 2026-08-25
  requirement: "section 3, ERF-17, ERF-59"
  claim: "SPEC.md section 3 says types/erf.ts governs where the two differ, and that file still dates itself v1.0 against a 0.9.0 specification, still calls a claim's corpus a confidentiality tier, and still says the corpus registry governs classification disputes although the registry was retired on 2026-08-24"
verifications:
  - by: "claude-opus-5, read the file directly"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed: header 'v1.0, 2026-08-24'; line 157 'Confidentiality tier'; lines 219-220 name the retired registry as governing"
outcome: promoted
promoted_to: "B-50"
---

# F-002 · SPEC.md section 3 says types/erf.ts governs where the two differ, and that file still dates itself v1.0 against a 0.9.0 specification, still calls a claim's corpus a confidentiality tier, and still says the corpus registry governs classification disputes although the registry was retired on 2026-08-24
