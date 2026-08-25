# ERF as a relational schema, and a test of ERF-53's round-trip clause

An independent implementation trial. The Epistemic Record Format (`SPEC.md`,
v0.9 draft) is expressed as a SQLite schema, and the clause in ERF-53 that
permits a store to hold records as "rows in a database, provided every record
round-trips through the interchange form without loss" is tested end to end.

Built from `SPEC.md` alone, in one session, 2026-08-25. No reference
implementation, conformance fixture or example corpus was consulted; all
corpus content under `tests/` is fixture material constructed for this trial
and describes nothing outside it.

## What is here

| File | What it is |
|:--|:--|
| `schema.sql` | The schema. 27 tables, 22 triggers, 14 views, commented with the requirement each constraint serves. |
| `erf_yaml.py` | A YAML 1.2 JSON-schema reader (ERF-65) that also refuses duplicate keys, anchors, aliases and tags (ERF-66), plus a canonical emitter. Stock PyYAML satisfies neither requirement. |
| `erf_load.py` | Corpus directory → database. Reports every diagnostic it raises. |
| `erf_dump.py` | Database → corpus directory. Reads columns only; never reads the input. |
| `erf_roundtrip.py` | The harness. Loads, dumps, and classifies every file as E1/E2/E3/LOSS. |
| `validator-report.sql` | Everything the format says MUST be computed and never stored. |
| `tests/constraint_probes.py` | 40 probes measuring which requirements the schema actually enforces and which it structurally cannot. |
| `tests/negative_cases.py` | Four corpora a validator must reject, showing *where* each violation is caught (key, foreign key, or parser) and what that costs. |
| `round-trip-report.md` | **The result.** What survived, what did not, and whether the spec permits it. |
| `relational-questions.md` | **The distinctive output.** Every question the schema forced that the prose does not answer. |
| `friction-log.md` | Every guess, re-read and unsettled choice, with its requirement id. |

## Requirements

Python 3 with PyYAML, and SQLite 3.37 or later (the schema uses `STRICT`
tables). Verified on Python 3.14, PyYAML 6.0.3, SQLite 3.43.2.

The schema is self-contained: it defines no application functions, so
`sqlite3 db.sqlite < schema.sql` works from a bare shell. (SQLite resolves
functions named in a `CHECK` constraint at `CREATE TABLE` time, so a schema
that depends on registered helpers cannot be opened by anyone else.)

## Reproducing the round trip

Everything, from a clean tree:

```sh
./run-trial.sh
```

That writes `out/` and prints the three verdicts. To run the pieces
separately:

```sh
# 1. build the schema on its own
sqlite3 out/erf.db < schema.sql

# 2. load a corpus
python3 erf_load.py --db out/erf.db --deployment trial \
        tests/corpus-canonical/relational-trial

# 3. regenerate the interchange form from columns alone
python3 erf_dump.py --db out/erf.db --deployment trial --out out/regen

# 4. compare
diff -ru -x captures tests/corpus-canonical/relational-trial \
        out/regen/relational-trial

# or all four steps with the classification:
python3 erf_roundtrip.py tests/corpus-canonical/relational-trial
python3 erf_roundtrip.py tests/corpus-authored/relational-trial
python3 erf_roundtrip.py tests/corpus-hostile/relational-hostile
```

The three corpora must be run in **separate** deployments: the canonical and
authored corpora are the same corpus in two serialization styles and share
their record ids, so loading both into one deployment is an ERF-36 violation
and the loader correctly refuses it.

Then the two supporting suites:

```sh
python3 tests/constraint_probes.py            # 40 probes, expect 0 mismatches
python3 tests/negative_cases.py               # 4 rejections, expect 0 mismatches
sqlite3 out/canonical.db < validator-report.sql
```

## The corpus directory layout (invented)

The specification fixes no filenames, so this is a guess (friction-log #1):

```
<corpus-dir>/
  corpus.yaml           the declaration            ERF-59
  sources.yaml          the source list            ERF-3
  records/**/*.md       one record per file        ERF-53
  narratives/**/*.md    documents, not records     ERF-34
  captures/**           captures                   ERF-1  (not loaded)
```

Nothing reads a path for meaning: a record's identity and corpus come from its
own frontmatter (ERF-54). The path is stored in `record_file` only so the
writer can put the file back.

## The three corpora

- **`tests/corpus-authored/relational-trial`** — hand-written in the style of
  the specification's own examples. The realistic input.
- **`tests/corpus-canonical/relational-trial`** — the same corpus after one
  pass through the writer. The byte-identity fixed point.
- **`tests/negative/*`** — four one-violation corpora for the negative suite.
- **`tests/corpus-hostile/relational-hostile`** — nine legal-but-awkward
  constructs: scrambled key order, wrapped and folded and block and
  single-quoted scalars, four-space sequences, a comment, an explicit empty
  list, an undefined non-extension key, a nested `x_` extension, an unknown
  record type, an atom carrying a body, an empty evidence stamp, a
  non-`Z` offset, and an unquoted numeric yield.

Between them they exercise every field in the data model, all five source
statuses, all three source qualities, all three verdicts, all four relations,
all four epistemic kinds, and all five computed dispositions.

## The shape of the schema, in brief

```
deployment                        invented; ERF-35/36/37/38 scope to it and
  └── corpus                      the format gives it no identity
        ├── corpus_source         PK (deployment, corpus, id) -- corpus-scoped
        ├── narrative             not a record (ERF-34); keyed by path
        │     └── narrative_binding    claim_id has NO foreign key (ERF-33)
        └── record                PK (deployment, id) -- ERF-36, type-blind
              ├── atom            + finding_audit
              ├── claim           + families, atoms(for/against), surveys,
              │                     edges, standings(+evidence), evidence_audit
              ├── survey          + searches, notable_results(+atoms)
              └── opaque_record_body     unknown types (ERF-57)
        record_extra_field / source_extra_field / corpus_extra_field
                                  the tolerance sidecar (ERF-55/57/72)
        record_file               the filename ERF-54 says means nothing
```

No `disposition` column (ERF-22), no stored quote-check result (ERF-11), no
drift or counts on an evidence stamp (ERF-20). Those three MUST NOTs are
satisfied by columns that do not exist, and asserted structurally by the probe
suite.

## Reading order for a reviewer

1. `round-trip-report.md` — the result and the diff evidence.
2. `relational-questions.md` — the fifteen questions and the CANNOT table.
3. `schema.sql` — the schema itself; section 11 lists what it cannot express.
4. `friction-log.md` — fifty dated entries, if you want the working.
