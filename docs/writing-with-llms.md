---
title: "Writing with LLMs"
purpose: "What the field has actually built for writing prose with an LLM when a human is responsible for the result, and where this format sits among it."
status: non-normative
generated: 2026-08-26
model: claude-opus-5
last_updated: 2026-08-26
---

# Writing with LLMs

## The question

Someone writes for a living. An LLM now drafts or co-drafts a good share of
what leaves their desk, and their name is still on it. What tools,
workflows, constraints and rules has the field actually produced for that
situation, what do they cover, and where do they stop?

This is a different survey from [`influences.md`](influences.md), which
looks at formats and ontologies (argumentation schemas, provenance
standards, discourse graphs) and asks what ERF inherits from each. This one
looks at practice: editors, house-rules files, linters, checking tools, and
what working writers say they do. It matters here for two reasons. First,
the essay behind this format claims that knowledge work outside coding has
nothing like version control, tests and lint for prose, and a claim of
absence should rest on a search rather than an impression. Second, a reader
deciding whether to implement this format deserves to see it placed among
the things that already exist, including the several that do a piece of the
job better.

Everything below was fetched fresh on 2026-08-26 by six parallel research
passes. Pages that did not load are named at the end rather than described
from memory, and where a figure was only reachable through a secondary
source that is stated inline.

## 1. Writing tools with LLM collaboration built in

| Tool | What it does with the LLM | The rule it embodies | URL | Where it stops |
|---|---|---|---|---|
| Lex | `++` summons continuations, rewrites, feedback; continuations adapt to the writer's style | The LLM is invisible until summoned; it writes *with* you | https://lex.page | No marking of which sentences came from the LLM, no export of authorship |
| Sudowrite | Story Bible (braindump, genre, style, synopsis, characters, worldbuilding, outline) feeds structured context into scene generation | A human-authored constraint document scopes what may be generated | https://docs.sudowrite.com | Entity detection is a consistency aid, not an authorship record |
| Novelcrafter | Codex entries (characters, locations, lore) are fed as context, with a per-entry visibility toggle | The human curates, entry by entry, what the LLM is allowed to know | https://www.novelcrafter.com/features/codex | Fidelity depends on curation quality; no provenance tracking |
| Notion AI | Inline AI blocks, workspace-aware agents, database autofill | Generation happens in place, inside existing pages | https://www.notion.com/product/ai | Once text lands in a block, LLM and human text are indistinguishable |
| Google Docs with Gemini | "Help me write" and "Help me create"; suggested edits | An accept gate: suggestions are "only visible to you until you approve them" | https://workspaceupdates.googleblog.com (2026-04) | After approval the text is an ordinary edit under the human's account |
| Microsoft Copilot in Word | Draft or rewrite a selection in a side pane | A three-way gate: Replace, Insert below, Regenerate | https://support.microsoft.com/en-us/office/rewrite-text-with-copilot-in-word-923d9763-f896-4da7-8a3f-5b12c3bfc475 | After Replace the text carries no origin tag |
| iA Writer (Authorship) | Marks generated text with a colored gradient; per-author colors; dims unknown-origin "reference" text | Provenance is a label the author applies, and editing a word by hand adopts it | https://ia.net/writer/support/editor/authorship | "iA Writer automatically strips author metadata on export to Markdown, HTML, PDF and MS Word" |
| Ulysses | No LLM features found; a conventional grammar and style checker only | Deliberate non-adoption | https://ulysses.app | Stops before any generation |
| Copilot for Obsidian | Agent mode over the vault, quick chat, custom commands, per-project instructions | Project instructions scope the agent; notes stay plain files | https://github.com/logancyang/obsidian-copilot | Agent-written note content is not distinguishable in the markdown |
| Smart Connections (Obsidian) | Local-embedding semantic search over existing notes | Never writes prose; only surfaces what the human already wrote | https://github.com/brianpetro/obsidian-smart-connections | Generation moved out to a separate paid plugin |
| Text Generator (Obsidian) | Template and prompt engine, inserts generated text at the cursor | Templates plus context settings are the human-authored contract | https://github.com/nhaouari/obsidian-textgenerator-plugin | No insertion-time diff or authorship tag |
| Logseq GPT plugin | Block-level generation with the selected blocks as context, preview before insert | The outliner's block is the unit of both context and output | https://github.com/briansunter/logseq-plugin-gpt3-openai | Tagging generated blocks is template-dependent, not systematic |
| Cursor (rules) | `.cursor/rules` files injected at the start of the context, scoped by glob or description | Persistent style contract, precedence Team then Project then User | https://cursor.com/docs/context/rules | Context injection, not enforcement; does not apply to inline completion |
| Claude Code (CLAUDE.md) | Human-authored memory loaded every session | A standing instruction file for behavior, not content | https://code.claude.com/docs/en/memory | "Claude treats them as context, not enforced configuration" |
| Typora | No LLM features; positions markdown as the format AI writes into | Deliberate non-adoption | https://typora.io | Stops before generation |

