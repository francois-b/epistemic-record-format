# claimsB friction notes

Dated one-liners from minting 26 new claims (lane 3, "claimsB") into the `ai-capex` corpus,
covering supply chain, power/land, academic economics, financing structure, historical
analogy, and decomposition -- everything beyond the core 27 claims a prior author minted.

## 2026-08-25

- **decomposes-into cannot be added to a claim I'm not allowed to edit (structural, not a
  workaround).** Per SPEC.md 5, `decomposes-into` is stored subject-first on the PARENT:
  "the target is one part of THIS claim." The prior author's
  `capex-hyperscaler-aggregate-2026-doubling` could carry decomposes-into edges to its two
  per-company children because the same author minted parent and children together. I
  cannot do the same for `semiconductor-supply-chain-results-show-real-not-just-announced-demand`,
  `capacity-and-power-constraints-signal-undersupplied-real-demand`, or
  `ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet`: I wanted to give
  each a company- or category-specific child (TSMC; ASML+memory; PJM+hyperscaler power
  signals; vacancy; CoreWeave rating; system-wide bonds), but I'm barred from editing the 27
  existing claims, and there is no inverse "part-of" relation in the closed vocabulary
  (section 5 lists only `supports`, `assumes`, `decomposes-into`, `conflicts-with`; the note
  under the vocabulary explicitly keeps this set small on purpose). So every one of those six
  narrower claims carries a `supports` edge pointing at the existing parent instead of the
  parent carrying `decomposes-into` pointing at it. This is honest (`supports`: "this claim
  argues for the target" fits -- a narrower confirming data point does argue for the wider
  claim) but weaker than a true decomposition: it doesn't formally record "this atom set was
  partitioned," and ERF-43's caution about closures also doesn't apply to it the way it would
  to a real decomposes-into edge. **The one decomposes-into pair I actually used is
  `openai-attracts-large-direct-equity-investments-from-multiple-strategic-investors-beyond-its-primary-cloud-partner`
  decomposing into `amazon-invests-28-7-billion-in-openai-series-c-preferred-stock` and
  `softbanks-follow-on-investment-brings-its-cumulative-openai-stake-to-64-6-billion`** --
  both children minted by me in the same batch, so the edge is legitimately mine to place.
  Relation-vocabulary gap worth flagging for spec authors: a format that lets a second author
  extend a corpus without editing the first author's records has no way to formally register
  "this claim I'm adding is a part of a claim someone else already minted." Task requirement
  ("consider decomposes-into children ... a partition claimed complete is a strong statement,
  so only where honest") is best read, given this constraint, as: I considered it for four
  existing parents and could not honestly claim it without editing them, so I used `supports`
  instead and record that substitution here rather than silently downgrading the connection.

- **Historical analogy: reconnected via a new narrow argument claim, left the neutral claim
  itself untouched.** The prior author's `historical-technology-buildout-analogies-are-ambiguous-precedent`
  deliberately carries no edges into the central pair, with working notes explaining that
  forcing one would misrepresent evidence that "genuinely support[s] neither side more than
  the other." I agree with that judgment at the level the prior claim operates -- the episode
  as a whole is ambiguous precedent. But rereading the atoms for a narrower, honest relation:
  Hogendorn's finding (acx-115) that the telecom boom's "excessive entry" was concentrated in
  carrier swaps and leases rather than physical construction is structurally the same
  complaint `rpo-growth-does-not-establish-monetizable-diversified-demand` makes about
  today's RPO/backlog quality (non-binding deals, circular guarantee structures). Minted
  `hogendorns-moderate-physical-overbuild-finding-parallels-todays-rpo-quality-concerns` as
  a new argument claim that `assumes` the neutral historical claim and `supports` the
  existing RPO-quality argument -- a real, narrow, mechanism-level connection that doesn't
  touch the parent's own neutrality. Did not attempt a second connective claim off
  Odlyzko's railway-mania material (collective hallucination despite trustworthy warning
  signals): the natural inference there reads as a meta-caution about the debate itself
  ("good bear arguments existing doesn't guarantee correction") rather than a specific
  first-order relation, and forcing it into `supports`/`conflicts-with` on either central
  claim felt like overreach in the same way the prior author avoided for the parent. Recorded
  as a considered-and-declined connection rather than an oversight.

