#!/usr/bin/env python3
"""excerpt.py <slug> --lines A-B [--reflow]

Step three and four of the ERF-1 pipeline: select a passage from the
extracted CommonMark, then normalize it with bl-normalize.py 1.0.0.

Selection is by contiguous line range of `work/extracted/<slug>.md`, snapped
outward to the nearest blank line on each side so that the range always
covers whole blocks. That is what makes the ERF-69 fidelity check exact
rather than approximate: the script asserts the normalized excerpt is a
byte-for-byte substring of the normalization of the whole extracted source,
which is stronger than "occurs under the folding of ERF-51" and implies it.

Prints the normalized path and its sha256, for the source list entry.
Selecting the passage is a judgment and is attributed on the source
(`excerpt.by`), never to this script.
"""
import argparse
import hashlib
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from bl_normalize import normalize  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent


def snap(lines, a, b):
    """1-based inclusive range, widened to blank-line boundaries."""
    i = a - 1
    while i > 0 and lines[i - 1].strip() != "":
        i -= 1
    j = b - 1
    while j + 1 < len(lines) and lines[j + 1].strip() != "":
        j += 1
    return i, j


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--lines", required=True, help="A-B, 1-based inclusive")
    ap.add_argument("--reflow", action="store_true")
    args = ap.parse_args()

    extracted = (ROOT / "work" / "extracted" / f"{args.slug}.md").read_text(encoding="utf-8")
    lines = extracted.split("\n")
    a, b = (int(x) for x in args.lines.split("-"))
    i, j = snap(lines, a, min(b, len(lines)))
    excerpt = "\n".join(lines[i : j + 1])

    normalized = normalize(excerpt, reflow=args.reflow)
    whole = normalize(extracted, reflow=args.reflow)
    if normalized.strip("\n") not in whole:
        print("FIDELITY FAILURE (ERF-69): normalized excerpt does not occur "
              "in the normalization of the whole extracted source", file=sys.stderr)
        return 2

    out = ROOT / "corpus" / "normalized" / f"{args.slug}.md"
    out.write_text(normalized, encoding="utf-8")
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    print(f"normalized/{args.slug}.md  lines {i+1}-{j+1}  "
          f"{len(normalized)} chars  sha256:{digest[:12]}...  "
          f"ERF-69 fidelity: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
