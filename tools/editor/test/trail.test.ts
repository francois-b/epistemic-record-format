/**
 * The research trail's lines, without a DOM: searches in order, the captures
 * each led to under it, refusals said as refusals, atoms and claims last, and
 * an empty window said in one line.
 *
 *     node --test tools/editor/test/trail.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { clock, short, trailLines, trailSummary, type FlagTrail } from "../src/trail.ts";

const t: FlagTrail = {
  flag: 1, research: "survey", since: "2026-08-27T17:13:00.000Z",
  searches: [
    { ts: "2026-08-27T17:13:48.267Z", for: "km-90s", tool: "web_search", query: "Hansen Nohria Tierney 1999 codification personalization", hits: "8 results: ScienceDirect abstract only, two Academia.edu PDF pages" },
    { ts: "2026-08-27T17:19:28.688Z", for: "km-90s", tool: "web_search", query: "Lotus Notes intranet document repository 1990s", hits: "9 results" },
  ],
  captures: [
    { ts: "2026-08-27T17:14:10.000Z", source: "scheepers-2006", held: true, citation: "Scheepers et al., refining the model of Hansen, Nohria and Tierney, 2006", url: "https://example.org/a", search: 0 },
    { ts: "2026-08-27T17:20:01.000Z", source: "lotus-1998", held: false, refused: "the PDF has no text layer; OCR is not done", url: "https://example.org/b.pdf", search: 1 },
  ],
  atoms: [{ id: "fei-007", source: "scheepers-2006" }],
  claims: [{ id: "km-wave-90s", title: "An organizational knowledge-management movement in the 1990s attempted to capture working knowledge." }],
};

test("lines: searches in order, captures under the search that led to them, refusals named, atoms and claims last", () => {
  const lines = trailLines(t);
  assert.deepEqual(lines.map((l) => l.kind), ["search", "capture", "search", "refused", "atom", "claim"]);
  assert.match(lines[0]!.text, /^17:13 web_search: “Hansen Nohria Tierney 1999 codification personalization” · 8 results/);
  assert.match(lines[1]!.text, /^ {2}held scheepers-2006: Scheepers et al/);
  assert.equal(lines[1]!.href, "https://example.org/a");
  assert.match(lines[3]!.text, /^ {2}refused lotus-1998: the PDF has no text layer/);
  assert.match(lines[4]!.text, /fei-007 \(scheepers-2006\)/);
  assert.equal(lines[5]!.href, "claim-km-wave-90s.html");
});

test("an empty window says so, and says it differently once the flag is resolved", () => {
  const empty: FlagTrail = { ...t, searches: [], captures: [], atoms: [], claims: [] };
  assert.deepEqual(trailLines(empty), [{ kind: "empty", text: "waiting for the first search…" }]);
  assert.deepEqual(trailLines({ ...empty, until: "2026-08-27T18:00:00.000Z" }), [{ kind: "empty", text: "nothing was logged for this flag" }]);
});

test("a capture no search preceded lands after the searches, not under one", () => {
  const lines = trailLines({ ...t, captures: [{ ts: "2026-08-27T17:00:00.000Z", source: "x", held: true, search: null }], atoms: [], claims: [] });
  assert.deepEqual(lines.map((l) => l.kind), ["search", "search", "capture"]);
});

test("the summary counts across flags; clock and short do what they say", () => {
  assert.equal(trailSummary([t, { ...t, flag: 2, atoms: [], claims: [] }]), "4 searches · 4 captures · 1 atom · 1 claim");
  assert.equal(clock("2026-08-27T17:13:48.267Z"), "17:13");
  assert.equal(short("a b c", 90), "a b c");
  const s = short("word ".repeat(40), 30);
  assert.ok(s.length <= 31 && s.endsWith("…"), s);
});
