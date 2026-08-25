## What passes

`source_quality` is a legal enum value (`high`), the field is present
and well-typed, the atom has no `limitations`, which is itself legal
(`limitations` is optional and only asked for where the grade is
`medium` or `low`, as guidance under 4.2, not a MUST at any grade). The
capture, quote, source list entry, and citation are all structurally
sound.

## What's wrong

ERF-9's own table is explicit about exactly this shape of source:
"`medium`: ...a first party with an interest in the answer: trade
press, an analyst note, a vendor's claim about its own product... The
same organization can attest at both grades: its audited filing is
accountable, its marketing page is interested." This atom's source is,
verbatim, "a vendor's claim about its own product" -- the table's own
example -- graded `high`, which the table reserves for "direct and
accountable" attesters: regulators, court filings, organizations under
legal/regulatory accountability, named studies reporting their own
data. A marketing blog post asserting an unfalsifiable superlative
("the fastest... nothing else comes close") is close to the paradigm
case the `medium` tier was written for, not the `high` tier.

## Which rule is carrying the weight

ERF-9 and ERF-10 together: ERF-9 states the axis (provenance distance,
attester accountability, weaker one governs) and its table gives the
worked example this fixture mirrors almost exactly; ERF-10 clarifies
the grade must track "the substance the finding conveys," which here
is a marketing superlative, not a checkable fact with an accountable
attester behind it. Neither requirement is phrased as a closed rule a
validator can evaluate -- there is no field recording "is this attester
self-interested" or "is this an accountable filing," only the enum
value itself, which is exactly the judgment call the rubric exists to
guide a *human* through.

## Could a machine check exist?

Not from the data model as specified. A check would need structured
attester-type metadata the format doesn't require (issuer type, whether
the statement is about the issuer's own product, whether it's under
regulatory accountability) -- fields that don't exist and, per ERF-9's
own design ("a consumer wanting one combined trust signal computes it
from the three at read time"), are deliberately kept out of the stored
record. A crude heuristic (source's citation_text or fetched.url domain
matches a known vendor-blog pattern, flag anything graded `high` for
review) would catch the easy cases like this one and miss everything
else -- self-published research with a genuine methodology, a first-
party disclosure under actual legal exposure (which correctly *is*
`high` per the table), a relayed quote inside an otherwise-accountable
filing. The grading judgment ERF-9/ERF-10 describe is squarely a human
read of context the schema doesn't capture.