Two things are worth naming. The **constraint document** recurs across
otherwise unrelated products: Sudowrite's Story Bible, Novelcrafter's
Codex, Cursor's rules, Claude Code's memory file. All four are
human-authored side files that scope the LLM, and all four are described by
their own vendors as advisory. The second is that **the human/machine
boundary is enforced at a single UI moment and then discarded**. Word's
Replace, Gemini's approve-before-visible, and iA Writer's tag-clears-on-edit
all draw the line at the instant of insertion, and none of them maintain it
afterwards. iA Writer is the one product that treats the mark as the
feature rather than the gate, and it is also the one that tells you, in its
own documentation, that the mark does not survive export.

## 2. Provenance and attribution of who wrote what

| Thing | What it does | The rule it embodies | URL | Where it stops |
|---|---|---|---|---|
| iA Writer Authorship | Manual per-span tagging of human, AI, and reference text | Provenance is an authorial claim, not a detection result | https://ia.net/writer/support/editor/authorship | Stripped on export to Markdown, HTML, PDF and Word |
| Grammarly Authorship | Session replay of typed, pasted, and AI-revised text, with a shareable report | A behavioral log of composition, not a classifier of content | https://support.grammarly.com/hc/en-us/articles/29548735595405 | "may not capture 100% of cases accurately"; text retyped by hand is indistinguishable from original writing |
| Google Docs version history | Ordinary edit history, with Gemini output attributed to the human account | No AI/human distinction at the platform level | https://workspaceupdates.googleblog.com (2026-04) | The only forensic cue is edit cadence |
| `Co-Authored-By:` trailer | A commit trailer GitHub parses into a second avatar and contribution credit | Whole-commit attribution, machine-parseable | https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors | Says nothing about which lines; its use for LLMs was contested in anthropics/claude-code#47579, closed "not planned", now configurable |
| C2PA / Content Credentials | Cryptographically signed manifest of an asset's history | Provenance as a signed chain bound to the asset | https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html | v2.2 added unstructured text via Unicode variation selectors, v2.4 added structured text including Markdown; no evidence of any editor, chat interface or publishing pipeline emitting it |
| ICMJE Recommendations | Journal authorship guidance | "Chatbots... should not be listed as authors because they cannot be responsible" | https://www.icmje.org/recommendations/browse/roles-and-responsibilities/defining-the-role-of-authors-and-contributors.html | Prose disclosure in acknowledgments or methods; nothing machine-readable |
| ICML call for papers | Conference policy | Generative tools allowed, "authors must take full responsibility"; "LLMs are not eligible for authorship" | https://icml.cc/Conferences/2026/CallForPapers | Disclosure encouraged, not mandated, for writing assistance |
| ACM generative-AI policy | Publication policy | "The use of generative AI tools and technologies to create content is permitted but must be fully disclosed in the Work" | https://respect.acm.org/2026/index.php/policies-on-generative-ai-llms-and-related-tools/ | A prose acknowledgment line; no structured metadata |
| Elsevier | Author policy | A fixed-title declaration "at the end of the manuscript, immediately above the references" | https://www.elsevier.com/about/policies-and-standards/the-use-of-generative-ai-and-ai-assisted-technologies-in-writing-for-elsevier | Same shape: a sentence in the body, unverified by software |
| arXiv | Repository policy index | No dedicated AI-authorship policy page exists at the policy index | https://info.arxiv.org/help/policies/index.html | Enforcement is reported to be post-hoc moderation; the primary page for that could not be fetched |

Every publisher mechanism found is a **sentence a human writes and no
software reads**. Every tool mechanism found is either a vendor-local
session log that does not travel (Grammarly), or a display-time mark that
its own vendor strips on export (iA Writer). C2PA is the one genuinely
machine-readable, cryptographically bound candidate, and as of the 2.4
specification it does now name Markdown and other structured text, but the
research pass found no production system emitting it for text. The honest
finding is that **there is no deployed, portable, sub-document provenance
standard for prose**. The nearest deployed convention is a commit trailer
that asserts nothing about which words are whose, and whose LLM use was
contested and made optional.

## 3. Constraints given to the LLM up front

