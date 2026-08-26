/**
 * The coverage map must describe the specification as it actually is.
 *
 * Two ways this file rots: a requirement is added and nobody maps it, or a
 * requirement is retired and its row lingers. Both make the summary line
 * lie, and a coverage number that lies is worse than none.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import yaml from "js-yaml";
import { join } from "node:path";
import { BINDINGS, ROOT, SPEC } from "../paths.ts";

export interface CoverageEntry {
  tests?: string[];
  "untestable-by-design"?: string;
  uncovered?: string;
  note?: string;
}

/**
 * The normative surface is SPEC.md plus every binding document: a rule that
 * moved to bindings/ on 2026-08-25 kept its id and is still a requirement.
 */
export function specRequirements(): string[] {
  const files = [SPEC, ...(existsSync(BINDINGS)
    ? readdirSync(BINDINGS).filter((f) => f.endsWith(".md")).sort().map((f) => join(BINDINGS, f))
    : [])];
  return files.flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/^- \*\*((?:ERF|YAMLB)-\d+)\*\*/gm)].map((m) => m[1]!));
}

export function coverage(): Record<string, CoverageEntry> {
  const doc = yaml.load(readFileSync(join(ROOT, "coverage.yaml"), "utf8")) as
    { requirements: Record<string, CoverageEntry> };
  return doc.requirements;
}

test("every requirement in the spec has a coverage row", () => {
  const missing = specRequirements().filter((id) => !(id in coverage()));
  assert.deepEqual(missing, [], `unmapped requirements: ${missing.join(", ")}`);
});

test("every coverage row names a requirement the spec still has", () => {
  const ids = new Set(specRequirements());
  const stale = Object.keys(coverage()).filter((id) => !ids.has(id));
  assert.deepEqual(stale, [], `rows for requirements the spec no longer has: ${stale.join(", ")}`);
});

test("a retired id is not silently refilled", () => {
  // ERF-16 was cross-realm reference resolution, retired 2026-08-24 with
  // the realm concept itself: no second deployment exists to share with,
  // and the backlog holds the trigger.
  // ERF-29 was the survey `limitations` requirement, retired 2026-08-23.
  // ERF-30 required a narrative to comprise prose plus a claims-tree
  // document, retired 2026-08-23: a claims-tree is one practice's doc class,
  // not something the format needs.
  // ERF-45 was the classification wall, retired 2026-08-24: a rule about
  // who may cite what is a policy, and v1 struck policies.
  // ERF-46 was title/body agreement, retired 2026-08-24 into ERF-18's
  // guidance: whether an opening in other words states the same claim is a
  // reading, and authoring judgment is not numbered. Retired ids are never
  // reused, so a reappearance would mean the numbering discipline broke
  // rather than that a rule came back.
  for (const id of ["ERF-16", "ERF-29", "ERF-30", "ERF-45", "ERF-46", "ERF-64"]) {
    assert.ok(!specRequirements().includes(id), `${id} is retired and must not reappear`);
    assert.ok(!(id in coverage()), `coverage names retired ${id}`);
  }
});

test("every row states exactly one of tests, untestable-by-design, or uncovered", () => {
  for (const [id, e] of Object.entries(coverage())) {
    const stated = [e.tests?.length ? "tests" : null,
      e["untestable-by-design"] ? "untestable" : null,
      e.uncovered ? "uncovered" : null].filter(Boolean);
    assert.equal(stated.length, 1, `${id} states ${stated.length} states: ${stated.join(", ")}`);
  }
});
