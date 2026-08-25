#!/usr/bin/env python3
"""
erf_load.py -- read an ERF corpus directory into the relational schema.

  usage: erf_load.py --db out/erf.db --deployment <id> <corpus-dir> [...]

INVENTED corpus directory layout. The specification says a corpus "travels as
a directory or archive of its records and captures, and the declaration
travels with it" [ERF-59] and that "no meaning lives in a path" [ERF-54], and
then fixes no filenames at all. This loader expects:

    <corpus-dir>/corpus.yaml        the declaration            [ERF-59]
    <corpus-dir>/sources.yaml       the source list, {sources: {...}}  [ERF-3]
    <corpus-dir>/records/**/*.md    one record per file        [ERF-53]
    <corpus-dir>/narratives/**/*.md documents, not records     [ERF-34]
    <corpus-dir>/captures/**        captures; read only by erf_check.py

Nothing below reads a path for meaning: every record's identity and corpus
come from its own frontmatter [ERF-54]. The path is stored in `record_file`
only so a writer can put the file back where it came from.
"""

import argparse
import json
import os
import sqlite3
import sys

import erf_yaml as ey

# Field order per record type, taken from the interface declaration order in
# section 3. This IS the canonical key order the writer emits; the format
# specifies none. (friction-log 2026-08-25, ERF-53)
ATOM_FIELDS = ["id", "type", "corpus", "finding", "quote", "source",
               "source_quality", "as_of_date", "limitations", "created",
               "last_modified", "finding_audit"]
CLAIM_FIELDS = ["id", "type", "corpus", "title", "epistemic_kind", "created",
                "last_modified", "short_name", "families", "atoms_for",
                "atoms_against", "surveys", "edges", "standings",
                "evidence_audit", "semantic_query"]
SURVEY_FIELDS = ["id", "type", "corpus", "title", "conducted", "searches",
                 "notable_results", "prior_survey", "last_modified"]
SOURCE_FIELDS = ["citation_text", "citation", "fetched", "status", "path",
                 "reason", "licence", "licence_name", "excerpt", "converter"]
CORPUS_FIELDS = ["id", "title", "spec_version", "classification", "owner"]

KNOWN_TYPES = {"atom": ATOM_FIELDS, "claim": CLAIM_FIELDS, "survey": SURVEY_FIELDS}

LIST_FIELDS = {"finding_audit", "families", "atoms_for", "atoms_against",
               "surveys", "edges", "standings", "evidence_audit",
               "searches", "notable_results"}


class Diagnostics:
    def __init__(self):
        self.rows = []

    def add(self, deployment, path, requirement, severity, message):
        self.rows.append((deployment, path, requirement, severity, message))

    def flush(self, con):
        con.executemany(
            "INSERT INTO load_diagnostic(deployment_id, rel_path, requirement, "
            "severity, message) VALUES (?,?,?,?,?)", self.rows)


def j(value):
    return json.dumps(value, ensure_ascii=False)


def stamp(value, where, diag, dep, path, req):
    """An ActorStamp: {timestamp, by}. [ERF-58] the event-time key is always
    `timestamp`."""
    if value is None:
        return None, None
    if not isinstance(value, dict):
        diag.add(dep, path, req, "error", "%s is not a mapping" % where)
        return None, None
    for k in value:
        if k not in ("timestamp", "by"):
            diag.add(dep, path, req, "violation",
                     "%s carries undefined key %r" % (where, k))
    return value.get("timestamp"), value.get("by")


