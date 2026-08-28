---
title: "Research note: sources for the record-prose pattern"
conducted: 2026-08-27
by: "agent/claude-code (three Sonnet research agents, one helper), coordinated by claude-fable-5"
status: working note; unverified items marked
---

# Sources for record prose (2026-08-27)

Four research tracks. Each item names the page fetched and the date it speaks as of. Items marked UNVERIFIED were not confirmed against a primary page in this pass and are not relied on by the pattern beyond what a secondary source states.

## 1. Controlled and plain languages

| Source | Fetched | As of | Rules relevant to one declarative sentence |
|---|---|---|---|
| ASD-STE100 Simplified Technical English | asd-ste100.org (rule pages 404; rules via en.wikipedia.org/wiki/Simplified_Technical_English) | Issue 9, 2025-01-15 | 20 words per instruction sentence, 25 for descriptive text; one instruction per sentence; one topic per paragraph (six sentences max); active voice, passive only when the agent is unknown; ~900-word dictionary, one meaning and one part of speech per word; no noun cluster over three words; restricted verb forms; no elliptical omission. 53 rules in 9 sections. |
| Attempto Controlled English | attempto.ifi.uzh.ch; Wikipedia | undated | Every noun takes a determiner; fixed clause order; constructs ambiguous in English are forced to one reading; parses to first-order logic. The project's own admission: "not all ambiguities can be safely removed from ACE without rendering it artificial". Too formal for prose. |
| plainlanguage.gov (Federal Plain Language Guidelines) | digital.gov/guides/plain-language and /writing | fetched 2026-08-27, undated | Active voice; present tense over conditional and future; avoid nominalizations ("hidden verbs" in -ment, -tion, -sion, -ance); shorter sentences. No numeric ceiling found. |
| GOV.UK content design | gov.uk/guidance/content-design/writing-for-gov-uk | UNVERIFIED | Redirect loop and empty stubs this pass; the cited 14 to 18 words per sentence not confirmed. |
| Plain English Campaign | plainenglish.co.uk | UNVERIFIED | Only the mission page reached; the guide 404'd. |
| Microsoft Writing Style Guide | learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice | ms.date 2026-07-02 | Bigger ideas, fewer words; write like you speak; front-load the important information; start with a verb; avoid "there is / there are"; serial comma. |
| Google developer documentation style guide | developers.google.com/style/voice, /sentence-structure | fetched 2026-08-27 | Active voice with three named exceptions (emphasize the object, de-emphasize the actor, actor unknown or irrelevant); second person; conditions before instructions. |
| Wikipedia MoS, Words to watch | en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Words_to_watch | fetched 2026-08-27 | Peacock terms (best, legendary, iconic, visionary, award-winning); weasel words (some people say, many scholars state, it is believed); contentious labels; expressions of doubt (alleged, so-called, scare quotes); editorializing (notably, of course, clearly, interestingly, fortunately); loaded synonyms for said (claimed, insisted, admitted, revealed, exposed). |
| The Economist style guide | economist.com/style-guide | UNVERIFIED | Site unreachable to the fetcher. |

## 2. Requirements writing and argument mapping

| Source | Fetched | As of | Rules |
|---|---|---|---|
| INCOSE Guide for Writing Requirements v3 (2019, 41 rules), v4 (2023, 42) | incose.org 403; ebin.pub copy of v3; reqi.io and jamasoftware summaries of v4; visuresolutions.com summary | 2019 / 2023 | R2 active voice, responsible entity as subject; R5 "the" not "a" for a specific entity; R6 explicit units; R7 no vague terms (some, adequate, reasonable, user-friendly, approximately, sufficient); R8 no escape clauses (where possible, as appropriate, if necessary); R9 no open-ended (including but not limited to, etc.); R10 no superfluous infinitives (to be able to); R18 single thought: one subject, one main verb, one object; R19 no combinators joining two statements (and, or, then, unless); R20 no "purpose of"; R21 no parenthetical subordinate text; R24 no personal or indefinite pronouns; R26 no unachievable absolutes; R32 "each" not all/any/both. One agent reached the ebin.pub copy of the text; a second reached only the Visure summary and could not confirm R8, R19 and R26 from it: treat those three as confirmed by the first agent's copy, not by the official PDF. |
| EARS (Mavin, Wilkinson, Harwood, Novak, 2009) | alistairmavin.com/ears; Wikipedia | "first published in 2009" | Six closed templates (ubiquitous, event-driven WHEN, state-driven WHILE, optional WHERE, unwanted IF-THEN, complex), each with exactly one shall-clause. Closed sentence shapes beat open checklists. |
| ISO/IEC/IEEE 29148:2018 | standard paywalled; Wikipedia fragment; three secondaries (modernrequirements, cwnp, t2informatik) that disagree | 2018 | Confirmed fragment: individual requirements "necessary, appropriate, and unambiguous"; a set "complete, consistent, feasible, comprehensible". The fuller list (singular, verifiable, correct, conforming) UNVERIFIED against the standard. |
| Argdown | argdown.org/guide, /syntax | fetched 2026-08-27 | Negative finding: no one-proposition rule; a statement may span several sentences. |
| Kialo | support.kialo.com writing-good-claims; support.kialo-edu.com marking-a-claim-for-review, creating-a-claim | fetched 2026-08-27 | "Make one point at a time"; "keep claims short, simple and to the point; avoid introductory statements, restatements, and in most cases hedging language"; QA mark "More than one claim". |
| Rationale (Austhink successor) | rationaleonline.com tutorial 1 (austhink.com is dead) | undated | "Boxes should contain full, grammatical, declarative sentences"; no questions; no fragments; "boxes contain claims, not whole arguments". |

