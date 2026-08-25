# claimsA friction log

Batch A (DEBATE CORE) of the `ai-capex` claim-minting pass. 27 claims minted
into `corpus/claims/`. Dated one-liners below, requirement ids where a
specific `ERF-*` is in tension, and every place a judgment call was made
that a second author or an orchestrator merge should be aware of.

## 2026-08-25 — naming convention established (no prior art in the corpus)

`corpus/claims/` was empty; no id convention existed to inherit. I used
plain descriptive kebab-case slugs with **no corpus prefix**
(`ai-capex-sustainable-given-demand-backing`, not `acx-claim-...` or
`acx-152`), matching `SPEC.md` §4.3's own worked example
(`citators-disagree-on-negative-treatment`) rather than reusing the atom
corpus's `acx-<number>` shape, which `ERF-13` reserves for atoms ("a
mint-time prefix plus a sequence number"). **Collision risk**: batch A and
batch B (lane 3b) are minting into the same corpus without a shared id
registry at mint time. `ERF-37`/`ERF-38` put duplicate-prevention on the
producer and duplicate-rejection on the validator; I could only verify
uniqueness against my own 27 ids and the 151 existing atom ids. Flagging
for the orchestrator to diff batch A's and batch B's id lists before merge
— a slug collision between two authors working the same debate is a live
risk, not a hypothetical one (both batches likely reach for something like
`ai-capex-is-a-bubble` independently).

## 2026-08-25 — timestamp precision: bare date over RFC 3339 instant (ERF-19 vs the `ActorStamp` comment)

The inline TypeScript mirror tags `ActorStamp.timestamp` `// RFC 3339`, but
both worked examples in §4.2 and §4.3 write `created: {timestamp:
2026-07-19, ...}` as a bare date, and `ERF-19`'s own commentary says full
RFC 3339 precision is "required here and nowhere else" (standings), with a
bare date "correct where nothing is ordered, as in an atom's `as_of_date`
or a survey's `conducted`." I read `created`/`last_modified` as falling on
the bare-date side of that line and used `"2026-08-25"` throughout. All 27
claims were minted in one sitting so no same-day ordering problem arises
either way, but a producer minting claims across a single day in two
sittings would want the full-instant form per `ERF-48`'s advice ("a
producer stamping a second edit on the same day SHOULD write a full
instant"). Worth the orchestrator picking one reading explicitly rather
than leaving it to each author's inference.

## 2026-08-25 — minting observation-only "premise" claims purely to satisfy ERF-43

