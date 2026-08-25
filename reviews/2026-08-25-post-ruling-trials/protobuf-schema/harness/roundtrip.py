"""YAML -> protobuf message -> WIRE BYTES -> message -> YAML, and diff.

The round trip goes through SerializeToString()/FromString() deliberately. An
in-process Python object retains distinctions the wire encoding does not; only
a real serialize/parse cycle tests proto3's presence semantics, which is what
this trial is about.

Usage:  python harness/roundtrip.py tests/  [--write]
"""

import sys, os, json, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "gen"))

import erf_yaml
import bindings as bindings_mod
import mapping
import erf_pb2 as pb


# --------------------------------------------------------------------------
# Structural diff, with a verdict per difference.
# --------------------------------------------------------------------------

IDENTICAL = "identical"
LICENSED = "licensed"   # the spec explicitly requires or permits this change
LOSS = "loss"
ORDER = "order"         # same data, different mapping key order


def _same_scalar(b, a):
    """Type-aware equality.

    Python's `1494 == 1494.0` is True, which would hide the exact loss this
    trial is looking for: google.protobuf.Value has one number type, `double`,
    so every integer in a CSL citation block returns as a float. The YAML
    emitted from a float is `1494.0`, and ERF-8 makes the citation canonical.
    """
    if isinstance(b, bool) != isinstance(a, bool):
        return False
    if isinstance(b, (int, float)) and isinstance(a, (int, float)):
        return type(b) is type(a) and b == a
    return b == a


def diff(before, after, path="", out=None):
    out = out if out is not None else []
    if isinstance(before, dict) and isinstance(after, dict):
        if list(before.keys()) != list(after.keys()) and \
           sorted(before.keys()) == sorted(after.keys()):
            out.append((ORDER, path or "(root)", "mapping key order changed",
                        list(before.keys()), list(after.keys())))
        for k in before:
            p = f"{path}.{k}" if path else k
            if k not in after:
                v = before[k]
                if isinstance(v, list) and len(v) == 0:
                    # ERF-55: "Empty lists MUST be omitted: a field's absence
                    # means none." ERF-56: a reader materializes it back. The
                    # producer is REQUIRED to drop it.
                    out.append((LICENSED, p, "empty list omitted (ERF-55)", v, None))
                else:
                    out.append((LOSS, p, "key dropped", v, None))
            else:
                diff(before[k], after[k], p, out)
        for k in after:
            if k not in before:
                p = f"{path}.{k}" if path else k
                out.append((LOSS, p, "key invented", None, after[k]))
        return out
    if isinstance(before, list) and isinstance(after, list):
        if len(before) != len(after):
            out.append((LOSS, path, f"length {len(before)} -> {len(after)}",
                        before, after))
            return out
        for i, (b, a) in enumerate(zip(before, after)):
            diff(b, a, f"{path}[{i}]", out)
        return out
    if not _same_scalar(before, after):
        out.append((LOSS, path, f"{type(before).__name__} -> "
                    f"{type(after).__name__}", before, after))
    return out


# --------------------------------------------------------------------------

