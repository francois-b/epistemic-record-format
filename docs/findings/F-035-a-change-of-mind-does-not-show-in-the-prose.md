---
id: F-035
raised:
  by: "claude-fable-5, deep pass over the use-case table, 2026-08-27"
  on: 2026-08-27
  observation: "a claim rejected or retired through its standings leaves every passage bound to it reading current: ERF-32 stales a binding on the claim's last_modified, and ERF-48 forbids a standing from advancing it"
basis: demonstrated
specified:
  by: "claude-fable-5, operator session, 2026-08-27"
  on: 2026-08-27
  requirement: "ERF-32, ERF-47, ERF-48"
  claim: >
    ERF-47 stales a narrative binding when "the claims it names" changed
    since bound-at, and the reference reads that change from last_modified;
    ERF-48's exception for append-only lists means a standing never moves
    last_modified. So an edit to a claim's title reaches the prose and a
    rejection of the claim does not, though the second is the larger change
    of mind. Verified against SPEC.md at HEAD on 2026-08-27; the reference
    implementation's bindingStaleness compares bound-at to last_modified only.
verified:
  by: ""
  on:
  verdict:
outcome: open
promoted_to: ""
ruling_now_in: ""
closed_because: ""
---

# F-035 · A change of mind does not show in the prose

`ERF-32` and `ERF-47` make a narrative binding stale when the claim it
names changed after `bound-at`, and `ERF-48` says an appended standing
MUST NOT advance `last_modified`, because otherwise every stance would
invalidate itself at the moment it was recorded. Both rules are right on
their own. Together they leave a passage reading current after the claim
under it was rejected, contested or retired through its ledger, which is
the change a reader would most want to see.

The two obvious fixes pull against each other. Keying staleness on the
newer of `last_modified` and the newest standing's timestamp is simple,
but it reports a change of mind with the word that already means the text
changed, and the two ask the reader for different work: a rewrite asks
whether the passage still says what the claim says; a rejection asks
whether the passage should stand at all.

## Proposed resolution

A second computed reading beside stale, kept distinct from it: a narrative
binding whose `bound-at` precedes the newest admissible standing on any
claim it names is reported as *disposition moved since bound*. `ERF-48`
stays as it is; `ERF-47` gains the reading and names what it compares; a
consumer that reports stale bindings reports this one too, under its own
name. One fixture (a bound claim that gains an `against` standing after
the binding) and the reference reading.

Not ruled. The operator agreed the finding is real and has not chosen a
resolution.
