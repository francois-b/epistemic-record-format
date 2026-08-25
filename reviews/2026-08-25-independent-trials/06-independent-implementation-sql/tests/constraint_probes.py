#!/usr/bin/env python3
"""
constraint_probes.py -- what the schema actually enforces, and what it lets
through.

Each probe issues one statement against a database holding the canonical
corpus, inside a savepoint that is always rolled back, and records whether the
store refused it. Probes marked REFUSE are requirements the schema holds;
probes marked ALLOW are requirements it structurally cannot hold, kept as
negative controls so the gap is measured rather than asserted.

  usage: python3 tests/constraint_probes.py [--db out/probe.db]
"""

import argparse
import os
import sqlite3
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

STAMP = ("UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', "
         "last_modified_by='human:trial-operator' WHERE id='%s'")

# (requirement, expectation, label, sql|[sql, ...], params)
PROBES = [
    # ---- transition constraints: only a trigger can hold these -------------
    ("ERF-19", "REFUSE", "edit an existing standing entry",
     "UPDATE claim_standing SET why='rewritten' "
     "WHERE claim_id='constraints-cannot-see-transitions'", ()),
    ("ERF-19", "REFUSE", "delete an existing standing entry",
     "DELETE FROM claim_standing WHERE claim_id='constraints-cannot-see-transitions'", ()),
    ("ERF-20", "REFUSE", "edit the evidence stamped on a standing",
     "UPDATE standing_evidence SET atom_id='rt-006' WHERE claim_id='constraints-cannot-see-transitions'", ()),
    ("ERF-40", "REFUSE", "edit a finding_audit verdict",
     "UPDATE atom_finding_audit SET verdict='UNSUPPORTED' WHERE atom_id='rt-001'", ()),
    ("ERF-40", "REFUSE", "edit an evidence_audit verdict",
     "UPDATE claim_evidence_audit SET verdict='UNSUPPORTED' "
     "WHERE claim_id='constraints-cannot-see-transitions'", ()),
    ("ERF-28", "REFUSE", "change what a survey searched",
     "UPDATE survey_search SET hits_reported='99' "
     "WHERE survey_id='round-trip-equivalence-2026-08-24'", ()),
    ("ERF-28", "REFUSE", "delete a search act",
     "DELETE FROM survey_search WHERE survey_id='round-trip-equivalence-2026-08-24'", ()),
    ("ERF-2", "REFUSE", "overwrite a source's retrieved artifact",
     "UPDATE corpus_source SET fetched_url='https://example.invalid/v2' "
     "WHERE id='fixture-constraint-kinds'", ()),
    ("ERF-13", "REFUSE", "rename a record id",
     "UPDATE record SET id='rt-099' WHERE id='rt-001'", ()),
    ("ERF-48", "REFUSE", "stamp last_modified earlier than the prior stamp",
     "UPDATE record SET last_modified_timestamp='2026-08-21T00:00:00Z' WHERE id='rt-003'", ()),
    ("ERF-48", "REFUSE", "stamp last_modified earlier than created",
     "UPDATE record SET last_modified_timestamp='2026-07-01T00:00:00Z', "
     "last_modified_by='human:trial-operator' WHERE id='rt-001'", ()),
    ("ERF-48", "REFUSE", "edit a never-edited claim without stamping",
     "UPDATE claim SET body='rewritten' WHERE id='losslessness-needs-an-equivalence'", ()),

    # ---- state constraints: CHECK and key -------------------------------
    ("ERF-36", "REFUSE", "reuse a record id under a different type",
     "INSERT INTO record(deployment_id,id,type,corpus_id,created_timestamp,"
     "created_by,is_known) VALUES('probe','rt-001','claim','relational-trial',"
     "'2026-08-25','human:x',1)", ()),
    ("ERF-35", "REFUSE", "cite an atom that does not exist",
     "INSERT INTO claim_atom(deployment_id,claim_id,side,pos,atom_id) "
     "VALUES('probe','constraints-cannot-see-transitions','for',9,'rt-999')", ()),
    ("ERF-35", "REFUSE", "name a survey that does not exist",
     "INSERT INTO claim_survey(deployment_id,claim_id,pos,survey_id) "
     "VALUES('probe','constraints-cannot-see-transitions',9,'no-such-survey')", ()),
    ("ERF-4", "REFUSE", "name a source absent from the corpus source list",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='rt-001'", "UPDATE atom SET source_id='not-in-the-list' WHERE id='rt-001'"], ()),
    ("ERF-43", "REFUSE", "store a self-edge",
     "INSERT INTO claim_edge(deployment_id,claim_id,pos,to_claim_id,relation) "
     "VALUES('probe','append-only-needs-triggers',9,'append-only-needs-triggers','assumes')", ()),
    ("ERF-43", "REFUSE", "close an assumes cycle",
     "INSERT INTO claim_edge(deployment_id,claim_id,pos,to_claim_id,relation) "
     "VALUES('probe','constraints-cannot-see-transitions',9,"
     "'keys-swallow-the-violations-they-enforce','assumes')", ()),
    ("ERF-44", "REFUSE", "store the reciprocal of a conflicts-with edge",
     "INSERT INTO claim_edge(deployment_id,claim_id,pos,to_claim_id,relation) "
     "VALUES('probe','append-only-needs-triggers',9,"
     "'keys-swallow-the-violations-they-enforce','conflicts-with')", ()),
    ("ERF-21", "REFUSE", "record a stance taken by a machine",
     "INSERT INTO claim_standing(deployment_id,claim_id,pos,timestamp,stance,by,why)"
     " VALUES('probe','constraints-cannot-see-transitions',9,"
     "'2026-08-25T10:00:00Z','for','agent/claude-fable-5','because')", ()),
    ("ERF-39", "REFUSE", "record a stance with no reason",
     "INSERT INTO claim_standing(deployment_id,claim_id,pos,timestamp,stance,by,why)"
     " VALUES('probe','constraints-cannot-see-transitions',9,"
     "'2026-08-25T10:00:00Z','for','human:x','   ')", ()),
    ("ERF-19", "REFUSE", "record a stance timestamped with a bare date",
     "INSERT INTO claim_standing(deployment_id,claim_id,pos,timestamp,stance,by,why)"
     " VALUES('probe','constraints-cannot-see-transitions',9,'2026-08-25','for',"
     "'human:x','because')", ()),
    ("ERF-19", "REFUSE", "record a stance instant with no offset",
     "INSERT INTO claim_standing(deployment_id,claim_id,pos,timestamp,stance,by,why)"
     " VALUES('probe','constraints-cannot-see-transitions',9,'2026-08-25T10:00:00',"
     "'for','human:x','because')", ()),
    ("ERF-12", "REFUSE", "write a failed audit as a verdict",
     "INSERT INTO atom_finding_audit(deployment_id,atom_id,pos,auditor,verdict,"
     "timestamp,protocol) VALUES('probe','rt-001',9,'a','FAILED','2026-08-25','p')", ()),
    ("ERF-12", "REFUSE", "write an audit entry with no protocol",
     "INSERT INTO atom_finding_audit(deployment_id,atom_id,pos,auditor,verdict,"
     "timestamp,protocol) VALUES('probe','rt-001',9,'a','SUPPORTED','2026-08-25','')", ()),
    ("ERF-9", "REFUSE", "grade a source outside the closed vocabulary",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='rt-001'", "UPDATE atom SET source_quality='unknown' WHERE id='rt-001'"], ()),
    ("ERF-24", "REFUSE", "use an epistemic kind outside the closed vocabulary",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='constraints-cannot-see-transitions'", "UPDATE claim SET epistemic_kind='hunch' WHERE id='constraints-cannot-see-transitions'"], ()),
    ("ERF-5", "REFUSE", "record an absence with no reason",
     "UPDATE corpus_source SET status='licence-unverified', path=NULL, reason=NULL "
     "WHERE id='fixture-interchange-notes'", ()),
    ("ERF-7", "REFUSE", "put a URL in citation_text",
     "UPDATE corpus_source SET citation_text='See https://example.invalid/x' "
     "WHERE id='fixture-interchange-notes'", ()),
    ("ERF-27", "ALLOW", "state a yield as a number rather than as text",
     "INSERT INTO survey_search(deployment_id,survey_id,pos,tool,query,"
     "hits_reported) VALUES('probe','lossless-language-2026-08-22',9,'grep','x',0)", ()),
    ("ERF-52", "REFUSE", "store a quote that is nothing but an elision marker",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='rt-001'", "UPDATE atom SET quote='[...]' WHERE id='rt-001'"], ()),
    ("ERF-31", "REFUSE", "store a narrative binding with an empty anchor",
     "INSERT INTO narrative_binding(deployment_id,corpus_id,path,pos,claim_id,"
     "anchor,bound_at) VALUES('probe','relational-trial','narratives/trial-note.md',"
     "9,'x','',NULL)", ()),

    # ---- negative controls: what the schema CANNOT hold ------------------
    ("ERF-26", "ALLOW", "name a category instead of a concrete instrument",
     "INSERT INTO survey_search(deployment_id,survey_id,pos,tool,query,"
     "hits_reported) VALUES('probe','lossless-language-2026-08-22',9,"
     "'web search','constraints','several')", ()),
    ("ERF-6", "ALLOW", "store a quote that occurs in no capture",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='rt-001'", "UPDATE atom SET quote='a sentence that appears in no capture at all' WHERE id='rt-001'"], ()),
    ("ERF-10", "ALLOW", "grade an anonymous forum comment as high",
     ["UPDATE record SET last_modified_timestamp='2026-08-25T12:00:00Z', last_modified_by='human:trial-operator' WHERE id='rt-008'", "UPDATE atom SET source_quality='high' WHERE id='rt-008'"], ()),
    ("ERF-8", "ALLOW", "leave citation_text unrendered from its citation block",
     "UPDATE corpus_source SET citation_text='Something else entirely' "
     "WHERE id='fixture-constraint-kinds'", ()),
    ("ERF-18", "ALLOW", "write a body that does not restate the title",
     [STAMP % 'mixed-precision-is-unorderable',
      "UPDATE claim SET body='unrelated prose' WHERE id='mixed-precision-is-unorderable'"], ()),
    ("ERF-23", "ALLOW", "put one atom on both sides of one claim",
     "INSERT INTO claim_atom(deployment_id,claim_id,side,pos,atom_id) "
     "VALUES('probe','constraints-cannot-see-transitions','against',9,'rt-001')", ()),
    ("ERF-48", "ALLOW", "edit an already-edited claim without re-stamping",
     "UPDATE atom SET finding='rewritten again' WHERE id='rt-003'", ()),
    ("ERF-44", "ALLOW", "store supports in both directions of a pair",
     "INSERT INTO claim_edge(deployment_id,claim_id,pos,to_claim_id,relation) "
     "VALUES('probe','append-only-needs-triggers',9,"
     "'constraints-cannot-see-transitions','supports')", ()),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.join(ROOT, "out", "probe.db"))
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.db), exist_ok=True)
    for suffix in ("", "-wal", "-shm"):
        if os.path.exists(args.db + suffix):
            os.remove(args.db + suffix)
    rc = subprocess.run(
        [sys.executable, os.path.join(ROOT, "erf_load.py"), "--db", args.db,
         "--deployment", "probe", "--schema", os.path.join(ROOT, "schema.sql"),
         os.path.join(ROOT, "tests", "corpus-canonical", "relational-trial")],
        capture_output=True, text=True, cwd=ROOT)
    if rc.returncode != 0:
        sys.stderr.write(rc.stdout + rc.stderr)
        raise SystemExit(rc.returncode)

    con = sqlite3.connect(args.db)
    con.execute("PRAGMA foreign_keys = ON")

    print("%-8s %-8s %-52s %s" % ("REQ", "EXPECT", "PROBE", "RESULT"))
    print("-" * 100)
    failures = 0
    for req, expect, label, sql, params in PROBES:
        con.execute("SAVEPOINT p")
        refused, err = False, ""
        try:
            for stmt in ([sql] if isinstance(sql, str) else sql):
                con.execute(stmt, params)
            # FK violations surface at the end of the statement only with
            # immediate FKs; force the check.
            con.execute("PRAGMA foreign_key_check")
            bad = con.execute("PRAGMA foreign_key_check").fetchall()
            if bad:
                refused, err = True, "foreign key violation"
        except sqlite3.Error as exc:
            refused, err = True, str(exc)
        con.execute("ROLLBACK TO p")
        con.execute("RELEASE p")
        got = "REFUSE" if refused else "ALLOW"
        ok = (got == expect)
        failures += 0 if ok else 1
        print("%-8s %-8s %-52s %-7s %s%s" % (
            req, expect, label[:52], got, "ok" if ok else "MISMATCH",
            ("  <- " + err.split("\n")[0][:60]) if refused and ok and expect == "REFUSE" else ""))
    print("-" * 100)

    # [ERF-22][ERF-11][ERF-20] three MUST NOTs a schema satisfies by having no
    # column. Asserted structurally rather than probed.
    print()
    print("STRUCTURAL ASSERTIONS (a MUST NOT expressed as an absent column)")
    for table, forbidden, req in (
            ("claim", {"disposition", "state", "status"}, "ERF-22"),
            ("atom", {"quote_check", "quote_ok", "mechanical_check"}, "ERF-11"),
            ("standing_evidence", {"drift", "count", "atom_count"}, "ERF-20")):
        cols = {r[1] for r in con.execute("PRAGMA table_info(%s)" % table)}
        clash = cols & forbidden
        print("  %-8s %-18s %s" % (req, table,
              "no such column" if not clash else "PRESENT: %s" % clash))
        failures += 1 if clash else 0

    print()
    print("%d probes, %d mismatches" % (len(PROBES), failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
