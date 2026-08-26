#!/usr/bin/env python3
"""erf_yaml.py 1.0.0 — a deliberately small YAML writer for this corpus.

The YAML/Markdown binding (ERF-65) asks a producer to quote every scalar the
model types as a string, so that a reader on a legacy YAML 1.1 schema still
receives a string. The cheapest way to obey that without auditing a general
library's emitter is to emit every string as a double-quoted scalar, always,
and to emit nothing else except mappings, sequences, and the three JSON
scalars. That is all this writer does.

Block style only; no anchors, no aliases, no tags, no duplicate keys
(ERF-66 — a Python dict cannot produce one).
"""

ESCAPES = {
    "\\": "\\\\",
    '"': '\\"',
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
}


def dq(s: str) -> str:
    out = ['"']
    for ch in s:
        if ch in ESCAPES:
            out.append(ESCAPES[ch])
        elif ord(ch) < 0x20 or ord(ch) == 0x7F:
            out.append("\\x%02x" % ord(ch))
        else:
            out.append(ch)
    out.append('"')
    return "".join(out)


def emit(value, indent: int = 0) -> str:
    pad = " " * indent
    if isinstance(value, dict):
        lines = []
        for k, v in value.items():
            if isinstance(v, dict) and v:
                lines.append(f"{pad}{k}:")
                lines.append(emit(v, indent + 2))
            elif isinstance(v, dict):
                lines.append(f"{pad}{k}: {{}}")
            elif isinstance(v, list):
                if not v:
                    continue  # ERF-55: empty lists are omitted
                lines.append(f"{pad}{k}:")
                lines.append(emit(v, indent + 2))
            else:
                lines.append(f"{pad}{k}: {scalar(v)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                block = emit(item, indent + 2)
                first, *rest = block.split("\n")
                lines.append(f"{pad}- {first.lstrip()}")
                lines.extend(rest)
            else:
                lines.append(f"{pad}- {scalar(item)}")
        return "\n".join(lines)
    return f"{pad}{scalar(value)}"


def scalar(v) -> str:
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return dq(str(v))


def frontmatter(fields: dict, body: str = "") -> str:
    out = "---\n" + emit(fields) + "\n---\n"
    if body:
        out += body if body.endswith("\n") else body + "\n"
    return out
