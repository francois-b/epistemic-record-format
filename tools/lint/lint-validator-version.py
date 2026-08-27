#!/usr/bin/env python3
"""The reference validator's version tracks the specification's.

Rule: the package version's major.minor equals the spec version's
major.minor; the patch digit is the implementation's own. The package's
`erf.spec_version` and the exported `SPEC_VERSION` equal the spec version
exactly. The spec version is read from the schema's `$id`
(…/schema/<version>/erf.schema.json), which is the one machine-readable
statement of it; SPEC.md's "Specification, vX.Y" must agree on major.minor.

    tools/lint/lint-validator-version.py        exit 1 on any mismatch

Runs from the pre-commit hook and the conformance suite.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
PKG = ROOT / "validator" / "yaml-markdown" / "typescript"

def spec_version() -> str:
    schema = json.loads((ROOT / "schema" / "erf.schema.json").read_text())
    m = re.search(r"/schema/(\d+\.\d+\.\d+)/erf\.schema\.json$", schema["$id"])
    if not m: sys.exit(f"schema $id carries no version: {schema['$id']}")
    return m.group(1)

def main() -> None:
    spec = spec_version()
    spec_mm = ".".join(spec.split(".")[:2])
    problems = []
    md = re.search(r"^Specification, v(\d+\.\d+)", (ROOT / "SPEC.md").read_text(), re.M)
    if not md or md.group(1) != spec_mm:
        problems.append(f"SPEC.md says v{md.group(1) if md else '?'}; the schema $id says {spec}")
    pkg = json.loads((PKG / "package.json").read_text())
    ver = str(pkg.get("version", ""))
    if not re.fullmatch(r"\d+\.\d+\.\d+", ver):
        problems.append(f"package version {ver!r} is not major.minor.patch")
    elif ".".join(ver.split(".")[:2]) != spec_mm:
        problems.append(f"package version {ver} does not track the spec: major.minor must be {spec_mm} (patch is the implementation's own)")
    declared = str((pkg.get("erf") or {}).get("spec_version", ""))
    if declared != spec:
        problems.append(f"package.json erf.spec_version is {declared!r}; the spec is {spec}")
    idx = (PKG / "index.ts").read_text()
    m = re.search(r'export const SPEC_VERSION = "([^"]+)"', idx)
    if not m or m.group(1) != spec:
        problems.append(f"index.ts SPEC_VERSION is {m.group(1) if m else '?'!r}; the spec is {spec}")
    if problems:
        print("validator version: " + "; ".join(problems)); sys.exit(1)
    print(f"validator version: {ver} tracks spec {spec}")

if __name__ == "__main__":
    main()