def load_corpus(con, diag, deployment, corpus_dir):
    corpus_dir = os.path.abspath(corpus_dir)
    name = os.path.basename(corpus_dir)

    # ---- the declaration [ERF-59] ----------------------------------------
    decl_path = os.path.join(corpus_dir, "corpus.yaml")
    raw = open(decl_path, "rb").read()
    for p in ey.check_encoding(raw, "corpus.yaml"):
        diag.add(deployment, "corpus.yaml", "ERF-67", "violation", p)
    decl = ey.load_document(raw.decode("utf-8"))
    for req in ("id", "title", "spec_version"):
        if req not in decl:
            raise SystemExit("ERF-59: %s/corpus.yaml is missing %s" % (name, req))
    corpus_id = decl["id"]
    con.execute(
        "INSERT INTO corpus(deployment_id, id, title, spec_version, "
        "classification, owner) VALUES (?,?,?,?,?,?)",
        (deployment, corpus_id, decl["title"], decl["spec_version"],
         decl.get("classification"), decl.get("owner")))
    for pos, (k, v) in enumerate(decl.items()):
        if k not in CORPUS_FIELDS:
            con.execute("INSERT INTO corpus_extra_field(deployment_id, corpus_id,"
                        " pos, key, value_json) VALUES (?,?,?,?,?)",
                        (deployment, corpus_id, pos, k, j(v)))
            diag.add(deployment, "corpus.yaml",
                     "ERF-72" if k.startswith("x_") else "ERF-55",
                     "report" if k.startswith("x_") else "violation",
                     "declaration key %r is not defined by the data model" % k)

    # ---- the source list [ERF-3] -----------------------------------------
    src_path = os.path.join(corpus_dir, "sources.yaml")
    if os.path.exists(src_path):
        raw = open(src_path, "rb").read()
        for p in ey.check_encoding(raw, "sources.yaml"):
            diag.add(deployment, "sources.yaml", "ERF-67", "violation", p)
        doc = ey.load_document(raw.decode("utf-8"))
        sources = doc.get("sources", {})
        for sid, s in sources.items():
            fetched = s.get("fetched") or {}
            conv = s.get("converter") or {}
            excerpt = s.get("excerpt")
            con.execute(
                "INSERT INTO corpus_source(deployment_id, corpus_id, id, "
                "citation_text, citation_json, fetched_url, fetched_digest, "
                "status, path, reason, licence, licence_name, excerpt, "
                "converter_tool, converter_deterministic) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (deployment, corpus_id, sid, s.get("citation_text"),
                 j(s["citation"]) if "citation" in s else None,
                 fetched.get("url"), fetched.get("digest"), s.get("status"),
                 s.get("path"), s.get("reason"), s.get("licence"),
                 s.get("licence_name"),
                 None if excerpt is None else int(bool(excerpt)),
                 conv.get("tool"),
                 None if "deterministic" not in conv
                 else int(bool(conv["deterministic"]))))
            for pos, (k, v) in enumerate(s.items()):
                if k not in SOURCE_FIELDS:
                    con.execute(
                        "INSERT INTO source_extra_field(deployment_id, corpus_id,"
                        " source_id, pos, key, value_json) VALUES (?,?,?,?,?,?)",
                        (deployment, corpus_id, sid, pos, k, j(v)))
                    diag.add(deployment, "sources.yaml",
                             "ERF-72" if k.startswith("x_") else "ERF-55",
                             "report" if k.startswith("x_") else "violation",
                             "source %s: key %r is not defined by the data model"
                             % (sid, k))
            # [ERF-68] SHOULD, so a report rather than a violation.
            if s.get("status") == "shipped" and not s.get("licence") \
                    and not s.get("licence_name"):
                diag.add(deployment, "sources.yaml", "ERF-68", "advice",
                         "source %s ships a capture and names no licence" % sid)
            # [ERF-71] SHOULD, for excerpts and conversions.
            if (s.get("excerpt") or conv) and not fetched.get("digest"):
                diag.add(deployment, "sources.yaml", "ERF-71", "advice",
                         "source %s is an excerpt or a conversion and carries "
                         "no fetched.digest" % sid)

    # ---- the records [ERF-53] --------------------------------------------
    rec_root = os.path.join(corpus_dir, "records")
    files = []
    for base, _, names in os.walk(rec_root):
        for fn in sorted(names):
            if fn.endswith(".md"):
                files.append(os.path.join(base, fn))
    files.sort()

    parsed = []
    for full in files:
        rel = os.path.relpath(full, corpus_dir)
        raw = open(full, "rb").read()
        for p in ey.check_encoding(raw, rel):
            diag.add(deployment, rel, "ERF-67", "violation", p)
        text = raw.decode("utf-8")
        fm_text, body = ey.split_file(text)
        fm, order = ey.load_frontmatter(fm_text)
        parsed.append((rel, fm, order, body))

    # pass 1: the record supertype, so every subtype FK has a parent
    for rel, fm, order, body in parsed:
        rid, rtype = fm.get("id"), fm.get("type")
        if rid is None or rtype is None:
            raise SystemExit("ERF-54: %s has no id or no type" % rel)
        if fm.get("corpus") is None:
            raise SystemExit("ERF-54: %s does not name its corpus" % rel)
        if fm["corpus"] != corpus_id:
            # A record states its own corpus; a directory does not. A record
            # filed under a corpus it does not claim is an ERF-54 report, not
            # a licence to believe the path. (friction-log 2026-08-25)
            diag.add(deployment, rel, "ERF-54", "report",
                     "record names corpus %r but was found under %r"
                     % (fm["corpus"], corpus_id))
        known = rtype in KNOWN_TYPES
        if not known:
            diag.add(deployment, rel, "ERF-57", "report",
                     "unknown record type %r preserved as opaque data" % rtype)
        c_ts, c_by = stamp(fm.get("created"), "created", diag, deployment, rel, "ERF-58")
        m_ts, m_by = stamp(fm.get("last_modified"), "last_modified", diag,
                           deployment, rel, "ERF-48")
        con.execute(
            "INSERT INTO record(deployment_id, id, type, corpus_id, "
            "created_timestamp, created_by, last_modified_timestamp, "
            "last_modified_by, is_known) VALUES (?,?,?,?,?,?,?,?,?)",
            (deployment, rid, rtype, fm["corpus"], c_ts, c_by, m_ts, m_by,
             int(known)))
        con.execute("INSERT INTO record_file(deployment_id, record_id, rel_path)"
                    " VALUES (?,?,?)", (deployment, rid, rel))

        fields = KNOWN_TYPES.get(rtype, [])
        for pos, k in enumerate(order):
            if k not in fields:
                con.execute(
                    "INSERT INTO record_extra_field(deployment_id, record_id, "
                    "pos, key, value_json) VALUES (?,?,?,?,?)",
                    (deployment, rid, pos, k, j(fm[k])))
                if known:
                    diag.add(deployment, rel,
                             "ERF-72" if k.startswith("x_") else "ERF-55",
                             "report" if k.startswith("x_") else "violation",
                             "key %r is not defined for a %s" % (k, rtype))
            # [ERF-55] "Empty lists MUST be omitted: a field's absence means none."
            if k in LIST_FIELDS and isinstance(fm[k], list) and not fm[k]:
                diag.add(deployment, rel, "ERF-55", "violation",
                         "empty list %r is written out; it must be omitted" % k)

    # pass 2: subtypes and their lists
    for rel, fm, order, body in parsed:
        rid, rtype = fm["id"], fm["type"]
        if rtype == "atom":
            load_atom(con, diag, deployment, rel, fm, body)
        elif rtype == "claim":
            load_claim(con, diag, deployment, rel, fm, body)
        elif rtype == "survey":
            load_survey(con, diag, deployment, rel, fm, body)
        else:
            con.execute("INSERT INTO opaque_record_body(deployment_id, id, body)"
                        " VALUES (?,?,?)", (deployment, rid, body))

    # ---- narratives [ERF-34] ---------------------------------------------
    nar_root = os.path.join(corpus_dir, "narratives")
    for base, _, names in os.walk(nar_root):
        for fn in sorted(names):
            if not fn.endswith(".md"):
                continue
            full = os.path.join(base, fn)
            rel = os.path.relpath(full, corpus_dir)
            raw = open(full, "rb").read()
            for p in ey.check_encoding(raw, rel):
                diag.add(deployment, rel, "ERF-67", "violation", p)
            fm_text, body = ey.split_file(raw.decode("utf-8"))
            fm, _ = ey.load_frontmatter(fm_text)
            c_ts, c_by = stamp(fm.get("created"), "created", diag, deployment,
                               rel, "ERF-34")
            con.execute(
                "INSERT INTO narrative(deployment_id, corpus_id, path, title, "
                "created_timestamp, created_by, body) VALUES (?,?,?,?,?,?,?)",
                (deployment, fm.get("corpus", corpus_id), rel, fm.get("title", ""),
                 c_ts, c_by, body))
            load_bindings(con, diag, deployment, fm.get("corpus", corpus_id),
                          rel, body)


