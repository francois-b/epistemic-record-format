---
title: "Corrected-spec trials, 2026-08-25"
purpose: "Two cold re-tests of the seven requirements rewritten after the post-ruling trials, scoped to those requirements and told to attack the corrected quote check."
status: non-normative
last_updated: 2026-08-25
---

# Corrected-spec trials, 2026-08-25

Seven requirements were rewritten in response to the post-ruling trials
(`ERF-3`, `31`, `41`, `43`, `51`, `52`, `65`, plus the Validator class and
section 7's bindings framing), each ruled, implemented and fixtured by one
hand. These two trials read `SPEC-as-tried.md` and `BINDING-as-tried.md`,
snapshots at commit `a1e14f8`, under the purity boundary, and were asked one
narrow question: does the new text determine one implementation, or still
admit several? Each was also told to attack the corrected quote check.

| Trial | Lens | Outcome |
|---|---|---|
| `python-implementation/` | PyYAML is a YAML 1.1 reader; the binding requires 1.2 | Nine fabrication attempts, **eight passed**; the whole-words rule had stopped the original attack and nothing else. Twenty-eight remaining ambiguities across the seven, registered with readings |
| `swift-implementation/` | Native typed language, no install | Nineteen attempts, eleven passed, five real; found that the grammar's `id` production could swallow the next binding, and that the loss definition excluded its own example |

Everything both found was verified against the reference implementation
before ruling, ruled the same day as `F-016`, and pinned with fourteen new
conformance cases and six fixtures. The two independent findings of the
same holes (format characters, hyphens, punctuation edges) are the strongest
evidence in this repository that a fix which only its author has read is
not yet a fix.

Compiled output (`.build/`) is not committed; the sources rebuild it.