Two argument-kind claims needed a clean, non-argument leaf to assume so
their premise closure would terminate per `ERF-43` and not trip the
`ERF-49` unbacked flag: `ai-gpu-assets-may-depreciate-faster-than-
industry-schedules-assume` needed `coreweave-depreciation-growth-2026` to
exist as its own record before it could carry a valid `assumes` edge. That
observation claim (CoreWeave's D&A roughly 2.5x-ing in H1 2026) is true and
checkable on its own, but it exists mainly as graph plumbing — I would not
have minted it as a standalone claim absent the argument-backing
requirement. Same pattern, more visibly, with `enterprise-roi-scarcity-
supports-bubble-risk-reading`: it exists to give
`ai-capex-outpaces-realizable-revenue-bubble-risk` a second `supports`
route into the ROI-evidence family, and its own working notes say so
plainly. Neither is padding — both state genuine, disagreeable
propositions — but the honest account is that the argument-backing
machinery in `ERF-24`/`ERF-43`/`ERF-49` pushed the claim count up by at
least one, maybe two, beyond what the debate's substance alone would have
produced.

## 2026-08-25 — epistemic_kind was hardest to assign for three claims

1. `ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume` —
   landed on `argument` because the load-bearing move is Burry's
   inference from CoreWeave's D&A growth plus a telecom analogy, not a
   directly-checkable fact; but it reads close enough to "the atoms show
   depreciation growing fast, full stop" that `observation` was a live
   alternative. Resolved by asking what the backing audit would need to
   check (`ERF-24`): for `observation` it would ask "do the atoms jointly
   entail the statement," which understates the inferential work Burry's
   argument is doing; for `argument` it asks "granting the premise, does
   the conclusion follow," which is the real question here.
2. `covello-ai-cost-must-justify-itself-against-cheaper-prior-transitions`
   — landed on `bet` (only the world, i.e., realized AI value over
   coming years, settles it) over `argument` (reasoning over Covello's own
   premises). Chose `bet` because the claim as titled is forward-looking
   and evaluative ("remains genuinely unresolved"), not a request to audit
   whether Covello's syllogism is valid; an `argument` framing would have
   required restating it as "granting AI is exceptionally expensive and
   must solve high-value problems, it has not yet done so," which is a
   narrower, more mechanical claim than the one worth minting here.
3. `historical-technology-buildout-analogies-are-ambiguous-precedent` —
   considered `argument` (reasoning from two historical episodes to a
   meta-conclusion about precedent) but minted as `observation` because the
   atoms directly report what the two studies found, and "ambiguous" is
   itself the finding rather than an inference layered on top of it. A
   second author might reasonably call this one `argument`; flagging the
   disagreement rather than pretending the line is bright.

## 2026-08-25 — edge vocabulary didn't quite fit three places

1. **`conflicts-with` across mismatched asset classes.**
   `ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume`
   (about GPU/AI-hardware lifetimes, evidenced by CoreWeave) carries
   `conflicts-with` against `msft-datacenter-useful-life-extension-
   flatters-near-term-earnings` (about datacenter *buildings*, evidenced
   by Microsoft). They are not, strictly, the same proposition negated —
   Microsoft's extension covers structures, not chips. I stored the edge
   anyway because both claims are genuinely opposing readings of "how long
   do AI-era infrastructure assets last, and is the industry's accounting
   keeping pace," which is the debate a reader actually cares about, but
   the four-relation vocabulary (§5) has no "adjacent tension, not a
   strict negation" relation — `conflicts-with` was the closest fit and I
   used it, with this note as the honesty flag.
2. **No relation for "cuts both ways, connects to neither side."**
   `historical-technology-buildout-analogies-are-ambiguous-precedent` is
   deliberately unconnected by edge to either
   `ai-capex-sustainable-given-demand-backing` or
   `ai-capex-outpaces-realizable-revenue-bubble-risk`, because its own
   atoms support neither more than the other (Odlyzko's railway study
   argues manias persist despite good warnings; Hogendorn's fiber study
   argues the "excessive entry" reading of the telecom bust is
   overstated). Forcing a `supports` edge into one central claim to avoid
   leaving this claim orphaned in the graph would have misstated what the
   evidence does. The format gives no vocabulary for "this is relevant
   background that adjudicates neither side," so it sits as a free-
   standing claim, findable only by family (`central-thesis`) and semantic
   search, not by edge traversal from the pair it's actually about.
3. **`conflicts-with` at mismatched scope.**
   `circular-financing-arrangements-raise-particular-bubble-concern`
   carries `conflicts-with` against `prepaid-and-customer-financed-
   contracts-reduce-vendor-capital-need-but-signal-buyer-conviction`, but
   the latter claim's scope is broader (Oracle, Amazon, Anthropic prepaid/
   commitment structures generally) than the former's (specifically the
   NVIDIA-OpenAI-CoreWeave circular deals). The two do genuinely conflict
   on the NVIDIA-related atoms both cite (`acx-51`, `acx-52`), but the
   edge reads as though the whole of one claim opposes the whole of the
   other, which overstates the overlap. No sub-claim relation exists to
   say "conflicts on the shared portion only."

## 2026-08-25 — atoms_against used for three different senses of "against," not one

The instructions ask for evidence in both directions where the corpus
carries it; the corpus's "against" evidence is not homogeneous, and
`atoms_against` is a single flat list with no room to say which kind of
tension applies:
- **Genuine present-tense rebuttal** (the common case): e.g.
  `rpo-growth-does-not-establish-monetizable-diversified-demand`'s
  `atoms_against` (`acx-3`, `acx-37`) are atoms that actually undercut the
  claim's own conclusion right now.
- **Methodological/scope variance, not contradiction**:
  `capex-hyperscaler-aggregate-2026-doubling` carries `acx-49` (GMO's
  lower, differently-scoped estimate) in `atoms_against` because it's the
  only mechanism the schema offers to flag "another credible source states
  a materially different number for what sounds like the same fact." It
  does not actually dispute that aggregate capex roughly doubled.
- **Forward risk, not a dispute of present facts**:
  `semiconductor-supply-chain-results-show-real-not-just-announced-demand`
  carries Doomberg's China-competition atom (`acx-53`) in `atoms_against`
  even though it does not contest that TSMC/ASML/Samsung/SK hynix posted
  record 2026 results — it names a mechanism that could erode the margins
  those results reflect, later. Using the same field for "this is false"
  and "this may stop being true" is a real fidelity loss; a reader scanning
  `atoms_against` alone cannot tell which kind of tension each atom
  represents without opening the working notes.