def process_file(path, rel):
    text = open(path, encoding="utf-8").read()
    fm, body = erf_yaml.split_file(text)
    rtype = fm.get("type")
    notes = []
    result = {"file": rel, "type": rtype, "notes": notes}

    if rtype not in mapping.TYPE_TO_MESSAGE:
        # ERF-54 (no `type` -> not part of the corpus, ignore AND report) and
        # ERF-57 (unknown record type -> preserve as opaque, report).
        op = pb.OpaqueFile(path=rel, body=body or "")
        if rtype is not None:
            op.type_value = rtype
        from google.protobuf import json_format
        for k, v in fm.items():
            json_format.ParseDict(v, op.frontmatter[k])
        wire = op.SerializeToString()
        back = pb.OpaqueFile.FromString(wire)
        rebuilt = {k: json_format.MessageToDict(back.frontmatter[k])
                   for k in back.frontmatter}
        result.update(
            kind="opaque", wire_bytes=len(wire),
            diffs=diff(fm, rebuilt), body_ok=(back.body == (body or "")),
        )
        return result

    cls = mapping.TYPE_TO_MESSAGE[rtype]
    msg = cls()

    if rtype == "narrative":
        # The body is authoritative; `bindings` is a recomputed projection
        # (ERF-62) and is deliberately NOT part of the round-trip comparison.
        mapping.to_proto(fm, msg, notes)
        msg.body = body or ""
        for b in bindings_mod.extract(body or ""):
            msg.bindings.add(**b)
    elif rtype in ("claim", "survey"):
        mapping.to_proto(fm, msg, notes)
        msg.body = body or ""
    else:
        mapping.to_proto(fm, msg, notes)

    wire = msg.SerializeToString()
    back = cls.FromString(wire)
    rebuilt = mapping.from_proto(back)

    if rtype in ("claim", "survey", "narrative"):
        body_back = rebuilt.pop("body", "")
    else:
        # ERF-53: an atom's file "is frontmatter and nothing else". The Atom
        # interface has no body field, so there is nothing to carry and nothing
        # to lose; the empty body is a property of the file, not of the record.
        body_back = ""
        body = body or ""
    rebuilt.pop("bindings", None)

    result.update(
        kind="record", wire_bytes=len(wire),
        diffs=diff(fm, rebuilt),
        body_ok=(body_back == (body or "")),
        rebuilt=rebuilt, body_back=body_back,
        n_bindings=len(getattr(back, "bindings", [])),
        malformed_bindings=sum(
            1 for b in getattr(back, "bindings", []) if not b.well_formed),
    )
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    results = []
    for dirpath, _, files in os.walk(root):
        if os.path.basename(dirpath) == "out":
            continue
        for fn in sorted(files):
            if not fn.endswith((".md", ".yaml", ".yml")):
                continue
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, root)
            try:
                results.append(process_file(p, rel))
            except Exception as e:
                results.append({"file": rel, "kind": "error",
                                "error": f"{type(e).__name__}: {e}", "diffs": []})

    if args.write:
        outdir = os.path.join(root, "out")
        os.makedirs(outdir, exist_ok=True)
        for r in results:
            if r.get("kind") != "record":
                continue
            dst = os.path.join(outdir, r["file"].replace(os.sep, "__"))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "w", encoding="utf-8") as f:
                f.write(erf_yaml.join_file(r["rebuilt"], r.get("body_back")))

    n_loss = n_lic = n_ord = n_err = 0
    print("=" * 78)
    for r in results:
        losses = [d for d in r.get("diffs", []) if d[0] == LOSS]
        lics = [d for d in r.get("diffs", []) if d[0] == LICENSED]
        ords = [d for d in r.get("diffs", []) if d[0] == ORDER]
        body_flag = "" if r.get("body_ok", True) else "  BODY-MISMATCH"
        n_loss += len(losses)
        n_lic += len(lics)
        n_ord += len(ords)
        if r.get("error"):
            n_err += 1
        status = ("FAIL" if r.get("error")
                  else "OK " if not losses and r.get("body_ok", True)
                  else "LOSS")
        print(f"[{status}] {r['file']:<46} {r.get('wire_bytes','-'):>5}B{body_flag}")
        for kind, path, why, b, a in lics:
            print(f"        ~ {path}: {why}")
        for kind, path, why, b, a in ords:
            print(f"        o {path}: {why}")
        for kind, path, why, b, a in losses:
            print(f"        ! {path}: {why}")
            print(f"            before: {b!r}")
            print(f"            after : {a!r}")
        for n in r.get("notes", []):
            print(f"        · note {n}")
        if r.get("error"):
            print(f"        ! {r['error']}")
    print("=" * 78)
    print(f"files: {len(results)}   losses: {n_loss}   hard failures: {n_err}   "
          f"spec-licensed changes: {n_lic}   key-order changes: {n_ord}")

    with open(os.path.join(ROOT, "report.json"), "w") as f:
        json.dump(results, f, indent=1, default=str)


if __name__ == "__main__":
    main()