## 3. Linters and LLM tells

Tools (npm registry and GitHub, fetched 2026-08-27):

| Tool | Node/TS | Licence | Latest | Checks |
|---|---|---|---|---|
| wink-nlp | yes, in-process | MIT | 2.4.0 | sentence split, POS tags (~95% WSJ), ~650k tokens/s |
| compromise | yes | MIT | 14.16.0 | POS, sentences; no passive or nominalization detector |
| retext-passive / -intensify / -simplify / -readability / -repeated-words | yes | MIT | 5.0.0 / 7.0.0 / 8.0.0 / 8.0.0 / 5.0.0 (2023-09) | passive; weak and intensifying words; wordy phrases; readability; repeated words |
| write-good | yes | MIT | 1.0.8 (2021-02) | passive, weasel words, weakening adverbs, "there is" openers, clichés, wordy phrases |
| text-readability | yes | ISC | 1.1.1 (2025-03) | Flesch-Kincaid and grade level |
| textlint-rule-sentence-length | yes | MIT | 5.2.1 (2026-01-03) | sentence length |
| Vale | Go binary, subprocess only | MIT | 3.19.0 (2026-08-26) | styles: write-good (8 rules), proselint (34), Microsoft (47), Google (36), alex (11), Readability (7) |
| proselint | Python | BSD-3 | 0.16.0 (2025-11) | 60+ checks |
| LanguageTool | Java, HTTP | LGPL-2.1+ | not shown | grammar and style |

LLM tells:

- Wikipedia, "Signs of AI writing" (WP:AISIGNS), revised through July 2026: delve, tapestry, testament, crucial, pivotal, underscore, landscape, intricate, vibrant, enduring; boasts, showcases, fosters, cultivates, highlights, emphasizes; align with, bolstered, enhance, garner, interplay, sentence-initial "additionally", valuable, meticulous, robust; drift by era (delve fell off in 2025; 2025 onward: emphasizing, enhance, highlighting, showcasing); rhetorical: "not just X but also Y", "it's not X, it's Y", "X rather than Y", "stands as a testament", "marks a pivotal moment", rule of three, copula avoidance ("serves as" for "is"); formatting: bold overuse, em-dash overuse, emoji and title-case headers; structural: "Despite its X, Y faces challenges", vague attribution.
- Kobak et al., "Delving into ChatGPT usage in academic writing through excess vocabulary", Science Advances 11(27), 2025-07-02 (arXiv 2406.07016): excess ratios delves 28.0, underscores 10.9, showcasing 10.2; markers across, additionally, comprehensive, crucial, enhancing, exhibited, insights, notably, particularly, within; 319 excess style words in 2024, 66% verbs.
- Liang et al., "Monitoring AI-Modified Content at Scale", arXiv 2403.07183 (2024): commendable 9.8x, meticulous 34.7x, intricate 11.2x; innovative, notable, versatile, noteworthy, invaluable, pivotal, potent, ingenious, cogent, tangible, profound, methodical, laudable, lucid.
- UNVERIFIED: GPTZero and Originality.ai public lists (404 at guessed URLs); GitHub "ai-isms" repositories (search quota exhausted); 2026 follow-up studies.

## 4. Sentence craft

- Library (DAA `books/communication/`): Pinker, *The Sense of Style* (zombie nouns; metadiscourse; compulsive hedging; shudder quotes; minimize negation; a passive must be chosen; split infinitives and final prepositions are false rules); Klinkenborg, *Several Short Sentences About Writing* (one thought per sentence; suspicion of subordination; "volunteer sentences" such as "In order to", "There is"; rhetorical connectives only when earned); Tufte, *Artful Sentences*.
- Web: Orwell, "Politics and the English Language" (orwell.ru full text; six rules; "verbal false limbs": render inoperative, militate against, give grounds for, have the effect of); Strunk, *The Elements of Style* 1918 (Gutenberg 37134; rules 10 active voice, 11 positive form, 13 omit needless words, 15 parallel form, 18 emphatic words at the end); Gopen and Swan, "The Science of Scientific Writing", American Scientist 78(6), 1990 (via crowl.org summary; action in the verb; topic and stress positions; old before new); Williams, *Style* (secondaries: characters as subjects, actions as verbs, nominalizations).
- Convergence: actor as subject, action as verb, old information first, the point at the end (Strunk 1918, Orwell 1946, Gopen 1990, Williams, Pinker).

