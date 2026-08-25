---
# PRESENCE CASE P-3. `surveys?: SurveyId[]` -- the only OPTIONAL LIST on a
# record, and the field proto3 cannot express, because `optional repeated` is
# forbidden outright.
#
# Written here PRESENT AND EMPTY. That is itself an ERF-55 producer violation
# ("Empty lists MUST be omitted"), and it is written anyway because the
# question is what a reader does with it. Pair with claim-surveys-absent.md.
#
# `families`, `atoms_for` and `edges` are also present and empty, for the same
# reason: they are total lists in the type, so the `?` on `surveys` is either
# information the others lack, or noise. The spec does not say which.
id: universal-negative-scoped-only
type: claim
corpus: proto-trial
title: "No shipped knowledge-management tool records a per-person, reasoned,
  append-only standings ledger with computed dispositions"
epistemic_kind: observation
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
short_name: "no ledger anywhere"
families: []
atoms_for: []
atoms_against: []
surveys: []
edges: []
semantic_query: "append-only per-person position ledger with reasons,
  knowledge management, provenance tooling"
---
No shipped knowledge-management tool records a per-person, reasoned,
append-only standings ledger with computed dispositions.

## Working notes

ERF-25 makes this a scoped audit rather than a proof, and directs the claim to
cite surveys rather than atoms. It cites neither yet.
