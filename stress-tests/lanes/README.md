# The lanes

Process records from the v0.9 stress battery, one folder per lane. The
plan is `../stress-test-battery-v0.9.md`, the findings are
`../findings-2026-08-25.md`, and the read is
`../battery-report-2026-08-25.md`.

| Lane | Question | What is here |
|---|---|---|
| `lane1-validator` | Can someone build a validator from the prose alone? | The validator, its README, its ambiguity register, its smoke corpora |
| `lane2-buffon` | Can someone author correct records from the prose alone? | The Buffon corpus, authoring notes |
| `lane3-ai-capex` | What falls apart at real scale, across several authors? | Friction logs in execution order and the audit log. **The corpus itself is `../ai-capex/`** |
| `lane4-fixtures` | What do the spec authors' own fixtures fail to test? | The adversarial fixture set and its manifest |

Every lane carries a `friction-log` (lane 3's is per run): the record of
each moment an agent guessed, re-read, or made a call the specification
did not settle. Those logs carried more findings than the pass and fail
results did.

Lane 3's corpus sits outside this folder on purpose. It is a real corpus
on the AI capital-expenditure debate, not a test fixture, and it is meant
to be read and extended as one.
