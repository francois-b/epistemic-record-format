---
title: "Pattern: record prose"
purpose: "The style for anything an LLM writes into a record or onto a card: one sentence, one idea, plain words, readable at a glance; and what a server can check of it."
status: non-normative, draft for ruling
last_updated: 2026-08-27
---

# Pattern: record prose

## The problem

An LLM writes claim titles, notes, findings and summaries into the record, and a person reads them hundreds of times: on the ruling card, in the tree, in the editor's popover, in the chat. Default LLM prose is built for a different reader. It stacks clauses with colons and semicolons, reaches for three items where one would do, sets up antitheses ("not X but Y"), hedges, intensifies, and leans on a small vocabulary of borrowed weight ("load-bearing", "tension", "nuance", "crucial", "underscore"). A title written that way takes two readings; a hundred of them make review a chore.

A banned-word list chases the tells one at a time. This pattern states the sentence instead, and says which of its rules a server can enforce without a person in the loop.

The target is plain and precise, not human-sounding. Record prose does not want voice, warmth or variation, and it does not want the sophistication of a good writer; it wants the fewest plain words that state one thing exactly. It is not terse either: a fragment or a clipped noun phrase is a failure the same as a flourish. Tools and prompts whose aim is to "write like a human" are the wrong instrument here; the right ones remove slop and enforce plainness.

## The one rule

**One sentence, one idea, the actor as its subject, the action as its verb, the point at the end.** Everything below is that rule applied to a particular kind of text.

