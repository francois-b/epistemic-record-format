/**
 * `ERF-47` and `ERF-32`: staleness is computed, never stored, and a
 * comparison the stamps' precision cannot order resolves to stale (or, for
 * a binding with no `bound-at` at all, to indeterminate). These are unit
 * cases over the computed readings, because the branches that matter (the
 * indeterminate report, the mixed-precision day) never occur in the valid
 * fixtures and would otherwise be free to regress.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { staleAgainst, staleAudits, bindingStaleness } from "../../viewer/compute.ts";
import type { Atom } from "../../types/erf.ts";

const atom = (created: string, modified?: string, audit?: string): Atom => ({
  id: "fx-001", type: "atom", corpus: "fx", finding: "f", quote: "q",
  citation_text: "c", source_quality: "high",
  created: { timestamp: created, by: "agent/fixture" },
  ...(modified ? { last_modified: { timestamp: modified, by: "agent/fixture" } } : {}),
  finding_audit: audit
    ? [{ auditor: "m", verdict: "SUPPORTED", timestamp: audit, protocol: "v1" }]
    : [],
});

test("ERF-47: a verdict from an earlier day than the change is stale", () => {
  assert.equal(staleAudits(atom("2026-08-01", "2026-08-20", "2026-08-10")), true);
});

test("ERF-47: a verdict from a later day than the change is current", () => {
  assert.equal(staleAudits(atom("2026-08-01", "2026-08-10", "2026-08-20")), false);
});

test("ERF-47: equal bare dates read as current (the same-day re-audit)", () => {
  assert.equal(staleAudits(atom("2026-08-01", "2026-08-19", "2026-08-19")), false);
});

test("ERF-47: mixed precision on one day cannot be ordered, so it is stale", () => {
  assert.equal(staleAgainst("2026-08-19", "2026-08-19T14:00:00Z"), true);
  assert.equal(staleAgainst("2026-08-19T14:00:00Z", "2026-08-19"), true);
});

test("ERF-47: two full instants on one day order by the instant", () => {
  assert.equal(staleAgainst("2026-08-19T09:00:00Z", "2026-08-19T14:00:00Z"), true);
  assert.equal(staleAgainst("2026-08-19T14:00:00Z", "2026-08-19T09:00:00Z"), false);
});

test("ERF-47: an unmodified record is never stale", () => {
  assert.equal(staleAudits(atom("2026-08-01", undefined, "2026-08-10")), false);
});

const corpusWith = (modified?: string) => ({
  claims: new Map([["c-1", {
    id: "c-1", type: "claim", corpus: "fx", title: "t",
    epistemic_kind: "observation",
    created: { timestamp: "2026-08-01", by: "agent/fixture" },
    ...(modified ? { last_modified: { timestamp: modified, by: "agent/fixture" } } : {}),
    families: [], atoms_for: [], atoms_against: [], edges: [],
    standings: [], evidence_audit: [], body: "t",
  }]]),
  // Only `claims` is consulted by bindingStaleness.
}) as never;

test("ERF-32: a binding without bound-at is indeterminate, never current", () => {
  const r = bindingStaleness(undefined, ["c-1"], corpusWith("2026-08-20"));
  assert.equal(r.state, "indeterminate");
});

test("ERF-32: a binding older than the claim's last change is stale", () => {
  const r = bindingStaleness("2026-08-10", ["c-1"], corpusWith("2026-08-20"));
  assert.equal(r.state, "stale");
});

test("ERF-32: a binding newer than the claim's last change is current", () => {
  const r = bindingStaleness("2026-08-25", ["c-1"], corpusWith("2026-08-20"));
  assert.equal(r.state, "current");
});

test("ERF-32: a same-day instant edit under a date-precision binding is stale", () => {
  const r = bindingStaleness("2026-08-20", ["c-1"], corpusWith("2026-08-20T09:00:00Z"));
  assert.equal(r.state, "stale");
});

test("ERF-32: a claim never modified leaves the binding current", () => {
  const r = bindingStaleness("2026-08-10", ["c-1"], corpusWith(undefined));
  assert.equal(r.state, "current");
});
