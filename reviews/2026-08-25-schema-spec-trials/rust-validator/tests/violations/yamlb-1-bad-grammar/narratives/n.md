---
type: narrative
title: "A narrative with a broken binding"
corpus: yamlb-1-bad-grammar
created: {timestamp: "2026-08-23", by: "human:fb"}
---
The first passage asserts something and closes with a binding whose ids are
separated by commas, which the grammar refuses.
<!-- claims: bad-001, other "closes with a binding" bound-at=2026-08-23 -->

The second passage closes with a binding that never terminates.
<!-- claims: bad-001 "never terminates" bound-at=2026-08-23

The third passage closes with a binding whose date is not a date.
<!-- claims: bad-001 "is not a date" bound-at=23-08-2026 -->
