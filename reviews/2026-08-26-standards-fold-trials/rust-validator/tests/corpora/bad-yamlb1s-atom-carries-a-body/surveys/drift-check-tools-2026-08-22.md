---
id: "drift-check-tools-2026-08-22"
type: "survey"
corpus: "ledger-governance"
title: "Tools that check prose against the claims it rests on"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "npm search (npm CLI 10.8.2)"
    query: "narrative drift claim binding prose check"
    scope: "the public npm registry"
    hits_reported: "0"
  - tool: "PyPI simple index via pip download --no-deps (pip 24.2)"
    query: "claim-binding OR narrative-anchor OR prose-drift"
    scope: "the public Python package index"
    hits_reported: "3 packages, none a drift checker"
notable_results:
  - what: "prose-lint, a style checker"
    note: "Checks the prose against a style guide and never against an
      external record; the nearest live relative, not an instance."
---
Tools that check prose against the claims it rests on.

The two indexes searched are package registries, not the world: an absence
here says something about what is packaged and distributed, not about what
exists inside firms. Coverage bounds: no search of private tooling, no search
of research prototypes, and hits were inspected only as far as each package's
own description.
