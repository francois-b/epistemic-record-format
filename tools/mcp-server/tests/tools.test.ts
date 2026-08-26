/**
 * Every tool's output loads clean under the reference validator, and every
 * refusal in DESIGN.md fires. The fixture is a temporary copy of the minimal
 * example corpus; the oracle is `loadCorpus` plus the computed readings,
 * never a second implementation of a rule.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openCorpus, Refusal, type Corpus } from "../src/corpus.ts";
import * as T from "../src/tools.ts";
import { normalizeText } from "../src/capture.ts";
import { loadCorpus } from "../../../validator/yaml-markdown/typescript/corpus.ts";
import { danglingRefs, disposition } from "../../../validator/yaml-markdown/typescript/compute.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MINIMAL = join(REPO, "examples", "corpora", "minimal");

function fresh(layout: "plain" | "brain" = "plain"): Corpus {
  const dir = mkdtempSync(join(tmpdir(), "erf-mcp-"));
  if (layout === "plain") cpSync(MINIMAL, dir, { recursive: true });
  else {
    // a brain: records under wiki/, held texts under source/
    cpSync(join(MINIMAL, "corpus.yaml"), join(dir, "corpus.yaml"));
    writeFileSync(join(dir, "sources.yaml"), "type: sources\nsources: {}\n");
    cpSync(join(MINIMAL, "narratives"), join(dir, "wiki", "narrative"), { recursive: true });
  }
  return openCorpus({ dir, agent: "agent/test", fetchEnabled: false, commit: false });
}

function clean(c: Corpus): void {
  const l = loadCorpus(c.dir);
  const findings = [...l.findings, ...danglingRefs(l)];
  assert.deepEqual(findings, [], `validator findings: ${JSON.stringify(findings, null, 1)}`);
}

async function refuses(fn: () => unknown, re: RegExp): Promise<void> {
  try { await fn(); } catch (e) { assert.ok(e instanceof Refusal, `expected a Refusal, got ${String(e)}`); assert.match(e.message, re); return; }
  assert.fail("expected a refusal");
}

test("the fixture loads clean before anything is written", () => { clean(fresh()); });

test("corpus_check reports over the minimal corpus", () => {
  const r = T.corpusCheck(fresh());
  assert.match(r.text, /9 atoms, 6 claims, 3 surveys/);
  assert.match(r.text, /violations: 0/);
});

test("source_add from a path holds raw and normalized text, and the atom quote check gates the mint", async () => {
  const c = fresh();
  writeFileSync(join(c.dir, "memo.md"), "# A memo\n\nThe recorded total was seventeen units, and the ledger agreed.\r\n\r\n\r\nEnd.\n");
  const r = await T.sourceAdd(c, { id: "memo-2026", citation_text: "Internal memo, 2026", path: "memo.md" });
  assert.match(r.text, /status licence-unverified/);
  assert.ok(existsSync(join(c.dir, "raw", "memo-2026.md")) && existsSync(join(c.dir, "normalized", "memo-2026.md")));
  assert.equal(readFileSync(join(c.dir, "normalized", "memo-2026.md"), "utf8"), normalizeText(readFileSync(join(c.dir, "memo.md"), "utf8")));
  clean(c);
  // paraphrase refused, nearest passage returned
  await refuses(() => T.atomMint(c, { source: "memo-2026", quote: "The total recorded was seventeen units", finding: "x", source_quality: "high" }), /ERF-50[\s\S]*nearest passage/);
  // verbatim accepted
  const m = T.atomMint(c, { source: "memo-2026", quote: "The recorded total was seventeen units", finding: "The memo states a total of seventeen units.", source_quality: "high", as_of_date: "2026" });
  assert.match(m.text, /quote check: present/);
  clean(c);
  const l = loadCorpus(c.dir);
  const id = m.text.match(/atom (\S+) minted/)![1]!;
  assert.equal(l.atoms.get(id)?.quote, "The recorded total was seventeen units");
  // unknown source, unheld source
  await refuses(() => T.atomMint(c, { source: "nope", quote: "x", finding: "y", source_quality: "high" }), /not registered/);
  await refuses(() => T.atomMint(c, { source: "memo-2026", quote: "x", finding: "y", source_quality: "high", as_of_date: "2026-08-26T10:00:00Z" }), /ERF-14/);
});

test("source_add refuses a URL when fetching is off, a URL in citation_text, and a duplicate id", async () => {
  const c = fresh();
  await refuses(() => T.sourceAdd(c, { id: "x", citation_text: "X", url: "https://example.com" }), /fetching is off/);
  writeFileSync(join(c.dir, "a.txt"), "hello\n");
  await refuses(() => T.sourceAdd(c, { id: "x", citation_text: "see https://example.com", path: "a.txt" }), /ERF-7/);
  await T.sourceAdd(c, { id: "x", citation_text: "X", path: "a.txt" });
  await refuses(() => T.sourceAdd(c, { id: "x", citation_text: "X", path: "a.txt" }), /already registered/);
  await refuses(() => T.sourceAdd(c, { id: "y", citation_text: "Y", path: "../outside.txt" }), /outside the corpus/);
});

test("claims: mint, refusals, update stamps last_modified and flags stale bindings, stand computes disposition", () => {
  const c = fresh();
  const atomId = [...loadCorpus(c.dir).atoms.keys()][0]!;
  await0(() => T.claimMint(c, { id: "test-claim", title: "A test claim about the ledger", epistemic_kind: "observation", atoms_for: [atomId], notes: "minted by a test" }));
  clean(c);
  let l = loadCorpus(c.dir);
  assert.equal(l.claims.get("test-claim")?.body.startsWith("A test claim about the ledger"), true, "body opens with the title");
  assert.equal(disposition(l.claims.get("test-claim")!).disposition, "proposal");
  // refusals
  assert.throws(() => T.claimMint(c, { id: "test-claim", title: "dup", epistemic_kind: "observation" }), /already used/);
  assert.throws(() => T.claimMint(c, { id: "bad-kind", title: "t", epistemic_kind: "hunch" }), /epistemic_kind/);
  assert.throws(() => T.claimMint(c, { id: "bad-ref", title: "t", epistemic_kind: "observation", atoms_for: ["nope"] }), /ERF-35/);
  assert.throws(() => T.claimMint(c, { id: "self", title: "t", epistemic_kind: "argument", edges: [{ to: "self", relation: "assumes" }] }), /ERF-43/);
  // stand
  assert.throws(() => T.claimStand(c, { id: "test-claim", stance: "for", why: "  " }), /why/);
  const s = T.claimStand(c, { id: "test-claim", stance: "for", why: "The atom says so." });
  assert.match(s.text, /disposition active/);
  clean(c);
  l = loadCorpus(c.dir);
  const st = l.claims.get("test-claim")!.standings;
  assert.equal(st.length, 1);
  assert.match(String(st[0]!.timestamp), /T\d\d:\d\d:\d\d/, "a full instant, not a bare date (ERF-19)");
  assert.match(String(st[0]!.by), /^human:/);
  // second standing appends, never edits
  T.claimStand(c, { id: "test-claim", stance: "withdrawn", why: "Changed my mind." });
  assert.equal(loadCorpus(c.dir).claims.get("test-claim")!.standings.length, 2);
  clean(c);
  // update stamps last_modified
  const u = T.claimUpdate(c, { id: "test-claim", title: "A narrower test claim about the ledger" });
  l = loadCorpus(c.dir);
  assert.ok(l.claims.get("test-claim")!.last_modified, "last_modified stamped");
  assert.equal(l.claims.get("test-claim")!.body.startsWith("A narrower test claim"), true);
  assert.equal(l.claims.get("test-claim")!.standings.length, 2, "standings untouched by update");
  clean(c);
  void u;
});

test("surveys: from the research log, and refused with no acts", () => {
  const c = fresh();
  assert.throws(() => T.surveyRecord(c, { id: "nothing-2026-08-26", title: "Nothing", coverage_bounds: "none" }), /ERF-26/);
  T.searchLog(c, { tool: "web search", query: "continuous claim check tools", hits_reported: "9 results, none on point" });
  assert.throws(() => T.searchLog(c, { tool: "web search", query: "x", hits_reported: "" }), /ERF-27/);
  const day = new Date().toISOString().slice(0, 10);
  const r = T.surveyRecord(c, { id: `claim-check-tools-${day}`, title: "Tools running a continuous claim check", coverage_bounds: "English-language web only.", from_log: day, notable_results: [{ what: "None on point", note: "nothing shipped runs continuously" }] });
  assert.match(r.text, /1 act/);
  clean(c);
  const s = loadCorpus(c.dir).surveys.get(`claim-check-tools-${day}`)!;
  assert.equal(s.searches[0].query, "continuous claim check tools");
  assert.ok(s.body.startsWith("Tools running a continuous claim check"));
  // a gap claim backed by the survey
  T.claimMint(c, { id: "no-such-tool", title: "No shipped tool runs a continuous claim check", epistemic_kind: "observation", surveys: [`claim-check-tools-${day}`] });
  clean(c);
});

test("narratives: bind inserts a marker the validator reads; check reports; update makes it stale; replace rewrites", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  // a passage in the minimal narrative with no binding yet: take its first paragraph's words
  const firstPara = n.body.split("\n\n").find((p) => !/<!--/.test(p) && p.trim().length > 40)!;
  const ws = firstPara.trim().split(/\s+/);
  let words = "";
  for (let i = 0; i + 4 <= ws.length; i++) { const cand = ws.slice(i, i + 4).join(" "); if (n.body.indexOf(cand) === n.body.lastIndexOf(cand)) { words = cand; break; } }
  assert.ok(words, "found a unique four-word anchor");
  T.claimMint(c, { id: "bound-claim", title: "A claim bound by a test", epistemic_kind: "commitment" });
  assert.throws(() => T.narrativeBind(c, { narrative: n.slug, anchor: "words that are not there", claims: ["bound-claim"] }), /does not occur/);
  assert.throws(() => T.narrativeBind(c, { narrative: n.slug, anchor: words, claims: ["missing-claim"] }), /mint it first/);
  const before = loadCorpus(c.dir).narratives[0]!.bindings.length;
  const r = T.narrativeBind(c, { narrative: n.slug, anchor: words, claims: ["bound-claim"] });
  assert.match(r.text, /bound 1 claim/);
  clean(c);
  const after = loadCorpus(c.dir).narratives[0]!;
  assert.equal(after.bindings.length, before + 1);
  const b = after.bindings.find((x) => x.claims.includes("bound-claim"))!;
  assert.equal(b.anchor, words);
  assert.match(T.narrativeCheck(c, { narrative: n.slug }).text, /stale/);
  assert.throws(() => T.narrativeBind(c, { narrative: n.slug, anchor: words, claims: ["bound-claim"] }), /replace=true/);
  // the claim changes: binding goes stale, then rebind clears it
  T.claimUpdate(c, { id: "bound-claim", title: "A claim bound by a test, narrowed" });
  assert.match(T.narrativeCheck(c, { narrative: n.slug }).text, /1 stale/);
  const rb = T.narrativeBind(c, { narrative: n.slug, anchor: words, claims: ["bound-claim"], replace: true });
  assert.match(rb.text, /bound 1 claim/);
  const rebound = loadCorpus(c.dir).narratives[0]!.bindings.filter((x) => x.claims.includes("bound-claim"));
  assert.equal(rebound.length, 1, "replace rewrote the marker rather than adding a second");
  assert.match(String(rebound[0]!.boundAt), /^\d{4}-\d{2}-\d{2}T/, "bound at an instant (YAMLB-1), so a same-day rebind can read current");
  assert.doesNotMatch(T.narrativeCheck(c, { narrative: n.slug }).text, /1 stale/);
  clean(c);
});

test("brain layout: records go under wiki/, held texts under source/", async () => {
  const c = fresh("brain");
  assert.equal(c.layout, "brain");
  writeFileSync(join(c.dir, "note.md"), "Seventeen units were recorded.\n");
  await T.sourceAdd(c, { id: "note", citation_text: "A note, 2026", path: "note.md" });
  assert.ok(existsSync(join(c.dir, "source", "raw", "note.md")) && existsSync(join(c.dir, "source", "normalized", "note.md")));
  const m = T.atomMint(c, { source: "note", quote: "Seventeen units were recorded.", finding: "Seventeen units.", source_quality: "medium" });
  const id = m.text.match(/atom (\S+) minted/)![1]!;
  assert.ok(existsSync(join(c.dir, "wiki", "atoms", `${id}.md`)));
  T.claimMint(c, { id: "brain-claim", title: "Seventeen units were recorded", epistemic_kind: "observation", atoms_for: [id] });
  assert.ok(existsSync(join(c.dir, "wiki", "claims", "brain-claim.md")));
  clean(c);
  assert.match(T.corpusCheck(c).text, /1 atoms, 1 claims/);
});

test("record_read and record_list", () => {
  const c = fresh();
  assert.match(T.recordList(c, { type: "claim" }).text, /^claim /m);
  const id = [...loadCorpus(c.dir).claims.keys()][0]!;
  assert.match(T.recordRead(c, { id }).text, /^---\n/);
  assert.throws(() => T.recordRead(c, { id: "nope" }), /no record/);
});

function await0(fn: () => unknown): void { fn(); }
