#!/usr/bin/env python3
"""
erf_dump.py -- regenerate the interchange form from the relational schema.

  usage: erf_dump.py --db out/erf.db --deployment <id> --out <dir>

This is the other half of ERF-53's untested claim: "A store MAY hold records
any other way it likes ... rows in a database, PROVIDED EVERY RECORD
ROUND-TRIPS THROUGH THE INTERCHANGE FORM WITHOUT LOSS."

Everything written below comes from columns. The writer never reads the input
files, and the database holds no copy of them.
"""

import argparse
import json
import os
import sqlite3

import erf_yaml as ey
from erf_load import (ATOM_FIELDS, CLAIM_FIELDS, SURVEY_FIELDS, SOURCE_FIELDS,
                      CORPUS_FIELDS)


def rows(con, sql, args=()):
    cur = con.execute(sql, args)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def one(con, sql, args=()):
    r = rows(con, sql, args)
    return r[0] if r else None


# --------------------------------------------------------------------------
# assembling a record's frontmatter back out of its tables
# --------------------------------------------------------------------------

def stamp_pairs(ts, by):
    p = []
    if ts is not None:
        p.append(("timestamp", ts))
    if by is not None:
        p.append(("by", by))
    return p


def atom_fields(con, dep, rec):
    rid = rec["id"]
    a = one(con, "SELECT * FROM atom WHERE deployment_id=? AND id=?", (dep, rid))
    out = {
        "id": rid, "type": rec["type"], "corpus": rec["corpus_id"],
        "finding": a["finding"], "quote": a["quote"], "source": a["source_id"],
        "source_quality": a["source_quality"],
    }
    if a["as_of_date"] is not None:
        out["as_of_date"] = a["as_of_date"]
    if a["limitations"] is not None:
        out["limitations"] = a["limitations"]
    if rec["created_timestamp"] is not None:
        out["created"] = ("FLOWMAP", stamp_pairs(rec["created_timestamp"], rec["created_by"]))
    if rec["last_modified_timestamp"] is not None:
        out["last_modified"] = ("FLOWMAP",
                                stamp_pairs(rec["last_modified_timestamp"],
                                            rec["last_modified_by"]))
    audits = rows(con, "SELECT * FROM atom_finding_audit WHERE deployment_id=? "
                       "AND atom_id=? ORDER BY pos", (dep, rid))
    if audits:  # [ERF-55] empty lists are omitted
        out["finding_audit"] = ("FLOWSEQMAP",
                                [[("auditor", e["auditor"]), ("verdict", e["verdict"]),
                                  ("timestamp", e["timestamp"]), ("protocol", e["protocol"])]
                                 for e in audits])
    return out