Five traditions that never cite each other arrive at it independently: technical writing standards (ASD-STE100: one instruction per sentence, 20 to 25 words), requirements engineering (INCOSE R18 "single thought", R19 no combinators joining two statements; EARS's fixed sentence shapes with one shall-clause; ISO/IEC/IEEE 29148 "singular"), argument mapping (Kialo's "more than one claim" mark; Rationale's "boxes contain claims, not arguments"), the plain-language guides (plainlanguage.gov, Microsoft, Google), and the sentence-craft books (Strunk 1918 rule 18, Orwell 1946, Gopen and Swan 1990, Williams, Pinker, Klinkenborg). The convergence is the evidence for making it a hard rule here.

## The rules

### A claim title

A title is read most, so it is bound tightest.

1. **One sentence, one idea.** No colon, no semicolon, no dash, no parentheses. If it needs a second clause, it is two claims. (INCOSE R18/R19; EARS; Rationale.)
2. **Twenty-five words or fewer.** (ASD-STE100's ceiling for descriptive text.)
3. **A declarative sentence with a finite verb.** Not a question, not a fragment, not a noun phrase. (Rationale.)
4. **The actor is the subject and the action is the verb.** Not a nominalization ("the codification of material" becomes "the movement codified material"). (Williams; plainlanguage.gov "hidden verbs"; Gopen and Swan.)
5. **Active voice**, unless the agent is unknown or the object is the point. (Google's three exceptions; Pinker: a passive must be chosen, not defaulted to.)
6. **Plain words.** Use, not utilize; start, not commence; about, not approximately. No jargon where an everyday word exists. (Orwell rules 2 and 5; retext-simplify's list.)
7. **No hedges in an observation** (may, might, seems, arguably, perhaps, in many ways). A bet may hedge; the note may hedge. (Kialo; Pinker on compulsive hedging.)
8. **No intensifiers or evaluative adverbs** (very, clearly, notably, significantly, deeply, truly, fundamentally). (Wikipedia words-to-watch, editorializing; write-good.)
9. **No vague measures** (adequate, appropriate, significant, sufficient, some, several without a number). Numbers, dates and names as the source gives them, with their units. (INCOSE R6, R7.)
10. **No absolutes** (always, never, all, 100%) unless the source states one. (INCOSE R26.)
11. **No rhetorical shapes.** No series of three; no "not X but Y" or "not just X, it's Y"; no "X rather than Y" as a flourish; no "serves as" or "stands as" for "is". (Wikipedia AI-signs; Kobak et al. 2025.)
12. **Nothing about the document or the reader.** No "this essay", "the narrative", "your section 1". Provenance lives in the note, never in the title.
13. **No coined terms and none of the borrowed-weight words**: load-bearing, tension, nuance, crucial, pivotal, delve, underscore, tapestry, testament, landscape, robust, meticulous, intricate, showcase, foster, navigate. (Wikipedia AI-signs; Kobak et al.; Liang et al.; DAA RULE-023 and RULE-025.)

Two titles from the first ruling card, before and after:

> *Before:* Knowledge management existed as a named, self-conscious movement from the early 1990s, dated by one of its originators to the first conference devoted to it, held in Boston in early 1993.
> *After:* Knowledge management was a named movement from the early 1990s; its first dedicated conference was held in Boston in early 1993.

The second still breaks rule 1 (a semicolon joining two facts). The honest version is two claims, or one: *Knowledge management's first dedicated conference was held in Boston in early 1993.*

> *Before:* The 1990s movement attempted what this essay attempts: separating knowledge from data and information, and codifying an organisation's scattered material into a curated store where it could be found and reused.
> *After:* 1990s knowledge management codified an organisation's scattered material into curated stores so it could be found and reused.

### A note

Two sentences. The first says how strong the claim is and on what; the second says the gap. Hedges are allowed, because a note is an assessment. Rules 6, 8, 11, 12 and 13 apply. Never "load-bearing", never "tension".

### A finding

One sentence that says what the source says, and no more than its quote says. It never mentions the narrative, the claim, or what the author "attributes". The `meaning-check` prompt is its test: reading only the quote, would you accept the finding?

### A summary

One sentence, or none. It is kept with the set and never shown on the card.

### The LLM's reports in the chat

The same rules, and the report shape from the server instructions: the proposals, what would settle each, the coverage in two lines, what could not be held. A server cannot lint the chat; the instructions ask for it and the card carries the rest.

## Enforcement, three tiers

**Refuse** (mechanical and certain; the write is rejected with the field named):

| Rule | Check | Tool |
|---|---|---|
| 1 | colon, semicolon, em dash, en dash as a joiner, parentheses in a title | string scan |
| 2 | word count over 25 | tokenizer |
| 3 | a question mark; no finite verb | part-of-speech tags (wink-nlp) |
| 12 | "this essay", "the essay", "this document", "the narrative", "your section", "the reader" | phrase list |
| 13 | the banned words | word list |

**Warn** (mechanical but heuristic; the write lands with a warning line):

| Rule | Check | Tool |
|---|---|---|
| 4 | a noun in -tion, -ment, -ance, -ity in the subject slot | wink-nlp tags |
| 5 | be + past participle | retext-passive, or the same over wink-nlp tags |
| 6 | the simplify list | retext-simplify |
| 7 | the hedge list in an observation's title | word list |
| 8 | the intensifier and editorializing lists | retext-intensify; write-good adverbs; Wikipedia list |
| 9 | the vague-measure list; a bare number without a unit where one is expected | word list; regex |
| 10 | the absolute list | word list |
| 11 | a series of three with a serial conjunction; "not … but …"; "not just … it's …"; "serves as", "stands as" | regex over tokens |
| note length | more than two sentences | sentence splitter |
| readability | grade level above 12 for a note | text-readability |

**Judge** (an LLM pass; a flag, never a verdict):

| Question | Source |
|---|---|
| Is this one proposition, or two stitched? | ISO 29148 "singular"; Kialo |
| Does the finding say more than the quote? | `meaning-check` |
| Is the hedge warranted, or reflex? | Pinker |
| Is the sentence readable in one pass? | the reader |

All of the refuse and warn tier runs in-process in TypeScript in under a millisecond per sentence: wink-nlp for sentences and tags, four small retext plugins, write-good's lists vendored, and a hand-kept tell list. No subprocess (Vale is a Go binary), no Python (proselint), no Java (LanguageTool), no network.

## Word lists

Kept in one file the server reads (`prose-lists.yaml`, proposed), so a ruling changes a list and not code. Sources for each list are in the research note.

- **Banned** (refuse): load-bearing, tension, nuance, nuanced, delve, delves, tapestry, testament, underscore, underscores, pivotal, crucial, landscape, robust, meticulous, intricate, showcase, showcasing, foster, fostering, navigate, leverage (as a verb), utilize, commence.
- **Hedges** (warn in observation titles): may, might, could, seems, appears, arguably, perhaps, possibly, in many ways, to some extent, it could be said.
- **Intensifiers and editorializing** (warn): very, truly, clearly, notably, particularly, significantly, deeply, fundamentally, genuinely, of course, interestingly, importantly, crucially.
- **Vague measures** (warn): adequate, appropriate, sufficient, reasonable, significant, substantial, some, several, many, approximately, roughly (without a number).
- **Absolutes** (warn): always, never, all, none, every, 100%, entirely, completely.
- **Escape clauses** (warn): where possible, as appropriate, if necessary, as required, including but not limited to, etc.
- **Weasel and puffery** (warn): some say, it is believed, experts argue, many scholars, widely regarded, best, legendary, iconic, visionary.
- **Loaded verbs of saying** (warn): claimed, insisted, admitted, revealed, exposed.
- **Rhetorical shapes** (warn, by pattern): a three-item series; not … but; not just … ; it's not … it's; … rather than … as a flourish; serves as; stands as; marks a pivotal; a testament to.

## What this pattern does not decide

The prose of the narrative itself, which is the author's and follows the author's own voice; the prose of a captured source, which is held as it is; the chat's tone beyond the report shape. A corpus may keep its own lists (a house style) beside these.

## Sources

The research note `docs/research/record-prose-sources-2026-08-27.md` carries the per-source tables, the tool comparison with licences and release dates, the LLM-tell lists with their studies, and the unverified list. Items the note marks unverified (GOV.UK's numeric sentence guidance, the Plain English Campaign's guide text, the Economist style guide, the official INCOSE and ISO texts behind paywalls, Rationale's current guidance) are not relied on above beyond what a secondary source confirmed.