| Thing | What it does | The rule it embodies | URL | Where it stops |
|---|---|---|---|---|
| CLAUDE.md | Project memory injected at session start | Standing house rules as a committed file | https://code.claude.com/docs/en/memory | "no guarantee of strict compliance"; blocking requires a separate hook |
| Cursor rules | `.mdc` rule files included at the start of the context | Version-controlled, scoped style contract | https://cursor.com/docs/context/rules | Advisory; does not reach tab completion or inline edit |
| AGENTS.md | A cross-tool "README for agents" | One conventional filename many tools read | https://agents.md | Scoped to code, build, test and architecture; no prose provision |
| GitHub Copilot repository instructions | `.github/copilot-instructions.md` added to requests automatically | Repository-level standing instructions | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions | Code-scoped; no stated enforcement |
| Wikipedia:Signs of AI writing | A curated, era-tagged list of LLM tells for editors | Detection after the fact, not constraint before | https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing | "these aren't rules but descriptive patterns" |
| GitHub Spec Kit | `/specify`, `/plan`, `/tasks`, `/implement` as an ordered workflow | Structure is written and approved before generation | https://github.com/github/spec-kit | Sequence is recommended, not enforced; code only |
| Spec Kit fiction preset | An issue proposing story brief, structure, and scene tasks | The same discipline proposed for prose | https://github.com/github/spec-kit/issues/2174 | Proposed 2026-04-11, not merged |
| Plan-and-Write; DOC; Dramatron | Research systems that plan structure, then generate conditioned on the plan | Content determination before surface realization | https://arxiv.org/abs/1811.05701, https://arxiv.org/abs/2212.10077, https://arxiv.org/abs/2209.14958 | Research prototypes; the plan is often machine-generated too |
| NotebookLM | Retrieval-grounded answers over the user's own sources, with passage citations | Ground the generation in supplied documents | https://arxiv.org/abs/2509.25498 (independent evaluation) | Citations are displayed, not verified; the evaluation found 13% of NotebookLM outputs still contained a hallucination |
| Elicit | Extracts claims from papers with sentence-level citations | "Elicit supports all AI-generated claims with sentence-level citations" | https://elicit.com/ | Validated as an aggregate benchmark, not as a per-sentence gate |
| RARR | Generates, researches evidence, then edits out unsupported content | Verify then revise, post-hoc | https://arxiv.org/abs/2210.08726 | Research prototype, not shipped |
| ALCE | Benchmark scoring citation quality and correctness | Measurement after generation | https://arxiv.org/abs/2305.14627 | A score, not a gate |
| Vale | Prose linter with YAML rules and installable style packages, runnable in CI | Prose as a lintable artifact | https://vale.sh | Lexical and syntactic pattern matching; no semantics |
| proselint, write-good, alex | Fixed-checklist prose linters (clichés, weasel words, passive voice, insensitive terms) | Known bad patterns, deterministically caught | https://github.com/amperser/proselint, https://github.com/btford/write-good, https://github.com/get-alex/alex | Static and small; its own author calls write-good "naive" |
| textlint, retext | Pluggable text-linting platforms over a parsed syntax tree | Composable rule ecosystems | https://textlint.org/, https://github.com/retextjs/retext | Only as strong as the installed rules; no first-party AI rules |
| Google and Microsoft Vale packages | House style guides compiled to Vale rules | A published style guide as executable rules | https://github.com/errata-ai/Google, https://github.com/errata-ai/Microsoft | Explicitly partial coverage (the Microsoft package states 37 of 64 guideline categories) |
| vale-ai-tells | 111 Vale rules built to catch LLM prose tells, wired into CI and pre-commit | LLM output is a lintable artifact with its own known patterns | https://github.com/tbhb/vale-ai-tells | Token matching only; cannot see sentence-length uniformity, rhythm, or document-level repetition |

Three findings. First, **every up-front constraint mechanism in production
is advisory**, and the vendors say so in their own documentation; the only
mechanical enforcement offered anywhere is a separate hook that blocks a
tool call, which is a coding construct and not a prose one. Second,
**structure-before-generation is a real and old idea** (content
determination before surface realization long predates LLMs) that has been
formalized for code and only proposed for prose. Third, and most directly
relevant to the essay's claim: **prose lint exists, is mature, runs in CI,
and has now been extended to LLM output**. `vale-ai-tells` is the
counter-example to a flat claim that nobody has built tests for prose. What
it catches is vocabulary and phrasing, not whether a sentence is true or
whether it is supported by anything.

