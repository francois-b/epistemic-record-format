---
title: "The documentation"
purpose: "What each document here is for, and which question it answers."
status: non-normative
last_updated: 2026-08-25
---

# The documentation

`SPEC.md` states what the format is. Everything here is non-normative and
answers a different question, one document per question.

| Read this | To answer |
|---|---|
| [`purpose.md`](purpose.md) | What does this format do, and what does it deliberately refuse to do? |
| [`non-goals.md`](non-goals.md) | Was this idea considered? (Permanent no, with the date and the reason.) |
| [`backlog.md`](backlog.md) | Will it ever do X, and is anything known to be wrong? The governed queue: capabilities waiting on a trigger, defects waiting on a ruling, each with its basis and whether anyone has verified the description. |
| [`influences.md`](influences.md) | Where do these ideas come from, and what does each tradition already own? |
| [`history.md`](history.md) | Why is this rule the way it is? What was tried, measured, reversed? |

Two of these are registers rather than essays, and the distinction is the
point. **`non-goals.md` is a permanent no**: an idea ruled out under the
current design, kept so a reader can check a proposal against a ruling
instead of re-arguing it. **`backlog.md` is the queue**: capabilities the
format does not have yet, each naming the event that would revive it, and
defects a reader has reported, each waiting on a ruling. Every entry states
its basis (demonstrated, reported, or merely anticipated) and whether
anyone has checked that its description is still true. An unverified entry
is not ready to be decided. An idea moves from the first to the second only if the ground it was
declined on has changed, which is itself worth a dated entry.

Elsewhere in the repository: [`../CHANGELOG.md`](../CHANGELOG.md) is what
changed and when, [`../LAYOUT.md`](../LAYOUT.md) is what lives where, and
[`../reviews/`](../reviews/) holds evaluations of the specification itself.
