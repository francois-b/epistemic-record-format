/**
 * ERF-50 and ERF-52: the mechanical quote check.
 *
 * The check is the format's central promise: a quote is what the source
 * said, and anyone holding the corpus can re-run the proof. These cases
 * defend the two ways it can fail dishonestly, passing something the source
 * never carried and failing something it did.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { Atom } from "../../types/erf.ts";
import { quoteCheck } from "../../viewer/compute.ts";
import { CASES } from "../paths.ts";

interface QuoteCase {
  name: string; requirement: string; note?: string;
  quote: string; capture: string | null; expect: "pass" | "fail" | "uncheckable";
}

export function loadQuoteCases(): QuoteCase[] {
  const doc = yaml.load(readFileSync(join(CASES, "quote-check.yaml"), "utf8")) as { cases: QuoteCase[] };
  return doc.cases;
}

function atomWith(quote: string): Atom {
  return {
    id: "fx-quote", type: "atom", corpus: "fixture",
    finding: "case", quote, citation_text: "fixture", source_quality: "high",
    created: { timestamp: "2026-08-23", by: "agent/conformance" },
    finding_audit: [],
  } as unknown as Atom;
}

test("ERF-50/52 quote check", async (t) => {
  const cases = loadQuoteCases();
  assert.ok(cases.length > 0, "no quote cases loaded");
  for (const c of cases) {
    await t.test(`${c.requirement}: ${c.name}`, () => {
      assert.equal(quoteCheck(atomWith(c.quote), c.capture).state, c.expect);
    });
  }
});

test("ERF-51 a missing capture is uncheckable, never a pass", () => {
  // The distinction matters more than it looks: a tool that reports a pass
  // when it could not read the source is asserting a proof it never ran.
  assert.equal(quoteCheck(atomWith("anything"), null).state, "uncheckable");
});
