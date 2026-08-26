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

# Beyond field sets: every object definition needs an interface (or a named
# alias to one), every enum definition needs a union alias with the same
# members, an enum on a property needs the same members on the field, and a
# field's kind (list, object, scalar) must agree. Added 2026-08-26 after the
# gate passed with Narrative missing from erf.ts entirely.
ts_ifaces = {m.group(1): m.group(2) for m in re.finditer(r"^export interface (\w+) \{(.*?)^\}", ts, re.S | re.M)}
ts_aliases = {m.group(1): m.group(2).strip() for m in re.finditer(r"^export type (\w+)\s*=\s*(.*?);", ts, re.S | re.M)}
def union_members(expr):
    return set(re.findall(r'"([^"]+)"', expr))
for name, d in schema.items():
    if d.get("type") == "object" and "properties" in d:
        if name not in ts_ifaces and not (name in ts_aliases and ts_aliases[name] in ts_ifaces):
            problems.append(f"{name}: object definition in the schema, no interface in erf.ts")
    if "enum" in d:
        if name not in ts_aliases:
            problems.append(f"{name}: enum definition in the schema, no type alias in erf.ts")
        elif union_members(ts_aliases[name]) != set(d["enum"]):
            problems.append(f"{name}: enum members differ: schema {sorted(d['enum'])}, erf.ts {sorted(union_members(ts_aliases[name]))}")
    for f, pv in d.get("properties", {}).items():
        body = ts_ifaces.get(name)
        if body is None: continue
        m = re.search(r"^\s*%s\??:\s*(.+?);" % re.escape(f), body, re.S | re.M)
        if not m: continue
        expr = re.sub(r"//.*", "", m.group(1)).strip()
        if "enum" in pv and union_members(expr) != set(pv["enum"]):
            problems.append(f"{name}.{f}: enum members differ: schema {sorted(pv['enum'])}, erf.ts {sorted(union_members(expr))}")
        sch_kind = pv.get("type") or ("ref" if "$ref" in pv else None)
        if sch_kind == "array" and not expr.endswith("[]"):
            problems.append(f"{name}.{f}: a list in the schema, not a list in erf.ts ({expr})")
        if sch_kind in ("string", "object") and expr.endswith("[]"):
            problems.append(f"{name}.{f}: a {sch_kind} in the schema, a list in erf.ts")
        if sch_kind == "ref":
            target = pv["$ref"].split("/")[-1]
            tdef = schema.get(target, {})
            if tdef.get("type") == "object" and "properties" in tdef and not (expr == target or expr.startswith("{") or expr in ts_aliases):
                problems.append(f"{name}.{f}: the schema refers to {target}, erf.ts has {expr}")

if problems:
    print("schema vs types: the two disagree\n")
    for p in problems: print("  " + p)
    print(f"\n{len(problems)} mismatch(es). erf.schema.json is normative; fix types/erf.ts, or the schema if the model is wrong.")
    sys.exit(1)
print(f"schema vs types: clean ({len(schema)} definitions)")
