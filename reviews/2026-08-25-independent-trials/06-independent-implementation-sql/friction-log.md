# Friction log

One dated line per guess, re-read, or unsettled choice, with the requirement
it belongs to. Everything here is a place where the specification did not
decide something a relational schema had to decide, or where I had to go back
and read a passage again because a first reading did not survive contact with
a table definition.

All entries 2026-08-25 (one working session, built from `SPEC.md` alone).

## Layout and packaging

| # | Req | Entry |
|--:|:--|:--|
| 1 | ERF-59, ERF-53 | GUESS. Invented the whole corpus directory layout (`corpus.yaml`, `sources.yaml`, `records/**/*.md`, `narratives/**/*.md`, `captures/**`). ERF-59 says a corpus "travels as a directory or archive of its records and captures" and fixes not one filename. Two implementations of this spec cannot read each other's corpora. |
| 2 | ERF-59 | GUESS. "A YAML document under this section's rules" — section 7's rules are written for *frontmatter* (ERF-53, ERF-65, ERF-66) and for record *bodies* (ERF-67). Guessed that a declaration is a bare YAML document with no `---` fences and that ERF-65/66/67 apply to it by analogy. |
| 3 | ERF-3 | GUESS. Same for the source list, plus: guessed the top-level key is `sources:` from the section 4.1 example, which is informative, not normative. |
| 4 | ERF-53 | UNSETTLED. Nothing says whether one corpus's records may live in nested directories, or whether a filename must relate to an id. Chose free nesting, stored the path (see #26). |

## Identity and scope

| # | Req | Entry |
|--:|:--|:--|
| 5 | ERF-36, ERF-35 | INVENTED. A `deployment` table. The format scopes its two hardest invariants (id uniqueness, reference resolution) to "the deployment" and gives a deployment no id, no declaration, no file, and no record. A key needs columns. See relational-questions Q1. |
| 6 | ERF-59, ERF-17 | GUESS. Corpus ids are unique within a deployment. Never stated; forced, because records name their corpus by bare id (ERF-54). |
| 7 | ERF-13 | GUESS. `id GLOB '*-[0-9]*'` as the machine reading of "a mint-time prefix plus a sequence number". The prose gives one example (`kwg-117`) and no grammar. |
| 8 | ERF-13, ERF-15 | GENERALIZED. ERF-13 says an *atom's* id is never renamed; ERF-15 says a *claim* keeps its id across a corpus move. Nothing states the rule for a survey. Made the immutability trigger cover every record type. |
| 9 | ERF-13 | UNSETTLED. "Never reused" is a constraint over ids that have ever existed. Added a `record_id_tombstone` table plus a trigger, but the format names no act that retires an id, so nothing populates the tombstone in normal operation. |
| 10 | ERF-11 | RE-READ. `auditor` is "deliberately not an `Actor`". First draft gave it the actor CHECK; removed it, and dropped the FK to any actor table with it. There is no actor table in this schema for the same reason: the format has no actor record. |
| 11 | ERF-13, §2 | UNSETTLED. The `Actor` union `human:${string}` \| `${string}/${string}` \| `process:${string}` is ambiguous: `human:a/b` matches both the first and the second arm, and `${string}/${string}` matches almost anything containing a slash. The CHECK accepts all three arms and cannot tell them apart. |

## Time

| # | Req | Entry |
|--:|:--|:--|
| 12 | ERF-48 | RE-READ, then GUESS. ERF-48 requires `last_modified` "later than its `created`". A `Survey` has no `created` — it has `conducted`. The trigger falls back to `conducted` for surveys. Either the data model or ERF-48 is missing a sentence. |
| 13 | ERF-48 | LIMITATION. The "any change must stamp" trigger cannot span the `record`/subtype table split: stamping the supertype and editing the subtype are two statements and a row trigger cannot see the other. Only the *first* edit of a never-edited record is caught. Recorded as an ALLOW probe. |
| 14 | ERF-48 | FRICTION. The stamp trigger fires before every other constraint on an update path, so the store reported "ERF-48" for what were really ERF-9, ERF-7, ERF-4 and ERF-52 violations. Had to stamp explicitly inside each probe to measure the right thing. Constraint precedence is diagnostic quality, and the format ranks nothing. |
| 15 | ERF-19 | GUESS. Ordering full instants with different offsets. `2026-08-23T14:02:00+02:00` and `2026-08-23T12:02:00Z` are the same moment and do not compare lexicographically. Used `julianday()`. The format mandates an offset and never says the comparison is by instant rather than by string. |
| 16 | ERF-47 | UNSETTLED. "A bare date against a full instant on the same day" — whose day? A bare date has no offset. `2026-08-23` against `2026-08-24T01:00:00+05:00` is the same UTC day and a different literal day. Implemented on the literal date string; logged as arbitrary. |
| 17 | ERF-19, §3 | RE-READ. The `ActorStamp` comment says "RFC 3339", and every example writes a bare date, which is an RFC 3339 `full-date` and not a `date-time`. The CHECK accepts both. ERF-19's carve-out for standings only makes sense if the general case is the loose one, so the type comment is wrong rather than the examples. |
| 18 | ERF-41 | GUESS. Two entries by one person bearing the same instant: the format supplies no tie-break ("no stance outranks another"). Used list position as the tiebreaker, which means the *file order* decides a disposition — exactly the kind of dependence ERF-65 was written to eliminate elsewhere. |
| 19 | ERF-28 | UNSETTLED. `prior_survey` forms a chain and nothing forbids a cycle in it. Blocked self-reference only. |

