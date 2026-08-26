#!/usr/bin/env python3
"""build-records 1.0.0 — emit the corpus's atom, claim, survey and narrative
files from the four data files in tools/.

Why a builder at all: ERF-65 makes an unquoted string-typed scalar a
violation, ERF-55 makes an empty list written out a violation, and ERF-18
makes a body that does not open with the title verbatim a flag. All three are
mechanical, all three are easy to get wrong 150 times by hand, and none of
them is the part of this exercise worth a human's attention.

  tools/atoms.data.yaml      -> corpus/atoms/<id>.md
  tools/claims.data.yaml     -> corpus/claims/<id>.md
  tools/surveys.data.yaml    -> corpus/surveys/<id>.md
"""
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus")
CORPUS_ID = "epistemology-llm-era"

ATOM_ORDER = [
    "id", "type", "corpus", "finding", "quote", "source", "source_quality",
    "as_of_date", "limitations", "created", "last_modified", "finding_audit",
]
CLAIM_ORDER = [
    "id", "type", "corpus", "title", "epistemic_kind", "short_name",
    "semantic_query", "families", "created", "last_modified", "atoms_for",
    "atoms_against", "surveys", "edges", "standings", "evidence_audit",
]
SURVEY_ORDER = [
    "id", "type", "corpus", "title", "conducted", "prior_survey",
    "last_modified", "searches", "notable_results",
]


def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def scalar(v):
    if isinstance(v, bool) or v is None:
        raise SystemExit("no boolean or null belongs in a record")
    return q(v)


def emit(v, indent):
    pad = " " * indent
    if isinstance(v, dict):
        out = []
        for k, val in v.items():
            if isinstance(val, (dict, list)):
                out.append("%s%s:" % (pad, k))
                out.append(emit(val, indent + 2))
            else:
                out.append("%s%s: %s" % (pad, k, scalar(val)))
        return "\n".join(out)
    if isinstance(v, list):
        if not v:
            raise SystemExit("ERF-55: an empty list must be omitted, not written")
        out = []
        for item in v:
            if isinstance(item, dict):
                lines = emit(item, indent + 2).split("\n")
                out.append("%s- %s" % (pad, lines[0].lstrip()))
                out.extend(lines[1:])
            else:
                out.append("%s- %s" % (pad, scalar(item)))
        return "\n".join(out)
    return pad + scalar(v)


def frontmatter(d, order):
    ordered = {}
    for k in order:
        if k in d and d[k] not in (None, [], {}):
            ordered[k] = d[k]
        elif k in d and d[k] == {}:
            ordered[k] = d[k]  # a present-and-empty mapping asserts existence
    unknown = [k for k in d if k not in order and k != "body"]
    if unknown:
        raise SystemExit("unknown key(s) %r" % unknown)
    return "---\n" + emit(ordered, 0) + "\n---\n"


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def load(name):
    p = os.path.join(ROOT, "tools", name)
    if not os.path.exists(p):
        return {}
    return yaml.safe_load(open(p, encoding="utf-8")) or {}


def audits():
    """Verdicts from tools/audits.json, written by tools/run_finding_audit.py.
    An atom missing from the file is unaudited and carries no `finding_audit`
    key at all, which ERF-56 says is a complete record: an audit that produced
    nothing did not happen (ERF-12)."""
    import json
    p = os.path.join(ROOT, "tools", "audits.json")
    if not os.path.exists(p):
        return {}
    return json.load(open(p, encoding="utf-8"))


def main():
    made = {"atom": 0, "claim": 0, "survey": 0}
    verdicts = audits()
    audited = 0

    for a in load("atoms.data.yaml").get("atoms", []):
        a = dict(a)
        a["type"] = "atom"
        if a["id"] in verdicts:
            a["finding_audit"] = [{
                "auditor": "gemini-3.5-flash",
                "verdict": verdicts[a["id"]],
                "timestamp": "2026-08-25",
                "protocol": "finding-audit-v1-batched-10",
            }]
            audited += 1
        a["corpus"] = CORPUS_ID
        a.setdefault("created", {"timestamp": "2026-08-25", "by": "anthropic/claude-opus-5"})
        # ERF-53: an atom carries no body. Frontmatter, then nothing.
        write(os.path.join(CORPUS, "atoms", a["id"] + ".md"),
              frontmatter(a, ATOM_ORDER))
        made["atom"] += 1

    for c in load("claims.data.yaml").get("claims", []):
        c = dict(c)
        body = c.pop("body", "")
        c["type"] = "claim"
        c["corpus"] = CORPUS_ID
        c.setdefault("created", {"timestamp": "2026-08-25", "by": "anthropic/claude-opus-5"})
        # ERF-18: the body opens by restating the title verbatim.
        text = frontmatter(c, CLAIM_ORDER) + "\n" + c["title"] + "\n"
        if body.strip():
            text += "\n" + body.strip() + "\n"
        write(os.path.join(CORPUS, "claims", c["id"] + ".md"), text)
        made["claim"] += 1

    for s in load("surveys.data.yaml").get("surveys", []):
        s = dict(s)
        body = s.pop("body", "")
        s["type"] = "survey"
        s["corpus"] = CORPUS_ID
        s.setdefault("conducted", {"timestamp": "2026-08-25", "by": "anthropic/claude-opus-5"})
        text = frontmatter(s, SURVEY_ORDER) + "\n" + body.strip() + "\n"
        write(os.path.join(CORPUS, "surveys", s["id"] + ".md"), text)
        made["survey"] += 1

    print("built: %d atoms (%d with a finding audit), %d claims, %d surveys" %
          (made["atom"], audited, made["claim"], made["survey"]))


if __name__ == "__main__":
    main()