## 5. Projects built against LLM prose (GitHub, npm, PyPI, searched 2026-08-28 with gh)

Plain and precise (aim stated by the project): textlint-rule-preset-ai-writing (textlint-ja, TS, MIT, 1,110 stars, pushed 2026-06-16; rules no-ai-list-formatting, no-ai-hype-expressions, no-ai-colon-continuation, no-ai-emphasis-patterns, ai-tech-writing-guideline; runs as `npx textlint --mcp`); sloptrim (Python stdlib, Apache-2.0, 197 stars, 2026-08-18; 71 patterns, 62 detectable, era-stable vs era-variable; ETHICS.md "improve prose, not conceal its origin"); anti-slop (AgriciDaniel, Python, Apache-2.0 code / CC BY-SA content, 42 stars, 2026-07-28; cites Stowe et al. ACL 2026, DAMAGE COLING 2025, Shaib et al. arXiv 2509.19163, unverified against the papers); vale-ai-tells (krishnasunkam, Vale YAML, MIT, 2026-08-25; 17 rules) and vale-ai-tells (tbhb, Vale YAML, MIT, 82 stars, 2026-08-26; prose, commits, experimental metrics; "not to disguise AI-generated content as human-written"); tellsign (ctkrug, TS, licence unverified, 2026-07-16; typed weighted tells); deslop (fayerman-source, skill, MIT, 2026-08-23; Garner, SEC Plain English Handbook, Federal guidelines); skill-deslop (stephenturner, MIT, 375 stars, 2026-03-18, scientific writing); unsloppify (woerndl, shell + skill, licence inconsistent GH/PyPI, 2026-08-17); llmlint (Chinese, TS, AGPL-3.0); CWOnline/AIWords (raw lists, no licence: journey, navigate, landscape, realm, ecosystem, tapestry, beacon, delve, dive, unlock, harness, cultivate, forge, catalyze, illuminate, weave, crystallize, ignite, curate, unravel, roadmap, cornerstone, treasure trove, in the world of, shedding light, unsung hero, linchpin, crucible).

Mixed (plainness lists inside a voice wrapper): blader/humanizer (skill, MIT, 38,502 stars, 2026-08-19; 35 patterns from WP:AISIGNS, sections 7, 14, 23, 26 are pure plainness); petergyang/no-ai-slop (skill, MIT, 6,296 stars, 2026-08-06; words to cut: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving; patterns to cut: binary contrasts, throat-clearing, colon reveals, weasel attribution, fake-profound kickers, recap endings); kdgbalmer/ai-tells (MIT, 2026-05-04; tiered vocabulary and an "era-specific tells" section).

Detection or humanizing, excluded: CyranoB/slop-detector (npm TS MCP server, MIT, 2026-04-06; kept only as scaffolding shape), Aboudjem/humanizer-skill (5 voices), epoko77-ai/im-not-ai (voice injection), gouwsxander/slop-detector (detector), humanize-ai-text (paid API). Out of scope (UI slop): Nutlope/hallmark, yetone/kill-ai-slop.

Empirical: osolmaz/ai-smell (Python, MIT, 2026-08-27): labelled bullets 53 to 100% of bullets in LLM text vs 0 to 11% human; exactly-three lists 6.3 to 15.9 per 1k words vs 0 to 2; vocabulary tells barely differ. ulfaslak/opus-smell (pre-2022 corpus baseline). jenna-russell/human_detectors (frequent ChatGPT users detect LLM text well).

Vendor: Anthropic, Claude Fable 5 system prompt (platform.claude.com release notes, 2026-06-09): prose without bullets, numbered lists or excessive bolding for reports and explanations unless asked; no em-dash ban in that snapshot. OpenAI Model Spec (2026-08-18): clear and direct, no unnecessary jargon, not sycophantic; no anti-cliché section.

Queries with zero hits (gh search repos): awesome-ai-writing-tells, vale AI-isms, em dash llm, boilerplate AI phrases, AI cliche list, banned words AI writing, slop score writing, write like a human system prompt, GPTZero wordlist, not just X but Y llm, textlint AI, vale style AI slop, AGENTS.md no em dash, controlled vocabulary LLM output, precise technical prose skill, plain English AI slop; "dehype" is not a coinage in use. Google's guidance for AI-generated content was not searched.

## Process note

The first research agent spawned helpers and stalled waiting for them; two parts were re-run as single-purpose agents told not to spawn or wait. One helper's report reached the coordinating session directly. Search quota ran out twice; several fetches used search-result pages as a substitute.