def claim_fields(con, dep, rec):
    rid = rec["id"]
    c = one(con, "SELECT * FROM claim WHERE deployment_id=? AND id=?", (dep, rid))
    out = {"id": rid, "type": rec["type"], "corpus": rec["corpus_id"],
           "title": c["title"], "epistemic_kind": c["epistemic_kind"]}
    if rec["created_timestamp"] is not None:
        out["created"] = ("FLOWMAP", stamp_pairs(rec["created_timestamp"], rec["created_by"]))
    if rec["last_modified_timestamp"] is not None:
        out["last_modified"] = ("FLOWMAP",
                                stamp_pairs(rec["last_modified_timestamp"],
                                            rec["last_modified_by"]))
    if c["short_name"] is not None:
        out["short_name"] = c["short_name"]
    fams = [r["family"] for r in rows(con, "SELECT family FROM claim_family WHERE "
                                           "deployment_id=? AND claim_id=? ORDER BY pos",
                                      (dep, rid))]
    if fams:
        out["families"] = ("FLOWSEQ", fams)
    for side, key in (("for", "atoms_for"), ("against", "atoms_against")):
        ids = [r["atom_id"] for r in rows(
            con, "SELECT atom_id FROM claim_atom WHERE deployment_id=? AND claim_id=? "
                 "AND side=? ORDER BY pos", (dep, rid, side))]
        if ids:
            out[key] = ("FLOWSEQ", ids)
    surveys = [r["survey_id"] for r in rows(
        con, "SELECT survey_id FROM claim_survey WHERE deployment_id=? AND claim_id=? "
             "ORDER BY pos", (dep, rid))]
    if surveys:
        out["surveys"] = ("FLOWSEQ", surveys)
    edges = rows(con, "SELECT to_claim_id, relation FROM claim_edge WHERE "
                      "deployment_id=? AND claim_id=? ORDER BY pos", (dep, rid))
    if edges:
        out["edges"] = ("FLOWSEQMAP",
                        [[("to", e["to_claim_id"]), ("relation", e["relation"])]
                         for e in edges])
    standings = rows(con, "SELECT * FROM claim_standing WHERE deployment_id=? AND "
                          "claim_id=? ORDER BY pos", (dep, rid))
    if standings:
        blocks = []
        for s in standings:
            pairs = [("timestamp", s["timestamp"]), ("stance", s["stance"]),
                     ("by", s["by"]), ("why", s["why"])]
            if s["evidence_stamped"]:
                ev = []
                for side, key in (("for", "atoms_for"), ("against", "atoms_against")):
                    ids = [r["atom_id"] for r in rows(
                        con, "SELECT atom_id FROM standing_evidence WHERE "
                             "deployment_id=? AND claim_id=? AND standing_pos=? AND "
                             "side=? ORDER BY pos", (dep, rid, s["pos"], side))]
                    if ids:      # [ERF-55] again, inside a nested mapping
                        ev.append((key, ("FLOWSEQ", ids)))
                pairs.append(("evidence_at_stance", ("FLOWMAPSEQ", ev)))
            blocks.append(pairs)
        out["standings"] = ("BLOCKSEQMAP", blocks)
    audits = rows(con, "SELECT * FROM claim_evidence_audit WHERE deployment_id=? AND "
                       "claim_id=? ORDER BY pos", (dep, rid))
    if audits:
        out["evidence_audit"] = ("FLOWSEQMAP",
                                 [[("auditor", e["auditor"]), ("verdict", e["verdict"]),
                                   ("timestamp", e["timestamp"]), ("protocol", e["protocol"])]
                                  for e in audits])
    if c["semantic_query"] is not None:
        out["semantic_query"] = c["semantic_query"]
    return out, c["body"]


def survey_fields(con, dep, rec):
    rid = rec["id"]
    s = one(con, "SELECT * FROM survey WHERE deployment_id=? AND id=?", (dep, rid))
    out = {"id": rid, "type": rec["type"], "corpus": rec["corpus_id"],
           "title": s["title"],
           "conducted": ("FLOWMAP", stamp_pairs(s["conducted_timestamp"], s["conducted_by"]))}
    acts = rows(con, "SELECT * FROM survey_search WHERE deployment_id=? AND survey_id=? "
                     "ORDER BY pos", (dep, rid))
    if acts:
        blocks = []
        for a in acts:
            pairs = [("tool", a["tool"]), ("query", a["query"])]
            if a["scope"] is not None:
                pairs.append(("scope", a["scope"]))
            pairs.append(("hits_reported", a["hits_reported"]))
            if a["timestamp"] is not None:
                pairs.append(("timestamp", a["timestamp"]))
            blocks.append(pairs)
        out["searches"] = ("BLOCKSEQMAP", blocks)
    notables = rows(con, "SELECT * FROM survey_notable_result WHERE deployment_id=? AND "
                         "survey_id=? ORDER BY pos", (dep, rid))
    if notables:
        blocks = []
        for n in notables:
            pairs = [("what", n["what"]), ("note", n["note"])]
            ids = [r["atom_id"] for r in rows(
                con, "SELECT atom_id FROM survey_notable_atom WHERE deployment_id=? "
                     "AND survey_id=? AND result_pos=? ORDER BY pos",
                (dep, rid, n["pos"]))]
            if ids:
                pairs.append(("atoms", ("FLOWSEQ", ids)))
            blocks.append(pairs)
        out["notable_results"] = ("BLOCKSEQMAP", blocks)
    if s["prior_survey_id"] is not None:
        out["prior_survey"] = s["prior_survey_id"]
    if rec["last_modified_timestamp"] is not None:
        out["last_modified"] = ("FLOWMAP",
                                stamp_pairs(rec["last_modified_timestamp"],
                                            rec["last_modified_by"]))
    return out, s["body"]


