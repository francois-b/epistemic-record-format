---
# PRESENCE CASE P-1 -- THE CENTRAL ONE.
#
# ERF-55: "a mapping that is present and empty asserts existence, per section
# 3, and MUST be written. ERF-20's `evidence_at_stance` is why the distinction
# is worth a sentence. Absent, it says the ruler stamped nothing; present and
# empty, it says the ruler stamped, and faced no evidence. Those are different
# facts, and ERF-20 calls the second the one thing about a ruling's context
# that cannot be recovered later, so a producer tidying `{}` away destroys it
# and makes never-stamped and stamped-facing-nothing the same bytes."
#
# Three standing entries below, differing only in that field:
#   [0] absent            -- the ruler stamped nothing
#   [1] present, empty    -- the ruler stamped, and faced no evidence
#   [2] present, with two EMPTY LISTS written out -- an ERF-55 producer
#       violation (empty lists MUST be omitted) that a consumer must still
#       read, and which must fold onto [1] rather than onto [0]
id: proto3-destroys-evidence-at-stance
type: claim
corpus: proto-trial
title: "A wire format without explicit presence cannot record the difference
  between a ruler who stamped nothing and a ruler who stamped and faced no
  evidence"
epistemic_kind: observation
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
families: [presence, wire-formats]
atoms_for: [pt-001, pt-002]
standings:
  - timestamp: "2026-08-24T10:00:00Z"
    stance: for
    by: "human:francois"
    why: "The rule is stated in ERF-55 in as many words, and the failure mode
      is named there too."
  - timestamp: "2026-08-24T11:30:00Z"
    stance: for
    by: "human:reviewer-b"
    why: "Ruled with nothing attached to the claim at the time; recording that
      I faced nothing is the point."
    evidence_at_stance: {}
  - timestamp: "2026-08-24T12:15:00Z"
    stance: against
    by: "human:reviewer-c"
    why: "Written out longhand rather than omitted, which ERF-55 forbids a
      producer to do but obliges a consumer to read."
    evidence_at_stance:
      atoms_for: []
      atoms_against: []
---
A wire format without explicit presence cannot record the difference between a
ruler who stamped nothing and a ruler who stamped and faced no evidence.

## Working notes

The three entries above are the measurement. If a round trip returns three
entries whose `evidence_at_stance` state is (absent, present-empty,
present-empty), the encoding preserved the distinction ERF-55 protects and
normalized the ERF-55 producer violation in the third. If it returns
(absent, absent, absent), the encoding destroyed it.
