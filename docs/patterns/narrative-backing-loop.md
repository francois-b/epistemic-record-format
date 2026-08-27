---
title: "Pattern: the narrative backing loop"
purpose: "How a document and its record are developed together: passages flagged, claims proposed and ruled, evidence gathered through gates, positions taken, prose revised, bindings kept honest."
status: non-normative
last_updated: 2026-08-27
---

# Pattern: the narrative backing loop

## The problem

A person has a document, or is writing one, and wants what it asserts to rest on something: claims they could defend line by line, evidence that can be checked, positions they have actually taken. They also want to keep rewriting the document, sometimes drastically, without the argument underneath it silently drifting.

The format gives them the records (section 4) and the binding between prose and claims (section 4.6, `ERF-31`). This pattern is the order of work around those records, with a person and an LLM at the table, and what each does.

## Two documents, two directions

The narrative is fluid: it is torn up and rewritten. The claims and their evidence are stable: a rewrite of the prose does not touch them. The bindings are the seam, and they are the only thing a rewrite breaks; `ERF-31` and `ERF-32` say how a consumer reports that. Big swings at the prose are therefore safe, which is the point of keeping the two apart.

Work runs in both directions:

- **Bottom-up**, from prose to claims: a passage asserts something; what claims does it rest on? This is the ordinary direction for an existing document.
- **Top-down**, from claims to prose: a thesis is decomposed into the claims it needs before evidence exists; the document is later written from the tree. This is the ordinary direction for a position being designed. See [`claims-tree.md`](claims-tree.md).

The loop below is written bottom-up. Top-down uses the same steps from step 3 on, with step 2 replaced by decomposing a claim instead of a passage.

## Who does what

- **The person** flags, rules, stands, and writes prose. Nothing enters the record as a position without them.
- **The LLM** proposes: decompositions, claims, searches, sources, quotes, findings, rewordings. It runs the housekeeping through gated tools and never writes a record the person has not confirmed.
- **The tools** enforce what neither can be trusted to remember: a quote is checked against held text at mint (`ERF-50`); an unheld source cannot be cited; a standing needs a reason and an instant (`ERF-19`); a survey needs logged acts (`ERF-26`); an id must resolve (`ERF-35`).

## The loop

1. **Flag.** Reading the narrative, the person marks a passage that asserts something worth backing. A flag is a note to self, not a record: it names the narrative, an anchor (a few exact words of the passage), and optionally why. A flag also says what the person wants done about it: propose the claims and stop, back it once the claims are ruled, or back it and search for the opposite as well. Flags accumulate; nothing else happens yet. *Tooling: `erf_flag` from a selection in the app's editor (which asks what the flag is for) or from chat; `flags.jsonl` at the corpus root holds them; the viewer and the editor both show flagged passages.*

2. **Decompose.** For a flagged span, the LLM lists every assertion the span makes (the anchor is the scope: a flag on one sentence is not a flag on its paragraph; the passage around it is context, and what the rest of it asserts waits for its own flag), each typed by what would settle it (`observation`, `argument`, `commitment`, `bet`), with the claim stated no stronger than the passage states it, what would back it, and the anchor words. Assertions that are one claim are merged. Nothing is written. *Tooling: the `decompose-passage` prompt; `erf_flags` lists what is waiting.*

3. **Rule.** The person accepts, narrows, merges, or drops each proposal, in a sentence. A narrowing is the ordinary outcome. *Tooling: none; it is a conversation. A flag made in the editor puts the opening request into that conversation itself, so the ruling happens in the same chat with the document still open.*

4. **Mint and bind.** Accepted claims are written, and the passage is bound to them with an instant-stamped marker. The flag is resolved by the binding. *Tooling: `erf_claim_mint`, `erf_narrative_bind`; `erf_narrative_check` reports the binding as current.*

5. **Back.** For each observation, the LLM searches (each act logged with what it was for), captures the pages it reads (bytes held, digested, registered), picks verbatim quotes from the held text, and mints atoms; a paraphrase is refused. For a gap claim it records a survey compiled from the logged acts. *Tooling: `erf_source_add`, which takes the search that led to the page (`found_by`, logged before the capture) and returns the passage around the phrase given as `find`, so the quote is chosen without reading the page again; `erf_atom_mint`, which takes every atom for that source in one call and reports each outcome in order; `erf_search_log` for a search that found nothing worth capturing; `erf_source_read` to re-read a source captured earlier; `erf_survey_record`.*

6. **Search for the opposite.** Before anyone stands on an observation, the LLM states the strongest case against it and where that evidence would be found; the person decides what to chase. Evidence against goes in `atoms_against`; a claim that survives only narrowed gets the narrower title. *Tooling: the `search-for-the-opposite` prompt.*

7. **Stand.** The person takes a position, with a reason. The disposition is computed (`ERF-41`). *Tooling: `erf_claim_stand`.*

8. **Look.** The person reads the claim with its evidence and standings, the narrative with its bound passages, or the whole tree. *Tooling: `erf_view` inline for a record, fullscreen for the narrative; `erf_render_site` for a browser.*

9. **Revise.** The prose changes: a claim narrowed, a sentence overclaims, a section is rewritten. Bindings whose claims changed read stale; anchors edited away read broken; passages left unbound are listed. The person rewrites, the LLM rebinds. *Tooling: any markdown editor for the prose, the app's editor among them, where the check runs on every save and stale and broken passages are marked as they happen; `erf_narrative_check`, `erf_narrative_bind` with `replace`.*

Then the next flag. A section of an essay is one sitting; a whole essay is a week of them.

## Conventions this pattern adds

- **A flag** is `{ts, narrative, anchor, note?, research?, by, status, taken_by?, taken_ts?}` in `flags.jsonl` at the corpus root, append-only, resolved by the binding that covers its anchor. `research` is what the flag asked for (propose, back, or back and oppose) and defaults to proposing. It is producer machinery, like the research log; the format does not see it.
- **A flag is taken before it is worked**, so several workers can share one queue: another chat, another session, an agent working through the backlog. A take names the worker and the instant, holds for half an hour and then goes stale, and is never cleared, so a resolved flag says who did it. A worker skips what someone else holds.
- **Anchors are exact words from the passage**, unique in the narrative, chosen at flag time and kept through to the binding.
- **The narrative's own source is never backing.** A corpus may hold the shipped version of the narrative as a source, pinned by digest, so a reader can tell the living text from the sent one; an atom quoting it records what the document says and never appears in a claim's `atoms_for`.
- **Log before capture, capture before quote, quote before claim backing.** The order the gates assume.
- **Narratives are written CommonMark-style: one line per paragraph, no hand-wrapping.** A newline inside a paragraph is a space to CommonMark and to the anchor check (`ERF-31` under `ERF-52`'s fold), so a hand-wrapped file conforms and reads correctly; it only makes edits and diffs untidy. A tool that meets one offers to unwrap it once, as an edit the person takes or declines; it never rewraps on save, since a save writes only what the person changed.

## What this pattern does not decide

Where the prose is edited (a text editor, the app's editor, a brain's in-conversation editor, a word processor that exports markdown: the app's editor is one option and not the pattern's choice); whether flags are shared between people; how many sittings a document takes. Those are the person's.
