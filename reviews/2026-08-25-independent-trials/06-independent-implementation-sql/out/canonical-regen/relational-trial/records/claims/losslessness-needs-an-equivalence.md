---
id: losslessness-needs-an-equivalence
type: claim
corpus: relational-trial
title: A requirement that records round-trip without loss is not checkable until the equivalence relation on records is stated
epistemic_kind: observation
created: {timestamp: "2026-08-21", by: agent/claude-fable-5}
short_name: loss-needs-equivalence
families: [interchange]
atoms_for: [rt-004, rt-005]
surveys: [round-trip-equivalence-2026-08-24]
standings:
  - timestamp: "2026-08-24T16:40:00Z"
    stance: for
    by: human:trial-operator
    why: "The round trip run in this trial produced three different answers to whether a record survived, depending on which equivalence was applied, which is the claim."
    evidence_at_stance: {atoms_for: [rt-004, rt-005]}
evidence_audit:
  - {auditor: fixture-auditor-b, verdict: SUPPORTED, timestamp: "2026-08-24", protocol: evidence-audit-v1}
semantic_query: round trip lossless equivalence byte identity canonical serialization
---
A requirement that records round-trip without loss is not checkable until the equivalence relation on records is stated.

## Working notes

Three candidate equivalences, all defensible: byte identity of the file;
equality of the parsed frontmatter mapping plus the body; equality after
canonicalization by a named writer. The format asserts the property and names
none of them.
