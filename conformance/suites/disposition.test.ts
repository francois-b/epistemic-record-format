/**
 * ERF-41 and ERF-42: disposition is computed from the current stances.
 *
 * Every branch has a case, including the two that were wrong until
 * 2026-08-23: unanimous opposition had no defined reading, and a withdrawal
 * beside a `for` was reported as a contest nobody was having.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { StandingEntry } from "../../schema/erf.generated.ts";
import type { Claim } from "../../implementations/yaml-markdown/typescript/corpus.ts";
import { disposition } from "../../implementations/yaml-markdown/typescript/compute.ts";
import { CASES } from "../paths.ts";

interface DispositionCase {
  name: string;
  requirement: string;
  note?: string;
  standings: StandingEntry[];
  expect: string;
}

export function loadDispositionCases(): DispositionCase[] {
  const dir = join(CASES, "disposition");
  return readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort().map((f) =>
    yaml.load(readFileSync(join(dir, f), "utf8")) as DispositionCase);
}

/** The minimum a Claim needs for `disposition`; the rest is not consulted. */
function claimWith(standings: StandingEntry[]): Claim {
  return {
    id: "fx-case", type: "claim", corpus: "fixture", title: "case",
    epistemic_kind: "observation",
    created: { timestamp: "2026-08-23", by: "agent/conformance" },
    families: [], atoms_for: [], atoms_against: [], edges: [],
    standings, evidence_audit: [], body: "",
  } as unknown as Claim;
}

test("ERF-41 disposition", async (t) => {
  const cases = loadDispositionCases();
  assert.ok(cases.length > 0, "no disposition cases loaded");
  for (const c of cases) {
    await t.test(`${c.requirement}: ${c.name}`, () => {
      assert.equal(disposition(claimWith(c.standings)).disposition, c.expect);
    });
  }
});

test("ERF-41 every input has exactly one reading", () => {
  // Totality is the property that failed before 2026-08-23. Rather than trust
  // the branch list, enumerate every combination of current stances up to
  // three people and assert a reading comes back.
  const stances = ["for", "against", "withdrawn"] as const;
  const readings = new Set<string>();
  for (const a of stances) for (const b of stances) for (const c of stances) {
    const standings = [a, b, c].map((s, i) => ({
      timestamp: `2026-08-2${i + 1}T09:00:00Z`, stance: s,
      by: `human:p${i}`, why: "case",
    })) as unknown as StandingEntry[];
    const r = disposition(claimWith(standings)).disposition;
    assert.ok(r, `no reading for ${a}/${b}/${c}`);
    readings.add(r);
  }
  assert.equal(disposition(claimWith([])).disposition, "proposal");
  assert.ok(readings.has("rejected"), "unanimous opposition never produced `rejected`");
});

test("ERF-42 rejected and retired are distinct readings", () => {
  const rejected = disposition(claimWith([{
    timestamp: "2026-08-23T10:00:00Z", stance: "against",
    by: "human:ana", why: "contradicted by the capture",
  } as unknown as StandingEntry])).disposition;
  const retired = disposition(claimWith([{
    timestamp: "2026-08-23T10:00:00Z", stance: "withdrawn",
    by: "human:ana", why: "absorbed elsewhere",
  } as unknown as StandingEntry])).disposition;
  assert.equal(rejected, "rejected");
  assert.equal(retired, "retired");
  assert.notEqual(rejected, retired);
});
