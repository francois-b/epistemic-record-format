#!/usr/bin/env python3
"""
erf_roundtrip.py -- test ERF-53's untested proviso.

  usage: erf_roundtrip.py <corpus-dir> [<corpus-dir> ...]

[ERF-53] "A store MAY hold records any other way it likes ... rows in a
database, provided every record round-trips through the interchange form
WITHOUT LOSS."

The specification never says what loss means, so this harness measures three
candidate equivalences and reports each separately:

  E1  byte identity        the regenerated file is byte-for-byte the input
  E2  parse identity       (frontmatter mapping, body) are equal
  E3  record identity      E2 after applying ERF-56, which says a reader MUST
                           materialize an omitted list-typed field as an empty
                           list -- so an omitted list and an empty list are
                           the same record

E3 is the only one the specification arguably defines, and it defines it for
lists only.
"""

import os
import shutil
import subprocess
import sys
import tempfile

import erf_yaml as ey

LIST_FIELDS = ["finding_audit", "families", "atoms_for", "atoms_against",
               "surveys", "edges", "standings", "evidence_audit",
               "searches", "notable_results"]


def normalize_erf56(fm):
    """[ERF-56] an omitted list-typed field IS the empty list."""
    out = dict(fm)
    for k in LIST_FIELDS:
        if k not in out:
            out[k] = []
    for s in out.get("standings") or []:
        if isinstance(s, dict) and isinstance(s.get("evidence_at_stance"), dict):
            ev = s["evidence_at_stance"]
            ev.setdefault("atoms_for", [])
            ev.setdefault("atoms_against", [])
    for n in out.get("notable_results") or []:
        if isinstance(n, dict):
            n.setdefault("atoms", [])
    return out


def compare(src, dst):
    a = open(src, "rb").read()
    b = open(dst, "rb").read()
    if a == b:
        return "E1", None
    if src.endswith(".yaml"):
        # the declaration and the source list are YAML documents, not records
        # [ERF-3][ERF-59]; they have no body and no ERF-56 list rule.
        da = ey.load_document(a.decode("utf-8"))
        db = ey.load_document(b.decode("utf-8"))
        if da == db:
            return "E2", None
        delta = ["document %r: in=%r out=%r" % (k, da.get(k, "<absent>"),
                                                db.get(k, "<absent>"))
                 for k in sorted(set(da) | set(db)) if da.get(k) != db.get(k)]
        return "LOSS", delta
    fa, ba = ey.split_file(a.decode("utf-8"))
    fb, bb = ey.split_file(b.decode("utf-8"))
    ma, _ = ey.load_frontmatter(fa)
    mb, _ = ey.load_frontmatter(fb)
    if ma == mb and ba == bb:
        return "E2", None
    if normalize_erf56(ma) == normalize_erf56(mb) and ba == bb:
        return "E3", None
    delta = []
    keys = set(ma) | set(mb)
    for k in sorted(keys):
        if normalize_erf56(ma).get(k) != normalize_erf56(mb).get(k):
            delta.append("field %r: in=%r out=%r" % (k, ma.get(k, "<absent>"),
                                                     mb.get(k, "<absent>")))
    if ba != bb:
        delta.append("body: %d bytes in, %d bytes out" % (len(ba), len(bb)))
    return "LOSS", delta


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    corpora = [os.path.abspath(p) for p in sys.argv[1:]]
    if not corpora:
        raise SystemExit(__doc__)
    tmp = tempfile.mkdtemp(prefix="erf-rt-")
    db = os.path.join(tmp, "erf.db")
    out = os.path.join(tmp, "out")
    load = subprocess.run(
        [sys.executable, os.path.join(here, "erf_load.py"), "--db", db,
         "--deployment", "roundtrip", "--schema", os.path.join(here, "schema.sql")]
        + corpora, capture_output=True, text=True, cwd=here)
    sys.stdout.write(load.stdout)
    sys.stderr.write(load.stderr)
    if load.returncode != 0:
        raise SystemExit(load.returncode)
    dump = subprocess.run(
        [sys.executable, os.path.join(here, "erf_dump.py"), "--db", db,
         "--deployment", "roundtrip", "--out", out],
        capture_output=True, text=True, cwd=here)
    sys.stdout.write(dump.stdout)
    sys.stderr.write(dump.stderr)
    if dump.returncode != 0:
        raise SystemExit(dump.returncode)

    print()
    print("=" * 78)
    print("ROUND TRIP  E1 byte-identical | E2 parse-identical | E3 identical "
          "under ERF-56 | LOSS")
    print("=" * 78)
    tally = {"E1": 0, "E2": 0, "E3": 0, "LOSS": 0, "MISSING": 0}
    losses = []
    for cdir in corpora:
        cid = os.path.basename(cdir)
        odir = os.path.join(out, cid)
        for base, _, names in os.walk(cdir):
            if os.path.basename(base) == "captures":
                continue
            for fn in sorted(names):
                src = os.path.join(base, fn)
                rel = os.path.relpath(src, cdir)
                if rel.startswith("captures" + os.sep):
                    continue
                dst = os.path.join(odir, rel)
                if not os.path.exists(dst):
                    tally["MISSING"] += 1
                    print("  MISSING  %s/%s" % (cid, rel))
                    continue
                verdict, delta = compare(src, dst)
                tally[verdict] += 1
                print("  %-8s %s/%s" % (verdict, cid, rel))
                if delta:
                    losses.append((cid, rel, delta))
    print()
    for cid, rel, delta in losses:
        print("LOSS DETAIL %s/%s" % (cid, rel))
        for d in delta:
            print("    " + d)
    print()
    print("tally:", ", ".join("%s=%d" % kv for kv in tally.items()))
    print("regenerated tree kept at:", out)
    print("diff it with:  diff -r -x captures <corpus-dir> %s/<corpus-id>" % out)
    # keep the tree for inspection; caller cleans up
    shutil.rmtree(os.path.join(tmp), ignore_errors=False) if os.environ.get(
        "ERF_RT_CLEAN") else None
    return 1 if (tally["LOSS"] or tally["MISSING"]) else 0


if __name__ == "__main__":
    sys.exit(main())
