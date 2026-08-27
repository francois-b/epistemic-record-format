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
import { openCorpus, readLog, readSourceList, Refusal, type Corpus } from "../src/corpus.ts";
import * as T from "../src/tools.ts";
import { normalizeText } from "../src/capture.ts";
import { loadCorpus } from "@epistemic-record-format/yaml-markdown";
import { danglingRefs, disposition } from "@epistemic-record-format/yaml-markdown";

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

test("source_add holds a PDF page by page: markers between pages, the quote check passes, the atom names its page", async () => {
  const c = fresh();
  cpSync(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "two-pages.pdf"), join(c.dir, "paper.pdf"));
  const r = await T.sourceAdd(c, { id: "paper-2026", citation_text: "A two-page paper, 2026", path: "paper.pdf" });
  assert.match(r.text, /status licence-unverified/);
  assert.ok(existsSync(join(c.dir, "raw", "paper-2026.pdf")), "the PDF bytes are held as received");
  const norm = readFileSync(join(c.dir, "normalized", "paper-2026.md"), "utf8");
  assert.match(norm, /^<!-- erf:page 1 -->$/m);
  assert.match(norm, /^<!-- erf:page 2 -->$/m);
  assert.match(norm, /seventeen units/);
  assert.match(readSourceList(c)["paper-2026"]!.extraction ?? "", /unpdf .* page markers/);
  // a quote from the second page: checked against the held text, and the page reported and written in the body
  const m = T.atomMint(c, { source: "paper-2026", quote: "the audit agreed with the ledger", finding: "The audit agreed.", source_quality: "medium" });
  assert.match(m.text, /quote check: present · page 2/);
  const atomPath = join(c.dir, "atoms", `${/atom (\S+) minted/.exec(m.text)![1]}.md`);
  assert.match(readFileSync(atomPath, "utf8"), /Page 2 of the held PDF/);
  // the marker is an HTML block: invisible to the quote check, so it never matches a word of a quote
  await refuses(() => Promise.resolve(T.atomMint(c, { source: "paper-2026", quote: "erf:page 2", finding: "x", source_quality: "low" })), /quote not found/);
  clean(c);
});

test("source_add refuses a PDF with no text layer, and holds nothing for it", async () => {
  const c = fresh();
  cpSync(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "no-text.pdf"), join(c.dir, "scan.pdf"));
  await refuses(() => T.sourceAdd(c, { id: "scan-2026", citation_text: "A scanned page, 2026", path: "scan.pdf" }), /no text layer.*OCR is not done/);
  assert.ok(!existsSync(join(c.dir, "raw", "scan-2026.pdf")), "nothing held");
  assert.equal(readSourceList(c)["scan-2026"], undefined);
  clean(c);
});

