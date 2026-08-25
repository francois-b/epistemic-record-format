## What passes

Every MUST is satisfied: `title` states a proposition (ERF-18), the
record has both `created` and a later `last_modified` (ERF-48, same-day
rule not even in play here -- 2026-08-22 is well after 2026-08-08),
`epistemic_kind` is a legal value, the body is valid CommonMark. There
is no stored disposition, no malformed edge, nothing a structural
validator flags.

## What's wrong

`title` says "Every regional office missed its Q2 hiring target."
`body` says "Most regional offices... with Austin and Denver coming in
close to plan" -- a strictly narrower, weaker claim than the title
states. Per ERF-18, `title` is the normative statement: whatever the
record actually asserts, for evidence-linking and disposition purposes,
is the *universal* claim, even though the working notes reveal the
author's actual belief is the *qualified* one. A reader (or a
downstream `atoms_for` audit) evaluating this claim's title against the
evidence is evaluating a stronger proposition than anyone currently
holds.

## Which rule is carrying the weight

ERF-18's own text forecloses a numbered rule here on purpose: "The body
SHOULD open by restating it, and keeping the restatement verbatim is
what makes later drift visible to a reader; whether an opening in other
words still states the same claim is a reading, so no rule numbers it."
That sentence is doing double duty -- it states the guidance (restate
verbatim) and explicitly declines to make conformance to it
machine-checkable. This fixture is constructed to sit exactly in the
gap the sentence describes: the body doesn't merely paraphrase the
title in other words, it silently narrows it, and the spec says by name
that telling those two apart is a reading, not a rule.

## Could a machine check exist?

A shallow one: flag when a claim has `last_modified` but the body's
opening sentence, string-diffed against the stored `title`, has drifted
past some edit-distance threshold -- catches exactly this fixture,
where the notes even admit the title wasn't revisited. It would false-
positive constantly on legitimate paraphrase (ERF-18 explicitly permits
"an opening in other words") and miss any drift introduced from the
start (no `last_modified` to compare against, or a title/body pair that
diverged at minting rather than by later edit). A semantic-similarity
check (embed both, threshold the cosine distance) would catch more true
cases and more false ones. Either way this is judgment about whether
two English sentences say the same thing at the same strength --
squarely the reading the spec disclaims a rule for.
