/**
 * The binding popover's state machine, without a DOM: a click opens it on a
 * bound passage and closes it anywhere else, the arrows cycle the claims, and
 * the document moving under it moves it along.
 *
 *     node --test tools/editor/test/popover.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { computeMarks, type BindingMark } from "../src/marks.ts";
import { claimCard, hitBinding, mapPopover, popoverAfterClick, sourceHref, step, type Popover } from "../src/popover.ts";

const DOC = `A first paragraph, unbound.

The citators disagree with each other on negative treatment, which is the part a reader would most want settled.  <!-- claims: citators-disagree no-unit-test "The citators disagree with each other" bound-at=2026-08-27T09:00:00Z -->

A third paragraph, unbound.
`;

const BINDING: BindingMark = {
  anchor: "The citators disagree with each other",
  claims: ["citators-disagree", "no-unit-test"],
  status: "current",
  claimInfo: {
    "citators-disagree": { title: "The citators disagree with each other.", kind: "observation", disposition: "proposal", evidence: 2, atoms: [
      { id: "ele-001", side: "for", finding: "Two citators differ on negative treatment.", source: "study-2024", citation: "A study, 2024", url: "https://example.org/study" },
      { id: "ele-002", side: "against", finding: "One sample found agreement.", source: "note-2025", citation: "A note, 2025" },
    ] },
    "no-unit-test": { title: "Knowledge work has no unit test.", kind: "argument", disposition: "active", evidence: 0 },
  },
};

const marks = () => computeMarks(DOC, { flags: [], bindings: [BINDING] });

test("a position inside the bound passage hits it, and so does one on its marker", () => {
  const c = marks();
  const inside = DOC.indexOf("negative treatment");
  assert.equal(hitBinding(c, inside)?.binding.anchor, BINDING.anchor);
  const onMarker = DOC.indexOf("<!-- claims:") + 5;
  assert.equal(hitBinding(c, onMarker)?.binding.anchor, BINDING.anchor);
  assert.equal(hitBinding(c, DOC.indexOf("A third")), null, "plain prose is no hit");
});

test("a click opens the popover on a bound passage, a second click there closes it, a click elsewhere closes it", () => {
  const c = marks();
  const hit = hitBinding(c, DOC.indexOf("negative treatment"));
  const open = popoverAfterClick(null, hit);
  assert.ok(open);
  assert.equal(open.index, 0, "the first claim shows on opening");
  assert.equal(open.from, hit!.from);
  assert.equal(popoverAfterClick(open, hit), null, "same passage again: closed");
  assert.equal(popoverAfterClick(open, null), null, "plain prose: closed");
});

test("the arrows cycle through the claims and wrap at both ends", () => {
  const p: Popover = { from: 0, to: 10, binding: BINDING, index: 0 };
  assert.equal(step(p, 1).index, 1);
  assert.equal(step(step(p, 1), 1).index, 0, "past the last claim comes the first");
  assert.equal(step(p, -1).index, 1, "before the first comes the last");
  const none: Popover = { ...p, binding: { ...BINDING, claims: [] } };
  assert.equal(step(none, 1).index, 0, "no claims: nowhere to step");
});

test("the card is the claim showing now, with its atoms and their sources", () => {
  const p: Popover = { from: 0, to: 10, binding: BINDING, index: 0 };
  const card = claimCard(p)!;
  assert.equal(card.id, "citators-disagree");
  assert.equal(card.at, 1); assert.equal(card.of, 2);
  assert.equal(card.atoms.length, 2);
  assert.equal(sourceHref(card.atoms[0]!), "https://example.org/study", "a captured page links to itself");
  assert.equal(sourceHref(card.atoms[1]!), "atom-ele-002.html", "no page: the atom's own view");
  const second = claimCard(step(p, 1))!;
  assert.equal(second.title, "Knowledge work has no unit test.");
  assert.deepEqual(second.atoms, [], "a claim with no atoms lists none");
  const bare = claimCard({ ...p, binding: { anchor: "x", claims: ["unknown-claim"], status: "missing-claim" } })!;
  assert.equal(bare.title, "unknown-claim", "a claim the corpus lacks is shown by id");
});

test("the popover follows the text through a change, and closes when its passage is gone", () => {
  const p: Popover = { from: 20, to: 40, binding: BINDING, index: 1 };
  const insertBefore = (pos: number): number => pos + 5;   // five characters typed before the passage
  const moved = mapPopover(p, insertBefore)!;
  assert.equal(moved.from, 25); assert.equal(moved.to, 45); assert.equal(moved.index, 1);
  const collapse = (pos: number): number => Math.min(pos, 20); // the passage deleted
  assert.equal(mapPopover(p, collapse), null);
  assert.equal(mapPopover(null, insertBefore), null);
});
