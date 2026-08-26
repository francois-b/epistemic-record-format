---
id: B-53
kind: defect
status: contested
priority: P3
contested_because: >
  Stale at HEAD: the failure the entry names, a byte-order mark failing a
  verbatim check, cannot happen under ERF-51 step 2, and section 7 now
  says a file in a requirement means a held byte sequence.
priority_because: "Real and cheap, but it needs a capture actually saved with a byte-order mark before it costs anyone anything."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      ERF-51 step 2 removes every Default_Ignorable_Code_Point and names the
      byte-order mark; section 7 scopes 'file' to held raw and normalized
      bytes. Both halves of the proposed resolution are at HEAD.
---

# B-53 · `ERF-67`'s encoding clause does not clearly reach captures

`ERF-67` reads "A record body MUST be valid CommonMark, and a file MUST be UTF-8 encoded with LF line endings and no byte-order mark", in a requirement whose first clause is record-scoped. The quote check runs against capture bytes, and `ERF-51`'s normalization has no step that removes a byte-order mark: `U+FEFF` survives NFKC and is not whitespace. So a capture saved with a BOM can fail a verbatim check for a byte nobody chose, which is the exact failure `ERF-67`'s own rationale names.

## Proposed resolution

Scope the encoding clause to every file a corpus holds, captures included, or add a normalization step.

## Consolidation note (2026-08-26)

The entry's mechanism was that `ERF-51` had "no step that removes a
byte-order mark". At HEAD step 2 reads: "Unicode NFC (UAX #15), then
remove every code point carrying the Unicode property
`Default_Ignorable_Code_Point`: the soft hyphen, the zero-width space, the
joiners, the byte-order mark." The scope half is answered in section 7:
"Requirements that speak of a *file* mean a held byte sequence, raw or
normalized, and are the model's", and `ERF-67` in the binding says "a
file MUST be UTF-8 encoded with LF line endings and no byte-order mark".
A normalized text saved with a BOM is a binding violation and, if it
reached the fold anyway, would fold identically. Nothing left to rule.
