---
# ERF-72 (the `x_` extension namespace) and ERF-57 (unknown fields preserved
# and reported) meeting a CLOSED schema.
#
# `x_confidence` is a legal extension field a producer MAY originate.
# `granted` is an unknown field: a producer violation under ERF-55, and one a
# consumer "MUST preserve [...] MUST report [...] and MUST NOT reject".
# `x_review` is a nested object, to test whether the escape hatch preserves
# structure and number type.
#
# A .proto file cannot say "any field whose name begins x_". Both land in
# map<string, google.protobuf.Value> fields, which costs: (a) ordering, since
# proto3 declares map ordering undefined; (b) integer fidelity, since Value's
# only number type is double.
id: citation-round-trip
type: claim
corpus: proto-trial
title: "A CSL citation block cannot be carried through a closed wire schema
  without either enumerating CSL or losing integer fidelity"
epistemic_kind: observation
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
atoms_for: [pt-001]
x_confidence: 3
x_review:
  reviewer: "human:reviewer-b"
  rounds: 2
  passed: false
granted: true
---
A CSL citation block cannot be carried through a closed wire schema without
either enumerating CSL or losing integer fidelity.
