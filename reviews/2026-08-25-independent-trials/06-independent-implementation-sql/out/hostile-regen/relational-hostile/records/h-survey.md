---
id: hostile-styles-2026-08-24
type: survey
corpus: relational-hostile
title: Which legal YAML constructs a canonical writer cannot reproduce
conducted: {timestamp: "2026-08-24", by: agent/claude-fable-5}
searches:
  - tool: manual enumeration
    query: constructs permitted by YAML 1.2 JSON schema and not fixed by ERF-53/65/66/67
    hits_reported: 8 constructs
  - tool: "grep -c (BSD grep, macOS 15)"
    query: "case 9: an unquoted yield, which ERF-65 resolves to an integer while ERF-27 and the SearchAct type both say string"
    hits_reported: "12"
notable_results:
  - what: comments
    note: "YAML comments are not data, so no data model can hold them; the round trip drops them silently."
---
Enumerated by hand while writing the hostile corpus.