BINDING_RE = __import__("re").compile(
    r"<!--\s*claims:\s+((?:[^\s\"]+\s+)+)\"([^\"]*)\"(?:\s+bound-at=(\d{4}-\d{2}-\d{2}))?\s*-->")


def load_bindings(con, diag, deployment, corpus_id, rel, body):
    """[ERF-31] parse the narrative bindings out of the prose. A PROJECTION
    [ERF-62]: recomputable from `narrative.body`, never consulted as truth."""
    for pos, m in enumerate(BINDING_RE.finditer(body)):
        ids = m.group(1).split()
        anchor, bound_at = m.group(2), m.group(3)
        if bound_at is None:
            # [ERF-32] "MUST be reported as staleness `indeterminate`, never
            # as current".
            diag.add(deployment, rel, "ERF-32", "violation",
                     "narrative binding %d has no bound-at" % pos)
        for cid in ids:
            con.execute(
                "INSERT OR IGNORE INTO narrative_binding(deployment_id, corpus_id,"
                " path, pos, claim_id, anchor, bound_at) VALUES (?,?,?,?,?,?,?)",
                (deployment, corpus_id, rel, pos, cid, anchor, bound_at))


def load_atom(con, diag, deployment, rel, fm, body):
    rid = fm["id"]
    if body != "":
        # [ERF-53] "an atom's body is empty, so its file is frontmatter and
        # nothing else". There is no column to put it in, by design.
        diag.add(deployment, rel, "ERF-53", "violation",
                 "an atom has no body; %d bytes discarded" % len(body))
    con.execute(
        "INSERT INTO atom(deployment_id, id, corpus_id, finding, quote, "
        "source_id, source_quality, as_of_date, limitations) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (deployment, rid, fm["corpus"], fm.get("finding"), fm.get("quote"),
         fm.get("source"), fm.get("source_quality"), fm.get("as_of_date"),
         fm.get("limitations")))
    # [ERF-10] guidance: a medium/low grade should say what is thin.
    if fm.get("source_quality") in ("medium", "low") and not fm.get("limitations"):
        diag.add(deployment, rel, "ERF-9", "advice",
                 "source_quality %s with no limitations" % fm["source_quality"])
    for pos, e in enumerate(fm.get("finding_audit") or []):
        con.execute(
            "INSERT INTO atom_finding_audit(deployment_id, atom_id, pos, auditor,"
            " verdict, timestamp, protocol) VALUES (?,?,?,?,?,?,?)",
            (deployment, rid, pos, e.get("auditor"), e.get("verdict"),
             e.get("timestamp"), e.get("protocol")))


