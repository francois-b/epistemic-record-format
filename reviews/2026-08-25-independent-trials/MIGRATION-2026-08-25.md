---
title: "Migration of the trial corpora to the post-trial specification"
purpose: "What was changed in the two authored corpora after the trials closed, why, and what the change measured."
status: non-normative
last_updated: 2026-08-25
---

# Migration of the trial corpora, 2026-08-25

The trials ran against `SPEC.md` as it stood on the morning of 2026-08-25.
Rulings the same day changed the normative surface underneath them. This
file records what was then changed in the two authored corpora, so that an
edit to an archive is never mistaken for a quietly rewritten record.

**The reports, friction logs and ambiguity registers were not touched.**
Those are the record of what happened and they stand as written. Only the
corpora were migrated, on the same principle any deployment migrates when a
format moves.

## What changed

**`type` on every file (`ERF-54`).** Added `type: corpus` to two
declarations, `type: sources` to two source lists, `type: narrative` to
four narratives. Records already carried theirs.

**The source vocabulary.** `fetched:` → `received:`, `path:` →
`normalized:`, `converter: {tool, deterministic}` → `extraction:`,
`excerpt: true` → `excerpt: {by, on}`. The actor and date on `excerpt` are
the ones the corpora already record on all 160 atoms
(`agent/claude-sonnet-5`, 2026-08-25); nothing was invented.

**Five malformed claims in trial 2.** Its claims were written as
frontmatter with the prose in a `body: |` field and no closing `---`. Under
`ERF-53` the interchange form is frontmatter plus markdown body; the
sentence permitting "body as one more field" applies to a store, not to a
file on disk. All five claims had been unloadable since authoring and
nobody had noticed. Converted to frontmatter plus body; no prose altered.

## What the migration measured

Before: both corpora loaded with their source lists unread, and **all 160
quote checks were dark**.

After: both load clean, and the quote check runs for the first time.

| Corpus | atoms | pass | fail |
|---|---|---|---|
| trial 2 (Buffon) | 9 | 6 | 3 |
| trial 3 (ai-capex) | 151 | 150 | 1 |

**All four failures are real transcription divergences, and none is a
normalization gap.** Three are an author silently tidying the source:
`Europeans ;` → `Europeans;` and `nett ;` → `nett;` (the 1853 scan
preserves a space before the semicolon), and `[another]` → `another` (the
editorial brackets marking a reconstruction, dropped). The fourth is an
ASCII apostrophe in the source written back as a curly one.

That is the cut to `ERF-51` doing exactly what it was cut to do. Under the
seventeen-step folding all four passed silently. Under three steps, at a
rate of 4 in 160, every failure is an author having improved their own
evidence. The quotes were left as authored: they are the measurement.
