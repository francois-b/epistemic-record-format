---
id: B-57
kind: defect
status: open
priority: P3
priority_because: "Non-breaking either way: the fix is a producer SHOULD on what a normalized text contains, and no two validators disagree on a corpus because of it. It sits below P2 because the elision it corrupts is still a judgment for the audit (B-59), and a validator's verdict is unchanged."
basis: demonstrated
raised: "F-026, the Bitter Lesson closed-loop trial, 2026-08-26 (six of twenty-two elisions step over footnote markers left in the normalized text); F-004, the 2026-08-25 re-run of the verifiers (both authored corpora prepended a YAML header to every normalized text)"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-026 with F-004 absorbed; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-57 · A normalized text may hold what is not the work's text, and nothing says so

`ERF-1` (every check runs against the normalized text) defines the
normalized text by the pipeline that produces it: raw file, extraction,
passage, normalization. `ERF-70` (the tools are named) permits
normalization to drop "export artifacts" and never says what an artifact
is. No sentence states what the normalized text may contain beyond the
work's own text, and two producers have put two different things in it.

**Apparatus.** The Bitter Lesson corpus's Wikipedia texts keep the
footnote markers (`^([12])`), which are the site's apparatus and not the
work's prose. A quote copied from the rendered page does not contain them,
so a quote that spans one must elide it: six of the corpus's twenty-two
elisions exist for that reason alone. `ERF-52` gives `[...]` one meaning,
that material was removed, and those six assert nothing.

**A header.** Both corpora authored on 2026-08-25 opened every normalized
text with a YAML block duplicating the source-list entry (citation, url,
digest, converter). Nothing asked for it; two cold agents invented it
independently. It duplicated fields the source list already holds, five
of the blocks did not parse, and it sat inside the text the quote check
folds, so a quote could match the header rather than the work. The
exhibit no longer exists on disk: both corpora's normalized texts now
carry no header. The gap that let it happen does.

Both are the same missing sentence. The reference reads a normalized text
whole and folds all of it; `ERF-69`'s fidelity test (an excerpt occurs in
the normalization of the whole extracted source) would fail on a header
and passes with the apparatus, so the two cases are not even treated
alike today.

## Proposed resolution

A producer SHOULD (or MUST) under `ERF-69`/`ERF-70`: a normalized text
carries the work's text as extracted and normalized, and nothing else; no
metadata header, and no site apparatus (footnote markers, edit links,
navigation) that the work's prose does not contain, so a quote never has
to step over what the source did not say. Related: `B-59`, the audit of
an elision.
