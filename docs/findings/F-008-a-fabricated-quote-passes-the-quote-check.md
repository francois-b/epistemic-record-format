---
id: F-008
raised:
  by: "Go trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "An elided quote whose spans match mid-word passes the quote check, so an atom can attribute words to a source that never contained them"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — the soundness of the mechanism the whole format rests on"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-51, ERF-52"
  claim: >
    Splitting on `[...]` before normalization, then normalizing each span
    independently, leaves plain substring containment. A span may therefore
    match inside a longer word, and a quote assembled from such fragments
    passes.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
    Run against the reference: quote `The cat[...]sat` against the text
    "The catapult was heavy. Someone eventually sat on the mat beside it."
    returns PASS.
outcome: open
---

# F-008 · A fabricated quote passes the quote check

## The demonstration

    capture : The catapult was heavy. Someone eventually sat on the mat beside it.
    quote   : "The cat[...]sat"
    VERDICT : PASS

The atom records that the source says *"The cat … sat"*. It says nothing of
the kind. Every condition `ERF-52` states is satisfied: both spans are
non-empty, both occur in the normalized text, they occur in order, and they
do not overlap.

## Mechanism

Two rules interacting, each defensible alone.

`ERF-52` splits the quote on `[...]` **before** normalization, correctly,
because normalization would otherwise destroy the marker. Each span is then
normalized independently. `ERF-51` step 3 ends *"then trim"*.

Trimming each span removes the whitespace that made it a whole word at its
edge. What remains is tested by substring containment, and `The cat` is a
substring of `The catapult`.

## Why this outranks everything else open

Every other claim the format makes rests on this one. The audits, the
standings, the argument that machines may fill a corpus because the
mechanical parts are mechanically checkable: all of it assumes a green quote
check means the source said the words. Here it does not.

`ERF-61` makes the timing decisive. Fixing this after publication flips
currently-passing corpora to failing, which is a MAJOR version change by the
format's own definition. Before publication it costs a sentence.

## Candidate resolutions, none ruled

1. **Word boundaries at elision-adjacent edges only.** Narrowest fix; kills
   this attack and leaves un-elided quotes matching as they do now.
2. **Word boundaries at every span edge.** Also rejects quoting `cat` out of
   `catapult` with no elision at all, which is the same dishonesty without
   the trick. Closer to what "verbatim" means; costs the ability to quote a
   word fragment deliberately.
3. **Do not trim span edges adjacent to an elision.** Preserves the author's
   own spacing as the boundary signal. Elegant, but depends on authors
   spacing elisions consistently.