On the question of a tool that refuses to emit an uncited sentence: the
research pass found none in production. NotebookLM, Perplexity, Elicit and
Consensus all attach citations at or alongside generation and push
verification onto the reader. The only mechanisms that actually check a
sentence against a source and revise it are research prototypes (RARR and
its successors), and they work post-hoc rather than as a gate.

## 4. Verification after the LLM writes

| Thing | What it does | The rule it embodies | URL | Where it stops |
|---|---|---|---|---|
| RefChecker | Validates references against Semantic Scholar, OpenAlex, CrossRef, DBLP and the ACL Anthology, then re-verifies flagged ones | Catch fabricated references before a reader does | https://github.com/markrussinovich/refchecker | Academic references only, not prose claims |
| CiteMe | Checks each reference against bibliographic databases, returning Verified, Partial Match, or Not Found | Existence check against real indexes | https://citeme.app/tools/ai-reference-verifier | Existence only; does not check that the source says what the text claims |
| Scite | Shows how a real paper has been cited elsewhere, classified by stance | Machine-classified citation stance at scale | https://scite.ai/ | Not designed to detect fabricated references |
| GPTZero Source Finder | Matches checkable claims to sources and shows supporting or contradicting evidence | Find the evidence, leave the verdict to the human | https://gptzero.me/hallucination-detector | "does not take a stance on whether your claims or the claims in the sources cited are true" |
| FActScore | Splits long text into atomic facts and checks each against a knowledge source | Factual precision as a measurable rate | https://github.com/shmsw25/FActScore | Bounded by the knowledge source; the checker is itself an LLM |
| SAFE (DeepMind) | An agent issues its own search queries to verify each atomic fact | Search-augmented per-fact judging, cheaper than humans | https://arxiv.org/abs/2403.18802 | Still an LLM judge underneath |
| MiniCheck | Small cheap checkers that test a claim sentence against a supplied grounding document | Sentence-level grounding as a cheap operation | https://github.com/Liyan06/MiniCheck | Needs the grounding document handed to it; does not retrieve |
| STM Integrity Hub | Publisher consortium screening of submitted manuscripts for integrity signals | Shared industry infrastructure at submission time | https://www.csescienceeditor.org/article/the-stm-integrity-hub/ | Publisher-side and not author-side; 40 publishers, about 125,000 papers screened monthly |
| Claims-table ritual | List every factual claim in the draft, attach a source link, mark whether the evidence suffices | Verification as a table you fill before shipping | https://innovaitionpartners.com/blog/how-to-verify-ai-output | One practitioner's self-described method, not audited |
| Court sanctions | Two lawyers fined $5,000 for a brief with six fabricated ChatGPT citations | The human who filed it is accountable, not the tool | https://www.reuters.com/legal/new-york-lawyers-sanctioned-using-fake-chatgpt-cases-legal-brief-2023-06-22/ | One case; a database tracking these at scale exists but did not load (see below) |
| Deloitte report case | An AU$440,000 government report contained a fabricated court quote and non-existent references | Firm review processes existed and did not catch it | https://www.horsesforsources.com/deloitte-dolittle_100725/ | Trade coverage rather than a primary report |
| LLM-as-judge bias studies | Quantify position bias and self-preference in judge LLMs | A second LLM is a biased instrument, not a neutral one | https://arxiv.org/html/2410.02736v1, https://arxiv.org/abs/2410.21819 | Benchmark-specific; narrow model sets |

The pattern here is a **split between existence and entailment**. Checking
that a reference exists is a solved, tooled, automatable problem with
several working implementations. Checking that the cited source actually
supports the sentence is where every tool either hands the job back to the
reader (GPTZero states this outright) or delegates it to another LLM, whose
own bias has been measured (position-bias robustness ranged from 0.566 to
0.832 across six judge LLMs in one study, falling below 0.5 with three or
four answer choices). The habits practitioners describe (a claims table, a
second-LLM pass, verifying every number) are disciplines rather than
mechanisms: nothing records that they ran, and nothing fails if they did
not.

## 5. What practitioners report

