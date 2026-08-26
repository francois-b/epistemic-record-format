---
id: F-034
raised:
  by: "erf-mcp v0, the first tool that rebinds a passage, 2026-08-26"
  on: 2026-08-26
  observation: "a claim edited and rebound within one day reads stale until the next day: bound-at is a date, last_modified an instant, and ERF-47 resolves the mixed comparison to stale"
basis: demonstrated
specified:
  by: "claude-fable-5, building erf-mcp, 2026-08-26"
  on: 2026-08-26
  requirement: "YAMLB-1, ERF-31, ERF-47"
  claim: >
    YAMLB-1's grammar admitted only a date for bound-at, so no binding
    could be ordered against a same-day last_modified, and ERF-47's rule for
    unorderable stamps made every same-day rebind stale by construction.
verifications:
  - by: "tools/mcp-server/tests/tools.test.ts, the narrative test"
    on: 2026-08-26
    verdict: confirmed
outcome: closed
resolution_note: >
  Ruled 2026-08-26: bound-at admits an RFC 3339 instant beside a date
  (YAMLB-1 grammar, ERF-31 wording, the reference parser, and erf-mcp,
  which now writes an instant). A binding made once may still carry a
  date; a tool that rebinds writes an instant. Fixture:
  conformance/fixtures/valid/binding-bound-at-instant.
---

# F-034 · A same-day rebind reads stale because `bound-at` is a date

The first tool that rebinds a passage after a claim changes met this on its
first run: `erf_claim_update` stamps `last_modified` with an instant,
`erf_narrative_bind` wrote `bound-at` as a date, and `ERF-47`, which is
right to resolve an unorderable pair to stale, flagged the fresh binding
until the next day. The rule was doing its job; the grammar had left it
nothing finer to compare. The fix is the grammar's: `bound-at` is a date or
an instant.
