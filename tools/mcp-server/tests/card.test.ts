/**
 * The pure parts of the ruling card: the word for where a set stands, the one
 * line a folded card shows, and what state a card opens in. The DOM the card
 * builds is looked at with scripts/preview-app.ts, not asserted here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { clip, evidenceLine, foldedLine, openingState, passName, stateWord, FOLD_CHARS } from "../app/card.ts";
import type { ProposalSetView } from "../src/proposals.ts";

const view = (over: Partial<ProposalSetView> = {}): ProposalSetView => ({
  kind: "proposals", corpus: "pilot", flag: 3, ts: "2026-08-28T09:00:00Z", by: "agent/test",
  narrative: "essay", narrative_title: "An essay", anchor: "tried this in the",
  span: "We tried this in the winter of 1994, and the ledger agreed with the count.",
  research: "survey",
  proposals: [],
  counts: { total: 5, ruled: 2, accepted: 1, narrowed: 1, dropped: 0 },
  all_ruled: false, status: "open", ...over,
});

test("the state word says where a set stands, and names the claims a finish bound", () => {
  assert.equal(stateWord(view()), "open");
  assert.equal(stateWord(view({ status: "superseded" })), "superseded");
  assert.equal(stateWord(view({ status: "ruled" })), "finished", "every proposal dropped: the flag resolved, nothing bound");
  assert.equal(stateWord(view({ status: "ruled", bound: ["wave-dates"] })), "bound to 1 claim");
  assert.equal(stateWord(view({ status: "ruled", bound: ["wave-dates", "upkeep-cause"] })), "bound to 2 claims");
});

test("the folded line is the flagged passage, the counts and the state word", () => {
  const f = foldedLine(view());
  assert.equal(f.passage, "We tried this in the winter of 1994, and the ledger agreed with the count.");
  assert.equal(f.counts, "5 proposals · 2 of 5 ruled");
  assert.equal(f.state, "open");
  assert.equal(f.text, "“We tried this in the winter of 1994, and the ledger agreed with the count.” · 5 proposals · 2 of 5 ruled · open");
  const one = foldedLine(view({ counts: { total: 1, ruled: 0, accepted: 0, narrowed: 0, dropped: 0 } }));
  assert.equal(one.counts, "1 proposal · 0 of 1 ruled");
  const bare = foldedLine(view({ span: undefined }));
  assert.equal(bare.passage, "tried this in the", "no span: the anchor is the flagged passage");
});

test("a long passage is clipped to one line's worth, on a word", () => {
  const long = "word ".repeat(60).trim();
  const f = foldedLine(view({ span: long }));
  assert.ok(f.passage.length <= FOLD_CHARS + 1, `clipped to ${f.passage.length}`);
  assert.ok(f.passage.endsWith("…"));
  assert.ok(!f.passage.includes("  "));
  assert.equal(clip("short enough", 40), "short enough", "nothing to cut");
  assert.equal(clip("a b c d e f g h i j", 8), "a b c d…");
  assert.equal(clip("  folded\nwhitespace  ", 40), "folded whitespace");
});

test("a card opens in summary; a finished, superseded or older set opens folded, and the person's choice wins", () => {
  const open = { status: "open" as const, ts: "2026-08-28T09:00:00Z" };
  assert.equal(openingState(open), "summary", "the default is the claims, not the quotes");
  assert.equal(openingState({ ...open, status: "ruled" }), "folded", "the pass is over");
  assert.equal(openingState({ ...open, status: "superseded" }), "folded");
  assert.equal(openingState({ ...open, newest: "2026-08-28T09:00:00Z" }), "summary", "it is itself the newest card");
  assert.equal(openingState({ ...open, newest: "2026-08-28T11:00:00Z" }), "folded", "a newer card is on the page");
  assert.equal(openingState({ ...open, newest: "2026-08-28T08:00:00Z" }), "summary", "it is newer than the last card drawn");
  assert.equal(openingState({ ...open, stored: "full", newest: "2026-08-28T11:00:00Z" }), "full", "what the person chose outranks every rule");
  assert.equal(openingState({ ...open, status: "ruled", stored: "summary" }), "summary");
  assert.equal(openingState({ ...open, stored: null }), "summary", "nothing stored, and storage that refused, read the same");
});

test("a proposal's evidence line counts both sides, and the eyebrow names the pass", () => {
  assert.equal(evidenceLine({ atoms: [] }), "for 0 · against 0");
  assert.equal(evidenceLine({ atoms: [{ side: "for" }, { side: "for" }, { side: "against" }] as never }), "for 2 · against 1");
  assert.equal(passName("survey"), "from a survey");
  assert.equal(passName("opposite"), "from a back pass");
  assert.equal(passName("mint"), "from a decomposition");
});
