## What passes

Structurally this is a textbook-legal universal negative per ERF-25:
`atoms_for` is correctly absent, `surveys` names a real survey record,
the survey's one search act names a concrete instrument (`tool`) and a
`query` in that instrument's own terms (ERF-26), and `hits_reported` is
recorded as the instrument actually reported it, in words rather than
false precision (ERF-27). The claim carries an `evidence_audit` entry
with a legal verdict and protocol (ERF-24). Nothing here is malformed.

## What's wrong

The claim's title is a market-wide universal negative -- "No
commercial note-taking product on the market" -- and its entire backing
is one Google search, one page of results, eyeballed, not paginated.
The non-normative note under ERF-28 draws exactly this distinction: "A
world-claim over the world's indexes... absence is real, defeasible,
decaying evidence" versus "A world-claim over a private sample...
absence is nearly no evidence." A single unpaginated search-engine page
is close to the second case wearing the first case's claim. The survey
record is honest about its own thinness (the body says so outright),
which is exactly what ERF-25/28's guidance asks for -- and it changes
nothing about whether the claim it backs should carry this much
confidence. The `evidence_audit` verdict of SUPPORTED then launders the
gap: a jury judged "does the coverage carry the claim" and said yes,
which is the one non-normative caution the spec itself raises about
juries (section 4.4's note): a verdict is a recorded hypothesis, not
proof, and thinness in, confidence out is exactly the failure mode a
correlated-error jury will not catch.

## Which rule is carrying the weight

ERF-25's SHOULD ("SHOULD cite the survey records whose coverage it
rests on") is satisfied here, which is precisely why this case is
interesting: citing a survey is necessary but not sufficient, and
nothing in the format states a sufficiency bar for *how much* coverage
a given claim's scope requires. The weight sits in the non-normative
note under ERF-28 (world-index vs. private-sample vs. closed-corpus)
plus the "Writing one well" guidance under 4.5 ("close by stating its
coverage bounds") -- none of it numbered, all of it advisory.

## Could a machine check exist?

Only a shallow structural proxy: flag when a claim's `surveys` list
totals fewer than N search acts, or when `hits_reported` text implies
an unpaginated single-page result, as "thin coverage for its claim's
apparent scope" -- cheap and gameable (pad the acts, keep them equally
thin). The real judgment is a match between the *claimed scope* (read
from `title`, natural language) and the *searched universe* (read from
`scope`/`query`, also natural language), which is not a structural
comparison a validator can make without a semantic reading of both
strings. This is the same "reading, not a rule" gap as `s3`, applied to
survey coverage instead of claim/body drift.
