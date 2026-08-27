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

1. **Flag.** Reading the narrative, the person marks a passage that asserts something worth backing. A flag is a note to self, not a record: it names the narrative, an anchor (a few exact words of the passage), and optionally why. Flags accumulate; nothing else happens yet. *Tooling: `erf_flag` from the viewer's selection toolbar or from chat; `flags.jsonl` at the corpus root holds them; the viewer shows flagged passages.*

2. **Decompose.** For a flagged passage, the LLM lists every assertion a reader could check, each typed by what would settle it (`observation`, `argument`, `commitment`, `bet`), with the claim stated no stronger than the passage states it, what would back it, and the anchor words. Assertions that are one claim are merged. Nothing is written. *Tooling: the `decompose-passage` prompt; `erf_flags` lists what is waiting.*

3. **Rule.** The person accepts, narrows, merges, or drops each proposal, in a sentence. A narrowing is the ordinary outcome. *Tooling: none; it is a conversation.*

4. **Mint and bind.** Accepted claims are written, and the passage is bound to them with an instant-stamped marker. The flag is resolved by the binding. *Tooling: `erf_claim_mint`, `erf_narrative_bind`; `erf_narrative_check` reports the binding as current.*

5. **Back.** For each observation, the LLM searches (each act logged with what it was for), captures the pages it reads (bytes held, digested, registered), picks verbatim quotes from the held text, and mints atoms; a paraphrase is refused. For a gap claim it records a survey compiled from the logged acts. *Tooling: `erf_search_log`, `erf_source_add`, `erf_source_read`, `erf_atom_mint`, `erf_survey_record`.*

6. **Search for the opposite.** Before anyone stands on an observation, the LLM states the strongest case against it and where that evidence would be found; the person decides what to chase. Evidence against goes in `atoms_against`; a claim that survives only narrowed gets the narrower title. *Tooling: the `search-for-the-opposite` prompt.*

7. **Stand.** The person takes a position, with a reason. The disposition is computed (`ERF-41`). *Tooling: `erf_claim_stand`.*

8. **Look.** The person reads the claim with its evidence and standings, the narrative with its bound passages, or the whole tree. *Tooling: `erf_view` inline for a record, fullscreen for the narrative; `erf_render_site` for a browser.*

9. **Revise.** The prose changes: a claim narrowed, a sentence overclaims, a section is rewritten. Bindings whose claims changed read stale; anchors edited away read broken; passages left unbound are listed. The person rewrites, the LLM rebinds. *Tooling: a markdown editor or the brain's editor for the prose; `erf_narrative_check`, `erf_narrative_bind` with `replace`.*

Then the next flag. A section of an essay is one sitting; a whole essay is a week of them.

## Conventions this pattern adds

- **A flag** is `{ts, narrative, anchor, note?, by, status}` in `flags.jsonl` at the corpus root, append-only, resolved by the binding that covers its anchor. It is producer machinery, like the research log; the format does not see it.
- **Anchors are exact words from the passage**, unique in the narrative, chosen at flag time and kept through to the binding.
- **The narrative's own source is never backing.** A corpus may hold the shipped version of the narrative as a source, pinned by digest, so a reader can tell the living text from the sent one; an atom quoting it records what the document says and never appears in a claim's `atoms_for`.
- **Log before capture, capture before quote, quote before claim backing.** The order the gates assume.

## What this pattern does not decide

Where the prose is edited (a text editor, a brain's in-conversation editor, a word processor that exports markdown); whether flags are shared between people; how many sittings a document takes. Those are the person's.
