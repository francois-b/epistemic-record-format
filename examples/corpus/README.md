# The ERF example corpus

Fifteen records that exercise every record type the format defines, so that
a reader can see the machine working rather than infer it from the
specification.

## Where these records came from

**These are real records, copied from the author's working practice, not
written for the demonstration.** They were minted in the course of research
into how knowledge work is governed, audited by the jury procedure the
format describes, and used in real documents before they were excerpted
here. Their ids, findings, quotes, citations, audit verdicts, and dates are
unchanged.

Three things were changed in the copying, and nothing else:

1. `corpus` is rewritten to this corpus's id, because these records now
   live here. Membership is mutable by design (`ERF-4.12`); identity is not,
   so the ids are as they were.
2. Working-note paragraphs that referred to the author's own sessions,
   pilots, and internal documents were dropped. They were about the
   practice, not about the evidence.
3. Nothing else. No record was invented, padded, tidied, or improved.

A corpus that demonstrates a format for recording evidence honestly should
not itself be a fabrication, so it is not one.

## What it holds

| Type | Count | What is worth looking at |
|:--|:--|:--|
| Atoms | 5 | Two have no audit verdicts, which the health view flags |
| Claims | 5 | All five compute to `proposal`: nobody has stood on them |
| Questions | 1 | Carries no evidence, by rule (`ERF-4.22`) |
| Surveys | 3 | One finds nothing, one finds plenty, one is conclusive |
| Narratives | 1 | Written for this corpus, with bindings into the claims |
| Captures | 0 | See below, and it matters |

The three surveys are the clearest single illustration of a design decision.
A survey is neutral as to polarity: `continuous-claim-check-tools-2026-08-19`
searched hard and found nothing, and backs an absence;
`citator-agreement-studies-2026-08-22` searched and found a
twenty-five-year literature, and backs a density reading;
`granted-flag-uses-2026-08-22` searched a closed corpus exhaustively, found
zero, and carries no `limitations` at all, because when the universe
searched *is* the universe the claim is about, absence is conclusive rather
than defeasible.

## The captures problem, stated plainly

The format's most convincing mechanism is the verbatim quote checked against
an immutable copy of its source. **This corpus ships none of those copies,
and so it cannot demonstrate that check.**

The reason is copyright, not oversight. Publishing a capture means
redistributing someone else's text. Of the five atoms here, three quote a
law journal article that is freely readable but not licensed for
redistribution, one quotes vendor product documentation, and one quotes a
documentation site whose content carries no stated licence at all.
Unverified is not permission, so nothing shipped.

`captures.yaml` records each one with its status and the reason. The viewer
reads that file and, on every claim resting on an atom whose capture did not
ship, says so instead of presenting the claim as backed. That is the viewer's own
choice rather than a rule of the format, and this corpus exercises it
thoroughly by accident of its own sourcing.

Closing the gap needs one atom over an openly licensed source: a W3C
document, a United States federal publication, a Creative Commons article,
or a public-domain text. That is a genuine piece of research work rather
than a packaging exercise, which is why it was not improvised here.
