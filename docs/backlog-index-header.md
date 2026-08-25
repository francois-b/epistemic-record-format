---
title: "Backlog"
purpose: "The governed queue: one file per entry, each with its basis, its provenance, and a verdict from someone other than whoever raised it. This page is the index."
status: non-normative
last_updated: 2026-08-25
---

# Backlog

Everything this format does not do yet, plus everything a reader has told it
is wrong. One queue, because both need the same governance before they reach
a decision: an accurate description, a stated basis, and someone other than
the raiser confirming both.

Nothing here is a promise and nothing is scheduled. **One file per entry,
under `backlog/`**; this page is generated from them.

## What an entry carries

- **id** — `B-nn`, stable and never reused. An entry that leaves keeps its
  id in the changelog.
- **kind** — `capability` (the format does not do this yet, waits on a
  trigger) or `defect` (the specification is wrong, unclear, or incomplete,
  waits on a ruling).
- **basis** — how the entry knows what it says. `demonstrated`: an artifact
  exists and can be re-run. `reported`: a careful reader judged it, nothing
  failed. `anticipated`: nobody has hit this, and it is the weakest basis
  there is.
- **raised** — where it came from, specifically enough to go back to.
- **verified** — who checked the description against the current
  specification, when, and their verdict. An entry nobody has verified is
  not ready to be decided.
- **status** — `open` (verified accurate, awaiting trigger or ruling) or
  `contested` (verification disputes it: stale, inaccurate, duplicate, or
  already decided elsewhere). A contested entry is a decision about the
  entry, not about the format.

## The rule this queue exists to enforce

A field earns its place by a demonstrated need rather than by symmetry or by
anticipation. That is why `anticipated` is recorded as weak rather than
treated as equal: an item that has sat unhit through a five-trial battery is
evidence about its author's imagination, not about the format.

Items leave when their trigger fires or their ruling lands, going into the
specification or into `non-goals.md` if the answer turns out to be no.
Decisions already taken against something are not here.