# --------------------------------------------------------------------------
# emitting
# --------------------------------------------------------------------------

def emit_value(key, value, lines):
    """Emit one top-level frontmatter key. The tuple tags are the writer's
    style table; see erf_yaml's header for what each one means and why every
    one of them is an invention."""
    if isinstance(value, tuple):
        kind, payload = value
        if kind == "FLOWMAP":
            lines.append("%s: %s" % (key, ey.flow_map(payload)))
        elif kind == "FLOWSEQ":
            lines.append("%s: %s" % (key, ey.flow_seq(payload)))
        elif kind == "FLOWSEQMAP":
            lines.append("%s:" % key)
            for pairs in payload:
                lines.append("  - %s" % ey.flow_map(pairs))
        elif kind == "BLOCKSEQMAP":
            lines.append("%s:" % key)
            for pairs in payload:
                first = True
                for k, v in pairs:
                    if isinstance(v, tuple):
                        sub, sp = v
                        if sub == "FLOWSEQ":
                            rendered = ey.flow_seq(sp)
                        elif sub == "FLOWMAPSEQ":
                            rendered = "{" + ", ".join(
                                "%s: %s" % (kk, ey.flow_seq(vv[1]))
                                for kk, vv in sp) + "}"
                        else:
                            raise AssertionError(sub)
                    else:
                        rendered = ey.scalar(v)
                    prefix = "  - " if first else "    "
                    lines.append("%s%s: %s" % (prefix, k, rendered))
                    first = False
        elif kind == "RAWJSON":
            block = ey.json_to_yaml(payload, indent=2)
            if len(block) == 1 and not block[0].strip().startswith("-"):
                lines.append("%s: %s" % (key, block[0].strip()))
            else:
                lines.append("%s:" % key)
                lines.extend(block)
        else:
            raise AssertionError(kind)
    else:
        lines.append("%s: %s" % (key, ey.scalar(value)))


def render_record(con, dep, rec):
    if rec["type"] == "atom":
        fields, body, order = atom_fields(con, dep, rec), "", ATOM_FIELDS
    elif rec["type"] == "claim":
        (fields, body), order = claim_fields(con, dep, rec), CLAIM_FIELDS
    elif rec["type"] == "survey":
        (fields, body), order = survey_fields(con, dep, rec), SURVEY_FIELDS
    else:
        # [ERF-57] an unknown type comes back out of the opaque sidecar.
        b = one(con, "SELECT body FROM opaque_record_body WHERE deployment_id=? "
                     "AND id=?", (dep, rec["id"]))
        fields, body, order = {}, (b["body"] if b else ""), []

    extras = rows(con, "SELECT key, value_json FROM record_extra_field WHERE "
                       "deployment_id=? AND record_id=? ORDER BY pos",
                  (dep, rec["id"]))
    lines = ["---"]
    for key in order:
        if key in fields:
            emit_value(key, fields[key], lines)
    for e in extras:
        emit_value(e["key"], ("RAWJSON", json.loads(e["value_json"])), lines)
    lines.append("---")
    return "\n".join(lines) + "\n" + body


def render_declaration(con, dep, corpus_id):
    c = one(con, "SELECT * FROM corpus WHERE deployment_id=? AND id=?", (dep, corpus_id))
    lines = []
    for key, col in (("id", "id"), ("title", "title"), ("spec_version", "spec_version"),
                     ("classification", "classification"), ("owner", "owner")):
        if c[col] is not None:
            lines.append("%s: %s" % (key, ey.scalar(c[col])))
    for e in rows(con, "SELECT key, value_json FROM corpus_extra_field WHERE "
                       "deployment_id=? AND corpus_id=? ORDER BY pos", (dep, corpus_id)):
        emit_value(e["key"], ("RAWJSON", json.loads(e["value_json"])), lines)
    return "\n".join(lines) + "\n"


