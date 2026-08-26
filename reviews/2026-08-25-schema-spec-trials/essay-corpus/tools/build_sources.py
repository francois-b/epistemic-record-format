#!/usr/bin/env python3
"""build-sources 1.0.0 — emit corpus/sources.yaml from tools/sources.data.yaml.

Two jobs the hand cannot do reliably at this volume:
  * compute `received.digest` and `normalized_digest` from the bytes actually
    held (ERF-71, ERF-53);
  * quote every string-typed scalar, because ERF-65 makes an unquoted `0`,
    `2018`, `no`, `on` or `0.9.0` a violation and a bare date a flag.
"""
import hashlib
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus")

# Key order inside one source entry, so the file reads the way ERF-4/ERF-70
# describes the pipeline: identity, then the raw file, then the text, then the
# tools that made it.
ORDER = [
    "citation_text",
    "citation",
    "received",
    "status",
    "normalized",
    "normalized_digest",
    "reason",
    "licence",
    "licence_name",
    "extraction",
    "normalization",
    "excerpt",
]
RECEIVED_ORDER = ["url", "path", "digest", "timestamp"]


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return "sha256:" + h.hexdigest()


def q(s):
    """A double-quoted YAML scalar. Every string-typed field goes through
    this: ERF-65 is a violation, not a style note."""
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def emit_scalar(v, indent):
    if isinstance(v, bool) or v is None:
        raise SystemExit("no boolean or null belongs in a source entry")
    if isinstance(v, (int, float)):
        return str(v)  # CSL fields only; typed by CSL, outside ERF-65
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
                out.append("%s%s: %s" % (pad, k, emit_scalar(val, indent)))
        return "\n".join(out)
    if isinstance(v, list):
        out = []
        for item in v:
            if isinstance(item, dict):
                lines = emit(item, indent + 2).split("\n")
                out.append("%s- %s" % (pad, lines[0].lstrip()))
                out.extend(lines[1:])
            else:
                out.append("%s- %s" % (pad, emit_scalar(item, indent)))
        return "\n".join(out)
    return pad + emit_scalar(v, indent)


def main():
    data = yaml.safe_load(
        open(os.path.join(ROOT, "tools", "sources.data.yaml"), encoding="utf-8")
    )
    lines = ["type: sources", "sources:"]
    for sid in sorted(data["sources"]):
        s = dict(data["sources"][sid])
        rec = s.get("received")
        if rec and rec.get("path"):
            p = os.path.join(CORPUS, rec["path"])
            if not os.path.exists(p):
                sys.exit("missing raw file for %s: %s" % (sid, rec["path"]))
            rec["digest"] = sha(p)
        if s.get("normalized"):
            p = os.path.join(CORPUS, s["normalized"])
            if not os.path.exists(p):
                sys.exit("missing normalized text for %s: %s" % (sid, s["normalized"]))
            s["normalized_digest"] = sha(p)
        if rec:
            s["received"] = {k: rec[k] for k in RECEIVED_ORDER if k in rec}
        ordered = {k: s[k] for k in ORDER if k in s}
        lines.append("  %s:" % sid)
        lines.append(emit(ordered, 4))
    out = "\n".join(lines) + "\n"
    with open(os.path.join(CORPUS, "sources.yaml"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(out)
    print("sources.yaml: %d sources" % len(data["sources"]))


if __name__ == "__main__":
    main()
