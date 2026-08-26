---
id: B-63
kind: defect
status: open
priority: P3
priority_because: "Guidance only: section 4 says its craft prose binds nothing, so no implementation is misled and no verdict changes. It is here because the measured failure rate is the highest in the format and the text that addresses it is the shortest."
basis: demonstrated
raised: "F-023, the top-down essay corpus trial, 2026-08-25: a cross-vendor audit returned PARTIAL on 46 of 123 findings"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-023; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-63 · Section 4.2 gives four sentences to the act where a third of atoms fail

The quote is checked by machine and the finding by judgment. In careful
hands the finding failed about a third of the time: 46 of 123 audited
atoms came back PARTIAL, the finding claiming more scope, certainty or
specificity than its quote carries. Section 4.2's "Writing one well" is
four sentences ("one sentence a stranger could check", names the actor and
the time scope, hedges as hard as the source, compression is a defect).
The specification's proportions are inverted relative to where the errors
are: pages on the fold, a paragraph on the one act with no mechanical check
behind it.

## Proposed resolution

Section 4.2 grows a short, concrete list of the ways a finding overreaches
its quote, drawn from the 46: a scope wider than the quote's subject, a
certainty the source hedged, a specificity (number, date, actor) the quote
does not carry, a causal reading of a correlational sentence. Non-normative,
like the paragraph it extends.
