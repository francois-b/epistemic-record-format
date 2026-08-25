---
id: F-010
raised:
  by: "Haskell trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "ERF-51's NFKC step folds the ellipsis character to three periods, which ERF-52 requires to be matched literally as distinct source characters"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — two requirements contradict each other on the format's own comparison"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-51, ERF-52"
  claim: >
    ERF-52 states that a bare `...` and a bare U+2026 are literal source
    characters that MUST be matched literally. ERF-51 step 1 applies NFKC,
    under which U+2026 decomposes to three periods, so the two are the same
    string by the time any comparison runs.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
    Run against the reference: normalizeForCheck(U+2026) and
    normalizeForCheck("...") both return "..." and compare equal.
outcome: open
---

# F-010 · NFKC reintroduces a character fold `ERF-51` deliberately deleted

## The demonstration

    ellipsis U+2026 folds to: "..."
    bare ... folds to       : "..."
    equal after folding?     true

## The contradiction

`ERF-52`:

> A bare `...` and a bare `…` are literal source characters and MUST be
> matched literally (`ERF-6`).

`ERF-51` step 1 applies Unicode NFKC, which decomposes U+2026 to three
FULL STOP characters. The requirement to match them literally cannot be
met by a conforming implementation of the sequence that runs first.

## The sharper version

`ERF-51` was cut from seventeen steps to three on 2026-08-25, and its own
non-normative note explains at length why the character folds went: an
author who retypes a character is guessing at their own evidence. Step 1
puts one of those folds back, silently, because NFKC is a package of folds
rather than a single operation and nobody enumerated what it contains.

The trial's phrasing is worth keeping: the note says the folds were removed
on principle, and NFKC is a fold.

## Candidate resolutions, none ruled

1. Change `ERF-52` to admit that the two are equal after normalization,
   which is honest but abandons a distinction it argued for.
2. Use NFC rather than NFKC. NFC is canonical composition and does not
   decompose U+2026; NFKC's compatibility folds are what reintroduce the
   character equivalences. This would need measuring against the corpora,
   because NFKC is also what folds the ligatures and fullwidth forms that
   extraction tools emit, which was the reason for choosing it.
3. Keep NFKC and enumerate, in the non-normative note, which folds it
   brings, so the choice is at least visible.
