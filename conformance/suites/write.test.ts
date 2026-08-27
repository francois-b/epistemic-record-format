/**
 * The implementation's writer, checked by round trip: what write.ts emits,
 * validate.ts loads clean, and the wire rules hold on the bytes (every
 * string scalar quoted, no empty list written, a present-and-empty mapping
 * as `{}`, the fence exactly).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { frontmatter, recordText, yamlDocument } from "@epistemic-record-format/yaml-markdown";
import { loadCorpus, splitDocument } from "@epistemic-record-format/yaml-markdown";
import { FIXTURES } from "../paths.ts";

test("write: the wire rules hold on the bytes", () => {
  const fm = frontmatter({ id: "x-1", type: "atom", as_of_date: "2018", hits: "0", empty_list: [], present_map: {}, created: { timestamp: "2026-08-26", by: "agent/t" } });
  assert.match(fm, /^id: "x-1"$/m, "string scalars quoted");
  assert.match(fm, /^as_of_date: "2018"$/m, "a bare year would parse as a number (ERF-65)");
  assert.doesNotMatch(fm, /empty_list/, "an empty list is omitted (YAMLB-2)");
  assert.match(fm, /^present_map: \{\}$/m, "a present-and-empty mapping is written (YAMLB-2)");
  const text = recordText({ id: "c", type: "claim" }, "Title\n\nbody\n\n\n");
  assert.ok(text.startsWith("---\n") && text.includes("\n---\n\nTitle\n\nbody\n") && text.endsWith("body\n"), "fence, frontmatter, fence, body, one final newline (YAMLB-3)");
  const s = splitDocument(text); assert.ok(typeof s === "object" && s && s.body.startsWith("Title"));
  assert.equal(recordText({ id: "a", type: "atom" }, null).endsWith("---\n"), true, "an atom's file ends at the closing fence");
});

test("write: what the writer emits, the validator loads clean", () => {
  const dir = mkdtempSync(join(tmpdir(), "erf-write-"));
  cpSync(join(FIXTURES, "valid", "minimal"), dir, { recursive: true });
  mkdirSync(join(dir, "claims"), { recursive: true });
  writeFileSync(join(dir, "claims", "written.md"), recordText({
    id: "written", type: "claim", corpus: "fixture-minimal", title: "A claim the writer wrote", epistemic_kind: "commitment",
    created: { timestamp: "2026-08-26", by: "agent/conformance-write" }, atoms_for: [], edges: [],
    standings: [{ timestamp: "2026-08-26T10:00:00Z", stance: "for", by: "human:conformance-write", why: "written by the writer" }],
  }, "A claim the writer wrote\n\n## Working notes\n\n(none)"));
  writeFileSync(join(dir, "corpus.yaml"), yamlDocument({ type: "corpus", id: "fixture-minimal", title: "Minimal", spec_version: "0.9.0", classification: "public" }));
  const c = loadCorpus(dir);
  assert.deepEqual(c.findings, [], JSON.stringify(c.findings, null, 1));
  assert.equal(c.claims.get("written")?.standings.length, 1);
});
