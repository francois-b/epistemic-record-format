#!/usr/bin/env python3
"""
Every field the model declares is discussed in SPEC.md.

`SPEC.md` and `types/erf.ts` (now `schema/erf.ts`, generated) were both normative, and on 2026-08-25 they
disagreed for a day: the source rework renamed `fetched` to `received` and
`cleanup` to `normalization` in the model, and the specification kept the
old names, including in its one worked Source example. Two implementers
reading the two documents build incompatible shapes, and neither has erred.

Nothing caught it. The style linter reads prose, the conformance suite
checks behaviour against the reference implementation, and no gate compared
the two documents. This is that gate (finding F-005).

    python3 tools/lint-field-names.py      # exit 1 on a mismatch

It checks one direction, which is the direction that bit: every field
declared in a normative interface MUST appear in SPEC.md as a backticked
token. The reverse direction is deliberately not checked, because SPEC.md
legitimately discusses field names it does not define (`x_` extensions,
retired fields named in prose about why they went).
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = ROOT / "SPEC.md"
TYPES = ROOT / "schema" / "erf.ts"

# The interfaces the specification is answerable for. A type that exists
# only to serve the reference implementation does not belong here.
NORMATIVE = {
    "ActorStamp", "StandingEntry", "SearchAct", "AuditEntry", "Atom",
    "Claim", "Survey", "CorpusDeclaration", "SourceList", "Source",
    "Received", "Excerpt",
}

# Fields the specification names by their qualified form only, e.g. it
# writes `received.url` and never bare `url`. The qualified spelling is the
# check; this list says which fields to look for that way.
QUALIFIED = {
    "Received": "received", "Excerpt": "excerpt", "ActorStamp": None,
}


def declared_fields() -> dict[str, list[str]]:
    text = TYPES.read_text()
    out: dict[str, list[str]] = {}
    for m in re.finditer(r"^export interface (\w+) \{(.*?)^\}", text, re.S | re.M):
        name, body = m.group(1), m.group(2)
        if name not in NORMATIVE:
            continue
        body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
        body = re.sub(r"//.*", "", body)
        out[name] = re.findall(r"^\s*(\w+)\??:", body, re.M)
    return out


def spec_names() -> set[str]:
    """
    Every way SPEC.md legitimately names a field.

    Backticked prose is the obvious one. The specification also embeds its
    own interface declarations and YAML examples in fenced blocks, and a
    field declared there is named just as normatively; requiring backticks
    everywhere would report `stance` and `verdict` as missing when the
    specification declares both. Found on this linter's first run.
    """
    spec = SPEC.read_text()
    names = set(re.findall(r"`([A-Za-z_][\w.]*)`", spec))
    for block in re.findall(r"^```[a-z]*\n(.*?)^```", spec, re.S | re.M):
        names |= set(re.findall(r"^\s*(\w+)\??:", block, re.M))
        # `{ timestamp: string; stance: Stance }` declares two fields on one
        # line, so a semicolon separates them as surely as a comma does.
        names |= set(re.findall(r"[{,;]\s*(\w+):", block))
    return names


def main() -> int:
    ticked = spec_names()
    missing: list[str] = []

    for iface, fields in sorted(declared_fields().items()):
        prefix = QUALIFIED.get(iface, "")
        for f in fields:
            names = {f}
            if prefix:
                names.add(f"{prefix}.{f}")
            if not (names & ticked):
                shown = " or ".join(f"`{n}`" for n in sorted(names))
                missing.append(f"{iface}.{f}: declared in schema/erf.ts, {shown} appears nowhere in SPEC.md")

    if missing:
        print("field names: the two normative surfaces disagree\n")
        for m in missing:
            print(f"  {m}")
        print(f"\n{len(missing)} field(s). Either the specification is stale or the "
              f"model declares something it should not.")
        return 1

    total = sum(len(v) for v in declared_fields().values())
    print(f"field names: clean ({total} declared fields, all named in SPEC.md)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
