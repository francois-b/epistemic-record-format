---
id: F-030
raised:
  by: "the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
  on: 2026-08-26
  observation: "Opus and Sol, sometimes all four, found six rules whose text either states two incompatible outcomes or forbids a field no record can hold since the schema closed"
basis: reported
specified:
  by: null
  on: null
  requirement: "ERF-31, ERF-48, ERF-41, ERF-20, ERF-11, ERF-47"
  claim: null
verifications: []
outcome: promoted
promoted_to: "ERF-31, ERF-48, ERF-41, ERF-20, ERF-11, ERF-47, ruled directly 2026-08-26"
resolution_note: >
  Ruled by the operator on 2026-08-26 ahead of 0.9.0, all six applied in
  one pass: ERF-31 has one outcome (a flag); ERF-48 keeps only what a
  corpus can decide (last_modified never precedes created) and makes the
  rest SHOULDs; ERF-41 reads every entry the schema admits and keeps the
  tie rule; ERF-20 drops the prohibitions on a closed object; ERF-11 says
  no field holds the mechanical result; ERF-47 names what each audit kind
  judged, and the reference's evidence-audit staleness now includes atoms
  edited or attached after the audit.
---

# F-030 · Six rules contradict themselves or forbid what the schema cannot hold

Each entry is one specific defect with the sentence that carries it.

- `ERF-31`: "the anchor MUST occur in its passage", then "a validator MUST
  flag an anchor that does not occur in its passage, a flag and not a
  violation". One condition, two outcomes. The reference flags.
- `ERF-48`: "later than any prior `last_modified`" needs history the
  corpus does not hold, and "later" while the same day is allowed is not
  an order. Only `last_modified >= created` is decidable.
- `ERF-41`: the admissibility test checks a stance in the vocabulary, an
  instant timestamp, and a `human:` author. Since option B every one of
  those is schema-enforced, so an inadmissible entry cannot exist in a
  valid corpus and the clause is dead text. What survives is the tie rule:
  same instant, later in the ledger wins.
- `ERF-20`: "drift MUST NOT be stored there" and "counts are not an
  acceptable digest either" forbid what `EvidenceAtStance`, a closed
  object of two arrays, cannot hold.
- `ERF-11`: "its result MUST NOT be stored" names no field any record has;
  the only writable slot is the `x_` namespace, which the rule does not
  mention.
- `ERF-47`: "the last change to what it judged" never says what an
  `evidence_audit` judged: the claim, its atoms, its surveys, its premises?
  Sol asked; the reference compares against the claim's own
  `last_modified` only.

## Candidate resolutions, none ruled

Pick one outcome for `ERF-31` (flag, since editing prose is permitted);
reduce `ERF-48` to what is decidable; cut `ERF-41` to the tie rule; keep
`ERF-20`'s producer SHOULD and drop the prohibitions; rephrase `ERF-11`
as "no field holds it, and a stored result under `x_` carries no
meaning"; give `ERF-47` one sentence per audit kind naming the dependency
set.
