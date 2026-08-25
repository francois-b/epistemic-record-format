---
id: B-01
kind: capability
status: open
priority: trigger-driven
priority_because: "A capability waiting on its named trigger, two parties sharing records whose ids may collide, which has not fired; the part the specification already leans on is carried by B-42."
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
