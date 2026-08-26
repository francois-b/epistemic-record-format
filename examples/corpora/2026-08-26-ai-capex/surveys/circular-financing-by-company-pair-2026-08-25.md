---
id: circular-financing-by-company-pair-2026-08-25
type: survey
corpus: ai-capex
title: "What the corpus holds on the circular-financing thread, organized by company pair, rather than as a single undifferentiated NVIDIA/OpenAI/CoreWeave cluster"
conducted: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
searches:
  - tool: "grep -liE (BSD grep, macOS)"
    query: "nvidia.*openai|openai.*nvidia|nvidia.*coreweave|coreweave.*nvidia|softbank.*openai|amazon.*openai|openai.*amazon|microsoft.*openai|openai.*microsoft"
    scope: "corpus/atoms/*.md, finding field; 151 atom files"
    hits_reported: "15 files: acx-3, acx-9, acx-12, acx-13, acx-14, acx-22, acx-29, acx-36, acx-51, acx-52, acx-75, acx-82, acx-118, acx-128, acx-150"
  - tool: "grep -liE (BSD grep, macOS)"
    query: "anthropic.*amazon|amazon.*anthropic|anthropic.*google|google.*anthropic"
    scope: "corpus/atoms/*.md, finding field; 151 atom files (a second act, since Anthropic's investment-partner pairs use different company names than act 1's query)"
    hits_reported: "3 files: acx-40, acx-82, acx-142"
  - tool: "manual review, read in full"
    query: "sort the 17 unique atoms from acts 1-2 into company pairs by which two counterparties each atom's finding names as investor/guarantor and customer/recipient"
    scope: "the 17 unique atoms from acts 1-2 (acx-82 appears in both act results, so 15 + 3 - 1 overlap = 17)"
    hits_reported: "6 pairs identified: NVIDIA-OpenAI (6 atoms: acx-13, acx-14, acx-36, acx-52, acx-75, acx-150), Microsoft-OpenAI (3: acx-3, acx-22, acx-82), Amazon-OpenAI (2: acx-9, acx-12), SoftBank-OpenAI (2: acx-118, acx-128), Anthropic-Amazon (2: acx-40, acx-142), NVIDIA-CoreWeave (1: acx-51). 1 atom (acx-29, Burry's CoreWeave argument) names CoreWeave but not a specific counterparty deal and is not assigned to a pair."
  - tool: "grep -liE (BSD grep, macOS)"
    query: "anthropic.*google|google.*anthropic"
    scope: "corpus/atoms/*.md, finding field, run in isolation to check whether Anthropic's other named cloud/compute partner has a direct deal-structure atom the way Amazon does"
    hits_reported: "1 file (acx-82), the same Zitron atom already captured in act 2 -- no atom in the corpus describes an Anthropic-Google deal structure directly"
notable_results:
  - what: "NVIDIA-OpenAI is the only pair with atoms on both the deal structure (acx-13, acx-14, acx-36, acx-75, acx-150) and market reaction to it (acx-52: NVIDIA shares fell ~4.5% intraday when a larger guarantee figure surfaced)"
    note: "The market-reaction atom is what the corpus's one claim built around this pair (circular-financing-arrangements-raise-particular-bubble-concern) leans on as evidence that markets treat the structure as a real risk factor, not a non-event -- no other pair in this survey has an equivalent reaction atom."
  - what: "Anthropic-Amazon has two direct deal-structure atoms (acx-40: the $100B/10-year AWS commitment for up to 5GW; acx-142: Project Rainier's 1M+ Trainium2 chips) but Anthropic-Google has none"
    note: "acx-82 (Zitron) asserts Anthropic 'faces an analogous dependency through its deals with Amazon and Google,' naming Google, but no atom in the corpus documents the Google side of that dependency the way acx-40/acx-142 document the Amazon side. A claim treating Anthropic's financing structure as symmetric across its two cloud partners would currently be resting more weight on the Google half than the corpus's atoms carry."
  - what: "NVIDIA-CoreWeave (acx-51: NVIDIA's $6.3B cloud-services purchase, characterized as guaranteeing CoreWeave's unsold capacity) is the pair with the thinnest coverage -- 1 atom, no market-reaction atom, no counter-atom"
    note: "The corpus's central circular-financing claim (circular-financing-arrangements-raise-particular-bubble-concern) names NVIDIA/OpenAI/CoreWeave together in its title, but the CoreWeave leg specifically rests on a single Register report; the OpenAI leg is the one carrying the corpus's deeper evidentiary base (6 atoms, plus the market-reaction atom)."
  - what: "acx-22 (Zitron/The Information's Microsoft AI-revenue breakdown) belongs to the Microsoft-OpenAI pair as much as it belongs to the revenue-gap thread"
    note: "It describes OpenAI's Azure spend at a heavily discounted, near-cost rate -- a financing-adjacent fact (preferential pricing as a form of implicit subsidy) distinct from the RPO figure in acx-3, which is why act 3 assigns it here rather than treating Microsoft-OpenAI as covered only by a bare commitment number and a secondhand dependency characterization."
