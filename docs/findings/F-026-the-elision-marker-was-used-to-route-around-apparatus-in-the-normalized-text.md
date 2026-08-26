---
id: F-026
raised:
  by: "the Bitter Lesson closed-loop trial, 2026-08-26"
  on: 2026-08-26
  observation: "6 of 22 elisions in the corpus exist only to step over Wikipedia footnote markers such as [12] left in the normalized text, so a marker ERF-52 defines as asserting removed material is asserting nothing"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-52, ERF-51, ERF-69"
  claim: null
verifications: []
outcome: open
---

# F-026 · The elision marker was used to route around apparatus in the normalized text

`ERF-52` gives `[...]` one meaning: material was removed here, and a reader
should expect the source to say more. The trial's normalized Wikipedia
texts kept the footnote markers (`[12]`), and a quote spanning one had to
either include it, which a quote-by-copy will not do because the marker is
not the source's prose, or elide it. Six elisions of twenty-two are of that
kind. The marker then carries a false signal, and F-017's concern (an
elision can invert meaning, and the audit sees only the quote) gains a
mundane cousin: an elision that means nothing at all.

Normalization is the producer's (`ERF-69`, `ERF-70` name the tool), so the
fix is available today: strip apparatus when producing the normalized text.
Nothing says so.

## Candidate resolutions, none ruled

- Producer guidance under `ERF-69`/`ERF-70`: a normalized text SHOULD carry
  the work's prose and not its apparatus (footnote markers, edit links,
  navigation), so that quotes do not need to step over it.
- Leave it to craft.