## Serialization

| # | Req | Entry |
|--:|:--|:--|
| 20 | ERF-65 | RE-READ. Stock `yaml.safe_load` cannot satisfy ERF-65: PyYAML implements YAML 1.1, so an unquoted `2026-07-19` becomes a `datetime.date` — precisely the hazard ERF-65 names. Had to clear the implicit-resolver table and re-add JSON's four productions. Worth stating in the spec that no default loader in the common libraries is conforming. |
| 21 | ERF-65 | UNSETTLED. An empty value (`limitations:` with nothing after it) has no resolution under the YAML 1.2 JSON schema, because the empty scalar is not a JSON token. Treated as the empty string. |
| 22 | ERF-65 | CHOICE. Honoured the producer SHOULD to quote timestamps. Consequence: this writer quotes timestamps that the specification's own examples leave bare, so the spec's examples are not this producer's output. |
| 23 | ERF-66 | RE-READ. Duplicate keys must be caught *in the parser* — by the time YAML is a mapping the duplicate is already gone. Same for anchors, aliases and tags: all four needed a subclassed loader. A validator built on a document object model cannot check ERF-66 at all. |
| 24 | ERF-7 | GUESS. "citation_text MUST NOT contain a URL" has no definition of URL. Used a crude scheme test (`*://*` and `*www.*`). A bare `archive.org/x` passes. |
| 25 | ERF-55 | GUESS. Does "empty lists MUST be omitted" reach *nested* lists, e.g. `evidence_at_stance.atoms_for`? Guessed yes, on the strength of ERF-56's reasoning ("a file should not spend a line saying nothing"). |
| 26 | ERF-54, ERF-53 | FRICTION. "No meaning lives in a path" and yet the interchange form is one record per *file*. To write a record back out, the store must remember a filename. `record_file` holds data the format declares meaningless and the round trip cannot proceed without. See Q12. |
| 27 | ERF-54 | GUESS. A record whose `corpus` field disagrees with the directory it was found in: reported it and believed the record, because ERF-54 says the record self-describes. Nothing states this. |
| 28 | ERF-27 | FINDING. SQLite's TEXT affinity silently stringifies an integer even in a STRICT table, so the column type does *not* hold ERF-27's "as text". A producer writing `hits_reported: 12` loads without complaint and comes back out as `"12"` — a silent type repair that the round trip records as loss. |
| 29 | ERF-53 | UNSETTLED. An atom carrying a body has nowhere to go: the schema has no column, so the bytes are discarded. Whether that counts as a round-trip "loss" under ERF-53 depends on whether the input was a record at all, which the format does not say. |

## The lists, and what absence means

| # | Req | Entry |
|--:|:--|:--|
| 30 | ERF-20, ERF-55 | FINDING → new column. `evidence_at_stance` present with two empty lists and `evidence_at_stance` absent are the same bytes after ERF-55, and different facts under ERF-20 (stamped-and-faced-nothing vs never-stamped). Added `claim_standing.evidence_stamped`, a column with no field behind it. See Q14. |
| 31 | ERF-56 | RE-READ. The data model types the list fields as required and the serialization omits them. Reading ERF-56 is what settled that an omitted list and an empty list are the same *record* — which turned out to be the only equivalence statement in the whole document, and it covers lists only. |
| 32 | ERF-23 | UNSETTLED. Nothing forbids one atom appearing in both `atoms_for` and `atoms_against` of one claim. Left legal; a quote that cuts both ways is imaginable. |
| 33 | ERF-44 | INVENTED. A `UNIQUE` on `(claim, to, relation)`. The format forbids duplicate identical edges nowhere; two identical edges say nothing twice. |
| 34 | ERF-35 | GUESS, stricter than the text. `atoms_for` is typed `AtomId[]` but ERF-35 says only that references "name existing records". Pointed the foreign key at `atom`, not `record`, which forbids a corpus that ERF-35 as written permits. See Q2. |
| 35 | ERF-35 | GUESS, stricter again. `notable_results[].atoms` is *not* in ERF-35's enumerated list of references that must resolve. Made it a foreign key anyway. |