test("source_add returns the passage, and logs the search that found the page", async () => {
  const c = fresh();
  writeFileSync(join(c.dir, "note.md"), "Preamble sentence.\n\nThe citators disagree with each other on negative treatment.\n\nA closing line.\n");

  // no found_by: nothing is logged but the fetch of the page itself
  const plain = await T.sourceAdd(c, { id: "note-a", citation_text: "A note, 2026", path: "note.md" });
  const afterPlain = readLog(c);
  assert.deepEqual(afterPlain.map((e) => e.kind), ["fetch"], "a capture with no found_by logs no search act");
  assert.match(plain.text, /chars held[\s\S]*The citators disagree/, "the opening of the held text comes back with the capture");
  const pd = plain.data as { id: string; held: boolean; chars: number; windows: { at: number; text: string }[] };
  assert.deepEqual([pd.id, pd.held, pd.windows.length], ["note-a", true, 0]);
  assert.ok(pd.chars > 0);

  // find: the windows the quote check would fold, so a quote is chosen without a second call
  const found = await T.sourceAdd(c, {
    id: "note-b", citation_text: "A note, 2026", path: "note.md",
    find: "citators disagree with each other",
    found_by: { tool: "web search", query: "citator negative treatment disagreement", hits_reported: "8 results", for: "citators-disagree" },
  });
  const d = found.data as { id: string; held: boolean; chars: number; windows: { at: number; text: string }[] };
  assert.equal(d.windows.length, 1);
  assert.match(d.windows[0]!.text, /citators disagree with each other/);
  assert.match(found.text, /1 match\(es\) for "citators disagree with each other"/);
  assert.ok(found.text.trimEnd().endsWith("…"), "the result text ends with the passage");
  assert.match(found.text, /logged search at .* for citators-disagree: web search/);

  const log = readLog(c);
  const search = log.filter((e) => e.kind === "search");
  assert.equal(search.length, 1, "found_by logged exactly one act");
  assert.equal(search[0]!.for, "citators-disagree");
  const fetches = log.filter((e) => e.kind === "fetch" && e.source === "note-b");
  assert.equal(fetches.length, 1);
  assert.ok(log.indexOf(search[0]!) < log.indexOf(fetches[0]!), "the search act is logged before the capture it led to");
  assert.ok(search[0]!.ts <= fetches[0]!.ts, "and dated before it");

  // an incomplete found_by refuses before anything is captured
  await refuses(() => T.sourceAdd(c, { id: "note-c", citation_text: "A note, 2026", path: "note.md", found_by: { tool: "web search", query: "x", hits_reported: "1", for: " " } }), /what the search was for/);
  assert.equal(readSourceList(c)["note-c"], undefined, "the refused capture registered nothing");

  // a phrase that is not in the text says so, and shows the opening anyway
  const miss = await T.sourceAdd(c, { id: "note-d", citation_text: "A note, 2026", path: "note.md", find: "words that are not there" });
  assert.match(miss.text, /no match for "words that are not there" under the fold/);
  assert.equal((miss.data as { windows: unknown[] }).windows.length, 0);
  clean(c);
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

test("atom_mint takes several: each checked in turn, one refusal does not stop the rest, ids consecutive", async () => {
  const c = fresh();
  writeFileSync(join(c.dir, "report.md"), "The recorded total was seventeen units.\n\nThe ledger agreed with the count.\n\nNo exception was raised that quarter.\n");
  await T.sourceAdd(c, { id: "report", citation_text: "Internal report, 2026", path: "report.md" });
  const before = loadCorpus(c.dir).atoms.size;
  const r = T.atomMint(c, {
    atoms: [
      { source: "report", quote: "The recorded total was seventeen units", finding: "The report states a total of seventeen units.", source_quality: "high", as_of_date: "2026" },
      { source: "report", quote: "The ledger was in agreement with the count", finding: "A paraphrase, which the quote check refuses.", source_quality: "high" },
      { source: "report", quote: "No exception was raised that quarter", finding: "No exception that quarter.", source_quality: "medium" },
    ],
  });
  const d = r.data as { minted: string[]; refused: { index: number; reason: string; nearest?: string }[] };
  assert.equal(d.minted.length, 2);
  assert.equal(d.refused.length, 1);
  assert.equal(d.refused[0]!.index, 2, "the refusal names its place in the list");
  assert.match(d.refused[0]!.reason, /ERF-50/);
  assert.match(d.refused[0]!.nearest!, /ledger agreed with the count/, "the nearest passage comes back for the one that failed");
  assert.match(r.text, /2 of 3 atom\(s\) minted/);
  assert.match(r.text, /\[1\] ok \S+ \(report\)/);
  assert.match(r.text, /\[2\] refused:[\s\S]*nearest passage/);
  assert.match(r.text, /\[3\] ok \S+ \(report\)/);

  // ids run consecutively: nothing interleaved between the two writes
  const [a1, a2] = d.minted as [string, string];
  const n = (id: string): number => Number(/-(\d+)$/.exec(id)![1]);
  assert.equal(n(a2), n(a1) + 1);
  assert.equal(loadCorpus(c.dir).atoms.size, before + 2, "the refused atom wrote nothing");
  clean(c);

  // the single shape still refuses the whole call, with the nearest passage in the message
  await refuses(() => T.atomMint(c, { atoms: [] }), /empty list/);
  await refuses(() => T.atomMint(c, { source: "report" }), /give one atom/);
  await refuses(() => T.atomMint(c, { source: "report", quote: "The ledger was in agreement", finding: "x", source_quality: "high" }), /ERF-50[\s\S]*nearest passage/);
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
  assert.throws(() => T.searchLog(c, { tool: "web search", query: "continuous claim check tools", hits_reported: "9 results" }), /what the search was for/);
  T.searchLog(c, { tool: "web search", query: "continuous claim check tools", hits_reported: "9 results, none on point", for: "no-such-tool" });
  T.searchLog(c, { tool: "web search", query: "cursor blame", hits_reported: "10 results", for: "coding-tooling-ahead" });
  assert.throws(() => T.searchLog(c, { tool: "web search", query: "x", hits_reported: "", for: "t" }), /ERF-27/);
  const day = new Date().toISOString().slice(0, 10);
  // a survey compiles only the acts logged for its own question
  assert.throws(() => T.surveyRecord(c, { id: `claim-check-tools-${day}`, title: "T", coverage_bounds: "x", from_log: day }), /say what this survey is for/);
  assert.throws(() => T.surveyRecord(c, { id: `claim-check-tools-${day}`, title: "T", coverage_bounds: "x", from_log: day, for: "something-else" }), /no search act on .* was logged for something-else/);
  const r = T.surveyRecord(c, { id: `claim-check-tools-${day}`, title: "Tools running a continuous claim check", coverage_bounds: "English-language web only.", from_log: day, for: "no-such-tool", notable_results: [{ what: "None on point", note: "nothing shipped runs continuously" }] });
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

test("source_read: the held text, and windows around a phrase under the fold", async () => {
  const c = fresh();
  writeFileSync(join(c.dir, "memo.md"), "Preamble.\n\nThe recorded total was seventeen units, and the ledger agreed.\n");
  await T.sourceAdd(c, { id: "memo", citation_text: "Internal memo, 2026", path: "memo.md" });
  assert.match(T.sourceRead(c, { id: "memo" }).text, /chars held[\s\S]*seventeen units/);
  assert.match(T.sourceRead(c, { id: "memo", find: "seventeen units" }).text, /1 match/);
  assert.match(T.sourceRead(c, { id: "memo", find: "eighteen units" }).text, /no match/);
  assert.match(T.recordRead(c, { id: "memo" }).text, /^source memo/);
  assert.throws(() => T.sourceRead(c, { id: "nope" }), /no source nope/);
});

test("render_site writes the viewer's pages inside the corpus and ignores them in git", () => {
  const c = fresh();
  const r = T.renderSiteTool(c, {});
  assert.match(r.text, /rendered \d+ pages/);
  assert.ok(existsSync(join(c.dir, "site", "index.html")));
  assert.ok(existsSync(join(c.dir, "site", "health.html")));
  assert.throws(() => T.renderSiteTool(c, { out: "../elsewhere" }), /inside the corpus/);
});

test("view: the viewer's pages, body only, addressed by kind and id", () => {
  const c = fresh();
  const idx = T.viewPage(c, {});
  assert.equal(idx.page, "index"); assert.match(idx.html, /^<main>/); assert.match(idx.html, /claim-/);
  const cid = [...loadCorpus(c.dir).claims.keys()][0]!;
  const cl = T.viewPage(c, { page: `claim:${cid}` });
  assert.match(cl.html, /atom-/); assert.doesNotMatch(cl.html, /<html/);
  assert.match(T.viewPage(c, { page: "narrative" }).html, /<main>/);
  assert.match(T.viewPage(c, { page: "health" }).html, /<main>/);
  const cpath = [...loadCorpus(c.dir).claims.keys()][0]!;
  assert.equal(T.viewPage(c, { page: `claims/${cpath}.md` }).page, `claim:${cpath}`, "a path names the record it holds");
  assert.throws(() => T.viewPage(c, { page: "claims/missing.md" }), /no record at/);
  assert.throws(() => T.viewPage(c, { page: "claim:nope" }), /no claim nope/);
  assert.throws(() => T.viewPage(c, { page: "bogus" }), /unknown page/);
});

test("flags: mark a passage, list it with its text, binding the passage resolves it, the view marks it", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  const para = n.body.split("\n\n").find((p) => !/<!--/.test(p) && p.trim().length > 60)!;
  const ws = para.trim().split(/\s+/); let anchor = "";
  for (let i = 0; i + 5 <= ws.length; i++) { const cand = ws.slice(i, i + 5).join(" "); if (n.body.indexOf(cand) === n.body.lastIndexOf(cand)) { anchor = cand; break; } }
  assert.throws(() => T.flag(c, { narrative: n.slug, anchor: "not in the text at all" }), /does not occur/);
  const r = T.flag(c, { narrative: n.slug, anchor, note: "back this" });
  assert.match(r.text, /flag #1 .* 1 open flag/);
  assert.throws(() => T.flag(c, { narrative: n.slug, anchor }), /already flagged/);
  assert.match(T.flags(c, {}).text, /#1 \[open\][\s\S]*back this/);
  assert.match(T.flags(c, {}).text, /scope "[^"]+"[\s\S]*passage \(context, scope marked «»\): [^\n]*«[^»]+»/); // the anchor is the scope; the passage is context
  assert.match(T.viewPage(c, { page: `narrative:${n.slug}` }).html, /<mark class="flag"/);
  T.claimMint(c, { id: "flagged-claim", title: "A claim from a flagged passage", epistemic_kind: "commitment" });
  const b = T.narrativeBind(c, { narrative: n.slug, anchor, claims: ["flagged-claim"] });
  assert.match(b.text, /resolved flag #1/);
  assert.match(T.flags(c, {}).text, /no open flags/);
  assert.match(T.flags(c, { all: true }).text, /#1 \[done\][\s\S]*bound to flagged-claim/);
  assert.throws(() => T.flagResolve(c, { id: 1 }), /already resolved/);
  clean(c);
});

test("flags can be taken: one worker at a time, a stale take is re-takable, resolution keeps the mark", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  const para = n.body.split("\n\n").find((p) => !/<!--/.test(p) && p.trim().length > 60)!;
  const ws = para.trim().split(/\s+/); let anchor = "";
  for (let i = 0; i + 5 <= ws.length; i++) { const cand = ws.slice(i, i + 5).join(" "); if (n.body.indexOf(cand) === n.body.lastIndexOf(cand)) { anchor = cand; break; } }
  T.flag(c, { narrative: n.slug, anchor, research: "back" });

  assert.throws(() => T.flagTake(c, { id: 99 }), /no flag #99/);
  const t = T.flagTake(c, { id: 1, by: "agent/first" });
  assert.match(t.text, /flag #1 taken by agent\/first/);
  assert.equal((t.data as { taken_by: string }).taken_by, "agent/first");
  assert.match(T.flags(c, {}).text, /taken by agent\/first, just now/);
  assert.equal((T.narrativeStatus(c, { narrative: n.slug }).data as { flags: T.FlagItem[] }).flags[0]!.taken_by, "agent/first");
  assert.equal((T.narrativeRead(c, { narrative: n.slug }).data as { flags: T.FlagItem[] })["flags"][0]!.taken_by, "agent/first");

  // a second worker is told who has it; the holder may refresh their own take
  assert.throws(() => T.flagTake(c, { id: 1, by: "agent/second" }), /taken by agent\/first[\s\S]*goes stale after 30 minutes/);
  assert.match(T.flagTake(c, { id: 1, by: "agent/first" }).text, /taken by agent\/first/);

  // a take older than half an hour is stale, and the result says whose it was
  const stale = readFileSync(join(c.dir, "flags.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
  stale[0]!["taken_ts"] = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  writeFileSync(join(c.dir, "flags.jsonl"), stale.map((f) => JSON.stringify(f)).join("\n") + "\n");
  const retake = T.flagTake(c, { id: 1, by: "agent/second" });
  assert.match(retake.text, /taken by agent\/second; agent\/first's take had gone stale/);
  assert.equal((retake.data as { expired_take_by?: string }).expired_take_by, "agent/first");

  // resolving clears nothing: the take is the provenance of who did the work
  T.claimMint(c, { id: "taken-claim", title: "A claim from a taken flag", epistemic_kind: "commitment" });
  T.narrativeBind(c, { narrative: n.slug, anchor, claims: ["taken-claim"] });
  assert.match(T.flags(c, { all: true }).text, /#1 \[done\][\s\S]*taken by agent\/second/);
  assert.throws(() => T.flagTake(c, { id: 1 }), /already resolved \(worked by agent\/second\)/);
  clean(c);
});

test("narrative read/write/status: the digest gates the write, and the check comes back with it", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  const read = T.narrativeRead(c, { narrative: n.slug });
  const d = read.data as { text: string; digest: string; path: string; title: string; bindings: T.BindingItem[]; flags: T.FlagItem[] };
  assert.equal(d.digest.length, 12);
  assert.match(d.text, /^---\n/, "the file as on disk, frontmatter included");
  assert.ok(d.bindings.length > 0, "the minimal narrative is bound somewhere");
  assert.ok(d.bindings.every((b) => b.line !== null), "every anchor is located in the file");
  assert.ok(d.bindings.every((b) => b.status === "current" || b.status === "indeterminate"));
  const first = d.bindings[0]!;
  assert.ok(first.claimInfo?.[first.claims[0]!]?.title, "a bound claim carries its title, kind and disposition for the hover");

  // a stale digest is refused, and the current one comes back
  const edited = d.text.replace(/\n$/, "") + "\n\nA paragraph the editor added.\n";
  await0(() => assert.throws(() => T.narrativeWrite(c, { narrative: n.slug, text: edited, expected_digest: "000000000000" }), /changed on disk[\s\S]*000000000000/));
  assert.equal(T.narrativeRead(c, { narrative: n.slug }).data!["digest"], d.digest, "a refused write wrote nothing");

  // the matching digest writes, and the check rides back with it
  const w = T.narrativeWrite(c, { narrative: n.slug, text: edited, expected_digest: d.digest });
  const wd = w.data as { digest: string; check: string; bindings: T.BindingItem[] };
  assert.notEqual(wd.digest, d.digest);
  assert.match(wd.check, /binding\(s\)/);
  assert.equal(readFileSync(join(c.dir, "narratives", `${n.slug}.md`), "utf8"), edited, "written exactly as sent");
  clean(c);

  // a claim update makes its binding stale, and the write reports it
  const bound = wd.bindings.find((b) => b.status !== "missing-claim")!;
  T.claimUpdate(c, { id: bound.claims[0]!, title: "A title the editor has not seen" });
  const after = T.narrativeWrite(c, { narrative: n.slug, text: edited + "\nAnd another.\n", expected_digest: wd.digest });
  assert.match((after.data as { check: string }).check, /1 stale/);
  assert.equal((after.data as { bindings: T.BindingItem[] }).bindings.find((b) => b.anchor === bound.anchor)?.status, "stale");
});

test("narrative status: a flag carries what it asked for, and a binding resolves it", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  const para = n.body.split("\n\n").find((p) => !/<!--/.test(p) && p.trim().length > 60)!;
  const ws = para.trim().split(/\s+/); let anchor = "";
  for (let i = 0; i + 5 <= ws.length; i++) { const cand = ws.slice(i, i + 5).join(" "); if (n.body.indexOf(cand) === n.body.lastIndexOf(cand)) { anchor = cand; break; } }
  assert.throws(() => T.flag(c, { narrative: n.slug, anchor, research: "sideways" }), /research is one of/);
  T.flag(c, { narrative: n.slug, anchor, note: "the case against, please", research: "opposite" });
  assert.match(T.flags(c, {}).text, /research opposite/);
  // survey: research first, claims after; flagged on a second passage so the first stays a single flag
  const para2 = n.body.split("\n\n").filter((p) => !/<!--/.test(p) && p.trim().length > 60 && p !== para)[0]!;
  const ws2 = para2.trim().split(/\s+/); let anchor2 = "";
  for (let i = 0; i + 5 <= ws2.length; i++) { const cand = ws2.slice(i, i + 5).join(" "); if (n.body.indexOf(cand) === n.body.lastIndexOf(cand)) { anchor2 = cand; break; } }
  T.flag(c, { narrative: n.slug, anchor: anchor2, research: "survey" });
  assert.match(T.flags(c, {}).text, /research survey/);
  const s = T.narrativeStatus(c, { narrative: n.slug }).data as { digest: string; flags: T.FlagItem[]; bindings: T.BindingItem[] };
  const f = s.flags.find((x) => x.id === 1)!;
  assert.equal(f.research, "opposite");
  assert.equal(f.status, "open");
  assert.ok(f.line !== null);
  assert.ok(!("text" in s), "status carries no text; it is the polling call");

  T.claimMint(c, { id: "polled-claim", title: "A claim the poll should see", epistemic_kind: "commitment" });
  T.narrativeBind(c, { narrative: n.slug, anchor, claims: ["polled-claim"] });
  const s2 = T.narrativeStatus(c, { narrative: n.slug }).data as { digest: string; flags: T.FlagItem[]; bindings: T.BindingItem[] };
  assert.notEqual(s2.digest, s.digest, "binding rewrote the file");
  assert.equal(s2.flags.find((x) => x.id === 1)!.status, "done");
  assert.deepEqual(s2.flags.find((x) => x.id === 1)!.claims, ["polled-claim"]);
  const b = s2.bindings.find((x) => x.claims.includes("polled-claim"))!;
  assert.equal(b.status, "current");
  assert.equal(b.claimInfo!["polled-claim"]!.kind, "commitment");
  clean(c);

  // a flag written before the field existed still parses, and reads as mint
  writeFileSync(join(c.dir, "flags.jsonl"), JSON.stringify({ id: 9, ts: new Date().toISOString(), narrative: n.slug, anchor, by: "agent/old", status: "open" }) + "\n");
  assert.match(T.flags(c, {}).text, /#9 \[open\][\s\S]*research mint/);
  assert.equal((T.narrativeStatus(c, { narrative: n.slug }).data as { flags: T.FlagItem[] }).flags[0]!.research, "mint");
});

test("a binding carries each claim's atoms with their side, finding and source page, for the editor's popover", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  const { bindings } = T.narrativeRead(c, { narrative: n.slug }).data as { bindings: T.BindingItem[] };
  const infos = bindings.flatMap((b) => Object.values(b.claimInfo ?? {}));
  assert.ok(infos.length > 0, "the minimal narrative binds claims");
  for (const i of infos) assert.equal(i.evidence, i.atoms?.length ?? 0, "evidence counts the atoms listed");
  const backed = infos.find((i) => (i.atoms?.length ?? 0) > 0)!;
  assert.ok(backed, "at least one bound claim is backed");
  for (const a of backed.atoms!) {
    assert.ok(a.id && a.finding && a.source, "each atom names itself, its finding and its source");
    assert.ok(a.side === "for" || a.side === "against");
    assert.equal(typeof a.citation, "string", "the source's citation travels with the atom");
  }
  const unbacked = infos.find((i) => i.evidence === 0)!;
  assert.ok(!("atoms" in unbacked), "an unbacked claim carries no atoms key");
});

test("an anchor chosen from a displayed line still finds a hand-wrapped passage", () => {
  const c = fresh();
  const n = loadCorpus(c.dir).narratives[0]!;
  // the minimal narrative is hand-wrapped: these words sit across a line break in the file
  const wrapped = /coined names for the\nsame set of problems/.test(n.body);
  assert.ok(wrapped, "the fixture narrative wraps inside this phrase");
  const r = T.flag(c, { narrative: n.slug, anchor: "coined names for the same set of problems" });
  assert.match(r.text, /flag #1/);
  const s = T.narrativeStatus(c, { narrative: n.slug }).data as { flags: T.FlagItem[] };
  assert.ok(s.flags[0]!.line !== null, "the flag is located on its line even though the anchor spans a wrap");
  T.claimMint(c, { id: "wrapped-claim", title: "A claim bound across a wrap", epistemic_kind: "commitment" });
  const b = T.narrativeBind(c, { narrative: n.slug, anchor: "coined names for the same set of problems", claims: ["wrapped-claim"], replace: true });
  assert.match(b.text, /bound/);
  clean(c);
});

test("record_read and record_list", () => {
  const c = fresh();
  assert.match(T.recordList(c, { type: "claim" }).text, /^claim /m);
  const id = [...loadCorpus(c.dir).claims.keys()][0]!;
  assert.match(T.recordRead(c, { id }).text, /^---\n/);
  assert.throws(() => T.recordRead(c, { id: "nope" }), /no record/);
});

function await0(fn: () => unknown): void { fn(); }

// ---------- workspace: roots, discovery, the active corpus ----------
import { openWorkspace, discover, resolveCorpus, useCorpus, newCorpusDir } from "../src/workspace.ts";
// the active-corpus state file lives under ~/.erf; the tests keep theirs in a temp path
process.env["ERF_STATE_FILE"] = `${process.env["TMPDIR"] ?? "/tmp"}/erf-test-active-${process.pid}.json`;

test("workspace: corpora are found under roots by their declarations; one corpus is active by default", () => {
  const root = mkdtempSync(join(tmpdir(), "erf-ws-"));
  cpSync(MINIMAL, join(root, "a"), { recursive: true });
  const ws = openWorkspace([root], { agent: "agent/test", fetchEnabled: false, commit: false });
  assert.deepEqual([...discover(ws).keys()], ["erf-example"]);
  assert.equal(ws.active, "erf-example");
  assert.equal(resolveCorpus(ws).id, "erf-example");
  // a root that is itself a corpus
  const ws2 = openWorkspace([join(root, "a")], { agent: "agent/test", fetchEnabled: false, commit: false });
  assert.equal(resolveCorpus(ws2).id, "erf-example");
});

test("workspace: two corpora need an explicit choice; duplicate ids are refused; init creates and activates", () => {
  const root = mkdtempSync(join(tmpdir(), "erf-ws-"));
  cpSync(MINIMAL, join(root, "a"), { recursive: true });
  cpSync(MINIMAL, join(root, "b"), { recursive: true });
  assert.throws(() => openWorkspace([root], { agent: "agent/test", fetchEnabled: false, commit: false }), /ERF-36/);
  writeFileSync(join(root, "b", "corpus.yaml"), readFileSync(join(root, "b", "corpus.yaml"), "utf8").replace("erf-example", "fixture-second"));
  const ws = openWorkspace([root], { agent: "agent/test", fetchEnabled: false, commit: false });
  assert.equal(ws.active, null);
  assert.throws(() => resolveCorpus(ws), /none active/);
  // the choice holds across processes: a second workspace over the same roots sees it (Cowork lost it, 2026-08-27)
  useCorpus(ws, [...discover(ws).keys()][0]!);
  const again = openWorkspace([root], { agent: "agent/test", fetchEnabled: false, commit: false });
  assert.equal(resolveCorpus(again).id, ws.active);
  assert.throws(() => useCorpus(ws, "nope"), /no corpus with id nope/);
  useCorpus(ws, "fixture-second");
  assert.equal(resolveCorpus(ws).id, "fixture-second");
  assert.equal(resolveCorpus(ws, "erf-example").id, "erf-example", "a call may name another corpus");
  // init under the root
  const dir = newCorpusDir(ws, "c");
  const c = openCorpus({ dir, agent: "agent/test", fetchEnabled: false, commit: false });
  T.corpusInit(c, { id: "fixture-third", title: "Third", owner: "human:test" });
  assert.ok(discover(ws).has("fixture-third"));
  assert.throws(() => newCorpusDir(ws, "/tmp/elsewhere"), /outside the workspace/);
  assert.throws(() => newCorpusDir(ws, "c"), /already holds/);
  // records written by the second corpus land in the second corpus
  const r = T.claimMint(resolveCorpus(ws, "fixture-second"), { id: "second-claim", title: "A claim in the second corpus", epistemic_kind: "commitment" });
  assert.match(r.wrote![0]!, /^claims\/second-claim\.md$/);
  assert.ok(existsSync(join(root, "b", "claims", "second-claim.md")));
  assert.ok(!existsSync(join(root, "a", "claims", "second-claim.md")));
});
