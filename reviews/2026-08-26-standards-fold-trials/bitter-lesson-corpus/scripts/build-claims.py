#!/usr/bin/env python3
"""build-claims.py 1.0.0 — write claim and survey files from work/*-specs.json.

The claim body opens with the title restated verbatim (ERF-18), which the
script copies from the title field rather than asking the author to retype
it, so drift between the two is impossible by construction. Working notes
follow. Every string-typed scalar is emitted double-quoted (ERF-65).
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from erf_yaml import frontmatter  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLAIM_ORDER = ["id", "type", "corpus", "title", "epistemic_kind", "created",
               "short_name", "families", "semantic_query", "atoms_for",
               "atoms_against", "surveys", "edges", "standings",
               "evidence_audit", "last_modified"]
SURVEY_ORDER = ["id", "type", "corpus", "title", "conducted", "searches",
                "notable_results", "prior_survey", "last_modified"]


def build_claims():
    specs = json.loads((ROOT / "work" / "claim-specs.json").read_text(encoding="utf-8"))
    out = ROOT / "corpus" / "claims"
    out.mkdir(parents=True, exist_ok=True)
    for spec in specs:
        fields = {
            "id": spec["id"], "type": "claim", "corpus": "bitter-lesson",
            "title": spec["title"], "epistemic_kind": spec["kind"],
            "created": {"timestamp": "2026-08-26", "by": "agent/claude-opus-5"},
        }
        if spec.get("short_name"):
            fields["short_name"] = spec["short_name"]
        if spec.get("families"):
            fields["families"] = spec["families"]
        if spec.get("semantic_query"):
            fields["semantic_query"] = spec["semantic_query"]
        for key in ("atoms_for", "atoms_against", "surveys"):
            if spec.get(key):
                fields[key] = spec[key]
        if spec.get("edges"):
            fields["edges"] = [{"to": e[0], "relation": e[1]} for e in spec["edges"]]
        ordered = {k: fields[k] for k in CLAIM_ORDER if k in fields}
        body = spec["title"] + "\n\n## Working notes\n\n" + spec["notes"].strip() + "\n"
        (out / f"{spec['id']}.md").write_text(
            frontmatter(ordered, body), encoding="utf-8")
    return len(specs)


def build_surveys():
    specs = json.loads((ROOT / "work" / "survey-specs.json").read_text(encoding="utf-8"))
    out = ROOT / "corpus" / "surveys"
    out.mkdir(parents=True, exist_ok=True)
    for spec in specs:
        fields = {
            "id": spec["id"], "type": "survey", "corpus": "bitter-lesson",
            "title": spec["title"],
            "conducted": {"timestamp": spec["conducted"], "by": "agent/claude-opus-5"},
            "searches": spec["searches"],
        }
        if spec.get("notable_results"):
            fields["notable_results"] = spec["notable_results"]
        ordered = {k: fields[k] for k in SURVEY_ORDER if k in fields}
        (out / f"{spec['id']}.md").write_text(
            frontmatter(ordered, spec["body"].strip() + "\n"), encoding="utf-8")
    return len(specs)


if __name__ == "__main__":
    print(f"{build_claims()} claims, {build_surveys()} surveys written")
