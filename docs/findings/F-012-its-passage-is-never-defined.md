---
id: F-012
raised:
  by: "Go trial and Haskell trial independently, 2026-08-25"
  on: 2026-08-25
  observation: "ERF-31 requires an anchor to occur in 'its passage' and never says where a passage begins"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — the anchor check has no defined operand, and two implementations flag differently"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-31, ERF-32"
  claim: >
    ERF-31 uses the phrase 'its passage' four times and defines it
    nowhere. Section 2 says a binding closes a passage, so a passage ends
    at its marker; where it starts is stated in no sentence.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
      Confirmed in SPEC.md. Both trials chose 'since the previous binding'
      and both recorded the choice as unforced; the Go trial exposed all
      three readings behind a flag rather than pick one silently.
outcome: promoted
promoted_to: "ERF-31, ruled directly 2026-08-25"
---

# F-012 · "Its passage" is never defined, so the anchor check has no haystack

## The gap

At least four readings are defensible: since the previous binding; the
preceding paragraph; since the last heading; the whole narrative body. They
disagree on ordinary edits, and both cold implementations flagged the
ambiguity independently.

## Why the choice is not cosmetic

Under the **whole-body** reading the check is close to vacuous: an anchor
lifted from anywhere in a long document matches, so the mechanism that
exists to detect edited prose detects almost nothing.

Under the **paragraph** reading it false-flags ordinary writing, because a
sentence split across a paragraph break moves text out of the passage
without changing its meaning.

`ERF-31` says in its own words that this failure "went unnoticed until
something else happened to look", so the sensitivity of the check is the
entire point of having it, and the sensitivity is undefined.

## Note on the reference implementation

The 2026-08-25 ruling on `B-34` and `B-35` chose the whole-body reading
without recording that a choice was being made, which is the weakest of the
four on the Go trial's reading. This finding reopens that.

## Candidate resolutions, none ruled

1. Define a passage as the text since the previous binding, or the start of
   the body when there is none.
2. Define it as the containing CommonMark block.
3. Define it as the text since the last heading of any level.

## Resolution

Ruled 2026-08-25: a binding's passage is the text from the end of the
previous binding's marker, or the start of the body where there is none, to
the start of its own marker. Both cold implementations had chosen this
reading independently and recorded it as unforced; it is now forced. The
whole-body reading, which the earlier `B-34` ruling had taken without
recording a choice, is named in the requirement as the one that makes the
check nearly vacuous.

Measured: all 26 anchors across the three live corpora still occur within
their own passage. Fixture `valid/anchor-in-an-earlier-passage` carries an
anchor whose words occur only above the previous binding, and asserts the
flag fires.
