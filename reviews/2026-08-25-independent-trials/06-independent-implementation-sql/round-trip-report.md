# Round-trip report

Testing the clause in ERF-53 that has never been checked:

> A store MAY hold records any other way it likes, body as one more field,
> many records in one collection document, **rows in a database, provided
> every record round-trips through the interchange form without loss**.

Method: load a corpus directory into the relational schema of `schema.sql`,
then regenerate the interchange form from columns alone, then compare. The
writer never reads the input files and the database holds no copy of them.

## The finding that governs everything else

**The specification never defines "without loss", so the clause is not
checkable as written.** Three equivalences are defensible from the document
and they give three different verdicts on the same corpus:

| | Equivalence | Where the document supports it |
|:--|:--|:--|
| **E1** | the regenerated file is byte-for-byte the input | ERF-67 (UTF-8, LF, no BOM) is about bytes; ERF-6 and ERF-51 make verbatim text the format's central concern |
| **E2** | the parsed frontmatter mapping and the body are equal | ERF-53 calls the file "YAML frontmatter plus markdown body", and YAML defines what a document means |
| **E3** | E2 after ERF-56, under which an omitted list *is* the empty list | ERF-55 + ERF-56 together, the only place the document says two different files carry the same record |

E3 is the only equivalence the specification arguably defines, and it defines
it for list-typed fields and nothing else.

## Verdict

| Corpus | Files | E1 | E2 | E3 | LOSS |
|:--|--:|--:|--:|--:|--:|
| `tests/corpus-canonical/relational-trial` | 20 | **20** | 0 | 0 | 0 |
| `tests/corpus-authored/relational-trial` | 20 | 0 | **20** | 0 | 0 |
| `tests/corpus-hostile/relational-hostile` | 8 | 0 | 4 | 2 | **2** |

Read plainly:

1. **Under E3, and under E2 for conforming input, the clause holds.** Every
   record in a conforming corpus survived the database and came back out
   saying the same thing, including standings ledgers, nested audit entries,
   claim graphs, an unknown record type, an `x_` extension field and a
   narrative binding pointing at a claim that does not exist.
2. **Under E1 the clause is false**, except at one fixed point. Only a corpus
   already written in this writer's exact style comes back byte-identical.
   The corpus written in the style of the specification's own examples did
   not: all 20 files differ, 58 lines rewritten.
3. **Two records were genuinely lost**, both in the hostile corpus, and the
   specification permits one of them and is silent about the other.

The clause is therefore true in the sense its author almost certainly meant
and false in the sense a reader could reasonably take, and nothing in the
document chooses between them.

## Evidence

Reproduce with the commands in `README.md`. The diffs quoted below are in
`out/authored.diff` and `out/hostile.diff` after a run.

### E1 holds only at the writer's fixed point

```
$ diff -ru -x captures tests/corpus-canonical/relational-trial \
        out/canonical-regen/relational-trial
$ echo $?
0
```

Zero bytes of difference across 20 files. This is a real result but a narrow
one: `tests/corpus-canonical/` **was produced by this writer** from
`tests/corpus-authored/`. It proves the writer is idempotent, not that
conforming files round-trip.

### E1 fails on a corpus written in the specification's own style

`tests/corpus-authored/` is hand-written, following the style of the examples
in sections 4.1, 4.2 and 4.5. All 20 files differ; 58 lines are rewritten, and
every one of them is a scalar style change and nothing else:

```diff
--- tests/corpus-authored/relational-trial/records/atoms/rt-006.md
+++ out/authored-regen/relational-trial/records/atoms/rt-006.md
-finding: "The ordering-note fixture states that a day-precision timestamp and an instant-precision timestamp on the same day cannot be ordered against one another."
+finding: The ordering-note fixture states that a day-precision timestamp and an instant-precision timestamp on the same day cannot be ordered against one another.
-created: {timestamp: "2026-07-30", by: "agent/claude-fable-5"}
+created: {timestamp: "2026-07-30", by: agent/claude-fable-5}
```

A mechanical classification of all 58 rewritten lines found **zero**
differences that survive stripping quotation marks. Nothing was lost;
everything was restyled.

### Where the bytes go, and whether the format permits it

| # | What changed | Permitted? |
|--:|:--|:--|
| 1 | **Quoting style.** Plain, single-quoted and double-quoted scalars all become one canonical choice. | Yes. The format fixes no scalar style. ERF-65 constrains what a plain scalar *resolves to*, never how a string is written. |
| 2 | **Key order.** Frontmatter comes back in data-model declaration order; extension and unknown keys move to the end. | Yes, and this is a gap: nothing in the format states a key order, so two conforming producers writing the same record produce different files by default. |
| 3 | **Line folding.** A double-quoted scalar wrapped across lines, and a `>-` folded scalar, come back on one line. | Yes. Both fold to the same string; the format fixes no line width. Note that the specification's own examples wrap. |
| 4 | **Block scalars.** `limitations: \|` with two lines comes back as `"…\n…\n"` with escapes. | Yes, same string. The writer cannot emit block scalars because a canonical emitter that never folds has no block form. |
| 5 | **Flow versus block collections.** Flow-style search acts come back as block mappings; a block-style audit list comes back as one-line flow mappings. | Yes. No rule. |
| 6 | **Indentation.** A 4-space block sequence comes back at 2. | Yes. No rule. |
| 7 | **Comments.** A comment in `corpus.yaml` is gone. | Silently. Comments are not data, so no data model can hold them, and the format never mentions them. Under E2 the file compares *equal*, which is how a comment disappears without any check noticing. |
| 8 | **Empty lists.** `finding_audit: []` and `families: []` are omitted on output. | Yes — required. ERF-55 says an empty list MUST be omitted, so the store silently **corrects** a producer violation. Reported by the loader as an ERF-55 violation, then repaired without a trace in the output. |
| 9 | **An empty evidence stamp.** `evidence_at_stance: {atoms_for: [], atoms_against: []}` comes back as `evidence_at_stance: {}`. | Yes, and only because the schema carries an invented column. See "the fact the interchange form cannot carry" below. |