def load_claim(con, diag, deployment, rel, fm, body):
    rid = fm["id"]
    con.execute(
        "INSERT INTO claim(deployment_id, id, title, epistemic_kind, short_name,"
        " semantic_query, body) VALUES (?,?,?,?,?,?,?)",
        (deployment, rid, fm.get("title"), fm.get("epistemic_kind"),
         fm.get("short_name"), fm.get("semantic_query"), body))
    for pos, fam in enumerate(fm.get("families") or []):
        con.execute("INSERT INTO claim_family(deployment_id, claim_id, pos, family)"
                    " VALUES (?,?,?,?)", (deployment, rid, pos, fam))
    for side, key in (("for", "atoms_for"), ("against", "atoms_against")):
        for pos, aid in enumerate(fm.get(key) or []):
            con.execute("INSERT INTO claim_atom(deployment_id, claim_id, side, pos,"
                        " atom_id) VALUES (?,?,?,?,?)",
                        (deployment, rid, side, pos, aid))
    for pos, sid in enumerate(fm.get("surveys") or []):
        con.execute("INSERT INTO claim_survey(deployment_id, claim_id, pos, survey_id)"
                    " VALUES (?,?,?,?)", (deployment, rid, pos, sid))
    for pos, e in enumerate(fm.get("edges") or []):
        con.execute("INSERT INTO claim_edge(deployment_id, claim_id, pos, "
                    "to_claim_id, relation) VALUES (?,?,?,?,?)",
                    (deployment, rid, pos, e.get("to"), e.get("relation")))
    for pos, s in enumerate(fm.get("standings") or []):
        ev = s.get("evidence_at_stance")
        con.execute(
            "INSERT INTO claim_standing(deployment_id, claim_id, pos, timestamp,"
            " stance, by, why, evidence_stamped) VALUES (?,?,?,?,?,?,?,?)",
            (deployment, rid, pos, s.get("timestamp"), s.get("stance"),
             s.get("by"), s.get("why"), int(ev is not None)))
        if ev:
            for side, key in (("for", "atoms_for"), ("against", "atoms_against")):
                for i, aid in enumerate(ev.get(key) or []):
                    con.execute(
                        "INSERT INTO standing_evidence(deployment_id, claim_id, "
                        "standing_pos, side, pos, atom_id) VALUES (?,?,?,?,?,?)",
                        (deployment, rid, pos, side, i, aid))
        else:
            # [ERF-20] a producer SHOULD stamp it.
            diag.add(deployment, rel, "ERF-20", "advice",
                     "standing %d carries no evidence_at_stance" % pos)
    for pos, e in enumerate(fm.get("evidence_audit") or []):
        con.execute(
            "INSERT INTO claim_evidence_audit(deployment_id, claim_id, pos, "
            "auditor, verdict, timestamp, protocol) VALUES (?,?,?,?,?,?,?)",
            (deployment, rid, pos, e.get("auditor"), e.get("verdict"),
             e.get("timestamp"), e.get("protocol")))


