---
title: "Requirement review rubric"
purpose: "Six questions every numbered requirement is judged against, by cold readers, after ERF-49 failed all of them at once."
status: non-normative
last_updated: 2026-08-26
---

# Requirement review rubric

`ERF-49` was a requirement that forbade a field the schema does not have,
was really a definition, assumed an order of work, confused stored with
derived, and contained a sentence that was not a sentence. None of the
repository's gates can see any of those. This rubric is what a reader
applies to every requirement instead.

For each requirement, answer six questions and give one verdict: **keep**,
**rewrite**, **move**, **merge**, or **retire**, with the failing question
and one sentence why. For a retire, spell out the deletion test.

| # | Question | A failing answer means |
|---|---|---|
| 1 | **Necessity.** Delete this paragraph. Does the schema, a cited standard, or another requirement still force the same behaviour? | if all of them do: retire |
| 2 | **Locus.** Is this a shape (the schema's), a computation (cases), an obligation on an act (prose), a duty on a conformance class, or a definition (section 2)? | wrong home: move |
| 3 | **Direction.** Does it assume an order of work, a substrate, or a tool? | rewrite as a statement about the corpus's state |
| 4 | **Stored or derived.** Does every "MUST NOT store" name something the schema could hold, and every "computed" name a real computation over stored fields? | rewrite |
| 5 | **Decidability.** Can a validator decide it from the corpus and its held files? If not, is it honestly an obligation on an act, attributed, or a SHOULD? | mislabelled MUST: downgrade |
| 6 | **Sentences.** Is every sentence a MUST/SHOULD/MAY, a definition, or the reason for one? | cut the rest |

Section prose gets the same test: every sentence states a rule, defines a
term, or gives the reason for one, or it is guidance and belongs elsewhere.

The output is a table, one row per requirement, then the section prose,
then a list of the ten things the reader would change first.
