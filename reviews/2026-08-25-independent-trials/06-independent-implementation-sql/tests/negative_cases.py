#!/usr/bin/env python3
"""
negative_cases.py -- corpora that a conforming validator MUST reject, and what
this store does with them instead.

This is the evidence for relational-questions Q9. Each fixture under
`tests/negative/` is the hostile corpus with one violation introduced. The
question is not whether the violation is caught -- all four are -- but WHERE
it is caught, because that decides whether a validator built on this store
could ever report it.

  usage: python3 tests/negative_cases.py
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

CASES = [
    ("duplicate-record-id", "ERF-36, ERF-38",
     "two records share an id",
     "PRIMARY KEY -- refused at INSERT; the corpus is unstorable, so a "
     "validator over this store can never examine it (Q9)"),
    ("dangling-atom-reference", "ERF-35",
     "a claim cites an atom that does not exist",
     "FOREIGN KEY -- refused at COMMIT; same consequence as above"),
    ("duplicate-frontmatter-key", "ERF-66",
     "one record's frontmatter carries a key twice",
     "the PARSER -- caught before the database exists at all, and "
     "uncatchable by anything downstream of a parse (Q10)"),
    ("alias-in-frontmatter", "ERF-66",
     "frontmatter uses a YAML anchor and alias",
     "the PARSER -- same"),
]


def main():
    failures = 0
    for name, req, what, where in CASES:
        db = os.path.join(ROOT, "out", "negative", name + ".db")
        os.makedirs(os.path.dirname(db), exist_ok=True)
        for suffix in ("", "-wal", "-shm"):
            if os.path.exists(db + suffix):
                os.remove(db + suffix)
        rc = subprocess.run(
            [sys.executable, os.path.join(ROOT, "erf_load.py"), "--db", db,
             "--deployment", "neg", "--schema", os.path.join(ROOT, "schema.sql"),
             os.path.join(HERE, "negative", name)],
            capture_output=True, text=True, cwd=ROOT)
        rejected = rc.returncode != 0
        last = [l for l in (rc.stderr or rc.stdout).strip().splitlines() if l.strip()]
        detail = last[-1] if last else "(no output)"
        print("%-26s %-16s %s" % (name, req, "REJECTED" if rejected else "ACCEPTED -- MISMATCH"))
        print("    what:   %s" % what)
        print("    where:  %s" % where)
        print("    store:  %s" % detail[:110])
        print()
        failures += 0 if rejected else 1
    print("%d cases, %d mismatches" % (len(CASES), failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
