---
id: B-01
kind: capability
status: open
basis: anticipated
raised: "retired from v0.9 as `ERF-16` on 2026-08-24 with the realm concept"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
trigger: "Two parties sharing records whose ids may collide."
---

# B-01 · Cross-deployment identity

Record ids are unique within a deployment. Between two deployments a bare id promises nothing, and the format says so and stops. What it does not supply is a way to name the pair.
