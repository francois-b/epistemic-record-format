#!/usr/bin/env python3
"""Every versioned artifact in implementations.yaml, checked against the
specification's version and against itself.

  tracks-spec   major.minor equals the spec's; patch is the artifact's own
  independent   any version, but its declared spec version is the current one

Each artifact's `also` entries are other places the same number is stated;
they must agree (with the version, or with the spec version when
`equals: spec`). The spec version itself is read from the schema's $id and
checked against SPEC.md's heading.

    tools/lint/lint-versions.py        exit 1 on any mismatch

Runs from the pre-commit hook and the conformance suite.
"""
import json, pathlib, re, sys
import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
REG = yaml.safe_load((ROOT / "implementations.yaml").read_text())

def read(src: dict, base: pathlib.Path | None = None) -> str:
    kind = src["kind"]
    if kind == "regex":
        text = (ROOT / src["file"]).read_text()
        m = re.search(src["pattern"], text, re.M)
        if not m: raise ValueError(f"{src['file']}: pattern {src['pattern']!r} matched nothing")
        return m.group(1)
    if kind == "package.json":
        d = json.loads(((base or ROOT) / "package.json").read_text())
        for k in src.get("key", "version").split("."): d = (d or {}).get(k) if isinstance(d, dict) else None
        if d is None: raise ValueError(f"{base}/package.json: no {src.get('key', 'version')}")
        return str(d)
    if kind == "pyproject":
        import tomllib
        d = tomllib.loads(((base or ROOT) / "pyproject.toml").read_text())
        for k in src.get("key", "project.version").split("."): d = (d or {}).get(k) if isinstance(d, dict) else None
        if d is None: raise ValueError(f"{base}/pyproject.toml: no {src.get('key', 'project.version')}")
        return str(d)
    if kind == "cargo":
        import tomllib
        d = tomllib.loads(((base or ROOT) / "Cargo.toml").read_text())
        for k in src.get("key", "package.version").split("."): d = (d or {}).get(k) if isinstance(d, dict) else None
        if d is None: raise ValueError(f"{base}/Cargo.toml: no {src.get('key', 'package.version')}")
        return str(d)
    raise ValueError(f"unknown source kind {kind}")

def mm(v: str) -> str: return ".".join(v.split(".")[:2])

def main() -> None:
    problems: list[str] = []
    spec = read(REG["spec"]["from"])
    for a in REG["spec"].get("also", []):
        got = read(a); want = mm(spec) if a.get("equals") == "spec-major-minor" else spec
        if got != want: problems.append(f"{a['file']} states {got}; the schema $id says {spec}")
    lines = [f"spec {spec}"]
    for art in REG["artifacts"]:
        base = ROOT / art["path"]
        try:
            ver = read(art["version"], base)
            declared = read(art["spec_version"], base)
        except ValueError as e:
            problems.append(f"{art['id']}: {e}"); continue
        if not re.fullmatch(r"\d+\.\d+\.\d+", ver):
            problems.append(f"{art['id']}: version {ver!r} is not major.minor.patch")
        elif art["policy"] == "tracks-spec" and mm(ver) != mm(spec):
            problems.append(f"{art['id']}: version {ver} does not track the spec; major.minor must be {mm(spec)} (patch is the artifact's own)")
        elif art["policy"] not in ("tracks-spec", "independent"):
            problems.append(f"{art['id']}: unknown policy {art['policy']!r}")
        if declared != spec:
            problems.append(f"{art['id']}: declares spec_version {declared!r}; the spec is {spec}")
        for a in art.get("also", []):
            try: got = read(a, base)
            except ValueError as e: problems.append(f"{art['id']}: {e}"); continue
            want = spec if a.get("equals") == "spec" else ver
            if got != want: problems.append(f"{art['id']}: {a['file']} states {got}; expected {want}")
        lines.append(f"{art['id']} {ver} ({art['policy']}, spec {declared})")
    if problems:
        print("versions: " + "; ".join(problems)); sys.exit(1)
    print("versions: " + " · ".join(lines))

if __name__ == "__main__":
    main()
