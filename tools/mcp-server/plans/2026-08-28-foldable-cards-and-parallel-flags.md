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
