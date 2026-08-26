# The fabrication suite

Each atom is one attempt to make a quotation the source does not carry
pass the ERF-52 check, or one control that must pass. The `limitations`
field on each atom states the attack and the expected verdict.

| id | file | expected |
|:--|:--|:--|
| fab-001 | atoms/a01-elide-negation.md | EXPECT PASS |
| fab-002 | atoms/a02-paragraph-splice.md | EXPECT FAIL |
| fab-003 | atoms/a03-word-prefix.md | EXPECT FAIL |
| fab-004 | atoms/a04-number-truncation.md | EXPECT FAIL |
| fab-005 | atoms/a05-elision-fakes-a-boundary.md | EXPECT FAIL |
| fab-006 | atoms/a06-case-change.md | EXPECT FAIL |
| fab-007 | atoms/a07-honest-control.md | EXPECT PASS |
| fab-008 | atoms/a08-markers-around-punctuation.md | EXPECT PASS |
| fab-009 | atoms/a09-total-elision.md | EXPECT PASS |
| fab-010 | atoms/a10-underscore-in-token.md | EXPECT FAIL |
| fab-011 | atoms/a11-star-between-digits.md | EXPECT FAIL |
| fab-012 | atoms/a12-comma-in-number.md | EXPECT FAIL |
| fab-013 | atoms/a13-soft-hyphen-in-text.md | EXPECT PASS |
| fab-014 | atoms/a14-nfc-mismatch.md | EXPECT PASS |
| fab-015 | atoms/a15-zero-width-join.md | EXPECT FAIL |
| fab-016 | atoms/a16-sentence-boundary.md | EXPECT PASS |
| fab-017 | atoms/a17-reordered-spans.md | EXPECT FAIL |
| fab-018 | atoms/a18-overlapping-spans.md | EXPECT FAIL |

Run: `./target/release/erfval --quiet tests/fabrication`

This file carries no `type`, so the validator ignores it and says so
(`ERF-54`), which is itself part of the test.
