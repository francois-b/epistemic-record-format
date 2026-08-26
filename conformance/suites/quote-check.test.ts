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
import type { Atom } from "../../validator/yaml-markdown/typescript/corpus.ts";
import { quoteCheck } from "../../validator/yaml-markdown/typescript/compute.ts";
import { QUOTE_CASES } from "../paths.ts";

interface QuoteCase {
  name: string; requirement: string; note?: string;
  quote: string; capture: string | null; expect: "pass" | "fail" | "uncheckable";
}

export function loadQuoteCases(): QuoteCase[] {
  // Tab-separated text beside SPEC.md (ERF-51): REQUIREMENT, EXPECT, QUOTE,
  // CAPTURE, with \n \t \\ escapes and <none> for a capture not held. The
  // preceding `#` line names the case.
  const unesc = (s: string) => s.replace(/\\(n|t|\\)/g, (_m, c: string) => (c === "n" ? "\n" : c === "t" ? "\t" : "\\"));
  const cases: QuoteCase[] = [];
  let name = "";
  for (const line of readFileSync(QUOTE_CASES, "utf8").split("\n")) {
    if (line.startsWith("#")) { const t = line.slice(1).trim(); if (t && !t.startsWith(" ") && !line.startsWith("#   ")) name = t; continue; }
    if (!line.trim()) continue;
    const [requirement, expect, quote, capture] = line.split("\t");
    cases.push({ name, requirement: requirement!, quote: unesc(quote ?? ""), capture: capture === "<none>" ? null : unesc(capture ?? ""), expect: expect as QuoteCase["expect"] });
  }
  return cases;
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
