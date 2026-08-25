---
title: "Disposed entries"
purpose: "What was removed from the queue, when, and why. A queue that silently loses items cannot be trusted about the ones it keeps."
status: non-normative
last_updated: 2026-08-25
---

# Disposed entries

An entry leaves the queue when it is ruled, when its trigger fires, or when
it turns out not to have been an entry at all. The third case is this file.
Ids are never reused, so a decision elsewhere that cites `B-16` still
resolves here.

## 2026-08-25 — the two-reviewer prune

Two independent reviews, one Fable and one GPT-5.5, read the specification
and all 48 entries and were asked which entries should not exist. Thirteen
were named by both. Every one falls into a category the queue's own rules
already exclude: already ruled in `non-goals.md`, already answered by the
specification, refused by `purpose.md`, duplicated, or too vague for anyone
to say when it was done.

The count is worth stating plainly: **just over a quarter of the queue was
not backlog.** Most of it was carried forward from the design period out of
politeness, which is the failure the `anticipated` basis was invented to
make visible and did not, because nothing ever forced a re-read.

| id | what it was | why it went |
|---|---|---|
| B-02 | B-02 · A classification wall: machine-checked citation direction | purpose.md refuses confidentiality enforcement in as many words; non-goals ruled policies 2026-08-23 |
| B-05 | B-05 · Per-attachment evidence roles | inaccurate and bodiless; its trigger names something the format already permits |
| B-13 | B-13 · Declared perishability (`stale_after`) | bodiless, never hit, and a stored stale_after reverses ERF-47 staleness being computed |
| B-14 | B-14 · Structured bet settlement | section 4.3 already says where a bet decision and outcome go; calibration is the refused degrees-of-belief ground |
| B-15 | B-15 · Inference grouping (joint premises) | joint-premise grouping is the argumentation machinery purpose.md declines to carry |
| B-16 | B-16 · A counter-survey mirror | section 4.5 answers it with reasoning: what disconfirms a gap claim is atom-shaped |
| B-17 | B-17 · A typed cause on withdrawals | already ruled in non-goals.md 2026-08-22 |
| B-18 | B-18 · A relation for near-identical claims | bodiless, anticipated, and overlapping the second-human trigger |
| B-19 | B-19 · Media-type extraction profiles for capture text | stale: the ERF-51 rewrite gave its trigger a defined outcome |
| B-20 | B-20 · A machine-readable audit policy schema | already ruled in non-goals.md 2026-08-23, policies of any kind |
| B-21 | B-21 · A full normalization grammar in prose | its live subject is carried by B-25 and B-26 |
| B-22 | B-22 · The question record type's return | already ruled in non-goals.md 2026-08-23; provenance cites a version that never existed |
| B-39 | B-39 · The example corpus's narrative carries an undefined field | duplicate of B-36, whose resolution absorbs its exhibit |

## Merged rather than disposed

Three entries stayed in the queue but stopped being separate problems:
`B-43` folds into `B-24` (one decision about which date precisions are
legal where), `B-47` folds into `B-36` (one decision about the narrative
file), and `B-42` folds into `B-01` (one decision about naming a
deployment). Each carries a `merge_into` field rather than being deleted,
because the reasoning in them is worth keeping where the merged entry can
reach it.
