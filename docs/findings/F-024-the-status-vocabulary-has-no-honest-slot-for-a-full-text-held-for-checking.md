---
id: F-024
raised:
  by: "the Bitter Lesson closed-loop trial, 2026-08-26"
  on: 2026-08-26
  observation: "a 1,100-word essay held in full for the quote check is not a short quotation, yet shipped-as-quotation is the only status that lets a normalized text exist under no licence; 24 of 31 sources used it and most are a stretch"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-68, section 5 status vocabulary"
  claim: null
verifications: []
outcome: open
---

# F-024 · The status vocabulary has no honest slot for a full text held for checking

`ERF-68` scopes `shipped-as-quotation` to "a text shipping under no licence
as a short quotation". Every other status that admits no licence
(`not-redistributable`, `access-restricted`, `licence-unverified`) means no
normalized text is held, which makes every atom on the source uncheckable.
The trial held Sutton's essay in full, and long excerpts of a dozen papers
and blog posts, because the quote check needs the text. It wrote
`shipped-as-quotation` on 24 of 31 sources; only the 7 Wikipedia and
Wikiquote sources could honestly say `shipped` with an SPDX identifier.

The gap is structural: verifiability requires holding text, and the licence
vocabulary offers one honest way to hold text one does not own, sized for a
sentence. Related: F-019 (a multi-range excerpt would shrink what must be
held).

## Candidate resolutions, none ruled

- Widen the status: "held for checking, not for redistribution", with the
  consumer duty that follows (the text is not to be republished).
- Keep the status and let the excerpt route (F-019) make short quotations
  achievable, so the stretch disappears rather than being legitimized.
