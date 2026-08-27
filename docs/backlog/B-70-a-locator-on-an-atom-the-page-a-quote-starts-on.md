---
id: B-70
kind: capability
status: open
priority: trigger-driven
priority_because: "The first held PDFs (2026-08-27) gave every quote a page, and the format has no field to carry it: the page is written into the atom's free body, which the validator keeps and no consumer reads. Nothing breaks without a field; a reader who wants the page opens the held text."
basis: anticipated
raised: "erf-mcp, the PDF capture, 2026-08-27"
verifications:
  - by: "claude-fable-5, the hand that built the capture"
    on: 2026-08-27
    verdict: unverified
    note: "raised by the hand that made the change; needs a check by another"
trigger: "A consumer that wants to cite the page (a rendered footnote, a reader's citation export), or a second producer holding paginated sources and inventing its own place to put the page."
generated: 2026-08-27
model: claude-fable-5
---

# B-70 · A locator on an atom: the page a quote starts on

An atom names its source and holds a verbatim quote (`ERF-6`); the quote
check finds the quote in the held normalized text (`ERF-50`). Where in the
source the quote sits is implicit in that offset and stated nowhere. For a
web page that is fine: the page is the locator. For a paginated source,
the reader wants the page, and a book or a report wants a chapter or a
section.

erf-mcp now holds PDFs page by page, with a marker line between pages in
the normalized text, and reports the page a quote starts on at mint. Having
no field to put it in, it writes one line into the atom's body ("Page N of
the held PDF"), which `Atom` does not model (`additionalProperties: false`,
no `body`; the reader drops the body without a finding). That is producer
convention, not format.

The question for a ruling: does an atom carry a `locator` (a string, the
source's own kind of place: `page 12`, `§3.2`, `chapter 4`, `00:14:32`),
optional, producer-stated, and checked by nothing? Or is a locator a
derived reading a consumer computes from the held text and its markers,
in which case the markers' form would need a rule of its own? The former
is one optional field and the page-marker convention stays producer
machinery; the latter makes the page a computed reading like a
disposition, which suits the format's habit but puts a marker grammar in
the specification.

Related: `B-04` (non-text evidence payloads), `B-07` (a capture manifest
with content-hash identity), `ERF-69` (excerpts).
