---
id: B-35
kind: defect
status: closed
priority: closed
priority_because: "Kept at P1 against GPT: a wire grammar that cannot express a legal anchor is the cheapest thing to change before publication and the most expensive after (Opus, Fable)."
basis: reported
raised: "trial 3's closing author, 2026-08-25 (S20)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
    basis_corrected: "both broken anchors were repaired before commit, so nothing is re-runnable"
---

# B-35 · The binding grammar has no escape for a quote character in an anchor

Two anchors broke silently when the passage's own prose used scare-quotes: the file still parses, the binding simply stops matching, and only a validation script noticed.

## Proposed resolution

Either the grammar gains an escape, or the guidance forbids the character and a validator SHOULD flag an anchor that no longer occurs in its passage.

## Resolution

Ruled 2026-08-25, taking both halves, though only one is essential.

**The essential half: a validator MUST flag an anchor that does not occur
in its passage.** Neither this entry nor `B-34` asked for it, and it is the
actual fix for what both describe. Anchors break for the ordinary reason
that someone edited the prose, and until now nothing said a word: two
anchors broke silently in trial 3 and one in trial 2, each found by
accident. A flag rather than a violation, on section 2's principle, because
editing prose is an act the format permits.

**The second half: the anchor gains the escapes `\"` and `\\`.** A grammar
that cannot express a legal value is a defect in the grammar. A passage
whose own words sit in quotation marks has no quote-free span long enough
to be a useful anchor, so without the escapes it has no anchor at all. One
regex now against a breaking change after publication.

With the flag in place the escape is the smaller half, since "choose a
different span" stopped being a silent trap. It was taken anyway because
the stuck-author case is real and the cost is one line.

**A bug the fixture caught immediately.** The first implementation folded
the whole narrative body as the haystack, so every anchor occurred inside
its own binding comment and the check passed vacuously: a corpus where
every anchor was broken would have reported clean. The markers are now
stripped before folding. `valid/anchor-broken-by-an-edit` asserts the flag
fires rather than that the corpus loads, which is why it caught it.

Fixtures: `valid/anchor-with-escaped-quote` (parses, and the escapes are
undone before matching) and `valid/anchor-broken-by-an-edit`. All 26
anchors across the three live corpora occur; nothing migrated.
