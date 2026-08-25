---
# PRESENCE CASE P-5a. Two vocabulary faults a CONSUMER must survive.
#
# `source_quality` is omitted. The data model types it as required (no `?`),
# so this record is non-conforming -- but ERF-57 forbids a consumer to reject
# it: "a consumer MUST NOT reject a corpus over unknown fields, unknown types,
# or records it cannot interpret." So a consumer must READ it, and proto3
# gives it SOURCE_QUALITY_UNSPECIFIED, which is indistinguishable from the
# same field written as a legal value that happens to encode to zero. There
# is no such legal value here only because this schema reserved zero.
#
# The finding_audit entry carries `verdict: FAILED`, outside the closed set of
# ERF-12. ERF-12 forbids WRITING it ("A failed, unparseable, or abandoned
# audit MUST NOT be written as a verdict"); ERF-57 forbids REFUSING it. A
# proto3 enum can hold an unknown NUMBER but not an unknown STRING, so the
# value has nowhere to go and lands on the zero member -- the exact
# indistinguishability ERF-12 is written to prevent.
id: pt-004
type: atom
corpus: proto-trial
finding: "An audit run that produced nothing is an audit that did not happen."
quote: "an audit that produced nothing is an audit that did not happen"
source: okf-spec-v0-2
created: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: some-tool, verdict: FAILED, timestamp: "2026-08-24",
     protocol: finding-audit-v2}
---
