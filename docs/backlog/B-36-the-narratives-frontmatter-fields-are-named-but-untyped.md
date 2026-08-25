---
id: B-36
kind: defect
status: closed
priority: closed
priority_because: "One author writes the narrative's `created` as a bare date while another implementation's validator demands an actor stamp, and typing the three fields is a shape decision that is free only now."
basis: demonstrated
raised: "trial 3's closing author against trial 1's validator, 2026-08-25 (S21)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-36 · The narrative's frontmatter fields are named but untyped

`ERF-34` requires title, corpus and created, and having ruled that a narrative has no interface in the data model, types none of them. The closing author wrote `created` as a bare date; trial 1's validator expects an actor stamp. Both defensible, and they disagree.

## Proposed resolution

Type the three fields in one sentence.

## Resolution

Ruled 2026-08-25. `title` is a string, `corpus` is the id of the corpus the
narrative belongs to, and `created` is the `{timestamp, by}` stamp every
other created thing in this format carries.

Two reasons, and the second is the stronger one. One field name with two
shapes in a single format is exactly how an implementer is made to guess,
which is what this rule exists to stop. And `by` earns its place on a
narrative more than it does on a record: `ERF-34`'s own preamble calls a
narrative prose authored by a person, so who wrote it is the fact a reader
most wants and the one nothing else in the corpus records.

Three capex narratives carried a bare date and were migrated. Their stamp
reads `agent/claude-sonnet-5`, which is what actually happened and which
sits awkwardly against the preamble's "authored by a person and never
generated". That awkwardness is `B-32`, already open, and this migration
moves it from reported to demonstrated: the format now has three narratives
on record whose author was not a person.

The loader validated no narrative frontmatter at all before this; it now
checks the three fields and the stamp's shape. Fixture
`invalid/narrative-created-is-a-bare-date`.
