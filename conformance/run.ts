#!/usr/bin/env -S npx tsx
/**
 * The conformance suite: run every case, then report coverage.
 *
 *     npx tsx conformance/run.ts
 *
 * A failing test is a FINDING about an implementation, not a licence to
 * edit the expectation. See README.md.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./paths.ts";
import { coverage, specRequirements, type CoverageEntry } from "./suites/coverage.test.ts";

function runTests(): boolean {
  const dir = join(ROOT, "suites");
  const files = readdirSync(dir).filter((f) => f.endsWith(".test.ts")).sort();
  try {
    execFileSync("npx", ["tsx", "--test", ...files.map((f) => join(dir, f))], {
      cwd: ROOT, stdio: "inherit", encoding: "utf8",
    });
    return true;
  } catch {
    return false;
  }
}

function report(): void {
  const cov = coverage();
  const ids = specRequirements();
  const bucket = (e: CoverageEntry) =>
    e.tests?.length ? "covered" : e["untestable-by-design"] ? "untestable" : "uncovered";
  const counts = { covered: 0, untestable: 0, uncovered: 0 };
  const uncovered: string[] = [];
  for (const id of ids) {
    const e = cov[id];
    if (!e) { uncovered.push(`${id} (no coverage row)`); counts.uncovered++; continue; }
    const b = bucket(e);
    counts[b as keyof typeof counts]++;
    if (b === "uncovered") uncovered.push(id);
  }
  console.log(
    `\n${ids.length} requirements: ${counts.covered} covered, `
    + `${counts.untestable} untestable by design, ${counts.uncovered} uncovered`,
  );
  if (uncovered.length) {
    console.log("\nuncovered:");
    for (const id of uncovered) {
      const why = cov[id]?.uncovered?.replace(/\s+/g, " ").trim() ?? "";
      console.log(`  ${id}  ${why.slice(0, 96)}${why.length > 96 ? "…" : ""}`);
    }
  }
}

const ok = runTests();
report();
process.exit(ok ? 0 : 1);
