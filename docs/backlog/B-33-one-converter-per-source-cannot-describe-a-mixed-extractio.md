---
id: B-33
kind: defect
status: open
priority: P3
priority_because: "The entry itself waits for a second instance and the workaround conforms (both reviewers)."
basis: reported
raised: "trial 2, 2026-08-25 (S11)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-33 · One `converter` per source cannot describe a mixed-extraction artifact

Jefferson's Notes PDF has clean embedded text for most pages and a fold-out table with no OCR layer at all. The author disclosed the split in prose and marked the whole source non-deterministic, which works and is not an answer the specification gives.

## Consolidation note (2026-08-26)

Still live at HEAD. The field was renamed on 2026-08-25: `converter`
became `extraction` (the extracting tool and version) with `normalization`
beside it, and the `deterministic` boolean is gone because `ERF-70` now
forbids a non-deterministic tool outright. That removes the workaround
the entry described (marking the whole source non-deterministic), so a
mixed-extraction artifact today has only prose to disclose the split.
Both fields are single strings; the question of one tool per step per
source is unchanged. Still waits on a second instance.
