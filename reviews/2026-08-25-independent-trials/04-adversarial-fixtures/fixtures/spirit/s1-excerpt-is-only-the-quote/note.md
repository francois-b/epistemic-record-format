## What passes

Every machine-checkable MUST is satisfied. `source.excerpt` is `true`
and `path` points at a real capture file; the atom's `quote` occurs
verbatim (after normalization) inside that capture; `status` is a
legal value (`shipped-as-quotation`); the source list, declaration, and
atom shape are all well-formed. A validator that runs ERF-1 through
ERF-72 mechanically finds nothing to reject.

## What's wrong

The capture file *is* the quote, word for word, and nothing else. This
is precisely the case ERF-69's prose names and forbids in the same
breath it grants the excerpt route: "It MUST contain the quoted passage
together with enough adjacent text for the passage's place in the
source to be legible: a capture holding the quote alone proves nothing,
because it is a copy of the thing it is meant to check." An excerpt
that is only the quote cannot show whether the sentence was quoted
fairly -- whether it continued "...but this is waived for enterprise
tier" on the next line, whether it was itself a hypothetical being
rebutted, whether the antecedent of "the vendor's uptime guarantee"
two paragraphs up narrows it further. The excerpt exists to let a
reader check the passage's place in the source; a one-sentence capture
makes that check impossible while looking, structurally, identical to
a well-formed excerpt.

## Which rule is carrying the weight

Textually this is phrased as a MUST (ERF-69), not a SHOULD -- so by the
letter of RFC 2119 this fixture should be a `fixtures/invalid` case,
not a `fixtures/spirit` case. It's filed here because the "enough
adjacent text... legible" standard has no operational definition
anywhere in the document: no minimum length, no minimum sentence count,
no rule for what counts as "the passage's place." A validator has
nothing to compute against. That gap between an MUST-worded requirement
and an unspecified acceptance test is itself the finding -- see
`friction-log.md`, `undecidable-1`.

## Could a machine check exist?

A partial one, cheaply: flag when `normalize(quote) == normalize(capture
content)` (or when the capture is under, say, 1.2x the length of the
quote) as "excerpt suspiciously thin, review its context." That would
catch this exact fixture. It would not catch a two-sentence capture
that quotes fairly out of an eight-page filing, nor would it clear a
one-sentence capture that legitimately was a one-sentence source (a
tweet, a headline). The general judgment -- does this capture actually
let a reader see the passage's place -- stays human. Recommend the
cheap length/equality heuristic as a SHOULD-level lint (a flag, not a
validator rejection, matching ERF-43/ERF-49's flag-not-violation
precedent) rather than leaving ERF-69's second sentence with no
machine-checkable teeth at all.
