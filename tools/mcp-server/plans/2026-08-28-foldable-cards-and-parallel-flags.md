---
title: "Plan: ruling cards that fold, and flags worked in parallel where sub-agents exist"
purpose: "A self-contained work order for one Claude Code session: make the ruling card and the research-trail card collapsible so a conversation with several passes stays readable; tell the LLM to work several open flags in parallel when it can run sub-agents (Cowork), one card per flag."
status: plan
last_updated: 2026-08-28
---

# Plan: ruling cards that fold, and flags worked in parallel where sub-agents exist

Read this whole file first. Then read `tools/mcp-server/DESIGN.md` (especially the sections on the app, the editor, the research trail and the ruling card), `tools/mcp-server/app/main.ts`, `tools/mcp-server/app/card.ts` (the ruling card), the trail rendering in `app/`, `tools/mcp-server/app/template.html`, `tools/mcp-server/src/index.ts` (INSTRUCTIONS and the prompts), `tools/mcp-server/src/tools.ts` (`propose`, `proposalRule`, `proposalFinish`), and run the tests once (`cd tools/mcp-server && npm test`).

## Why

The first two-pass session in Claude Desktop (Cowork mode, 2026-08-28) worked end to end and produced two ruling cards of five and four proposals. Each card is several screens tall, a proposal shows all its quotes open, and nothing folds, so after two flags the conversation is already hard to scroll and a third would bury the first. The two passes also ran one after the other although Cowork can run sub-agents, because nothing told the LLM to use them.

## Work packages

WP0: commit this plan file alone first (`Plans: foldable cards and parallel flags, work order`). Then one commit per package, subjects in the log's style. Never push. Before each commit: `npm test` and `npm run typecheck` in `tools/mcp-server` green; `npm run build:app` re-run whenever `app/` changed (the bundle is committed). The pre-commit hook runs the version lint.

### WP1. The ruling card folds