- **Family vocabulary: introduced five new tags, alongside the prior author's six.** The
  spec's closed vocabularies (section 5) cover epistemic_kind, stance, relation, and
  source_quality; `families` (`FamilyName[]`) is explicitly open-ended -- "recorded
  membership for exact pulls," no enumerated set. The prior author used six:
  `central-thesis`, `revenue-gap`, `demand-signals`, `financing-risk`, `capex-figures`,
  `roi-evidence`. My batch covers ground those six don't cleanly name (supply chain, power
  grid, academic macro modeling, financing-instrument structure, historical analogy), so I
  added `supply-chain`, `power-grid`, `academic-macro`, `financing-structure`, and
  `historical-analogy` as additional tags on top of (not instead of) the existing six where
  they applied. This is a divergence from the prior author's practice worth surfacing
  explicitly, not because it's against any rule (families aren't a closed set) but because a
  future author pulling "the demand claims" by family name now needs to know both vocabularies
  exist side by side.

- **atoms_against: went back for a second pass after an initial draft under-supplied it.**
  My first pass populated atoms_against on only ~4 of 26 claims; the prior author's 27 carry
  it on 22 (about 81%). Given the task's explicit instruction ("evidence in BOTH directions
  where the corpus carries it"), I re-walked every claim and looked harder for genuine
  corpus-carried tension rather than settling for whatever was easiest to state. Landed at
  19/26 (73%) with atoms_against populated; the 7 without it are narrow, single-source,
  largely uncontested factual claims (data-center vacancy from one JLL report, Dominion's
  forecast methodology, the two OpenAI-investor decomposition children, the IEA electricity
  claim, the ERCOT queue-size fact itself) where I could not find a real complicating atom
  without inventing one -- consistent with the ~5/27 claims in the existing corpus that also
  lack it (e.g. `coreweave-depreciation-growth-2026`, `genai-divide-attributed-to-learning-not-infrastructure-limits`).

- **"binding" used in two claim titles/ids** (`interconnection-queue-size-likely-overstates-binding-demand-...`,
  and originally considered for the PJM/power claim, renamed away from it) in the
  contract-law sense (binding vs. non-binding commitment), matching the existing corpus's own
  usage (`rpo-growth-does-not-establish-monetizable-diversified-demand`'s working notes
  already quote Marcus calling the Oracle deal "apparently non-binding"). Read this as
  distinct from a house style rule in the operating environment that flags "binding" as a
  watchword for vague abstraction-speak in operator-facing prose, not a domain-standard
  contract term inside a data corpus about financing structures. Renamed the PJM/hyperscaler
  power claim's title away from "binding constraint" anyway, to a plainer "the constraint
  currently limiting the AI buildout," since a cheap rewrite removed any ambiguity at zero
  cost.

- **Em dash convention followed the prior author's, not the literal Unicode character.** The
  existing 27 claims use `--` (double hyphen) rather than a true em dash character throughout
  their working notes. Matched that convention across all 26 new files, both for stylistic
  consistency with the existing corpus and because a house style rule in the operating
  environment bans em dashes in running prose generally.

- **Reused atoms heavily across new claims rather than treating each atom as
  single-use.** E.g. acx-53 (Doomberg, China competition) appears as atoms_against on two new
  claims; acx-138 (S&P credit fatigue) appears on three. This matches the existing corpus's
  own practice (acx-51/52/62/70/104 each appear in multiple existing claims) and the spec
  does not treat atoms as consumed by citation -- an atom's finding is a fact, not a token to
  spend once.

- **Semiconductor supply-chain "physical reality vs. economics" split into two claims**
  rather than one claim with both halves in its title, to keep each claim's title
  true-or-false standing alone (ERF-18) without a compound "X, but not Y" statement doing
  double duty. `semiconductor-supply-chain-results-show-real-not-just-announced-demand`
  (existing, physical reality) and my new
  `semiconductor-results-confirm-physical-buildout-but-not-hyperscaler-return-on-capital`
  (argument, what it cannot establish) are linked by an `assumes` edge from the second to the
  first, which is the intended ERF-24 mechanism for exactly this kind of "granting the
  premise, the further step doesn't follow" argument.

## Deliverable summary (see final message for full stats)

26 new claims in `corpus/claims/`. Zero collisions with the 27 existing ids or with each
other (checked programmatically before writing). Structural validation run after minting:
frontmatter parses as valid YAML on all 26; every `id:` matches its filename; no forbidden
`standings`/`evidence_audit`/`finding_audit` fields; every `atoms_for`/`atoms_against` id
resolves against `corpus/atoms/`; every edge target resolves against the full 53-file claim
set; no self-edges; no duplicate `conflicts-with` pairs; no cycles in `assumes` or
`decomposes-into`; every argument-kind claim's premise closure (own `assumes` plus incoming
`supports`) terminates in non-argument leaves, checked transitively across old and new claims
together.
