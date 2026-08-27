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
import { loadCorpus } from "../../implementations/yaml-markdown/typescript/validate.ts";
import { bindingStaleness, brokenAnchors, danglingRefs, disposition, evidenceRefsFlagged, quoteCheck, standingTies, stoodOn, unbacked } from "../../implementations/yaml-markdown/typescript/compute.ts";
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
      // `ERF-35`, current half: a valid fixture holds no broken reference.
      assert.deepEqual(danglingRefs(c), [],
        `${name}: references that do not resolve: ${JSON.stringify(danglingRefs(c))}`);
    });
  }
});

/**
 * `ERF-35`, historical half. An `evidence_at_stance` id the corpus no
 * longer holds is a FLAG: the fixture must load clean AND the flag must
 * actually be raised. Asserting only the first would pass for a validator
 * that never looked, which is the failure this pair exists to catch.
 */
test("evidence a standing faced is flagged when it goes, never a violation", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "evidence-at-stance-outlives-atom"));
  assert.deepEqual(c.findings, [], "a withdrawn atom cannot retroactively break conformance");
  assert.deepEqual(danglingRefs(c), [], "a historical reference is not a dangling reference");
  const flags = evidenceRefsFlagged(c);
  assert.equal(flags.length, 1, `expected one flag, got ${JSON.stringify(flags)}`);
  assert.match(flags[0], /fx-001/);
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

/**
 * `ERF-31`, the anchor. Three cases that a validator which never looks
 * would pass, so each asserts the positive fact and not merely that the
 * corpus loaded.
 */
test("an anchor spanning a hand-wrapped line still occurs", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "anchor-spans-a-line-wrap"));
  assert.equal(c.narratives[0]?.bindings.length, 1);
  assert.deepEqual(brokenAnchors(c), [],
    "ERF-51 collapses the newline on both sides, so the anchor matches");
});

test("an anchor carries the two escapes, and they are undone before matching", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "anchor-with-escaped-quote"));
  const b = c.narratives[0]?.bindings[0];
  assert.ok(b, "the binding must parse despite the quote characters inside the anchor");
  assert.ok(b.anchor.includes('"the recorded total is seventeen units"'),
    `the escapes must be undone; got: ${b.anchor}`);
  assert.deepEqual(brokenAnchors(c), [], "the unescaped anchor occurs in the passage");
});

test("an anchor left behind by an edit is flagged, and the corpus still conforms", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "anchor-broken-by-an-edit"));
  assert.deepEqual(c.findings, [], "editing prose is permitted, so this is no violation");
  const flags = brokenAnchors(c);
  assert.equal(flags.length, 1, `expected one flag, got ${JSON.stringify(flags)}`);
  assert.match(flags[0], /does not occur in its passage/);
});

/**
 * `ERF-73`/`ERF-20`: an empty mapping is not an empty list. A loader that
 * tidies `{}` away would pass the load-clean check while destroying the
 * distinction, so the assertion is on the two standings, not the corpus.
 */
test("evidence_at_stance present-and-empty is not the same as absent", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "evidence-at-stance-faced-nothing"));
  const st = c.claims.get("fx-claim")?.standings ?? [];
  assert.equal(st.length, 2);
  assert.notEqual(st[0]?.evidence_at_stance, undefined,
    "stamped-and-faced-nothing MUST survive the load as a present empty mapping");
  assert.equal(st[1]?.evidence_at_stance, undefined,
    "never-stamped MUST stay absent");
});

test("an anchor found only in an earlier passage is flagged", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "anchor-in-an-earlier-passage"));
  assert.deepEqual(c.findings, [], "both bindings are well formed");
  const flags = brokenAnchors(c);
  assert.equal(flags.length, 1, `expected the second binding flagged, got ${JSON.stringify(flags)}`);
  assert.match(flags[0], /fx-second/);
});

test("a binding after a code span mentioning the opener is still recognized", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "binding-after-a-code-span"));
  assert.deepEqual(c.findings, []);
  assert.equal(c.narratives[0]?.bindings.length, 2, "a raw scan would have swallowed the first binding");
  assert.deepEqual(brokenAnchors(c), []);
});

test("a malformed candidate closes no passage and is not the haystack", () => {
  const c = loadCorpus(join(FIXTURES, "invalid", "malformed-candidate-does-not-close-a-passage"));
  assert.equal(c.findings.length, 1, "the malformed candidate is reported");
  assert.match(c.findings[0]!.detail, /ERF-31/);
  assert.deepEqual(brokenAnchors(c), [], "the second anchor occurs above the malformed candidate, inside its passage");
});

test("two standings at one instant: the later in the ledger is current, and it is flagged", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "standing-tie-at-one-instant"));
  assert.deepEqual(c.findings, []);
  assert.equal(disposition(c.claims.get("fx-claim")!).disposition, "rejected");
  assert.equal(standingTies(c).length, 1);
});

/**
 * `ERF-60`: a validator sets its strictness by the declared version. A
 * corpus from a later minor carries a record type and a field this consumer
 * does not know; both are preserved and reported, and neither is a
 * violation. The same field under 0.9.0 is ERF-73's violation, which
 * invalid/unknown-field-originated asserts.
 */
test("content from a newer minor version is preserved and reported, not rejected", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "newer-minor-version-extends"));
  assert.deepEqual(c.findings, [], "nothing here is a violation under a newer minor");
  assert.ok(c.newerMinor, "the loader noticed the newer version");
  assert.equal(c.newerMinor!.fields.length, 1, "the unknown field is reported");
  assert.ok(c.unrecognized.some((u) => u.type === "question"), "the unknown type is reported");
});

test("an unsearched proposal is flagged, and the flag says nobody stands on it", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "unsearched-proposal-is-flagged"));
  const cl = c.claims.get("fx-claim")!;
  assert.deepEqual(c.findings, []);
  assert.ok(unbacked(cl, c), "no atoms, no survey: unbacked");
  assert.ok(!stoodOn(cl), "and a proposal, not a ruling");
});

test("YAMLB-3: a file without a fence is unrecognized, and a body starts at its first non-blank line", () => {
  const stray = loadCorpus(join(FIXTURES, "valid", "stray-file-without-fence"));
  assert.deepEqual(stray.findings, []);
  assert.deepEqual(stray.unrecognized.map((u) => u.path), ["notes.md"]);
  const blank = loadCorpus(join(FIXTURES, "valid", "body-leading-blank-lines"));
  assert.deepEqual(blank.findings, []);
  assert.ok(blank.claims.get("fx-claim")!.body.startsWith("The recorded total was seventeen units"), "leading line breaks are not part of the body");
});

test("YAMLB-1: bound-at admits an instant, so a same-day rebind after a same-day edit reads current (F-034)", () => {
  const c = loadCorpus(join(FIXTURES, "valid", "binding-bound-at-instant"));
  assert.deepEqual(c.findings, []);
  const b = c.narratives[0]!.bindings[0]!;
  assert.match(String(b.boundAt), /T10:05:00Z$/);
  assert.equal(bindingStaleness(b.boundAt, b.claims, c).state, "current");
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
      // Reference resolution is computed too (`ERF-35`), so it needs the
      // same lift as the quote check to be assertable here.
      c.findings.push(...danglingRefs(c));
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
