/**
 * Serialization behavior that no fixture's expect.yaml can state:
 * `ERF-65`, a date-shaped scalar loads as a string, never a date object;
 * `ERF-57`, a consumer preserves what it reports.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { loadCorpus } from "../../viewer/corpus.ts";
import { FIXTURES } from "../paths.ts";

test("ERF-65: an unquoted date-shaped timestamp loads as a string, not a date", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "minimal"));
  const atom = c.atoms.get("fx-001");
  assert.ok(atom, "fixture atom loads");
  // The minimal fixture writes `timestamp: 2026-08-23` unquoted. Under the
  // YAML 1.2 JSON schema it stays a string; under a legacy 1.1-style default
  // schema it becomes a Date, which is how a claim's computed disposition
  // once depended on how a weekday name sorts.
  assert.equal(typeof atom.created.timestamp, "string");
});

test("ERF-57: an unknown field is reported AND preserved, never dropped", () => {
  const c = loadCorpus(join(FIXTURES, "invalid", "unknown-field-originated"));
  const atom = c.atoms.get("fx-001") as unknown as Record<string, unknown>;
  assert.ok(atom, "the record still loads");
  assert.equal(atom["confidence"], 0.9, "the unknown field survives as opaque data");
  assert.ok(
    c.findings.some((f) => f.field === "confidence" && f.detail.includes("ERF-55")),
    "and the producer error is reported",
  );
});
