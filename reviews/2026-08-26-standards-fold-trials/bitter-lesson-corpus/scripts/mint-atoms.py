#!/usr/bin/env python3
"""mint-atoms.py 1.0.0 — quote by substring, never by retyping (ERF-6).

Reads `work/atom-specs.json`. Each entry names a source and one or more
spans, and each span is one or two anchors: the first few words the quote
starts with and the last few words it ends with, or a single string that is
the whole span. The script locates each
anchor in the source's *normalized text* and takes the bytes between them.
The quote written into the atom file is therefore a substring of the file
on disk, produced by `str.index` and slicing. Nothing in the quote passes
through the author's keyboard: the author types anchors, and a mistyped
anchor raises rather than producing plausible text.

Multiple spans are joined with the elision marker `[...]` (ERF-52).

Guards, all fatal:
  - an anchor that does not occur, or occurs out of order
  - a span crossing a block boundary (a newline in the normalized text,
    which with `--wrap=none` means a new leaf block, ERF-51 step 1)
  - a span containing CommonMark inline markup, which would fold to
    something other than its bytes. `allow_markup` waives the guard for a
    named character where the author has checked the fold by hand: the one
    use here is Sutton's ``brute force" whose two backticks are the only two
    in the file, so they open no code span and fold to themselves.

Usage: mint-atoms.py [--check]
"""
import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from erf_yaml import frontmatter  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
MARKUP = set("*_[]`<>")
FIELD_ORDER = [
    "id", "type", "corpus", "finding", "quote", "source", "source_quality",
    "as_of_date", "limitations", "created", "last_modified", "finding_audit",
]


def load_text(slug: str) -> str:
    return (ROOT / "corpus" / "normalized" / f"{slug}.md").read_text(encoding="utf-8")


def extract(text: str, spans, atom_id: str, allow_markup=()) -> str:
    pieces = []
    cursor = 0
    for n, span in enumerate(spans):
        start_anchor = span[0]
        end_anchor = span[-1]
        i = text.find(start_anchor, cursor)
        if i < 0:
            raise SystemExit(
                f"{atom_id}: span {n} start anchor not found in normalized text: "
                f"{start_anchor!r}")
        j = i if len(span) == 1 else text.find(end_anchor, i)
        if j < 0:
            raise SystemExit(
                f"{atom_id}: span {n} end anchor not found after the start anchor: "
                f"{end_anchor!r}")
        end = j + len(end_anchor)
        piece = text[i:end]
        if "\n" in piece:
            raise SystemExit(f"{atom_id}: span {n} crosses a block boundary")
        bad = (MARKUP & set(piece)) - set(allow_markup)
        if bad:
            raise SystemExit(
                f"{atom_id}: span {n} contains CommonMark inline markup "
                f"{sorted(bad)}; pick a span without it")
        pieces.append(piece)
        cursor = end
    return " [...] ".join(pieces)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="verify only; write nothing")
    args = ap.parse_args()

    specs = json.loads((ROOT / "work" / "atom-specs.json").read_text(encoding="utf-8"))
    out_dir = ROOT / "corpus" / "atoms"
    out_dir.mkdir(parents=True, exist_ok=True)
    texts = {}
    seen = set()
    errors = []
    written = 0
    for spec in specs:
        atom_id = spec["id"]
        if atom_id in seen:
            raise SystemExit(f"duplicate atom id in specs: {atom_id}")
        seen.add(atom_id)
        slug = spec["source"]
        if slug not in texts:
            texts[slug] = load_text(slug)
        try:
            quote = extract(texts[slug], spec["spans"], atom_id,
                            allow_markup=spec.get("allow_markup", ""))
        except SystemExit as exc:
            errors.append(str(exc))
            continue
        fields = {
            "id": atom_id,
            "type": "atom",
            "corpus": "bitter-lesson",
            "finding": spec["finding"],
            "quote": quote,
            "source": slug,
            "source_quality": spec["source_quality"],
        }
        if spec.get("as_of_date"):
            fields["as_of_date"] = spec["as_of_date"]
        if spec.get("limitations"):
            fields["limitations"] = spec["limitations"]
        fields["created"] = {"timestamp": spec.get("created", "2026-08-26"),
                             "by": "agent/claude-opus-5"}
        ordered = {k: fields[k] for k in FIELD_ORDER if k in fields}
        if not args.check:
            (out_dir / f"{atom_id}.md").write_text(
                frontmatter(ordered), encoding="utf-8")
        written += 1
    print(f"{written} atoms {'checked' if args.check else 'written'}, "
          f"quotes taken by substring from {len(texts)} normalized texts")
    for e in errors:
        print("FAILED:", e, file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
