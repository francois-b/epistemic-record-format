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
import { FIXTURES } from "../paths.ts";

interface Expectation {
  requirement: string; record: string; field: string; because: string;
}

const dirsIn = (p: string) =>
  existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

test("valid fixtures load without a conformance finding", async (t) => {
  const dir = join(FIXTURES, "valid");
  for (const name of dirsIn(dir)) {
    await t.test(name, () => {
      const c = loadCorpus(join(dir, name));
      assert.deepEqual(c.findings, [], `unexpected findings: ${JSON.stringify(c.findings, null, 2)}`);
    });
  }
});

test("invalid fixtures are rejected, each citing its requirement", async (t) => {
  const dir = join(FIXTURES, "invalid");
  for (const name of dirsIn(dir)) {
    await t.test(name, () => {
      const expect = yaml.load(readFileSync(join(dir, name, "expect.yaml"), "utf8")) as Expectation;
      const c = loadCorpus(join(dir, name));
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
