/**
 * Repository hygiene: the checks that keep the satellites honest.
 *
 * The 2026-08-23 flatten replaced section-shaped requirement ids (section
 * dot sequence) with a flat sequence, and the 2026-08-24 review found the old
 * ids still living in the examples, the viewer README, and the corpus
 * files: rulings had landed in SPEC.md without being swept through what
 * ships beside it. Both checks here exist so that class of drift fails a
 * run instead of waiting for the next reviewer.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import yaml from "js-yaml";
import { loadCorpus, KNOWN_FIELDS } from "../../viewer/corpus.ts";
import { REPO } from "../paths.ts";

/** Historical documents cite old ids on purpose; everything else may not. */
// Documents that narrate the format's past may cite the ids it used then.
// DESIGN-HISTORY.md split into docs/ on 2026-08-25; history.md inherited
// the id migrations and therefore this exemption.
// Documents that narrate the format's past may cite the ids it used then.
// non-goals.md is a register of dated rulings, so an entry about a
// requirement retired before the 2026-08-23 flatten legitimately cites the
// id that requirement had when it was ruled on; there is no flat id to
// point at instead, because the requirement no longer exists in any form.
const HISTORY = new Set(["docs/history.md", "docs/non-goals.md", "CHANGELOG.md"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "site"]);

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(md|ts|yaml|yml)$/.test(name)) yield p;
  }
}

test("no pre-flatten requirement id survives outside the history documents", () => {
  const offenders: string[] = [];
  for (const p of walk(REPO)) {
    const rel = relative(REPO, p);
    if (HISTORY.has(rel) || rel.startsWith("reviews/")) continue;
    const text = readFileSync(p, "utf8");
    const m = text.match(/ERF-\d+\.\d+[a-z]?/);
    if (m) offenders.push(`${rel}: ${m[0]}`);
  }
  assert.deepEqual(offenders, [],
    `pre-flatten ids in shipped files (cite the flat ids or move the text to a history doc): ${offenders.join(", ")}`);
});

test("the example corpus loads with no conformance finding", () => {
  const c = loadCorpus(join(REPO, "examples", "corpora", "minimal"));
  assert.deepEqual(c.findings, [],
    `the shipped example corpus must be conforming: ${JSON.stringify(c.findings, null, 2)}`);
});

test("every standalone example carries only defined fields and legal values", () => {
  const dir = join(REPO, "examples");
  const VERDICTS = new Set(["SUPPORTED", "PARTIAL", "UNSUPPORTED"]);
  const SOURCE_FIELDS = new Set(["id", "citation_text", "citation", "received",
    "status", "normalized", "normalized_digest", "reason", "licence",
    "licence_name", "excerpt", "extraction", "normalization"]);
  const RECEIVED_FIELDS = new Set(["url", "path", "digest", "on"]);
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    const doc = yaml.load(readFileSync(join(dir, name), "utf8"), { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;
    if (name.startsWith("source-")) {
      // A source is not a record (section 4.1): no type, no corpus, no
      // created stamp. Its roster is the Source shape plus an id,
      // which standalone store form carries as a field.
      for (const key of Object.keys(doc)) {
        assert.ok(SOURCE_FIELDS.has(key) || key.startsWith("x_"), `${name}: "${key}" is not a defined source field (ERF-55)`);
      }
      const f = (doc["received"] ?? {}) as Record<string, unknown>;
      for (const key of Object.keys(f)) {
        assert.ok(RECEIVED_FIELDS.has(key) || key.startsWith("x_"), `${name}: received."${key}" is not a defined field (ERF-55)`);
      }
      const ct = String(doc["citation_text"] ?? "");
      assert.ok(!/:\/\//.test(ct), `${name}: citation_text carries a URL (ERF-7)`);
      continue;
    }
    const kind = String(doc["type"]);
    const known = KNOWN_FIELDS[kind];
    assert.ok(known, `${name}: type "${kind}" is not a record type`);
    for (const key of Object.keys(doc)) {
      // `body` is legal here: a standalone YAML example is the store form,
      // where the body is one more field (ERF-53).
      if (key === "body") continue;
      assert.ok(known.has(key), `${name}: "${key}" is not a defined ${kind} field (ERF-55)`);
    }
    const audits = (doc["finding_audit"] ?? doc["evidence_audit"] ?? []) as { verdict?: unknown }[];
    for (const a of audits) {
      assert.ok(VERDICTS.has(String(a?.verdict)), `${name}: verdict ${String(a?.verdict)} (ERF-12)`);
    }
    const ct = String(doc["citation_text"] ?? "");
    assert.ok(!/:\/\//.test(ct), `${name}: citation_text carries a URL (ERF-7)`);
  }
});
