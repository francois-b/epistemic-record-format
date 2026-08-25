---
id: F-006
raised:
  by: "claude-opus-5, splitting F-003 on the specify gate's advice"
  on: 2026-08-25
  observation: "Two implementations, on failing to parse one structural file, reported every atom in the corpus as naming a source that does not exist"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: null
  claim: null
verifications: []
outcome: open
---

# F-006 · A validator that cannot read a file blames the records instead

## What was observed

Twice on 2026-08-25, an implementation failed to make sense of one
structural file and reported the failure as hundreds of defects in
unrelated records.

The reference loader, before it was fixed, skipped a source list carrying
no `type` and then reported 151 atoms as naming sources the corpus does not
hold. The Rust validator, reading the same corpus after `type: sources` was
added, reported the source list as two malformed entries and then reported
the same 151 atoms the same way.

In both cases exactly one file was wrong, and in both cases the report
pointed at 151 records that were correct.

## Why it may matter

`ERF-3`'s nesting is now explicit (`F-003`), which removes this instance.
The failure mode is not about nesting.

A reader given 151 findings does not go looking for one unreadable file.
They go looking for 151 missing sources, and the corpus looks catastrophic
when it is fine. That is a fidelity question about what a consumer says it
found, which is the kind of rule section 2 explicitly admits: "a rule that
says do not misrepresent what a record says ... is in scope."

The format already answers this shape three times without generalizing it.
`ERF-31` says a comment that fails the binding grammar is reported rather
than skipped, because skipping makes the claims vanish. `ERF-33` says a
narrative binding whose id resolves to nothing is reported, never dropped.
`ERF-57` says an unknown type is preserved and reported, never a reason to
refuse. Each says: report the thing you could not handle, at the thing you
could not handle.

The candidate rule is that fourth instance: a consumer that cannot
interpret a file it recognizes MUST report that file, and MUST NOT report
its own failure as findings against records that depend on it. Whether that
earns a requirement number or belongs as guidance under section 2 is the
question to settle.
