# Reviews

Evaluations of this specification. A review asks whether the *document*
works: whether it can be implemented, authored against, and read the same
way twice by people who did not write it. That is a different question
from the one `conformance/` asks, which is whether a given implementation
obeys the rules.

The distinction matters for where things live. `conformance/` is an
**instrument**: permanent, versioned with the requirements, partly
normative, aimed at a stranger checking their own implementation. A review
is an **evaluation**: dated, historical, non-normative, aimed at whoever
decides what the specification should say next. Reviews produce errata and
conformance cases; they are not themselves either.

One folder per review, dated. Findings carry dispositions, so a later
reader can tell what was accepted from what was argued and declined.

| Review | What it was |
|---|---|
| `2026-08-24-adversarial-reads` | Two readers, one cross-vendor and one internal, reading the frozen text for defects. Verbatim output with per-finding rulings. |
| `2026-08-25-independent-trials` | Four trials that tested the document by building from it: an independent validator, two authoring trials at different scales, and an adversarial fixture set. Each ran with no access to this repository beyond `SPEC.md`. |
