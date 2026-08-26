---
id: B-31
kind: defect
status: closed
priority: closed
contested_because: >
  Stale at HEAD: the note the entry proposed is now in ERF-48's own text,
  and ERF-40 and ERF-63 say the rest.
priority_because: "ERF-40 already says the check runs against the substrate history and ERF-63 requires that history; no fixture exercising it is a suite limitation (Fable)."
basis: reported
raised: "trial 4 undecidable 5, 2026-08-25 (S8)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      The proposed resolution, a note that these rules bind the substrate's
      history, landed in ERF-48 on 2026-08-26 under F-030; ERF-40 already read
      "verified against the substrate's history".
---

# B-31 · Append-only rules cannot be checked from a single corpus snapshot

`ERF-40` and `ERF-48`'s append-only exemption constrain a transition between two states, not any one state. No fixture in this format can exercise them.

## Proposed resolution

A note in section 6 that these bind the substrate's history, which `ERF-63` already implies. **Hold:** the SQL trial is testing exactly this distinction and should inform the wording.

## Consolidation note (2026-08-26)

The entry asked for "a note in section 6 that these bind the substrate's
history". At HEAD `ERF-40` reads "an edit or deletion of an existing
entry is a violation, verified against the substrate's history", `ERF-63`
requires "an edit history sufficient to verify `ERF-40`", and `ERF-48`,
rewritten on 2026-08-26, says of its own transition clause: "that is the
whole of what a validator decides here, since a corpus holds no prior
value to compare against. A producer SHOULD advance it with every edit".
The three together say what the entry wanted said. The hold on the SQL
trial's wording is moot; that trial closed on 2026-08-25. That no fixture
can exercise a transition rule is a limitation of the suite the entry's
own priority note already recorded, not a defect in the text.

## Resolution

Closed 2026-08-26, ruled by the operator on the consolidation pass's verdict: `ERF-48` says what a validator decides from a single corpus, `ERF-40` names history as the ground for append-only, and the `NOT-CHECKED` line names the rest.
