#!/usr/bin/env python3
"""
types/erf.ts follows erf.schema.json. This gate fails when they disagree.

For every interface in erf.ts that names a schema definition, the field set
must match, and a field TypeScript marks optional (`?`) must be one the
schema does not require, and vice versa, with one deliberate exception:
list-typed fields are total in the model (required in TypeScript) and may be
omitted on the wire (not required in the schema), per ERF-55 and ERF-56.

    python3 tools/lint-schema-types.py      # exit 1 on a mismatch
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
schema = json.loads((ROOT / "erf.schema.json").read_text())["$defs"]
ts = (ROOT / "types" / "erf.ts").read_text()

problems = []
for m in re.finditer(r"^export interface (\w+) \{(.*?)^\}", ts, re.S | re.M):
    name, body = m.group(1), m.group(2)
    if name not in schema:
        problems.append(f"{name}: interface has no schema definition"); continue
    d = schema[name]
    body = re.sub(r"/\*.*?\*/", "", body, flags=re.S); body = re.sub(r"//.*", "", body)
    # top-level fields only: a line that starts a field at two-space indent
    # A field is one statement up to ';', and a statement may span lines (a
    # union type with one member per line).
    ts_fields = {}
    depth = 0; stmt = ""
    for ch in body:
        if ch == "{": depth += 1
        elif ch == "}": depth -= 1
        if ch == ";" and depth == 0:
            f = re.match(r"^\s*(\w+)(\??):\s*(.+)$", stmt.strip(), re.S)
            if f: ts_fields[f.group(1)] = {"optional": f.group(2) == "?", "list": f.group(3).strip().endswith("[]")}
            stmt = ""
        else:
            stmt += ch
    sch_fields = set(d.get("properties", {}))
    required = set(d.get("required", []))
    for f in sorted(set(ts_fields) - sch_fields): problems.append(f"{name}.{f}: in erf.ts, not in the schema")
    for f in sorted(sch_fields - set(ts_fields)):
        problems.append(f"{name}.{f}: in the schema, not in erf.ts")
    for f, info in ts_fields.items():
        if f not in sch_fields: continue
        ts_req = not info["optional"]; sch_req = f in required
        if ts_req and not sch_req and not info["list"]:
            problems.append(f"{name}.{f}: required in erf.ts, not required in the schema")
        if sch_req and not ts_req:
            problems.append(f"{name}.{f}: required in the schema, optional in erf.ts")

if problems:
    print("schema vs types: the two disagree\n")
    for p in problems: print("  " + p)
    print(f"\n{len(problems)} mismatch(es). erf.schema.json is normative; fix types/erf.ts, or the schema if the model is wrong.")
    sys.exit(1)
print(f"schema vs types: clean ({len(schema)} definitions)")