In `app/card.ts` (and `main.ts` where the card is mounted; keep the card's own module host-free as it is now):

- **Three states per card**: *folded* (one line: the flagged passage clipped to one line in the reading face, then `N proposals · k of N ruled`, then a state word: `open`, `finished`, or `bound`), *summary* (the head as today, and each proposal as one row: kind, id, title on one or two lines, `for n · against m` counts, and its three buttons), *full* (today's layout, every quote open). A chevron or the head itself toggles folded and summary; a per-proposal disclosure (`quotes`) opens that proposal's atoms in place, so a person reads one proposal's evidence at a time. Ruling buttons work in summary and full alike.
- **Default state**: a card opens in *summary*. When `erf_proposal_finish` succeeds (the passage bound), the card goes to *folded* on its own, with `bound to k claims` as its state word. When the app renders more than one card on the page (the host may replay several tool results), every card but the newest opens folded; the host may not expose ordering, in which case use the proposal set's timestamp from the tool result.
- **Remember the state** per proposal set in `localStorage` (keyed by corpus and set id; wrap in try/catch and render correctly with nothing stored), so a card a person folded stays folded across the host's re-renders of the same result.
- **Inline versus fullscreen**: the card is an inline card and stays one; do not request fullscreen for it. In inline mode the app's auto-resize reports the height, so folding must shrink the card (no fixed heights, no internal scrolling).
- Keep the card's typography and the existing ruling flow (accept, accept narrower with the in-place edit box, drop, finish) exactly as they are; only the disclosure changes. Test the pure parts (state transitions, the folded line's text) in `tools/mcp-server/tests/` or the app's own test file if one exists; the DOM part stays untested.

### WP2. The research trail folds the same way

The research-trail card (the pass's captures, mints, survey) already folds to its summary line inline. Make its states match WP1's words and controls (folded, summary, full), and make it fold itself when the pass's ruling card appears, so the trail reads as the record of a pass and the card as its result. If the trail and the card for one flag can be told apart by flag id, the trail's folded line links to the card (`updateModelContext` is not needed; a plain in-page scroll is enough when both are on the page, else nothing).

### WP3. Flags worked in parallel where sub-agents exist

In `src/index.ts`:

- `INSTRUCTIONS` gains one passage: when more than one flag is open and the host lets you run sub-agents (Cowork, Claude Code), take each flag with `erf_flag_take` and work them in parallel, one sub-agent per flag, each running the full loop for its flag and ending with its own `erf_propose`; report once, one line per flag, when all are on cards. When sub-agents are not available, work the flags one after another, still one card per flag, and say in one line that they ran in series. Never let two workers take the same flag (`erf_flag_take` refuses; a refused take means skip that flag).
- The `work-the-flags` prompt says the same.
- The app's request line for a flag stays as it is (one flag per gesture). Add a **Work the flags** control in the editor header that appears when two or more flags with research other than `mint` are open and not taken: it sends one message, `Work the open flags: #3, #5, #6. In parallel where you can; one ruling card per flag.` and starts polling. Keep it out of the way (same size as the mode toggle, right of the status line).

Tests: the instruction text is covered by the existing instructions test if there is one (add a check that the passage is present); the header control's visibility rule is a pure function over the flag list, tested.

### WP4. Docs

`DESIGN.md`: a short section on the card's three states and why the summary is the default (a person rules on titles and opens evidence on demand); a paragraph on parallel flags. `CHANGELOG.md` Unreleased, two entries. erf-mcp version: bump to 0.5.0 in `src/index.ts` and `implementations.yaml` (the lint names every place).

## Constraints

- Never `git push`. Commit locally per package.
- Do not modify `SPEC.md`, `schema/`, `serialization/`, `implementations/`, `conformance/`. Do not touch `~/dev/fb-epistemology-imc` (it holds live work) or `~/dev/isomorphic-app`. Test against `examples/corpora/minimal` and the fixtures.
- Prose in documents, code comments and commit messages: no em dashes in running text; "LLM", never bare "model"; never the hyphenated compound of "load" and "bearing".
- Existing tool signatures and the ruling flow keep working.
- If something is impossible as written, do the rest and write a "Deviations" section at the end of this file; never narrow silently.
- No Claude Desktop verification is possible from the session; write a "Hand-off checklist" at the end of this file (a two-flag session: cards open in summary, one card folds after finish, the older card is folded when a new one appears, quotes open per proposal, the Work the flags control appears with two open flags and sends one message; in Cowork, whether two sub-agents ran and two cards appeared).

## Out of scope

The `.mcpb` bundle and the plugin; typography; the tree page; Bookeh.

## Deviations

Three, all additions or restatements; nothing in the plan was narrowed.

1. **The version number is in `package.json`, not `implementations.yaml`.** WP4
   says to bump erf-mcp to 0.5.0 "in `src/index.ts` and `implementations.yaml`".
   `implementations.yaml` states where each artifact's version is *read from*,
   not the number itself: for erf-mcp that is `tools/mcp-server/package.json`,
   with `src/index.ts` as its one `also`. Both were bumped and
   `tools/lint/lint-versions.py` passes; `implementations.yaml` needed no edit.
2. **A head control was added to reach the full card.** The plan gives the
   chevron for folded and summary and a per-proposal disclosure for quotes,
   which leaves no way into *full*. The card's head therefore carries one more
   control, `all quotes` / `fewer quotes`, the same size as the others; the
   trail carries its twin, `all lines` / `fewer lines`.
3. **"Every card but the newest opens folded" is done through `localStorage`.**
   Each tool result gets its own instance of the app in the host, so one
   instance cannot see the other cards on the page. Every instance shares one
   origin, so each card records the newest proposal-set timestamp it has drawn
   for the corpus, and a card older than that opens folded. The same mechanism
   carries the flag each card answers, which is how the editor's trail folds
   when the card lands in a different instance. Both reads and writes are
   guarded, and with no storage every card simply opens in summary.

## Hand-off checklist

Nothing below was verified from the session: Claude Desktop and Cowork cannot
be driven from it. The card's three states, the trail's three states, and the
**Work the flags** control were checked in a browser with
`npx tsx scripts/preview-app.ts <corpus> proposals:<flag>` and
`... narrative:<slug> --mode fullscreen --serve 8792`, against a copy of
`examples/corpora/minimal` with proposal sets written onto it. What follows is
for a real two-flag session.

**Before starting.** Rebuild nothing: the bundle is committed. Point the
connector at a corpus with a narrative worth flagging, and open that narrative
in the editor (`erf_view` on it, fullscreen).

1. **Two flags, one gesture.** Flag two passages, each asking for research
   (Survey or Back, not "What does this claim?"). Expect: the **Work the
   flags** control appears in the head bar, right of the status line, the
   moment the second flag is placed and while nobody has taken either. Press
   it. Expect exactly one message in the conversation, reading
   `Work the open flags: #N, #M. In parallel where you can; one ruling card per flag.`
   and nothing else sent. Report: did the control appear, and did the host
   accept the message.
2. **Sub-agents, in Cowork.** Watch what the LLM does with that message.
   Expect: one `erf_flag_take` per flag, then two sub-agents, one per flag,
   each ending with its own `erf_propose`, then one report of one line per
   flag. Report: how many sub-agents ran, whether both flags were taken before
   any work, whether any take was refused, and whether two separate ruling
   cards appeared in the conversation. In a host without sub-agents (plain
   Desktop), expect the flags one after another, two cards still, and a line
   saying they ran in series.
3. **Cards open in summary.** Look at the newer card. Expect: the eyebrow, the
   flagged passage as the title, the narrative's title, then one row per
   proposal (kind and id in the corner, the claim, `for n · against m`, a
   `quotes` control, and accept / accept narrower / drop). No quotes open.
   Report: how many screens tall the card is now, against the five-proposal
   card of 2026-08-28.
4. **The older card is folded.** Look at the first card, above it in the
   conversation. Expect one line: the flagged passage clipped to the line,
   `N proposals · k of N ruled`, and `open`. Press it: it opens in summary.
   Press the chevron or the eyebrow: it folds again. Report whether the older
   card was already folded when the second one arrived, or only after a
   scroll or a re-render.
5. **Quotes, one proposal at a time.** On a proposal with evidence, press
   `quotes`. Expect its atoms, its settling line and the worker's note to open
   in place, and nothing to move in the other proposals. Press `hide quotes`:
   they close. Press `all quotes` in the head: every proposal opens at once,
   and the control reads `fewer quotes`.
6. **Ruling still works.** Rule the whole set from the summary card: accept
   one, accept narrower on another (the edit box opens in place, `save` enables
   only once the wording changed), drop a third. Expect each ruling to redraw
   the card in the state it was in and to put its one line in the LLM's
   context. Report anything that lost the state or the scroll position.
7. **Finish folds the card.** Press `bind and finish`. Expect: the card folds
   itself to one line reading `bound to k claims` (or `finished` when
   everything was dropped), the flag resolves in the editor, and the finish
   line goes into the conversation as before. Report the card's height before
   and after; folding must shrink the card, not scroll inside it.
8. **The trail.** While a pass is running, press the status line
   ("researching #N"). Expect the trail to open in summary: a heading per flag
   with its counts. `all lines` opens every search, capture, atom and claim;
   the chevron folds it to the title line. When that flag's ruling card
   arrives, expect the trail to fold itself once, and the folded line to carry
   `the card for #N`, which scrolls to it. Report whether the trail folded on
   its own in Cowork, where the card is a separate instance of the app.
9. **What is remembered.** Re-enter the chat so the host replays the tool
   results. Expect each card to come back in the state it was left in, and any
   card that is not the newest to come back folded. Report anything that came
   back open that had been folded.

If a step fails, the file to look at is named in it: the card and its states
are `tools/mcp-server/app/card.ts`, the trail and the queue control are
`app/main.ts` with `app/flags.ts`, and what the LLM was told is `INSTRUCTIONS`
and the `work-the-flags` prompt in `src/index.ts`.
