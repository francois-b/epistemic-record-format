---
id: fx-survey-repeat
type: survey
corpus: fixture-prior-survey-dangling
title: "Re-run of an earlier search for a standalone embargo field"
conducted: {timestamp: 2026-08-25, by: "agent/conformance-fixture"}
prior_survey: fx-survey-first-pass
searches:
  - tool: "grep -rn (BSD grep, macOS)"
    query: "^x_embargo_until:"
    scope: "all declaration files in the fixture corpus; 1 file"
    hits_reported: "0"
---
A repeat search declaring itself a re-run of `fx-survey-first-pass`,
which no corpus in the deployment holds. `prior_survey` asserts a
current relationship (this survey stands in a line behind that one), so
the reference must resolve: a reader cannot compare yields against a
survey that is not there.
