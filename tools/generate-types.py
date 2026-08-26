#!/usr/bin/env python3
"""schema/erf.ts is generated from schema/erf.schema.json and never edited.

One definition of the generation, used two ways:

    tools/generate-types.py --write    regenerate schema/erf.ts (the pre-commit
                                       hook runs this when the schema is staged)
    tools/generate-types.py --check    exit 1 if schema/erf.ts differs from what
                                       the schema generates (the conformance
                                       suite runs this as a gate)

The generator is json-schema-to-typescript, a root devDependency; run
`npm install` at the repository root first. The schema is normative and the
TypeScript is a projection of it (SPEC.md section 3).
"""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "erf.schema.json"
OUT = ROOT / "schema" / "erf.ts"
BIN = ROOT / "node_modules" / ".bin" / "json2ts"
BANNER = (
    "/* GENERATED from schema/erf.schema.json by tools/generate-types.py. Do not edit:\n"
    " * change the schema and regenerate (the pre-commit hook does this when the\n"
    " * schema is staged; `npm run types` does it by hand). Not normative; the\n"
    " * schema is (SPEC.md section 3).\n"
    " *\n"
    " * One departure from the generator's output: the `x_` extension namespace\n"
    " * (ERF-72, `patternProperties: ^x_`) is dropped. TypeScript cannot hold an\n"
    " * index signature beside named fields of narrower types, and the loader\n"
    " * enforces ERF-72 against the schema itself with Ajv. */"
)
X_NAMESPACE = re.compile(r"\n  \[k: string\]: \{\n    \[k: string\]: unknown;\n  \};")

def generate() -> str:
    if not BIN.exists():
        sys.exit(f"{BIN.relative_to(ROOT)} not found: run `npm install` at the repository root")
    r = subprocess.run([str(BIN), str(SCHEMA), "--bannerComment", BANNER],
                       capture_output=True, text=True, check=True)
    out, n = X_NAMESPACE.subn("", r.stdout)
    if n == 0:
        sys.exit("generator output carried no x_ index signature; the post-processing step no longer matches its output")
    return out

def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "--check"
    text = generate()
    if mode == "--write":
        OUT.write_text(text)
        print(f"wrote {OUT.relative_to(ROOT)} ({text.count(chr(10))} lines)")
    elif mode == "--check":
        if not OUT.exists() or OUT.read_text() != text:
            sys.exit(f"{OUT.relative_to(ROOT)} is out of date with the schema; run `npm run types`")
        print(f"{OUT.relative_to(ROOT)} matches the schema")
    else:
        sys.exit(__doc__)

if __name__ == "__main__":
    main()
