/**
 * The editor's arithmetic, without a DOM: where a mark lands in a markdown
 * document, and what the editor does when the prose moved under it.
 *
 *     node --test tools/editor/test/marks.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { anchorFrom, boundClass, claimLines, computeMarks, locate, markerRanges, maskMarkers, paragraphRange } from "../src/marks.ts";

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
  assert.match(lines[0]!, /^a · observation · active · 1 atom — Citators disagree$/);
  assert.equal(lines[1], "b");
});

test("a document with no marks computes to nothing, and an empty document does not throw", () => {
  const c = computeMarks(DOC, { flags: [], bindings: [] });
  assert.deepEqual([c.flags.length, c.bound.length, c.missing.length], [0, 0, 0]);
  assert.equal(c.markers.length, 1);
  assert.deepEqual(computeMarks("", { flags: [], bindings: [] }).markers, []);
});