## Enforcement

| # | Req | Entry |
|--:|:--|:--|
| 36 | ERF-43 | COST. Acyclicity needs a recursive CTE inside an `AFTER INSERT` trigger — a graph walk per inserted edge. It is the only rule in the format that constrains the transitive closure of a table rather than a row or a pair of rows. |
| 37 | ERF-2 | CORRECTED MID-BUILD. First draft froze `citation_text` along with the fetch fields; it over-enforced and masked the ERF-7 CHECK. Narrowed to `fetched_url`/`fetched_digest`. |
| 38 | ERF-2 | CANNOT. Nothing in `Source` says whether a source is a *received file*. The only signal is an absent `fetched`, and ERF-7's "a received file has no retrieval locator" makes the inference circular: a fetched source whose author omitted the url is indistinguishable from a received one. Half of ERF-2 is unenforceable. |
| 39 | ERF-63, ERF-40 | DIVERGENCE. ERF-40 says append-only is "verified against the substrate's history" and ERF-63 says a substrate must keep "an edit history sufficient to verify ERF-40". This schema does something *different and stronger*: it forbids the edit instead of recording it. A conforming git substrate can hold a violating commit and report it; this one cannot hold it. |
| 40 | ERF-62 | CANNOT. "A corpus MUST have exactly one authoritative home... every database built over it is a projection." A database cannot know from the inside whether it is the home or the projection. Left unrepresented. |
| 41 | ERF-51 | NOT IMPLEMENTED. The normalization sequence is declared normative-by-conformance-case (`conformance/cases/normalization.txt`), and those files are outside this trial's working directory. Implementing it from the prose alone would be implementing a different thing, so the mechanical quote check stays out of the schema. |
| 42 | ERF-1, ERF-50 | SCOPE. Captures are not loaded into the database. ERF-11 forbids storing the mechanical check's result, so there is nothing for the schema to hold; the check runs outside it. |
| 43 | — | PORTABILITY. SQLite resolves functions named in a CHECK constraint at `CREATE TABLE` time, so a schema depending on application-defined helpers cannot be opened by anyone who has not registered them. Rewrote every predicate inline. The cost is that ERF-47's precision comparison is now duplicated verbatim at three sites. |

## Narratives

| # | Req | Entry |
|--:|:--|:--|
| 44 | ERF-34 | FRICTION. A narrative "MUST NOT be modelled as a record" and has "no interface in the data model", yet it lives in a corpus, refers to claims, and is checkable. It needed tables. It has no id, so the only thing that can key one is its path — the thing ERF-54 says carries no meaning. |
| 45 | ERF-31 vs ERF-32 | CONTRADICTION. ERF-31's grammar makes `bound-at` optional (`[ws+ "bound-at=" date]`). ERF-32 says "A narrative binding MUST record `bound-at`" and then specifies how to report one that lacks it. The grammar permits what the requirement forbids, and the requirement then handles the case it forbade. |
| 46 | ERF-33 | DELIBERATE OMISSION. Left `narrative_binding.claim_id` without a foreign key. A foreign key would make an unresolved binding unstorable, and an unstorable defect is a dropped one — the exact failure ERF-33 forbids. See Q1 in relational-questions. |

## Judgment calls the format leaves open

| # | Req | Entry |
|--:|:--|:--|
| 47 | ERF-25 | HEURISTIC. "A claim of the form 'no shipped tool does X'" has no machine test. The advisory view pattern-matches titles beginning "no", which is a guess dressed as a check. |
| 48 | ERF-68 | READING. A `shipped` source that names no licence is a SHOULD violation, so the loader emits advice rather than a violation. |
| 49 | ERF-72 | UNSETTLED. An `x_` field on a record whose *type* is unknown: is it an extension field (ERF-72) or part of an opaque record (ERF-57)? Both apply and neither yields. Treated as opaque. |
| 50 | — | DELETION. The specification never describes deleting a record, a corpus, or a source. Every `ON DELETE` clause in the schema is therefore invented; chose `RESTRICT` wherever a deletion would silently unmake something else's evidence, `CASCADE` only from a record to its own parts. See Q6. |
