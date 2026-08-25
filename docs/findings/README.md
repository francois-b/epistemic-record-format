---
title: "Findings inbox"
purpose: "Where a raw observation lands before it is allowed to become a backlog entry, and the three gates it must pass to get there."
status: non-normative
last_updated: 2026-08-25
---

# Findings inbox

A review, a trial, or a reader notices something. It lands **here**, not in
the backlog. This folder is a triage box, and its contents are not yet
claims about the specification.

The distinction the whole pipeline turns on: **a finding is an observation,
a backlog entry is a specified problem.** Most observations are one of the
two, and telling them apart before anyone spends time ruling is the point.

## The pipeline

A finding passes three gates, in order, and may not skip one.

**1. Raised.** Whoever noticed it writes a file here. It needs the
observation, where it came from, and what kind of evidence stands behind
it. Nothing else. A raiser is not asked to propose a fix, because a raiser
who proposes a fix tends to describe the problem in the shape of that fix.

**2. Specified.** Someone *other than the raiser* determines what is
actually being claimed about the specification: which requirement, what is
wrong with it, and whether it is one problem or several. This is where an
observation becomes checkable, and where duplicates and non-problems are
caught. A finding that cannot be specified is closed here, with the reason.

**3. Verified.** Someone other than the raiser and other than the
specifier checks the specified claim against the specification as it stands
now. The verdict is `accurate`, `stale`, `inaccurate`, `duplicate`, or
`already-closed`. Only `accurate` moves on.

A finding that passes all three becomes a backlog entry with an id, and its
file here is closed with a pointer to it. A finding that fails any gate
stays here, closed, with the reason: the record of what was looked at and
found not to matter is worth as much as the queue itself.

## Why three gates and not one

The 2026-08-25 trials produced twenty-four findings and they went to the
operator unverified. Six were wrong: one stale, three inaccurate, one
duplicate, two already ruled elsewhere. Three of the errors were introduced
by the person migrating them, who was also the person summarising them.

An observation, its specification, and its verification should not be the
same hand, because each step is an opportunity to notice the previous one
was wrong, and a single hand takes none of them.

## File shape

One file per finding, `F-nnn-short-slug.md`, frontmatter plus prose:

```yaml
id: F-001
raised:
  by: "trial 6 (SQL), 2026-08-25"
  observation: "the round trip is not byte-identical and nothing says whether it should be"
basis: demonstrated | reported | anticipated
specified:                      # gate 2, by a second hand
  by: ""
  on:
  requirement: "ERF-53"
  claim: "the clause has no definition of loss"
verified:                       # gate 3, by a third hand
  by: ""
  on:
  verdict: accurate | stale | inaccurate | duplicate | already-closed
outcome: open | promoted | closed
promoted_to: "B-40"             # when it becomes a backlog entry
closed_because: ""              # when it does not
```

Empty gates are how a reader sees where a finding is stuck.

## What is not here

Findings the trials produced before this folder existed are recorded in
their own reviews, and the ones that survived are already backlog entries
`B-23` through `B-48`. They did not pass these gates in this order, which
is why several of them turned out to be wrong. They are not backfilled;
the pipeline starts now.
