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
| [`essay/`](essay/epistemology-for-knowledge-work-in-the-llm-era.md) | Why does this format exist? The essay the format grew out of, with the PDF that circulated. |
| [`purpose.md`](purpose.md) | What does this format do, and what does it deliberately refuse to do? |
| [`non-goals.md`](non-goals.md) | Was this idea considered? (Permanent no, with the date and the reason.) |
| [`findings/`](findings/) | Something was noticed. Is it real, is it one problem or several, and is it still true? The triage box, and the three gates an observation passes before it may become a backlog entry. |
| [`backlog/`](backlog/) | Will it ever do X, and is anything known to be wrong? One file per entry, each carrying its basis, its provenance, and a verification verdict; its README is a generated index. |
| [`objections.md`](objections.md) | What is the strongest honest case that this cannot work, or that it reinvents something that already failed? Seven objections grounded in prior art and measurements, each with the condition under which it bites and where the format stands. |
| [`writing-with-llms.md`](writing-with-llms.md) | What has the field built for writing prose with an LLM when a human is responsible for the result, and where does this format sit among it? |
| [`influences.md`](influences.md) | Where do these ideas come from, and what does each tradition already own? |
| [`history.md`](history.md) | Why is this rule the way it is? What was tried, measured, reversed? |

Two of these are registers rather than essays, and the distinction is the
point. **`non-goals.md` is a permanent no**: an idea ruled out under the
current design, kept so a reader can check a proposal against a ruling
instead of re-arguing it. **`backlog/` is the queue**: capabilities the
format does not have yet, each naming the event that would revive it, and
defects a reader has reported, each waiting on a ruling. Every entry states
its basis (demonstrated, reported, or merely anticipated) and whether
anyone has checked that its description is still true. An unverified entry
is not ready to be decided. An idea moves from the first to the second only if the ground it was
declined on has changed, which is itself worth a dated entry.

Elsewhere in the repository: [`../CHANGELOG.md`](../CHANGELOG.md) is what
changed and when, [`../LAYOUT.md`](../LAYOUT.md) is what lives where, and
[`../reviews/`](../reviews/) holds evaluations of the specification itself.
- **How does a corpus become files?** [../bindings/yaml-markdown.md](../bindings/yaml-markdown.md), the interchange default. `SPEC.md` section 7 says what any binding must satisfy.
- **What does a record look like?** [../erf.schema.json](../erf.schema.json), the data model, normative. `SPEC.md` section 3 says how to read it.
