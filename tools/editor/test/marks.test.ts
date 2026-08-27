/**
 * The editor's arithmetic, without a DOM: where a mark lands in a markdown
 * document, and what the editor does when the prose moved under it.
 *
 *     node --test tools/editor/test/marks.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { anchorFrom, boundClass, claimLines, computeMarks, flagClass, locate, markerRanges, maskMarkers, paragraphRange } from "../src/marks.ts";

const DOC = `---
title: "Why nothing checks"
type: narrative
---

Knowledge work has no unit test. A lawyer's memo is read once and filed.

The citators disagree with each other on negative treatment, which is the
part a reader would most want settled.  <!-- claims: citators-disagree "The citators disagree with each other" bound-at=2026-08-27T09:00:00Z -->

A third paragraph, unmarked and unbound.
`;

test("markers are found, masked without moving anything, and read for their claim ids", () => {
  const m = markerRanges(DOC);
  assert.equal(m.length, 1);
  assert.deepEqual(m[0]!.claims, ["citators-disagree"]);
  assert.equal(DOC.slice(m[0]!.from, m[0]!.to).startsWith("<!-- claims:"), true);
  const masked = maskMarkers(DOC);
  assert.equal(masked.length, DOC.length, "masking preserves every offset");
  assert.equal(masked.includes("citators-disagree"), false);
});

test("an anchor is located in the prose, never in the marker that quotes it", () => {
  const r = locate(DOC, "The citators disagree with each other")!;
  assert.ok(r);
  assert.equal(DOC.slice(r.from, r.to), "The citators disagree with each other");
  assert.ok(r.from < markerRanges(DOC)[0]!.from, "the prose occurrence, not the one inside the marker");
  assert.equal(locate(DOC, "words that were rewritten away"), null);
  assert.equal(locate(DOC, "   "), null);
});

test("an anchor written on one line still finds a passage that was hand-wrapped", () => {
  const r = locate(DOC, "negative treatment, which is the part a reader")!;
  assert.ok(r, "the line break inside the passage is a run of whitespace, not a mismatch");
  assert.ok(DOC.slice(r.from, r.to).includes("\n"), "the located span really does cross the wrap");
  assert.equal(DOC.slice(r.from, r.to).replace(/\s+/g, " "), "negative treatment, which is the part a reader");
});

test("the paragraph around an offset runs blank line to blank line", () => {
  const at = DOC.indexOf("A lawyer's memo");
  const p = paragraphRange(DOC, at);
  assert.equal(DOC.slice(p.from, p.to), "Knowledge work has no unit test. A lawyer's memo is read once and filed.");
  const first = paragraphRange("no blank lines here at all", 3);
  assert.deepEqual(first, { from: 0, to: 26 });
});

test("a bound passage is decorated up to its marker, and never over it", () => {
  const c = computeMarks(DOC, { flags: [], bindings: [{ anchor: "The citators disagree with each other", claims: ["citators-disagree"], status: "current" }] });
  assert.equal(c.bound.length, 1);
  const b = c.bound[0]!;
  assert.equal(b.cls, "erf-bound");
  const covered = DOC.slice(b.from, b.to);
  assert.match(covered, /^The citators disagree/);
  assert.equal(covered.includes("<!--"), false, "the marker is not underlined; it collapses to a widget");
  assert.equal(covered.endsWith("settled."), true, "and the decoration does not trail into whitespace");
  assert.deepEqual(c.missing, []);
});

test("flags underline their own words, open and done differently", () => {
  const c = computeMarks(DOC, {
    flags: [
      { id: 1, anchor: "A lawyer's memo is read once", status: "open", research: "back" },
      { id: 2, anchor: "A third paragraph, unmarked", status: "done", claims: ["x"] },
      { id: 3, anchor: "a sentence that was cut in the last edit", status: "open" },
    ],
    bindings: [],
  });
  assert.deepEqual(c.flags.map((f) => f.cls), ["erf-flag-open", "erf-flag-done"]);
  assert.equal(DOC.slice(c.flags[0]!.from, c.flags[0]!.to), "A lawyer's memo is read once");
  assert.deepEqual(c.missing, ["a sentence that was cut in the last edit"], "an anchor the prose moved under is skipped and reported");
});

test("a flag another worker has taken draws as taken, and a resolved one still draws as done", () => {
  const c = computeMarks(DOC, {
    flags: [
      { id: 1, anchor: "A lawyer's memo is read once", status: "open", research: "back", taken_by: "agent/second", taken_ts: "2026-08-27T09:00:00Z" },
      { id: 2, anchor: "A third paragraph, unmarked", status: "done", claims: ["x"], taken_by: "agent/second" },
    ],
    bindings: [],
  });
  assert.deepEqual(c.flags.map((f) => f.cls), ["erf-flag-taken", "erf-flag-done"]);
  assert.equal(flagClass({ id: 3, anchor: "x", status: "open" }), "erf-flag-open", "nobody on it: the ordinary open underline");
  assert.equal(flagClass({ id: 4, anchor: "x", status: "open", taken_by: "agent/gone", taken_ts: "2026-08-26T17:13:00Z", take_stale: true }), "erf-flag-open", "a stale take is nobody on it");
});

test("status becomes a class: current bound, stale and indeterminate not confirmed, broken and missing-claim broken", () => {
  assert.equal(boundClass("current"), "erf-bound");
  assert.equal(boundClass("stale"), "erf-bound-stale");
  assert.equal(boundClass("indeterminate"), "erf-bound-stale");
  assert.equal(boundClass("broken"), "erf-bound-broken");
  assert.equal(boundClass("missing-claim"), "erf-bound-broken");
});

test("an anchor from a selection is collapsed and cut to twelve words", () => {
  assert.equal(anchorFrom("  The citators \n disagree   with each other  "), "The citators disagree with each other");
  assert.equal(anchorFrom("one two three four five six seven eight nine ten eleven twelve thirteen").split(" ").length, 12);
  assert.equal(anchorFrom("one two three", 2), "one two");
  assert.equal(anchorFrom("   "), "");
});

test("a tooltip line carries kind, disposition and evidence where they are known, and the bare id where they are not", () => {
  const lines = claimLines({
    anchor: "x", status: "current", claims: ["a", "b"],
    claimInfo: { a: { title: "Citators disagree", kind: "observation", disposition: "active", evidence: 1 } },
  });
  assert.match(lines[0]!, /^Citators disagree · a · observation · active · 1 atom$/);
  assert.equal(lines[1], "b");
});

test("a document with no marks computes to nothing, and an empty document does not throw", () => {
  const c = computeMarks(DOC, { flags: [], bindings: [] });
  assert.deepEqual([c.flags.length, c.bound.length, c.missing.length], [0, 0, 0]);
  assert.equal(c.markers.length, 1);
  assert.deepEqual(computeMarks("", { flags: [], bindings: [] }).markers, []);
});

test("a binding that landed from elsewhere is merged into what is being typed here", async () => {
  const { mergeMarkers, markerAnchor } = await import("../src/marks.ts");
  // theirs: the file on disk, where another worker just bound the first paragraph
  const theirs = DOC.replace(
    "A lawyer's memo is read once and filed.",
    'A lawyer\'s memo is read once and filed.  <!-- claims: no-unit-test "A lawyer\'s memo is read once" bound-at=2026-08-27T10:00:00Z -->',
  );
  // mine: the same file with a sentence being typed into the first paragraph, unsaved
  const mine = DOC.replace("A lawyer's memo is read once and filed.", "A lawyer's memo is read once and filed. Nobody reruns it.");

  const r = mergeMarkers(mine, theirs);
  assert.equal(r.inserted, 1);
  assert.deepEqual(r.conflicts, []);
  assert.match(r.text, /Nobody reruns it\./, "the words being typed here are kept");
  assert.match(r.text, /claims: no-unit-test/, "and their marker arrives");
  assert.equal(markerRanges(r.text).length, 2, "the marker already in both texts was not duplicated");
  const placed = markerRanges(r.text).find((m) => r.text.slice(m.from, m.to).includes("no-unit-test"))!;
  assert.equal(r.text[placed.from - 1], "\n", "the marker goes on its own line");
  assert.equal(r.text.slice(placed.to, placed.to + 2), "\n\n", "at the end of the paragraph its anchor sits in");
  assert.equal(markerAnchor(r.text.slice(placed.from, placed.to)), "A lawyer's memo is read once");

  // merging the same file twice changes nothing
  assert.equal(mergeMarkers(r.text, theirs).inserted, 0);
  assert.equal(mergeMarkers(r.text, theirs).text, r.text);

  // an anchor the person rewrote away cannot be placed, and nothing is inserted for it
  const rewritten = DOC.replace("A lawyer's memo is read once and filed.", "Nobody ever reads the thing twice.");
  const c = mergeMarkers(rewritten, theirs);
  assert.equal(c.inserted, 0);
  assert.deepEqual(c.conflicts, ["A lawyer's memo is read once"]);
  assert.equal(c.text, rewritten, "a conflict leaves the text exactly as it was");

  // a marker this text has and theirs lacks is left alone: the person may have removed it on purpose
  const dropped = DOC.replace(/\s*<!-- claims: citators-disagree[^>]*-->/, "");
  assert.equal(markerRanges(mergeMarkers(DOC, dropped).text).length, 1, "nothing of mine is removed by a merge");

  // a rebind from elsewhere rewrites the marker for that anchor rather than adding a second
  const rebound = DOC.replace("bound-at=2026-08-27T09:00:00Z", "bound-at=2026-08-27T11:00:00Z");
  const rb = mergeMarkers(DOC, rebound);
  assert.equal(rb.inserted, 1);
  assert.equal(markerRanges(rb.text).length, 1);
  assert.match(rb.text, /bound-at=2026-08-27T11:00:00Z/);
});

test("a hand-wrapped paragraph reads as one: its inner newlines are soft, its ending one is not", async () => {
  const { softBreakRanges, frontmatterRange } = await import("../src/marks.ts");
  const doc = `---\ntitle: x\ntype: narrative\n---\n\nFirst line of a paragraph\nsecond line, hand-wrapped\n    third line, indented as a footnote continues.\n\nNext paragraph.  \nafter a hard break.\n<!-- claims: c1 "Next paragraph" -->\n\n<!-- claims: c2 "stands alone" -->\n`;
  const fm = frontmatterRange(doc)!;
  assert.equal(doc.slice(fm.from, fm.to), "---\ntitle: x\ntype: narrative\n---\n");
  const p1 = { from: doc.indexOf("First"), to: doc.indexOf("continues.") + "continues.".length };
  const p2 = { from: doc.indexOf("Next paragraph"), to: doc.indexOf("break.") + "break.".length };
  const hard = [{ from: doc.indexOf("  \nafter"), to: doc.indexOf("after") }];
  const fmPara = { from: 4, to: doc.indexOf("narrative") + "narrative".length };
  const soft = softBreakRanges(doc, [fmPara, p1, p2], hard);
  const joined = soft.map((r) => doc.slice(r.from, r.to));
  assert.deepEqual(joined, ["\n", "\n    ", "\n"], "two inner wraps, the indentation swallowed, and the newline before the first marker; nothing in the frontmatter, nothing at the hard break");
  assert.equal(doc.slice(soft[2]!.to, soft[2]!.to + 12), "<!-- claims:", "the marker joins its passage");
  assert.equal(soft.some((r) => doc.slice(r.to).startsWith("<!-- claims: c2")), false, "a marker after a blank line stands alone");
});

test("unwrapping turns wrapping newlines into spaces and nothing else, and a CommonMark file is not called hand-wrapped", async () => {
  const { unwrapChanges, looksHardWrapped } = await import("../src/marks.ts");
  const doc = `---\ntitle: x\n---\n\nOne line of a\nwrapped paragraph\n    with a footnote continuation.\n\nA hard break  \nkept, then a marker.\n<!-- claims: c1 "A hard break" -->\n\nAnother wrapped\nparagraph here.\n`;
  const paras = [
    { from: doc.indexOf("One line"), to: doc.indexOf("continuation.") + "continuation.".length },
    { from: doc.indexOf("A hard break"), to: doc.indexOf("marker.") + "marker.".length },
    { from: doc.indexOf("Another"), to: doc.indexOf("here.") + "here.".length },
  ];
  const hard = [{ from: doc.indexOf("  \nkept"), to: doc.indexOf("kept") }];
  assert.equal(looksHardWrapped(doc, paras, hard), true);
  const changes = unwrapChanges(doc, paras, hard);
  let out = doc;
  for (const ch of [...changes].reverse()) out = out.slice(0, ch.from) + ch.insert + out.slice(ch.to);
  assert.equal(out, `---\ntitle: x\n---\n\nOne line of a wrapped paragraph with a footnote continuation.\n\nA hard break  \nkept, then a marker.\n<!-- claims: c1 "A hard break" -->\n\nAnother wrapped paragraph here.\n`);
  const paras2 = [
    { from: out.indexOf("One line"), to: out.indexOf("continuation.") + "continuation.".length },
    { from: out.indexOf("A hard break"), to: out.indexOf("marker.") + "marker.".length },
    { from: out.indexOf("Another"), to: out.indexOf("here.") + "here.".length },
  ];
  const hard2 = [{ from: out.indexOf("  \nkept"), to: out.indexOf("kept") }];
  assert.equal(looksHardWrapped(out, paras2, hard2), false, "once unwrapped, the notice never returns");
  assert.deepEqual(unwrapChanges(out, paras2, hard2), [], "and there is nothing left to unwrap");
});
