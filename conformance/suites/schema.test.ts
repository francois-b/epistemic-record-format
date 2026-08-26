/**
 * The schema is the normative data model, and it is tested rather than
 * trusted: every valid fixture, every spirit fixture and the example corpus
 * validate against it, file by file, with the markdown body attached as
 * `body` so the instance is the model's and not the wire's.
 *
 * Invalid fixtures are not asserted to fail here: most of them break a rule
 * the schema cannot see (references, cycles, the quote check). One is: the
 * fixture that originates an undefined field, because rejecting it is the
 * schema's own job (ERF-73).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { FIXTURES, REPO } from "../paths.ts";

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const schema = JSON.parse(readFileSync(join(REPO, "schema", "erf.schema.json"), "utf8"));
const validate = ajv.compile(schema);

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
function* walk(dir: string): Generator<string> {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== "node_modules") yield* walk(p); }
    else if (/\.(md|ya?ml)$/.test(n)) yield p;
  }
}
/** The model instance a file carries, or null where the file carries none. */
function instance(path: string): unknown {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  if (/\.ya?ml$/.test(path)) {
    const d = yaml.load(raw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    return d && typeof d === "object" && "type" in d ? d : null;
  }
  const m = FM.exec(raw); if (!m) return null;
  const d = yaml.load(m[1]!, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
  if (!d || typeof d !== "object" || !("type" in d)) return null;
  // An atom's body is empty and the model has no field for it (ERF-53);
  // a claim, survey or narrative carries its body as `body`.
  const body = (m[2] ?? "").trim();
  return ["claim", "survey", "narrative"].includes(String(d["type"])) ? { ...d, body } : d;
}

/**
 * `ERF-60`: strictness follows the declared version. A corpus declaring a
 * MINOR newer than this schema knows may carry types and fields the schema
 * has no branch for; validating it against this schema would call expected
 * content a violation. Such a corpus is skipped here and exercised by the
 * loader's own test instead.
 */
const KNOWN_MINOR = 9;
function declaresNewerMinor(dir: string): boolean {
  for (const f of walk(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const d = yaml.load(readFileSync(f, "utf8"), { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    if (d && d["type"] === "corpus") {
      const [maj, min] = String(d["spec_version"] ?? "0.0").split(".");
      return maj === "0" && Number(min) > KNOWN_MINOR;
    }
  }
  return false;
}

test("every valid fixture, spirit fixture and example record validates against erf.schema.json", async (t) => {
  let n = 0;
  for (const root of [join(FIXTURES, "valid"), join(FIXTURES, "spirit"), join(REPO, "examples", "corpora", "minimal"), join(REPO, "examples", "records")]) {
    if (!existsSync(root)) continue;
    const skip = new Set(readdirSync(root).map((d) => join(root, d)).filter((d) => statSync(d).isDirectory() && declaresNewerMinor(d)));
    for (const f of walk(root)) {
      if ([...skip].some((d) => f.startsWith(d + "/"))) continue;
      const inst = instance(f); if (inst === null) continue;
      n++;
      await t.test(f.slice(REPO.length + 1), () => {
        const ok = validate(inst);
        assert.ok(ok, `schema rejects a valid file:\n${ajv.errorsText(validate.errors, { separator: "\n" })}`);
      });
    }
  }
  assert.ok(n > 40, `expected to validate many files, validated ${n}`);
});

test("the schema itself rejects an originated undefined field (ERF-73)", () => {
  const bad = join(FIXTURES, "invalid", "unknown-field-originated");
  let rejected = 0;
  for (const f of walk(bad)) { const i = instance(f); if (i !== null && !validate(i)) rejected++; }
  assert.ok(rejected > 0, "the unknown-field fixture must fail schema validation");
});

test("the actor forms are disjoint: a human id cannot also parse as an agent id", () => {
  const at = (frag: string) => ajv.getSchema(`${schema.$id}#/$defs/${frag}`)!;
  const human = at("HumanActor"), agent = at("AgentActor"), actor = at("Actor");
  assert.ok(human("human:francois") && !agent("human:francois"));
  assert.ok(!human("human:claude/fable-5") && !agent("human:claude/fable-5"), "the overlap case is legal in neither form");
  assert.ok(actor("agent/claude-fable-5") && actor("process:importer") && !actor("human:claude/fable-5"));
});
