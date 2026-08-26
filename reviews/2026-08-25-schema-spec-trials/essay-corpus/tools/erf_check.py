#!/usr/bin/env python3
"""erf-check 1.0.0 — run the ERF-50/51/52 quote check over every atom in the
corpus before handing it to `erfval`, and re-stamp the digests ERF-71 and
ERF-53 compare.

  erf_check.py quotes   — the quote check, atom by atom
  erf_check.py digests  — recompute received.digest and normalized_digest and
                          rewrite sources.yaml in place
"""
import os
import re
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from erf_fold import check  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus")


def load_frontmatter(path):
    text = open(path, encoding="utf-8").read()
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---\n", 3)
    if end == -1:
        return None, text
    return yaml.safe_load(text[4:end]), text[end + 5 :]


def sources():
    return yaml.safe_load(open(os.path.join(CORPUS, "sources.yaml"), encoding="utf-8"))["sources"]


def cmd_quotes():
    srcs = sources()
    texts = {}
    bad = 0
    n = 0
    for sid, s in srcs.items():
        if "normalized" in s:
            p = os.path.join(CORPUS, s["normalized"])
            if os.path.exists(p):
                texts[sid] = open(p, encoding="utf-8").read()
    for fn in sorted(os.listdir(os.path.join(CORPUS, "atoms"))):
        if not fn.endswith(".md"):
            continue
        fm, _ = load_frontmatter(os.path.join(CORPUS, "atoms", fn))
        n += 1
        sid = fm["source"]
        if sid not in srcs:
            print("MISSING-SOURCE %s -> %s" % (fm["id"], sid))
            bad += 1
            continue
        if sid not in texts:
            print("NO-TEXT        %s -> %s" % (fm["id"], sid))
            continue
        ok, msg = check(fm["quote"], texts[sid])
        if not ok:
            print("FAIL %s (%s): %s" % (fm["id"], sid, msg))
            bad += 1
    print("%d atoms checked, %d failing" % (n, bad))
    return 1 if bad else 0


def sha(path):
    import hashlib

    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return "sha256:" + h.hexdigest()


def cmd_digests():
    p = os.path.join(CORPUS, "sources.yaml")
    text = open(p, encoding="utf-8").read()
    doc = yaml.safe_load(text)
    for sid, s in doc["sources"].items():
        rp = (s.get("received") or {}).get("path")
        if rp:
            f = os.path.join(CORPUS, rp)
            if os.path.exists(f):
                want = sha(f)
                if s["received"].get("digest") != want:
                    print("received.digest %s -> %s" % (sid, want))
                    text = re.sub(
                        r'(?ms)(^  %s:\n(?:.*?\n)*?      digest: ")[^"]*(")'
                        % re.escape(sid),
                        lambda m: m.group(1) + want + m.group(2),
                        text,
                    )
        nz = s.get("normalized")
        if nz and s.get("normalized_digest") is not None:
            f = os.path.join(CORPUS, nz)
            if os.path.exists(f):
                want = sha(f)
                if s.get("normalized_digest") != want:
                    print("normalized_digest %s -> %s" % (sid, want))
                    text = re.sub(
                        r'(?ms)(^  %s:\n(?:.*?\n)*?    normalized_digest: ")[^"]*(")'
                        % re.escape(sid),
                        lambda m: m.group(1) + want + m.group(2),
                        text,
                    )
    open(p, "w", encoding="utf-8", newline="\n").write(text)
    print("digests rewritten")
    return 0


if __name__ == "__main__":
    sys.exit({"quotes": cmd_quotes, "digests": cmd_digests}[sys.argv[1]]())
