#!/usr/bin/env python3
"""erf-excerpt 1.0.0 — cut one contiguous passage out of an extracted text.

Selecting *which* passage is the one pipeline step no tool can be named for,
so it is attributed instead (`excerpt.by`, `excerpt.timestamp`, ERF-69). This
tool only performs the cut, deterministically, given line numbers chosen by
the selector.

The range is deliberately single and contiguous. ERF-69 requires that the
normalized text "MUST occur, under the folding of ERF-51, in the normalization
of the whole extracted source"; two disjoint passages spliced together occur
nowhere in the source, so a multi-range excerpt could never satisfy that check.
See friction-log.md, entry F-04.

Usage: erf_excerpt.py <in> <out> START:END      (1-based, inclusive)
"""
import sys


def main() -> None:
    src, dst, spec = sys.argv[1], sys.argv[2], sys.argv[3]
    a, b = (int(x) for x in spec.split(":"))
    lines = open(src, encoding="utf-8").read().split("\n")
    out = "\n".join(lines[a - 1 : b])
    with open(dst, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(out.strip("\n") + "\n")


if __name__ == "__main__":
    main()
