/**
 * The pure state of a ruling card: counts, the all-ruled gate, the claims
 * bound, and the one line that goes into the conversation. No filesystem.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { counts, allRuled, acceptedClaims, finishLine, rulingLine, type ProposalSet } from "../src/proposals.ts";

const set = (): ProposalSet => ({
  flag: 3, ts: "2026-08-27T20:00:00Z", by: "agent/test", narrative: "essay", anchor: "tried this in the", research: "survey",
  proposals: [
    { id: "wave-dates", title: "The wave dates to the 1990s.", epistemic_kind: "observation", atoms_for: ["ex-001"] },
    { id: "upkeep-cause", title: "Upkeep was the cause.", epistemic_kind: "observation", atoms_for: ["ex-002"], atoms_against: ["ex-003"] },
    { id: "third-attempt", title: "This is the third attempt.", epistemic_kind: "argument" },
  ],
  rulings: {}, status: "open",
});

test("counts and the gate follow the rulings; nothing is ruled until something is", () => {
  const s = set();
  assert.deepEqual(counts(s), { total: 3, ruled: 0, accepted: 0, narrowed: 0, dropped: 0 });
  assert.equal(allRuled(s), false);
  assert.deepEqual(acceptedClaims(s), []);
  s.rulings["wave-dates"] = { ruling: "accepted", ts: "t", claim: "wave-dates" };
  s.rulings["upkeep-cause"] = { ruling: "narrowed", ts: "t", claim: "upkeep-cause", title: "Upkeep was one cause." };
  assert.deepEqual(counts(s), { total: 3, ruled: 2, accepted: 1, narrowed: 1, dropped: 0 });
  assert.equal(allRuled(s), false, "one proposal still unruled");
  s.rulings["third-attempt"] = { ruling: "dropped", ts: "t" };
  assert.equal(allRuled(s), true);
  assert.deepEqual(acceptedClaims(s), ["wave-dates", "upkeep-cause"], "dropped proposals bind nothing; order is the proposals' order");
  assert.equal(finishLine(s, true), "Flag #3 ruled: accepted wave-dates; narrowed upkeep-cause; dropped third-attempt; bound.");
});

test("an empty set is never all-ruled, and a set dropped whole finishes without a binding", () => {
  const s = set(); s.proposals = [];
  assert.equal(allRuled(s), false);
  const t = set();
  for (const p of t.proposals) t.rulings[p.id] = { ruling: "dropped", ts: "t" };
  assert.equal(allRuled(t), true);
  assert.deepEqual(acceptedClaims(t), []);
  assert.equal(finishLine(t, false), "Flag #3 ruled: dropped wave-dates, upkeep-cause, third-attempt; nothing to bind, flag resolved.");
});

test("a ruling reads as one line for the LLM", () => {
  const s = set();
  assert.equal(rulingLine(s, "x", { ruling: "accepted", ts: "t", claim: "x" }), "Flag #3: the user accepted x; it is minted as claim x.");
  assert.equal(rulingLine(s, "x", { ruling: "narrowed", ts: "t", claim: "x", title: "Narrower." }), 'Flag #3: the user narrowed x to "Narrower." and it is minted as claim x.');
  assert.equal(rulingLine(s, "x", { ruling: "dropped", ts: "t" }), "Flag #3: the user dropped the proposal x.");
});
