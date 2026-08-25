# Trial 2: authoring, small and deep

**Question:** can someone produce correct records from the specification
prose alone?

This tests an audience nothing else reaches. Fixtures and validators
exercise people who build tools; no test had ever asked whether a person
can sit down with the document and correctly author data, which is what
most users actually do.

The subject is the 18th-century dispute over Buffon's claim that American
animals were degenerate, and Jefferson's rebuttal. It was chosen for what
it exercises, not for its charm: a genuine two-sided argument, so evidence
in both directions gets used; public-domain primaries, so captures can
ship; a scanned 1780s volume, so the fetch, convert, digest and excerpt
chain gets run end to end; Jefferson's comparative weight tables, because
numbers stress the text-matching rules hardest; and one deliberately
restricted modern source, so a recorded absence appears too.

`corpus/` is what the agent built, from `SPEC.md` alone. To check its own
quotes it had to implement the normalization sequence itself, from the
prose. All nine of its quote checks then passed under the reference
implementation as well, which is the strongest interoperability result in
these trials: two independently built versions of the most intricate
machinery in the specification agreeing on real scanned text.

The discipline also caught a mistake in the agent's own work: a Buffon
passage that reads as supporting the thesis until its antecedent is
traced, at which point it cuts the other way. It was filed as
counter-evidence.

`friction-log.md` and `authoring-notes.md` are the process record.