---
Sought: every atom documenting a financing or investment structure among the small set of companies (NVIDIA, OpenAI, CoreWeave, Microsoft, Amazon, SoftBank, Anthropic, Google) whose deals with each other are the subject of the corpus's circular-financing concern, organized so that the strength of evidence can be read pair by pair rather than only as one aggregated claim.

The corpus's existing claim on this topic (`circular-financing-arrangements-raise-particular-bubble-concern`) is framed around NVIDIA, OpenAI, and CoreWeave together, which is the right grouping for the specific "NVIDIA guarantees payment to its own customers" concern the claim states -- but the broader circular-financing *thread* in the corpus, once pulled apart by pair, turns out to be uneven: NVIDIA-OpenAI carries six atoms including a market-reaction data point, Microsoft-OpenAI carries three, three pairs (Amazon-OpenAI, SoftBank-OpenAI, Anthropic-Amazon) carry two apiece, and NVIDIA-CoreWeave carries a single atom with no market-reaction and no counter-atom of its own.

What surprised me: NVIDIA-CoreWeave, the pair that gives the existing claim its title alongside NVIDIA-OpenAI, turns out to have the thinnest direct evidentiary base of any pair in this survey once the search is run pair by pair rather than treated as one cluster -- a single Register report (acx-51) describing NVIDIA's $6.3B guarantee, with no market-reaction atom of the kind that exists for the OpenAI guarantee (acx-52) and no atom describing CoreWeave's side of the arrangement. Michael Burry's CoreWeave argument (acx-29) is adjacent but is about CoreWeave's own depreciation profile, not the NVIDIA relationship specifically, so it does not thicken this pair's coverage. This does not mean the concern is weaker for CoreWeave than for OpenAI; it means the corpus's capture effort concentrated more heavily on documenting the newer, larger, and more novel NVIDIA-OpenAI guarantee structure, which is plausible given what was newsworthy during this corpus's collection window but is a source-selection fact worth naming rather than assuming away.

Where a possible claim could cite this: a claim narrower than the existing central circular-financing claim -- for instance, one stating that the corpus's circular-financing evidence concentrates asymmetrically on the NVIDIA-OpenAI pair and is comparatively thin on NVIDIA-CoreWeave, the pair the title's own name-checking implies is equally documented -- could cite this survey's per-pair breakdown. Per this closing pass's brief, no such claim is minted here.

Coverage bounds: this is a complete search of the closed set of 151 atoms under the query terms in acts 1, 2, and 4, so the pair counts are conclusive for that vocabulary. It is not a complete read of every atom mentioning any of these eight companies individually (an atom naming only "Microsoft" with no OpenAI-adjacent term, for instance, would not surface here even if it bore on the financing question in a way this survey's queries could not anticipate); a broader single-company sweep per name, rather than paired-name queries, would be the natural next act if this thread is worked further.
