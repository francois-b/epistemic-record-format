# Trial 3: authoring at scale

**Question:** what falls apart when a corpus grows past the size one
author can hold, and passes through several hands?

Small trials cannot see this. Identifier sequencing under volume,
citation-style drift between the fifth record and the hundred and fiftieth,
grading judgments diverging at the same boundary, conventions an author
quietly abandons when tired: these appear only at scale, and only across
authors. The precedent from this specification's own reference practice is
that atom tags were retired for exactly this reason, after 146 records had
accumulated 201 distinct tags.

So this trial ran as eleven sequential agents rather than one. Each read
the corpus its predecessors had left and added to it. None saw this
repository beyond `SPEC.md`.

`corpus/` is what they produced: a real corpus on the AI
capital-expenditure sustainability debate, 71 sources, 151 atoms, 53
claims, 6 surveys, 3 narratives, 62 cross-vendor audit verdicts. It stays
here, with the trial that produced it, rather than moving to `examples/`.
An example is a corpus stamped as conforming, and stamping against a
specification below 1.0 buys nothing that survives the next version. Its
promotion, if it comes, is a decision for 1.0.

The numbered files are the process record, in execution order. Read them
in sequence and the drift is legible.

| Run | What it did |
|---|---|
| 01, 02 | Source scouts, the debate's two camps, in parallel |
| 03, 04, 05 | Record batches over the captured sources |
| 06 | A third scout: the dimensions both camps ignore |
| 07, 08 | Record batches over the new sources, to the scale floor |
| 09, 10 | Claim batches: the debate core, then everything beyond it |
| 11 | The closing author: surveys and narratives |
| 12 | Cross-vendor finding audits (Gemini, DeepSeek) |

The findings this trial produced, with the rest, are in `../findings.md`.
