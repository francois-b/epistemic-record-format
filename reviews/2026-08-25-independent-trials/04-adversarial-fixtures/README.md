# Trial 4: adversarial fixtures

**Question:** what do the specification authors' own test cases fail to
test?

A fixture is a small corpus written to be a test case. Valid ones must
load clean; invalid ones must each fail for one named reason. A test suite
needs both, because a validator that accepts everything passes every valid
fixture: the invalid ones are what prove it checks anything.

The trap this trial exists to escape is that fixtures written by the
specification's own authors encode those authors' readings, including
their misreadings. The tests then agree with the implementation, both are
wrong in the same place, and everything is green. So this agent wrote
fixtures having never seen the existing suite.

It produced three kinds, plus the most valuable category of all:

- **valid**, legal but unusual combinations that must load clean
- **invalid**, each breaking exactly one named requirement
- **spirit**, which pass every mechanical check while plainly violating
  what the specification means (an excerpt capture containing only the
  quote it is meant to check, a sweeping absence claim backed by one
  trivial search)
- **undecidable**, cases where the prose does not settle whether the
  fixture should pass or fail. These are findings, not failures.

Running them against the reference found two implementation bugs within
an hour, one of which had been passing its own test for months because
the test data and the buggy code shared a blind spot.

`MANIFEST.md` lists every fixture with its expected outcome and what it
probes. Adoption of this set into `conformance/` is an open decision.
