---
id: B-53
kind: defect
status: open
priority: P2
priority_because: "Real and cheap, but it needs a capture actually saved with a byte-order mark before it costs anyone anything."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
---

# B-53 · `ERF-67`'s encoding clause does not clearly reach captures

`ERF-67` reads "A record body MUST be valid CommonMark, and a file MUST be UTF-8 encoded with LF line endings and no byte-order mark", in a requirement whose first clause is record-scoped. The quote check runs against capture bytes, and `ERF-51`'s normalization has no step that removes a byte-order mark: `U+FEFF` survives NFKC and is not whitespace. So a capture saved with a BOM can fail a verbatim check for a byte nobody chose, which is the exact failure `ERF-67`'s own rationale names.

## Proposed resolution

Scope the encoding clause to every file a corpus holds, captures included, or add a normalization step.
