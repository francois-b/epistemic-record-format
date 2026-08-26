---
id: B-64
kind: defect
status: open
priority: P2
priority_because: "A vocabulary addition is a MINOR change, so it does not block; but the status a published corpus writes is a statement about rights, and 24 of 31 sources in the latest trial wrote one the requirement's own scope ('a short quotation') does not honestly cover. B-60 would relieve the pressure without answering whether a full text held for checking has a status at all."
basis: demonstrated
raised: "F-024, the Bitter Lesson closed-loop trial, 2026-08-26: a 1,100-word essay held in full, and long excerpts of a dozen papers and posts, all under shipped-as-quotation; only the seven Wikipedia and Wikiquote sources could write shipped with an SPDX identifier"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-024; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-64 · No status for a text held in full for checking

`ERF-68` scopes `shipped-as-quotation` to "a text shipping under no licence
as a short quotation". Section 5 glosses every other status that admits no
licence (`not-redistributable`, `access-restricted`, `licence-unverified`)
as an absence: no normalized text is held, and the schema's conditional
then requires a `reason`. So the only status under which a text one does
not own can be held at all is sized for a sentence.

Verifiability needs the text. The quote check (`ERF-50`) and the fidelity
check (`ERF-69`) both run against the normalized text and nothing else, so
a corpus that wants its atoms checkable holds it, and a corpus over an
essay holds the essay. The trial did, and wrote `shipped-as-quotation` on
24 of 31 sources because nothing else was available; most are a stretch
of "short quotation" and the author said so.

The gap is structural rather than a producer's error: the licence
vocabulary offers one honest way to hold text one does not own, and the
format's central mechanism requires holding it.

## Proposed resolution

Either widen the vocabulary: a status meaning held for checking and not
for redistribution, with the consumer duty that follows (the text is not
republished, a published cut drops it and the atoms become citations
without proof, which the security and privacy considerations already
describe). Or keep the vocabulary
and let `B-60` make short quotations achievable, so the stretch disappears
rather than being legitimized; that leaves the full-text case (the essay
itself) unanswered.
