---
id: ai-attributable-revenue-evidence-rerun-2026-08-25
type: survey
corpus: ai-capex
title: "Re-run: does the corpus's raw source material and claim prose carry AI-attributable revenue evidence that never made it into a minted atom?"
conducted: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
prior_survey: ai-attributable-revenue-evidence-2026-08-25
searches:
  - tool: "grep -niE (BSD grep, macOS)"
    query: "AI revenue|AI-specific revenue|AI semiconductor revenue|AI-attributable revenue"
    scope: "corpus/claims/*.md, full file (frontmatter + working notes prose, not just atoms_for/against ids); 53 claim files"
    hits_reported: "28 lines across 9 files"
  - tool: "manual review, read in full"
    query: "the 9 matched claim files, checking whether any working-notes sentence names an AI-attributable revenue dollar figure not already traceable to one of the 5 atoms found in the prior survey"
    scope: "the 9 files from act 1"
    hits_reported: "0 new figures -- every dollar figure in the 28 matched lines restates one of acx-18, acx-19, acx-21, acx-22, or acx-38, or restates the claim titles themselves; no claim's prose surfaces AI-attributable revenue evidence beyond what its cited atoms already carry"
  - tool: "grep -liE (BSD grep, macOS)"
    query: "AI revenue|AI-specific revenue|AI-attributable revenue"
    scope: "corpus/captures/*.md, the 69 raw source captures (broader universe than atoms: an atom is a curated excerpt of a capture, so a capture can carry text no atom quotes); differently scoped from both acts above, which stayed inside minted records"
    hits_reported: "3 files: bear-cahn-600b-question-2024.md, bear-zitron-haters-guide-ai-bubble.md, bull-amzn-jassy-shareholder-letter-2025.md"
  - tool: "grep -niE (BSD grep, macOS), with context"
    query: "revenue"
    scope: "the 3 capture files from act 3, read around each match rather than atom-by-atom"
    hits_reported: "Cahn's and Zitron's captures contain no dollar figure beyond what acx-18/19/21/22 already quote. The Amazon/Jassy capture contains one not previously atomized: 'AWS's AI revenue run rate is over $15 billion in Q1 2026 (nearly 260 times larger' [than a cited early comparison figure], a first-party Amazon disclosure distinct from the already-atomized 'reportedly approaching $30 billion' OpenAI/Anthropic figure (acx-66) elsewhere in the same letter."
notable_results:
  - what: "AWS's own 'AI revenue run rate... over $15 billion in Q1 2026', from Andy Jassy's 2025 shareholder letter (source: bull-amzn-jassy-shareholder-letter-2025)"
    note: "A first-party, company-named AI-specific revenue figure -- stronger than acx-38 (Broadcom) on the 'first-party' axis, since this is the buyer-and-operator (Amazon/AWS) naming its own AI revenue rather than a chip vendor's revenue driven by AI demand. It sits in the same capture as the already-atomized acx-66 (OpenAI/Anthropic run rates) but was not itself minted into an atom. This is a genuine miss in the prior survey's atoms-only universe and the clearest illustration of why the re-run's differently-scoped act earns its place: an atoms-only search reports a thinner picture than the corpus's raw material actually supports. Minting it as an atom is future work outside this survey's scope -- see final-friction.md."
---
This is a deliberate re-run of `ai-attributable-revenue-evidence-2026-08-25`, chained via `prior_survey` per ERF-28. The sought question is unchanged (which corpus sources report AI-attributable revenue, as distinct from capex, cloud/segment revenue, RPO, or revenue-need methodology), but two of this run's four acts are scoped differently from anything the prior survey did: act 1 searches full claim files (frontmatter and working-notes prose together) rather than atom `finding` fields, and acts 3-4 search the 69 raw source captures directly rather than the 151 minted atoms. The prior survey's acts and their reported yield are unchanged and un-re-run here, per ERF-28's immutability rule; this record only adds new acts against a wider universe.

The claim-prose act (act 1-2) came back empty of anything new, which is expected and worth stating plainly rather than treating as a non-result: claims cite atoms, and a claim's working notes mostly restate or contextualize the atoms it cites rather than introducing fresh figures, so a claim-level search finding nothing beyond the atom-level search is the corpus behaving as designed, not a gap in the search.

The capture-level act (act 3-4) is where the differently-scoped act earns its keep. Searching the raw captures instead of the atoms distilled from them surfaces AWS's own "AI revenue run rate... over $15 billion in Q1 2026" sitting in the same Jassy shareholder-letter capture that already backs acx-66 -- a first-party figure that the corpus's atom layer simply never picked up. This does not overturn the prior survey's headline finding (AI-attributable revenue evidence in this corpus is thin, and what exists is mostly hedged, thirdhand, or a chip vendor's revenue rather than a buyer's); if anything it sharpens it, because even the one clean miss found here is a *run rate*, not audited revenue, consistent with everything else this pair of surveys turned up. But it does mean the prior survey's "5 of 31" tally describes the atom layer's coverage, not the corpus's total raw evidence -- a distinction worth keeping separate, which is exactly what re-running with a wider net was for.

Coverage bounds: acts 1-2 are a complete search of the claims directory (53 files, closed set), so their zero-new-figures finding is conclusive within that universe. Acts 3-4 are a complete keyword search of the 69 raw captures (also a closed set under the purity boundary of this closing pass), but a keyword search is not a complete *reading*: "AI revenue" and its three named variants are not the only phrasing a source might use for an AI-attributable revenue figure (a source could say "revenue from AI products" or name a specific product line without ever using the word "AI" adjacent to "revenue"), so a capture that discusses AI-attributable revenue without one of these four phrasings would not surface here. The prior survey's closing note already flagged this as the natural next scope; a future third pass would need a broader query set or a full manual read of all 69 captures rather than a keyword grep, which is more expensive and was judged out of scope for this closing pass's survey budget.
