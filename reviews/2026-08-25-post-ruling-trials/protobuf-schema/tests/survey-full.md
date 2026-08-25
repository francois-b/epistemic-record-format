---
# Exercises SearchAct's two optional fields in all three states, and
# notable_results[].atoms as the SECOND optional list.
#
#   searches[0]: `scope` present, `timestamp` absent (inherits `conducted`,
#                per ERF-28) -- absence is a live inheritance rule
#   searches[1]: `scope` PRESENT AND EMPTY, `timestamp` present
#   searches[2]: `scope` absent, `timestamp` absent
#
#   notable_results[0]: `atoms` absent  -- no hit minted yet (ERF-28: an entry
#                       may gain "its `atoms` once a hit is minted")
#   notable_results[1]: `atoms` PRESENT AND EMPTY
#   notable_results[2]: `atoms` present with an id
#
# `hits_reported` is TEXT in every act, including "0". ERF-27: "a record MUST
# NOT state precision the instrument did not give." An int32 here would be a
# conformance bug: "~120 reported, two pages inspected" is a legal value.
id: presence-semantics-in-wire-formats-2026-08-24
type: survey
corpus: proto-trial
title: "Whether any interchange schema language records an empty collection
  distinctly from an absent one"
conducted: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "optional[[:space:]]+repeated"
    scope: "the proto3 language guide, sections on field presence"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "has_presence"
    scope: ""
    hits_reported: "~40 reported, first two pages inspected"
    timestamp: "2026-08-24T16:00:00Z"
  - tool: "manual review"
    query: "every field in section 3 of SPEC-as-tried.md carrying a `?`"
    hits_reported: "24 optional fields, of which 2 are lists"
notable_results:
  - what: "proto3 forbids `optional repeated`"
    note: "The language has no syntax for an optional list at all, so the two
      optional lists in the data model must each be re-encoded as a wrapper
      message or silently flattened."
  - what: "A singular message field carries explicit presence"
    note: "Which is what saves `evidence_at_stance`, and only that."
    atoms: []
  - what: "Enum zero members are mandatory"
    note: "Every closed vocabulary gains a member the specification does not
      have."
    atoms: [pt-004]
prior_survey: presence-semantics-in-wire-formats-2026-07-02
---
## What was after

Whether a schema language exists whose default encoding preserves the
absent/empty distinction without an explicit opt-in.

## Coverage bounds

The acts covered proto3, JSON Schema, and Avro. They did not cover Thrift,
Cap'n Proto, or FlatBuffers, and the absence reading here is sparseness rather
than absence.
