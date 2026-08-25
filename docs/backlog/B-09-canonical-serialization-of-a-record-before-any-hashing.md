---
id: B-09
kind: capability
status: open
priority: trigger-driven
basis: anticipated
raised: "design period"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
trigger: "A content-addressed id, a capture manifest, or signatures."
---

# B-09 · Canonical serialization of a record, before any hashing

The real blocker rather than the choice of hash: two byte-different files can hold the same record, and neither multihash, Subresource Integrity, nor a Trusty URI says how to canonicalize YAML-plus-markdown first.