def load_survey(con, diag, deployment, rel, fm, body):
    rid = fm["id"]
    c_ts, c_by = stamp(fm.get("conducted"), "conducted", diag, deployment, rel, "ERF-28")
    con.execute(
        "INSERT INTO survey(deployment_id, id, title, conducted_timestamp, "
        "conducted_by, prior_survey_id, body) VALUES (?,?,?,?,?,?,?)",
        (deployment, rid, fm.get("title"), c_ts, c_by, fm.get("prior_survey"), body))
    for pos, a in enumerate(fm.get("searches") or []):
        con.execute(
            "INSERT INTO survey_search(deployment_id, survey_id, pos, tool, query,"
            " scope, hits_reported, timestamp) VALUES (?,?,?,?,?,?,?,?)",
            (deployment, rid, pos, a.get("tool"), a.get("query"), a.get("scope"),
             a.get("hits_reported"), a.get("timestamp")))
    for pos, n in enumerate(fm.get("notable_results") or []):
        con.execute(
            "INSERT INTO survey_notable_result(deployment_id, survey_id, pos, what,"
            " note) VALUES (?,?,?,?,?)",
            (deployment, rid, pos, n.get("what"), n.get("note")))
        for i, aid in enumerate(n.get("atoms") or []):
            con.execute(
                "INSERT INTO survey_notable_atom(deployment_id, survey_id, "
                "result_pos, pos, atom_id) VALUES (?,?,?,?,?)",
                (deployment, rid, pos, i, aid))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True)
    ap.add_argument("--deployment", required=True)
    ap.add_argument("--schema", default="schema.sql")
    ap.add_argument("corpora", nargs="+")
    args = ap.parse_args()

    fresh = not os.path.exists(args.db)
    con = sqlite3.connect(args.db)
    con.execute("PRAGMA foreign_keys = ON")
    if fresh:
        con.executescript(open(args.schema).read())

    diag = Diagnostics()
    con.execute("BEGIN")
    # [ERF-35] references resolve deployment-wide and may point forward (a
    # claim citing an atom in a file loaded later, a survey naming a later
    # prior_survey). Deferring the FK checks to COMMIT is what lets the whole
    # deployment be the unit of resolution rather than the file.
    con.execute("PRAGMA defer_foreign_keys = ON")
    con.execute("INSERT OR IGNORE INTO deployment(id) VALUES (?)", (args.deployment,))
    for d in args.corpora:
        load_corpus(con, diag, args.deployment, d)
    diag.flush(con)
    try:
        con.commit()
    except sqlite3.IntegrityError as exc:
        # [ERF-35][ERF-36][ERF-38] the invariants are keys and foreign keys, so
        # a corpus that violates them cannot be stored at all. See Q9.
        print("LOAD FAILED (an invariant is a key, so the corpus is unstorable):",
              exc, file=sys.stderr)
        raise SystemExit(2)

    n = con.execute("SELECT count(*) FROM record").fetchone()[0]
    print("loaded %d records into %s" % (n, args.db))
    for sev in ("error", "violation", "report", "advice"):
        rows = con.execute("SELECT rel_path, requirement, message FROM "
                           "load_diagnostic WHERE severity=? ORDER BY rel_path",
                           (sev,)).fetchall()
        for r in rows:
            print("  %-9s %-7s %-34s %s" % (sev, r[1], r[0], r[2]))


if __name__ == "__main__":
    main()
