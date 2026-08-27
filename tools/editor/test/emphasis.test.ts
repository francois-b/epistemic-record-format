/**
 * Live preview of emphasis, without a DOM: marks hide, spans style, and the
 * marks come back for the span the cursor is in.
 *
 *     node --test tools/editor/test/emphasis.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { classFor, cursorTouches, livePreview, type Span } from "../src/emphasis.ts";

// "## A title\n\nSome **bold** and *italic* words.\n"
const DOC = "## A title\n\nSome **bold** and *italic* words.\n";
const heading: Span = { name: "ATXHeading2", from: 0, to: 10, marks: [{ from: 0, to: 2 }] };
const bold: Span = { name: "StrongEmphasis", from: 17, to: 25, marks: [{ from: 17, to: 19 }, { from: 23, to: 25 }] };
const italic: Span = { name: "Emphasis", from: 30, to: 38, marks: [{ from: 30, to: 31 }, { from: 37, to: 38 }] };

test("the spans are where the fixture says", () => {
  assert.equal(DOC.slice(bold.from, bold.to), "**bold**");
  assert.equal(DOC.slice(italic.from, italic.to), "*italic*");
  assert.equal(DOC.slice(heading.from, heading.to), "## A title");
});

test("with the cursor elsewhere every mark hides and every span is styled", () => {
  const r = livePreview([heading, bold, italic], [{ from: 45, to: 45 }], DOC);
  assert.deepEqual(r.styled.map((s) => s.cls), ["erf-heading", "erf-strong", "erf-em"]);
  assert.deepEqual(r.hidden, [{ from: 0, to: 3 }, { from: 17, to: 19 }, { from: 23, to: 25 }, { from: 30, to: 31 }, { from: 37, to: 38 }]);
  assert.equal(DOC.slice(0, 3), "## ", "a heading's marks take the space after them");
});

test("the cursor inside a span brings its marks back, and only its marks", () => {
  const r = livePreview([heading, bold, italic], [{ from: 20, to: 20 }], DOC);
  assert.equal(r.styled.length, 3, "the span stays styled while it is edited");
  assert.deepEqual(r.hidden, [{ from: 0, to: 3 }, { from: 30, to: 31 }, { from: 37, to: 38 }]);
});

test("the cursor at either edge of a span counts as inside it", () => {
  assert.equal(cursorTouches(bold, [{ from: 17, to: 17 }]), true);
  assert.equal(cursorTouches(bold, [{ from: 25, to: 25 }]), true);
  assert.equal(cursorTouches(bold, [{ from: 16, to: 16 }]), false);
  assert.equal(cursorTouches(bold, [{ from: 26, to: 26 }]), false);
  assert.equal(cursorTouches(bold, [{ from: 0, to: 40 }]), true, "a selection across it touches it");
});

test("nodes that are not emphasis or headings are left alone", () => {
  assert.equal(classFor("Paragraph"), null);
  assert.equal(classFor("ATXHeading7"), null);
  const r = livePreview([{ name: "Link", from: 0, to: 5, marks: [{ from: 0, to: 1 }] }], [], DOC);
  assert.deepEqual(r, { styled: [], hidden: [] });
});