- **Simon Willison** draws the line at first-person text: "if text
  expresses opinions or has 'I' pronouns attached to it then it's written
  by me. I don't let LLMs speak for me in this way."
  (https://simonwillison.net/2026/Mar/1/ai-writing/)
- **Sophie Alpert** rejects the premise that an LLM rewrite is
  meaning-preserving: "There are no lossless transformations of
  natural-language text," and "You must stand behind every idea and every
  sentence in your docs."
  (https://sophiebits.com/2026/06/25/there-are-no-lossless-transformations-of-natural-language-text)
- **Stanislas** publishes a full pipeline: draft with completions off,
  then an edit pass accepted line by line, then multiple proofreading runs
  compared across LLMs. He dropped inline autocomplete because
  "autocompletion breaks the flow of thoughts for writing."
  (https://stanislas.blog/2025/02/writing-workflow-llm/)
- **Vincent Bernat** runs a staged pipeline (draft, copyedit skill,
  translation skill, human proofread) and discloses the level of LLM
  involvement per post with a footer emoji. For the post describing it:
  "I did not use an LLM to edit this post: an unnamed person kindly
  accepted to proofread it."
  (https://vincent.bernat.ch/en/blog/2026-blogging-llm)
- **Oxide Computer's RFD 576** tiers the rule by document class: public
  writing must be human-written and, further, "must be further true that
  the text not be read as LLM-authored"; operational writing may use
  assistance because correctness outranks authorship.
  (https://rfd.shared.oxide.computer/rfd/0576)
- **The Jellyfin project** requires contributors to explain changes in
  their own words: "If you can't explain what the LLM did, we are not
  interested in the change."
  (https://jellyfin.org/docs/general/contributing/llm-policies/)
- **A survey of technical bloggers** found the best-performing pattern was
  notes and voice transcription, then an LLM-built outline, then a
  human-written draft, then an LLM polish; only 13% of respondents felt
  generated drafts sounded like them and 59% called the tone generic. One
  respondent: "Fast way to produce something not worth editing."
  (https://writethatblog.substack.com/p/report-llms-tech-blogs)
- **Marginalia** rejects human-in-the-loop as a fix: "Having humans in the
  loop doesn't make the AI think more like people, it makes the human
  thought more like AI output."
  (https://www.marginalia.nu/log/a_132_ai_bores/)
- **Jola** stopped entirely, including for spell-checking, on a
  reader/writer contract argument.
  (https://jola.dev/posts/the-social-contract-of-writing)
- **Paul Graham** does not describe a workflow and argues the loss of the
  pressure to write is itself the problem.
  (https://www.paulgraham.com/writes.html)

What recurs across people who have never read each other is striking.
**The line is drawn at first-person opinion**, not at LLM use as such:
mechanical text (documentation, translation, proofreading) is fair game and
anything carrying "I" is not. **Every kept workflow puts the LLM after a
human draft or before it, never in place of it**: outline, polish,
translate, critique. **Nobody who described a working process described
generation from a prompt.** And the reason people gave for stopping was not
factual error but voice: flattened, unrecognizable prose. That last point
matters for a format like this one, because a format that catches false
claims does not catch the thing practitioners actually quit over.

## 6. Evidence on the failure modes

| Study | What it measured | Headline figure | Status |
|---|---|---|---|
| Dahl, Magesh, Suzgun & Ho, "Large Legal Fictions" | Hallucination on federal case-law queries, GPT-3.5, Llama 2, PaLM 2 | 69% to 88% hallucination across the three; at least 75% error on precedential analysis and case holdings | Peer reviewed (Journal of Legal Analysis); GPT-4 was not tested |
| Magesh et al., "Hallucination-Free?" | Commercial legal RAG tools | Lexis+ AI and Ask Practical Law AI incorrect more than 17% of the time; Westlaw AI-Assisted Research more than 34% | Stanford RegLab/HAI |
| Linardon et al., JMIR Mental Health | Fabricated citations in GPT-4o literature reviews | 19.9% entirely fabricated, a further 45.4% with bibliographic errors; 6% on a familiar topic rising to 29% on an unfamiliar one | Peer-reviewed venue; the JMIR page would not render, figures verified via secondary coverage |
| Hagar, Agustianto & Diakopoulos, "Not Wrong, But Untrue" | Hallucination in document-grounded journalism tasks over a 300-document corpus | 30% of outputs contained at least one hallucination; 40% for ChatGPT and Gemini, 13% for NotebookLM; errors were mostly "interpretive overconfidence" rather than fabricated entities | Preprint, arXiv:2509.25498 |
| BetterUp Labs and Stanford Social Media Lab, "workslop" | Prevalence and cost of low-quality AI work output | 40% of employees received workslop in the past month; 1 hour 51 minutes spent per instance; $186 per employee per month | Consultancy research with an academic partner; the survey size is stated inconsistently on the source's own page (1,004 in one place, 1,150 in another) |
| METR | Randomized trial of AI-assisted vs unassisted development, 16 developers, 246 tasks | 19% slower with AI; participants forecast 24% faster and still believed 20% faster afterwards | Preprint; developer-specific, no writing equivalent found |
| MIT Media Lab, "Your Brain on ChatGPT" | EEG connectivity and recall across brain-only, search, and LLM essay writing | LLM group showed the weakest neural coupling and the largest failure to quote their own essays; n=54, falling to 18 in the optional fourth session | Unreviewed preprint at release; criticized for sample size, reverse inference, and narrow task design |
| Lee et al., Microsoft Research and CMU | Survey of 319 knowledge workers, 936 use examples | Higher confidence in the tool tracks less critical thinking; higher self-confidence tracks more | Peer-reviewed (CHI 2025); no effect sizes on the fetched page |

Read together this is a weaker evidence base than the discourse implies,
and it points somewhere specific. The best-documented failure is not the
one most tools are built to catch. Fabricated references are real,
measurable and, in the most recent grounded evaluation, no longer the main
error: what the journalism study found instead was **unsupported
characterization of sources that do exist**, which no existence checker
sees. The one figure that speaks to review cost is from software rather
than writing, and it reports that the people doing the work believed they
were faster while being slower, which is the shape of an error a
self-assessed workflow cannot correct. Two things the research pass could
not establish at all: any controlled comparison showing LLM errors are
harder to detect than human ones, and any measured review-cost figure for
prose specifically. Both are widely asserted and neither was verifiable.

## What the field has and has not produced

### The patterns that recur

**The constraint document.** A human-authored side file that scopes the
LLM before it writes: Story Bible, Codex, `.cursor/rules`, CLAUDE.md,
AGENTS.md, `copilot-instructions.md`. It is the single most widely
converged-on pattern in the survey, and every vendor that ships one
describes it as context rather than enforcement.

**The accept gate.** A discrete UI moment where a human takes the
generated text: Word's Replace, Gemini's approve-before-visible, an editor
diff. It draws the human/machine line exactly once, at insertion, and
nothing preserves it afterwards.

**The display citation.** Attach a source to generated text and show it.
Every grounded-drafting product does this; none verifies that the source
supports the sentence before showing it, and the verification is handed to
the reader, usually explicitly.

**The disclosure sentence.** Every journal, conference and publisher
policy found resolves to a human-written sentence that no software reads.
It is the field's entire machine-readable provenance story for text, and
it is not machine-readable.

**The first-person line.** Independently arrived at by practitioners and
by at least one company policy: mechanical text may be generated, text
carrying "I" may not.

**Prose lint.** Mature, deterministic, CI-runnable rule engines (Vale,
proselint, textlint), now extended to LLM tells by at least one style
package. The one place where the essay's "no tests for prose" framing
needs correcting.

### The gaps

**Nothing carries provenance out of the tool.** iA Writer strips it on
export by design and says so; Grammarly's report lives in Grammarly;
Google Docs files Gemini's output under the human's name. C2PA now
specifies text embedding as of version 2.4 and nothing was found emitting
it. This is a gap with evidence on both sides: it has been built twice, in
different shapes, and neither instance travels.

**Nothing checks entailment.** Existence checking for references is
solved several times over. Whether the quoted source supports the sentence
is checked by no shipped product; the research systems that attempt it
(RARR and successors) are unshipped, and the practical substitute is a
second LLM whose bias has been measured.

**Nothing records that a check ran.** The claims table, the verify-every-
number habit, the second-model pass, the human sign-off: all are
disciplines, none leave an artifact. A reader of the finished document
cannot tell which sentences were verified, by whom, or when.

**Nothing records absence.** No surveyed tool records what was searched
for and not found, so a claim that something does not exist rests on an
unrecorded impression in every workflow found.

**Nothing binds prose to its support.** Citations point at documents.
Nothing found connects a passage of finished prose to the specific
propositions it rests on, such that changing the underlying material
surfaces the prose that depended on it.

**Nothing addresses the failure people actually quit over.** Voice loss
and the writer's own understanding are what practitioners name, and what
the cognitive studies gesture at. No tool in this survey addresses either,
and no format can.

### Where the record format sits

This format is an instance of three of the recurring patterns and none of
the others. It is a **structure-before-prose** discipline: claims and their
evidence exist before a narrative is written over them, and a narrative
passage names the claims it rests on. It is a **provenance** mechanism, at
the record's grain rather than the sentence's: every record carries an
actor (`human:<id>` for a person, `<producer>/<version>` for an LLM,
`process:<id>` for automation), and writing and confirming are separate
fields, so who drafted a claim is never conflated with who checked it. And
it is a **test for prose**, though a different one from Vale's: the quote
check is a mechanical, re-runnable comparison of a verbatim quote against a
frozen copy of its source, and the reference validator exits non-zero on a
violation.

Against the gaps, it addresses four. **Provenance travels**, because the
record is the file rather than an annotation over one; nothing strips it on
export because there is no export step. **A check runs and its result is
reproducible** by anyone holding the corpus and the captures, which is the
difference between a displayed citation and a checked one. **Absence is
recorded**, through the survey record, which the influences survey found
nowhere else. **Prose binds to its support**, and a binding that resolves
to nothing must be reported rather than dropped silently (`ERF-33`).
Beyond the gap list, the standings ledger turns the human sign-off ritual
into data: append-only, per person, dated, with a reason, and never
inferred from the strength of the evidence.

Against the same list, it addresses nothing else, and several of these are
not oversights but declared boundaries.

It does **not check entailment**. Whether a quote actually supports the
claim citing it is a judgment attributed to a named actor and a date, never
mechanized; `purpose.md` states this as a deliberate boundary. This is the
same gap the rest of the field has, differently handled: the field hands it
to the reader, this format hands it to a named person and records who that
was.

It does **not mark authorship inside prose**. The unit is the record. A
narrative's body is not tagged sentence by sentence, so on the axis where
iA Writer and Grammarly operate this format is coarser than both. It is
also unresolved internally: a guidance sentence still says a narrative is
authored by a person and never generated, three trial agents wrote one
anyway and disclosed it, and the ruling is open (`B-32`).

It does **not lint prose**, detect LLM tells, or say anything about voice.
`vale-ai-tells` does something this format does not attempt.

It does **not constrain the LLM up front**. There is no constraint document
here, no house style, no rules file; a corpus records what was produced and
says nothing about how to produce it. Anyone wanting the up-front half needs
one of the other patterns alongside.

It **specifies no policy at all**, by ruling: no gates, no thresholds, no
disclosure requirement, no ship criteria. It therefore cannot be the answer
to "what must a writer do before publishing," only to "what does the record
show they did."

And it does **not reduce review cost**. The one measured figure on that
question points the other way for a neighbouring kind of work, and a format
that asks for captured sources, typed claims, and dated standings plainly
adds work at capture time in exchange for work saved later. That trade has
not been measured here. The essay's own admission stands: what is known is
one operator, roughly six months, and 500-plus atoms, with no evidence
about how it behaves at any larger scale or with a second writer.

The fair summary is that the field has built the up-front half (constraint
documents, grounded retrieval, prose lint) and left the after-the-fact half
as unrecorded discipline, while this format does the reverse. It is a
record of what was found, asserted, searched and stood behind. It is not a
writing tool, and on the day-to-day frustration that prompted the question,
it does not help with the drafting at all.

## Sources

Fetched 2026-08-26 unless noted.

**Tools.** lex.page; docs.sudowrite.com (Story Bible);
novelcrafter.com/features/codex; notion.com/product/ai;
workspaceupdates.googleblog.com (Gemini in Docs, April 2026);
support.microsoft.com (Rewrite text with Copilot in Word);
ia.net/writer/support/editor/authorship; ia.net/topics/see-what-ai-wrote;
ia.net/topics/how-to-stay-in-control-of-apples-ai-writing-tools;
ulysses.app; stories.ulysses.app/blog; typora.io;
github.com/logancyang/obsidian-copilot;
github.com/brianpetro/obsidian-smart-connections;
github.com/nhaouari/obsidian-textgenerator-plugin;
github.com/briansunter/logseq-plugin-gpt3-openai;
cursor.com/docs/context/rules; code.claude.com/docs/en/memory;
grammarly.com/authorship;
support.grammarly.com/hc/en-us/articles/29548735595405.

**Provenance and policy.**
spec.c2pa.org (specifications 2.2 explainer and 2.4 specification);
docs.github.com (creating a commit with multiple authors);
github.com/anthropics/claude-code/issues/47579; icmje.org (defining the
role of authors and contributors); icml.cc/Conferences/2026/CallForPapers;
respect.acm.org (policies on generative AI, LLMs and related tools);
elsevier.com (use of generative AI in writing);
info.arxiv.org/help/policies/index.html.

**Constraints and lint.** agents.md; docs.github.com (repository custom
instructions); anthropic.com/news/claudes-constitution;
en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing;
en.wikipedia.org/wiki/Wikipedia:Large_language_models;
github.com/github/spec-kit and issue 2174;
marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html;
arxiv.org/abs/1811.05701 (Plan-and-Write); arxiv.org/abs/2212.10077 (DOC);
arxiv.org/abs/2209.14958 (Dramatron); elicit.com;
semanticscholar.org/product/tldr; arxiv.org/abs/2210.08726 (RARR);
arxiv.org/abs/2305.14627 (ALCE); vale.sh and docs.vale.sh;
github.com/amperser/proselint; github.com/btford/write-good;
github.com/get-alex/alex; textlint.org; github.com/retextjs/retext;
github.com/errata-ai/Google; github.com/errata-ai/Microsoft;
writewithharper.com; github.com/tbhb/vale-ai-tells.

**Verification.** github.com/markrussinovich/refchecker;
citeme.app/tools/ai-reference-verifier; scite.ai; citely.ai;
gptzero.me/hallucination-detector; github.com/shmsw25/FActScore;
arxiv.org/abs/2403.18802 (SAFE); github.com/Liyan06/MiniCheck;
csescienceeditor.org (STM Integrity Hub); arxiv.org/abs/2602.15871
(CheckIfExist); arxiv.org/abs/2606.21155 (citation-hallucination
detection); arxiv.org/html/2410.02736v1 (judge bias);
arxiv.org/abs/2410.21819 (self-preference bias);
reuters.com (New York lawyers sanctioned, 2023-06-22); apnews.com (same
case); horsesforsources.com (Deloitte report, 2025-10-07);
innovaitionpartners.com/blog/how-to-verify-ai-output;
leanlaw.co (firm generative-AI policy template).

**Practitioners.** simonwillison.net/2026/Mar/1/ai-writing/;
sophiebits.com/2026/06/25/...; stanislas.blog/2025/02/writing-workflow-llm/;
vincent.bernat.ch/en/blog/2026-blogging-llm;
reflexions.florianernotte.be/post/ai-transparency/;
jola.dev/posts/the-social-contract-of-writing;
rfd.shared.oxide.computer/rfd/0576;
jellyfin.org/docs/general/contributing/llm-policies/;
writethatblog.substack.com/p/report-llms-tech-blogs;
marginalia.nu/log/a_132_ai_bores/; paulgraham.com/writes.html;
news.ycombinator.com item 48980425 (via the Algolia items API).

**Failure-mode evidence.** law.stanford.edu and reglab.stanford.edu and
hai.stanford.edu (both legal hallucination studies);
arxiv.org/abs/2509.25498 (Hagar, Agustianto & Diakopoulos, "Not Wrong, But
Untrue", verified directly for this document);
betterup.com/blog/hidden-costs-workslop; techcrunch.com (workslop
coverage, 2025-09-27); metr.org and arxiv.org/abs/2507.09089;
media.mit.edu/projects/your-brain-on-chatgpt/overview;
microsoft.com/en-us/research (Lee et al., CHI 2025);
medicalxpress.com (coverage of Linardon et al., JMIR Mental Health).

### What did not load

Named rather than described from memory. Claims that would have rested on
these pages are either omitted above or marked as secondary-sourced.

- nature.com editorial policy on AI: redirected into an authentication
  wall. Nature's position is widely reported but is not quoted here from
  the primary page.
- science.org editorial policies and the AAAS policy-change post: HTTP 403
  on every attempt.
- acm.org canonical authorship policy: HTTP 403; the ACM-affiliated
  `respect.acm.org` mirror loaded and is what is quoted.
- damiencharlotin.com/hallucinations (the AI hallucination cases
  database): HTTP 403 on three attempts across two passes, including one
  by the author of this document. Secondary sources report case counts
  from roughly 1,200 to 1,700 at various 2026 dates; none is reported here
  as fact.
- ap.org and apnews.com generative-AI standards pages: host unreachable to
  the fetcher. The AP's newsroom rule is therefore not quoted.
- hbr.org workslop article: paywalled. The figures above come from
  BetterUp's own page.
- jmir.org (both the 2024 systematic-review study and the 2025 Linardon
  paper) and the PMC mirrors: blank responses and CAPTCHA blocks.
- nature.com/articles/s41598-023-41032-5 (Walters & Wilder on fabricated
  citations): login redirect. Its much-quoted 55% and 18% figures are
  deliberately not reported above.
- theguardian.com, wired.com and nytimes.com generative-AI policy pages:
  blocked. No newsroom style guide written as LLM instructions was found,
  and that absence is reported as a limit of this search rather than as an
  established fact.
- perplexity.ai, consensus.app and scispace.com: HTTP 403. Their citation
  behavior is described above only from secondary sources and is marked as
  such.
- web.archive.org: blocked to the fetcher, so no fallback was available
  for any of the above.

One methodological limit applies to the whole document. The web-search
budget for this session was exhausted partway through, and several passes
completed on direct fetches and secondary corroboration rather than fresh
search. The searches that ran are the basis for the absence claims in "The
gaps"; those claims are stronger than an impression and weaker than a
survey, and should be read that way.
