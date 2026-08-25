---
# Exercises: the Relation vocabulary including both HYPHENATED members, which
# are illegal as proto enum identifiers and so need a hand-written name table;
# a full standings ledger with a `withdrawn` exit; and an empty body.
#
# PRESENCE CASE P-6b: the body below the frontmatter is EMPTY. ERF-18 makes it
# a SHOULD that a claim's body open by restating the title, so an empty body is
# a departure and not a violation. There is no syntax in the interchange form
# for "no body" as distinct from "empty body", so proto3's `string body` with
# implicit presence matches the format exactly here.
id: presence-is-data
type: claim
corpus: proto-trial
title: "In this format the absence of a field is itself an assertion, not a
  missing value"
epistemic_kind: argument
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
last_modified: {timestamp: "2026-08-25T08:00:00Z", by: "human:francois"}
families: [presence]
edges:
  - {to: proto3-destroys-evidence-at-stance, relation: supports}
  - {to: universal-negative-scoped-only, relation: assumes}
  - {to: universal-negative-scoped-only-b, relation: decomposes-into}
  - {to: citation-round-trip, relation: conflicts-with}
standings:
  - timestamp: "2026-08-24T09:00:00Z"
    stance: for
    by: "human:francois"
    why: "ERF-71 says a missing digest 'itself tells a reader what kind of
      source it was', which is presence carrying data outright."
    evidence_at_stance:
      atoms_for: [pt-001]
      atoms_against: []
  - timestamp: "2026-08-25T07:00:00Z"
    stance: withdrawn
    by: "human:francois"
    why: "Withdrawn as too broad; the narrower version is the one about
      evidence_at_stance. Exit, not opposition."
evidence_audit:
  - {auditor: gpt-5.5, verdict: PARTIAL, timestamp: "2026-08-24",
     protocol: evidence-audit-v1}
---
