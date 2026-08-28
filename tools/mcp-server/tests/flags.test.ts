/**
 * The flag queue: which flags one request would name, the line it sends, and
 * the same instruction in what the server tells the LLM at initialize.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { flagsToWork, workTheFlagsLine, type QueuedFlag } from "../app/flags.ts";
import { INSTRUCTIONS } from "../src/index.ts";

const flag = (over: Partial<QueuedFlag> & { id: number }): QueuedFlag => ({ status: "open", research: "back", ...over });

test("the queue control names the open flags nobody is working, and never fewer than two", () => {
  assert.deepEqual(flagsToWork([]), [], "no flags, no control");
  assert.deepEqual(flagsToWork([flag({ id: 3 })]), [], "one flag is not a queue: its own request line covers it");
  assert.deepEqual(flagsToWork([flag({ id: 3 }), flag({ id: 5 }), flag({ id: 6, research: "survey" })]), [3, 5, 6]);
});

test("a flag that asks for nothing, is resolved, or is being worked stays out of the queue", () => {
  const flags = [
    flag({ id: 1, research: "mint" }),                       // proposes and stops: no request to send
    flag({ id: 2, status: "done" }),                         // resolved
    flag({ id: 3, taken_by: "agent/other" }),                // someone is on it
    flag({ id: 4, taken_by: "agent/other", take_stale: true }), // their take aged out: free again
    flag({ id: 5, research: "opposite" }),
  ];
  assert.deepEqual(flagsToWork(flags), [4, 5]);
  assert.deepEqual(flagsToWork(flags.filter((f) => f.id !== 5)), [], "one free flag left is not a queue");
});

test("the request is one line, and it asks for the flags in parallel with one card each", () => {
  assert.equal(workTheFlagsLine([3, 5, 6]), "Work the open flags: #3, #5, #6. In parallel where you can; one ruling card per flag.");
});

test("the server's instructions tell the LLM to work several flags in parallel where sub-agents exist", () => {
  assert.match(INSTRUCTIONS, /sub-agents/, "the passage is present");
  assert.match(INSTRUCTIONS, /take each free flag with erf_flag_take/);
  assert.match(INSTRUCTIONS, /one sub-agent one flag/);
  assert.match(INSTRUCTIONS, /its own erf_propose/, "each flag ends on its own card");
  assert.match(INSTRUCTIONS, /A refused take means another worker holds that flag/);
  assert.match(INSTRUCTIONS, /work the flags one after another, still one card per flag/, "the host without sub-agents");
});
