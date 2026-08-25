/**
 * Record fixtures: corpora that must load clean, and corpora that must be
 * rejected for a named reason.
 *
 * Every invalid fixture carries an `expect.yaml` naming the requirement that
 * must reject it. Asserting the right rule fired is the point: a validator
 * that rejects a record for the wrong reason has not passed, it has been
 * lucky.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { loadCorpus } from "../../viewer/corpus.ts";
import { quoteCheck } from "../../viewer/compute.ts";
import { FIXTURES } from "../paths.ts";

interface Expectation {
  requirement: string; record: string; field: string; because: string;
}

const dirsIn = (p: string) =>
  existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];


/**
 * Push quote-check failures into a loaded corpus's findings, so an invalid
 * fixture can assert on them like any other violation. A capture that is
 * HELD is checkable, whatever its shipping status says about travel
 * (`ERF-50`).
 */
function findQuoteFailures(dir: string, c: ReturnType<typeof loadCorpus>): void {
  for (const a of c.atoms.values()) {
    const src = c.sources.get(a.source);
    if (!src?.normalized) continue;
    const p = join(dir, src.normalized);
    if (!existsSync(p)) continue;
    const chk = quoteCheck(a, readFileSync(p, "utf8"));
    if (chk.state === "fail") {
      c.findings.push({ record: a.id, field: "quote",
        detail: `${chk.detail} (ERF-50, ERF-52)` });
    }
  }
}

test("valid fixtures load without a conformance finding", async (t) => {
  const dir = join(FIXTURES, "valid");
  for (const name of dirsIn(dir)) {
    await t.test(name, () => {
      const c = loadCorpus(join(dir, name));
      assert.deepEqual(c.findings, [], `unexpected findings: ${JSON.stringify(c.findings, null, 2)}`);
    });
  }
});

/**
 * Spirit fixtures: corpora that a correct validator MUST accept while
 * plainly violating what the format means. An excerpt capture holding only
 * the quote it exists to check; a sweeping absence backed by one trivial
 * search. They pass, and that is the point: each one marks a rule the prose
 * carries and no machine can, so its note.md names which SHOULD or which
 * guidance is doing the work. Adopted from the 2026-08-25 independent
 * trials, whose author could not see this suite.
 */
test("spirit fixtures load clean, and each says what it gets away with", async (t) => {
  const dir = join(FIXTURES, "spirit");
  for (const name of dirsIn(dir)) {
    await t.test(name, () => {
      const c = loadCorpus(join(dir, name));
      assert.deepEqual(c.findings, [], `a spirit fixture must load clean: ${JSON.stringify(c.findings, null, 2)}`);
      const note = join(dir, name, "note.md");
      assert.ok(existsSync(note), `${name}: a spirit fixture MUST carry note.md naming the rule that is unenforceable here`);
      assert.ok(readFileSync(note, "utf8").trim().length > 100, `${name}: note.md must say which rule carries the weight`);
    });
  }
});

test("invalid fixtures are rejected, each citing its requirement", async (t) => {
  const dir = join(FIXTURES, "invalid");
  for (const name of dirsIn(dir)) {
    await t.test(name, () => {
      const expect = yaml.load(readFileSync(join(dir, name, "expect.yaml"), "utf8")) as Expectation;
      const c = loadCorpus(join(dir, name));
      // The loader reports structure. The quote check is computed, so a
      // fixture that violates ERF-50 or ERF-52 would otherwise pass here
      // unexamined: this suite tested every rule except the one the format
      // exists for. Found on adopting the 2026-08-25 trial's fixtures.
      findQuoteFailures(join(dir, name), c);
      assert.ok(c.findings.length > 0, `expected a finding for ${expect.requirement}, got none`);

      const onRecord = c.findings.filter((f) => f.record === expect.record && f.field === expect.field);
      assert.ok(
        onRecord.length > 0,
        `expected a finding on ${expect.record}.${expect.field}; got ${JSON.stringify(c.findings)}`,
      );
      // The requirement id travels in the finding's prose. Asserting on it is
      // what distinguishes "rejected" from "rejected for the right reason".
      assert.ok(
        onRecord.some((f) => f.detail.includes(expect.requirement)),
        `no finding on ${expect.record}.${expect.field} names ${expect.requirement}; `
        + `details were: ${onRecord.map((f) => f.detail).join(" | ")}`,
      );
    });
  }
});
