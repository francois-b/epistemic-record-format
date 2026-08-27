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
import { claimCard, flagCard, hitAt, hitBinding, hitFlag, mapPopover, popoverAfterClick, sourceHref, step, type Popover, type FlagPopover } from "../src/popover.ts";
import type { FlagMark } from "../src/marks.ts";
import type { FlagTrail } from "../src/trail.ts";

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
  const p: Popover = { kind: "binding", from: 0, to: 10, binding: BINDING, index: 0 };
  assert.equal(step(p, 1).index, 1);
  assert.equal(step(step(p, 1), 1).index, 0, "past the last claim comes the first");
  assert.equal(step(p, -1).index, 1, "before the first comes the last");
  const none: Popover = { ...p, binding: { ...BINDING, claims: [] } };
  assert.equal(step(none, 1).index, 0, "no claims: nowhere to step");
});

test("the card is the claim showing now, with its atoms and their sources", () => {
  const p: Popover = { kind: "binding", from: 0, to: 10, binding: BINDING, index: 0 };
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
  const p: Popover = { kind: "binding", from: 20, to: 40, binding: BINDING, index: 1 };
  const insertBefore = (pos: number): number => pos + 5;   // five characters typed before the passage
  const moved = mapPopover(p, insertBefore)!;
  assert.equal(moved.from, 25); assert.equal(moved.to, 45); assert.equal(moved.index, 1);
  const collapse = (pos: number): number => Math.min(pos, 20); // the passage deleted
  assert.equal(mapPopover(p, collapse), null);
  assert.equal(mapPopover(null, insertBefore), null);
});

// ---- the flag card ----

const FLAG_FRESH: FlagMark = { id: 1, anchor: "A first paragraph, unbound", status: "open", research: "survey", taken_by: "claude-chat", taken_ts: "2026-08-27T17:13:00Z", take_stale: false };
const FLAG_STALE: FlagMark = { ...FLAG_FRESH, take_stale: true };
const FLAG_FREE: FlagMark = { id: 2, anchor: "A third paragraph, unbound", status: "open", research: "back", note: "the case for, please" };
const FLAG_DONE: FlagMark = { id: 3, anchor: "The citators disagree with each other", status: "done", research: "back", claims: ["citators-disagree", "no-unit-test"], taken_by: "claude-chat" };
const TRAIL: FlagTrail = {
  flag: 1, research: "survey", since: "2026-08-27T17:13:00.000Z", taken_by: "claude-chat",
  searches: [{ ts: "2026-08-27T17:13:48.267Z", tool: "web_search", query: "Hansen Nohria Tierney 1999", hits: "8 results" }],
  captures: [{ ts: "2026-08-27T17:14:10.000Z", source: "scheepers-2006", held: true, search: 0 }],
  atoms: [{ id: "fei-007", source: "scheepers-2006" }], claims: [],
};

test("a click on a flagged span opens the flag card, and a flag wins over a binding on the same span", () => {
  const c = computeMarks(DOC, { flags: [FLAG_FREE, FLAG_DONE], bindings: [BINDING] });
  const onFree = DOC.indexOf("A third paragraph") + 3;
  assert.equal(hitFlag(c, onFree)?.flag.id, 2);
  const open = popoverAfterClick(null, hitAt(c, onFree))!;
  assert.equal(open.kind, "flag");
  assert.equal(popoverAfterClick(open, hitAt(c, onFree)), null, "the same span again: closed");
  assert.equal(popoverAfterClick(open, null), null, "plain prose: closed");
  // the citators passage is both bound and flagged (#3): the flag is what a click opens
  const both = DOC.indexOf("citators disagree") + 2;
  assert.ok(hitBinding(c, both), "the passage is bound");
  assert.equal(popoverAfterClick(null, hitAt(c, both))?.kind, "flag");
  // further into the paragraph, past the flagged words, the binding card opens
  const later = DOC.indexOf("negative treatment");
  assert.equal(popoverAfterClick(null, hitAt(c, later))?.kind, "binding");
  const fp = popoverAfterClick(null, hitAt(c, onFree))!;
  assert.equal(step(fp, 1), fp, "a flag card has nothing to step through");
  assert.equal(claimCard(fp), null);
});

test("the flag card says where the flag stands: fresh take, stale take, nobody on it, done and bound", () => {
  const at = (flag: FlagMark): FlagPopover => ({ kind: "flag", from: 0, to: 10, flag });
  assert.equal(flagCard(at(FLAG_FRESH)).status, "taken by claude-chat · working now");
  assert.equal(flagCard(at(FLAG_STALE)).status, "taken by claude-chat · the take went stale");
  const free = flagCard(at(FLAG_FREE));
  assert.equal(free.status, "open · not being worked");
  assert.equal(free.note, "the case for, please");
  assert.equal(free.research, "back");
  const done = flagCard(at(FLAG_DONE));
  assert.equal(done.status, "done · bound to citators-disagree, no-unit-test");
  assert.deepEqual(done.claims, ["citators-disagree", "no-unit-test"]);
});

test("the flag card carries the flag's trail when the host has one, and says why not otherwise", () => {
  const at = (flag: FlagMark): FlagPopover => ({ kind: "flag", from: 0, to: 10, flag });
  const withTrail = flagCard(at(FLAG_FRESH), [TRAIL]);
  assert.deepEqual(withTrail.lines.map((l) => l.kind), ["search", "capture", "atom"]);
  const without = flagCard(at(FLAG_FREE), [TRAIL]);
  assert.equal(without.lines.length, 1); assert.equal(without.lines[0]!.kind, "empty");
  assert.match(without.lines[0]!.text, /no research logged yet/);
  const mint = flagCard(at({ ...FLAG_FREE, research: "mint" }));
  assert.match(mint.lines[0]!.text, /made in the chat/);
  const long = flagCard(at({ ...FLAG_FREE, span: "word ".repeat(60).trim() }));
  assert.ok(long.span!.endsWith("…") && long.span!.length <= 140, "a long span is cut to one line");
  assert.equal(flagCard(at({ ...FLAG_FREE, span: "the whole sentence selected" })).span, "the whole sentence selected");
});