## 2026-08-25 — two claims left with no atoms_against despite looking for one

`genai-divide-attributed-to-learning-not-infrastructure-limits` and
`labor-market-effects-of-genai-adoption-remain-minimal-2025` each rest on a
single atom from a single study (MIT NANDA; Humlum & Vestergaard
respectively), and I did not find a genuine counter-atom in the 151-atom
set for either. I resisted force-fitting something adjacent-but-not-really-
contradicting into `atoms_against` for the sake of appearing balanced —
per the task's own framing, an honest mix means some claims are
one-sided *because the corpus is one-sided on that narrow point*, not
because I under-searched. Both are flagged in their own working notes as
resting on a single study with no independent corroboration or challenge
inside this corpus.

## 2026-08-25 — one atoms_against pairing is a weaker fit than it looks

`enterprise-genai-roi-mostly-absent-2025` carries Humlum & Vestergaard's
~3%-time-savings finding (`acx-58`) in `atoms_against`, but that study
measures individual worker time savings via administrative labor data, not
enterprise-level financial ROI on formal AI deployments (MIT NANDA's actual
subject). They are adjacent, not opposed, and I said so in the claim's
working notes rather than let the field placement imply a cleaner rebuttal
than the evidence supports.

## 2026-08-25 — claim/atom boundary: revenue-gap claims sit close to atom restatement

`cahn-revenue-gap-methodology-and-figures` and `zitron-capex-vs-ai-revenue-
gap-2024-2025` are each built almost entirely from one analyst's own
essays (Cahn's, Zitron's), and the claim titles land close to "this is what
the analyst calculated." I judged these cross the claim threshold because
the disagreeable proposition is not "did Cahn say this" (trivially yes,
checkable) but "is this the right lens on the capex-vs-revenue question" —
which the atoms_against and working notes on both claims argue against
directly (contracted RPO the methodology doesn't count as revenue yet;
Zitron's narrow definition of "AI revenue" excluding broad-based cloud
growth). A stricter reader could still argue these two are atom summaries
wearing a claim's clothing rather than genuine propositions; flagging the
judgment call rather than asserting it's clean.

## 2026-08-25 — three structurally parallel micro-pairs feed the one macro pair, by design

`rpo-growth-reflects-large-contracted-commitments` /
`rpo-growth-does-not-establish-monetizable-diversified-demand`,
`capacity-and-power-constraints-signal-undersupplied-real-demand` /
`reported-contracted-capacity-figures-overstate-realized-electricity-
demand`, and the prepaid-contracts claim (one-sided title, two-sided
atoms) each mirror the same "signal is real" vs. "signal doesn't mean what
it's read to mean" shape, then feed into
`ai-capex-sustainable-given-demand-backing` (which `assumes` the
optimistic half of each pair) and
`ai-capex-outpaces-realizable-revenue-bubble-risk` (which `assumes` the
skeptical half via `rpo-growth-does-not-establish-...` and, transitively
through `circular-financing-arrangements-...`, the financing family). This
is an intentional structural choice — the corpus's actual argument
structure *is* three parallel contested demand-signal readings feeding one
macro dispute — not an accident of how the claims were drafted, but it
does mean the graph is denser around the central pair than around the
edges of the debate, which a reader pulling `families: [central-thesis]`
should expect.

## 2026-08-25 — scope of batch A vs batch B is inferred, not confirmed

The task described batch A's scope (capex magnitude, demand signals,
revenue gap, the central sustainability-vs-bubble pair, ROI evidence up to
MIT-NANDA and the labor studies) and named batch B only as "the other
half." I did not see batch B's claim set and could not check for
thematic overlap (e.g., whether batch B independently covers the
NVIDIA/OpenAI/CoreWeave circular-financing angle I put in
`circular-financing-arrangements-raise-particular-bubble-concern`, or the
China-competition atom `acx-53` I left out of scope on the judgment it
belongs to second-order/tail-risk territory). Flagging for the orchestrator
merge pass, alongside the id-collision risk noted above.

## Families established (for batch B / orchestrator alignment)

`capex-figures` (7), `demand-signals` (8), `revenue-gap` (7),
`financing-risk` (6), `roi-evidence` (5), `central-thesis` (5) — a claim
may carry more than one. No family taxonomy pre-existed in the corpus; this
is batch A's naming, offered as a starting point rather than a ruling.