def render_sources(con, dep, corpus_id):
    srcs = rows(con, "SELECT * FROM corpus_source WHERE deployment_id=? AND corpus_id=? "
                     "ORDER BY rowid", (dep, corpus_id))
    if not srcs:
        return None
    lines = ["sources:"]
    for s in srcs:
        lines.append("  %s:" % s["id"])
        lines.append("    citation_text: %s" % ey.scalar(s["citation_text"]))
        if s["citation_json"] is not None:
            lines.append("    citation:")
            lines.extend(ey.json_to_yaml(json.loads(s["citation_json"]), indent=6))
        if s["fetched_url"] is not None:
            lines.append("    fetched:")
            lines.append("      url: %s" % ey.scalar(s["fetched_url"]))
            if s["fetched_digest"] is not None:
                lines.append("      digest: %s" % ey.scalar(s["fetched_digest"]))
        lines.append("    status: %s" % ey.scalar(s["status"]))
        if s["path"] is not None:
            lines.append("    path: %s" % ey.scalar(s["path"]))
        if s["reason"] is not None:
            lines.append("    reason: %s" % ey.scalar(s["reason"]))
        if s["licence"] is not None:
            lines.append("    licence: %s" % ey.scalar(s["licence"]))
        if s["licence_name"] is not None:
            lines.append("    licence_name: %s" % ey.scalar(s["licence_name"]))
        if s["excerpt"] is not None:
            lines.append("    excerpt: %s" % ("true" if s["excerpt"] else "false"))
        if s["converter_tool"] is not None:
            lines.append("    converter: {tool: %s, deterministic: %s}" % (
                ey.scalar(s["converter_tool"], in_flow=True),
                "true" if s["converter_deterministic"] else "false"))
        for e in rows(con, "SELECT key, value_json FROM source_extra_field WHERE "
                           "deployment_id=? AND corpus_id=? AND source_id=? ORDER BY pos",
                      (dep, corpus_id, s["id"])):
            sub = ey.json_to_yaml(json.loads(e["value_json"]), indent=6)
            if len(sub) == 1 and not sub[0].strip().startswith("-"):
                lines.append("    %s: %s" % (e["key"], sub[0].strip()))
            else:
                lines.append("    %s:" % e["key"])
                lines.extend(sub)
    return "\n".join(lines) + "\n"


def render_narrative(n):
    lines = ["---", "title: %s" % ey.scalar(n["title"]),
             "corpus: %s" % ey.scalar(n["corpus_id"])]
    pairs = stamp_pairs(n["created_timestamp"], n["created_by"])
    lines.append("created: %s" % ey.flow_map(pairs))
    lines.append("---")
    return "\n".join(lines) + "\n" + n["body"]


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # [ERF-67] UTF-8, LF, no BOM. newline="" stops Python translating.
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True)
    ap.add_argument("--deployment", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    con.execute("PRAGMA foreign_keys = ON")
    dep = args.deployment
    n = 0
    for c in rows(con, "SELECT id FROM corpus WHERE deployment_id=? ORDER BY id", (dep,)):
        cid = c["id"]
        cdir = os.path.join(args.out, cid)
        write(os.path.join(cdir, "corpus.yaml"), render_declaration(con, dep, cid))
        src = render_sources(con, dep, cid)
        if src is not None:
            write(os.path.join(cdir, "sources.yaml"), src)
        for rec in rows(con, "SELECT r.*, f.rel_path FROM record r JOIN record_file f "
                             "ON f.deployment_id=r.deployment_id AND f.record_id=r.id "
                             "WHERE r.deployment_id=? AND r.corpus_id=? ORDER BY f.rel_path",
                        (dep, cid)):
            write(os.path.join(cdir, rec["rel_path"]), render_record(con, dep, rec))
            n += 1
        for nar in rows(con, "SELECT * FROM narrative WHERE deployment_id=? AND "
                             "corpus_id=? ORDER BY path", (dep, cid)):
            write(os.path.join(cdir, nar["path"]), render_narrative(nar))
    print("wrote %d records to %s" % (n, args.out))


if __name__ == "__main__":
    main()