### The two genuine losses

**Loss 1 — an atom's body is destroyed.** `tests/corpus-hostile/.../h-003.md`:

```diff
-created: {timestamp: 2026-08-24, by: "agent/claude-fable-5"}
+created: {timestamp: "2026-08-24", by: agent/claude-fable-5}
 ---
-This paragraph is a body on an atom. ERF-53 says an atom's file is frontmatter
-and nothing else, so a conforming store has nowhere to put these bytes.
```

151 bytes in, 0 bytes out.

*Does the specification permit it?* **Yes, by construction.** Section 4.2 and
ERF-53 both say an atom's body is empty, so the `atom` table has no `body`
column — the emptiness is structural, not a check. The input was not a
conforming record.

*But it is worth noticing how the loss happens.* ERF-57 requires a consumer to
preserve unknown *fields* and unknown *record types* as opaque data. A body on
a record type that has no body is neither, so nothing requires it to be kept
and nothing requires it to be reported. This loader reports it
(`ERF-53 violation: an atom has no body; 151 bytes discarded`) as a matter of
taste, not of conformance. A store that dropped it silently would be equally
conforming, and the format's own "never lose data in transit" principle
(section 1) would not catch it.

**Loss 2 — a number becomes a string.**
`tests/corpus-hostile/.../h-survey.md`:

```diff
-  - {tool: "grep -c (BSD grep, macOS 15)", query: "case 9: …", hits_reported: 12}
+  - tool: "grep -c (BSD grep, macOS 15)"
+    query: "case 9: …"
+    hits_reported: "12"
```

Under ERF-65 the unquoted `12` resolves to an integer. `SearchAct.hits_reported`
is typed `string`, and ERF-27 says the yield is recorded "as text". So the
input was a violation of both — and the store **repaired it silently**.

The mechanism is worth recording for anyone building on SQLite: TEXT affinity
converts an integer to text even in a `STRICT` table, so the column type does
*not* hold ERF-27's "as text" requirement. The value goes in as `12`, comes
back as `'12'`, and nothing anywhere reports the change.

*Does the specification permit it?* **It is silent.** ERF-57 governs unknown
content; ERF-60 forbids silently dropping unrecognized content across a
version mismatch. A *known* field carrying a value of the wrong type is
covered by neither. The format has no rule for what a store does with a
type violation, and "repair it quietly" is the default behaviour of at least
one obvious substrate.

### The fact the interchange form cannot carry

ERF-20 makes `evidence_at_stance` a producer SHOULD, so its *absence* means
"this ruling was not stamped". ERF-55 requires an empty list to be omitted.
Therefore a ruling that was stamped and faced no evidence serializes to
exactly the same bytes as a ruling that was never stamped.

To round-trip that distinction the schema needed
`claim_standing.evidence_stamped` — a column with no field behind it. Without
it the writer would either invent a stamp on every unstamped ruling or erase
every empty one. **The interchange form cannot express a fact the data model
distinguishes**, which is the sharpest thing the round trip turned up about
the format itself rather than about serialization.

## What a database needed in order to pass at all

Three structures that are not in the data model, without which the answer to
ERF-53 is no:

1. **An opaque sidecar** (`record_extra_field`, `opaque_record_body`). ERF-57
   requires a consumer to preserve unknown fields and unknown record types.
   A normalized schema has no column for them, so it needs an
   entity-attribute-value table. Demonstrated by `h-unknown-type.md` (a
   `hypothesis` record with a `statement` and a `confidence`) and by
   `provenance_note` and `x_trial` on `h-002.md`, all of which survive.
2. **A filename table** (`record_file`). ERF-54 says no meaning lives in a
   path; ERF-53 requires the round trip to produce files. Something has to
   remember which file.
3. **A presence flag** (`claim_standing.evidence_stamped`), for the reason
   just given.

An artifact worth noting: for an unknown record type, `created` is stored
*twice* — once in `record.created_timestamp`, because ERF-58 makes `timestamp`
the event-time key everywhere, and once in the opaque sidecar, because the
schema does not know that a `hypothesis` has a `created` field. It comes back
correctly, from the sidecar.

## What was not tested

- **Captures** are excluded from the comparison. They are files a corpus
  carries, not records, and ERF-53's clause is about records.
- **The mechanical quote check** (ERF-50, ERF-51) is not implemented. Its
  exact behaviour is normative by conformance case file, and those files were
  outside this trial's working directory.
- **Concurrent writers.** The note under ERF-52 acknowledges two writers can
  mint the same id; a single-connection loader cannot exercise it.
- **A corpus at a different `spec_version`** (ERF-60, ERF-61).

## Recommendation

State the equivalence. One sentence in ERF-53 would make the clause testable,
for example: *two files carry the same record when their frontmatter parses to
equal mappings after ERF-56 is applied and their bodies are byte-equal;
serialization style, key order and line width are not part of a record.*

Then add the two things that sentence would expose: a rule for a known field
carrying a wrong-typed value, and a resolution of the ERF-20 / ERF-55 conflict
so that a stamped-but-empty evidence set is expressible.
