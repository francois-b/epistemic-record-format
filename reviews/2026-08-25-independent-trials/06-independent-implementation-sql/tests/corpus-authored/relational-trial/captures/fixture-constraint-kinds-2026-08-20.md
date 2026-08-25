# Notes on Constraint Kinds (fixture)

Captured 2026-08-20 for the SQL trial. This file is constructed material; it
describes nothing outside this trial.

## 2. State and transition

A declarative constraint sees exactly one row version at a time. It can
therefore decide whether a value is admissible, and it can never decide
whether an edit was permitted, because the prior value is not in scope when
the constraint is evaluated.

## 3. Append-only ledgers

An append-only ledger is not a property of a table; it is a property of the
statements a writer is allowed to issue against that table. Enforcement is
therefore procedural: the table must refuse UPDATE and DELETE outright.

## 4. Keys and reports

Where an invariant is expressed as a key, the store loses the ability to hold
a violating instance at all, and a validator built over that store can never
report the violation it was written to detect.
