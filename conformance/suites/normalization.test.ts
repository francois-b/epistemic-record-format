/**
 * ERF-51: the normalization sequence.
 *
 * Cases live in `erf-cases-normalization.txt` beside SPEC.md, normative, as raw/expected pairs, after the
 * model of Unicode's normalization conformance files: a plain table any
 * implementation in any language can run, not a test bound to this codebase.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeForCheck } from "../../validator/yaml-markdown/typescript/compute.ts";
import { NORMALIZATION_CASES } from "../paths.ts";

interface Case { line: number; raw: string; expected: string }

export function loadNormalizationCases(): Case[] {
  const text = readFileSync(NORMALIZATION_CASES, "utf8");
  const out: Case[] = [];
  text.split("\n").forEach((ln, i) => {
    if (!ln.trim() || ln.startsWith("#")) return;
    const parts = ln.split("\t").filter((p) => p !== "");
    if (parts.length < 2) return;
    const unescape = (s: string) => s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    out.push({ line: i + 1, raw: unescape(parts[0]!), expected: unescape(parts[1]!) });
  });
  return out;
}

test("ERF-51 normalization", async (t) => {
  const cases = loadNormalizationCases();
  assert.ok(cases.length > 0, "no normalization cases loaded");
  for (const c of cases) {
    await t.test(`line ${c.line}: ${JSON.stringify(c.raw).slice(0, 60)}`, () => {
      assert.equal(normalizeForCheck(c.raw), c.expected);
    });
  }
});

test("ERF-51 case is never folded", () => {
  // Stated separately from the table because it is a prohibition rather than
  // a transformation: folding case lets a mis-cased quote pass a check whose
  // whole job is fidelity.
  const mixed = "The Study Found No Effect";
  assert.equal(normalizeForCheck(mixed), mixed);
  assert.notEqual(normalizeForCheck(mixed), normalizeForCheck(mixed.toLowerCase()));
});

test("ERF-51 is idempotent", () => {
  // Not stated by the requirement, but a normalization that changes text on a
  // second pass cannot be applied "identically to the quote and the capture"
  // with a stable result, so divergence would be reachable through ordering.
  for (const c of loadNormalizationCases()) {
    const once = normalizeForCheck(c.raw);
    assert.equal(normalizeForCheck(once), once, `not idempotent at line ${c.line}`);
  }
});
