/**
 * `ERF-49`: the unbacked warning, including the premise direction `ERF-24`
 * defines: an argument's premises are its outgoing `assumes` edges plus
 * other claims' `supports` edges pointing at it, so an argument backed
 * only by incoming support is backed, not bare.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { unbacked } from "../../viewer/compute.ts";
import type { Claim } from "../../types/erf.ts";

const claim = (over: Partial<Claim>): Claim => ({
  id: "fx-claim", type: "claim", corpus: "fx", title: "t",
  epistemic_kind: "observation",
  created: { timestamp: "2026-08-01", by: "agent/fixture" },
  families: [], atoms_for: [], atoms_against: [], edges: [],
  standings: [{ timestamp: "2026-08-20T10:00:00Z", stance: "for",
    by: "human:fixture", why: "a fixture stance" }],
  evidence_audit: [], body: "t",
  ...over,
});

const corpusWith = (...claims: Claim[]) =>
  ({ claims: new Map(claims.map((c) => [c.id, c])) }) as never;

test("unbacked: an observation someone stands on with no atoms and no surveys is unbacked", () => {
  assert.equal(unbacked(claim({})), true);
});

test("unbacked: a survey alone backs an observation", () => {
  assert.equal(unbacked(claim({ surveys: ["s-1"] })), false);
});

test("unbacked (section 2) is read from the corpus, stood on or not", () => {
  // Ruled 2026-08-26: a proposal awaiting its search is unbacked and
  // conforms, and a consumer may show it. The stance qualifies the
  // display; it does not gate the reading.
  assert.equal(unbacked(claim({ standings: [] })), true);
});

test("unbacked: an argument with an outgoing assumes edge is backed", () => {
  const a = claim({ epistemic_kind: "argument", edges: [{ to: "p", relation: "assumes" }] });
  assert.equal(unbacked(a, corpusWith(a)), false);
});

test("ERF-49/ERF-24: an argument backed only by an incoming supports edge is backed", () => {
  const a = claim({ epistemic_kind: "argument" });
  const premise = claim({ id: "fx-premise", edges: [{ to: "fx-claim", relation: "supports" }] });
  assert.equal(unbacked(a, corpusWith(a, premise)), false);
});

test("unbacked: an argument with no premises on either side is unbacked", () => {
  const a = claim({ epistemic_kind: "argument" });
  assert.equal(unbacked(a, corpusWith(a)), true);
});
