#!/usr/bin/env python3
"""build-sources.py 1.0.0 — write corpus/sources.yaml from work/source-specs.json.

Both digests (ERF-71 on the raw file, `normalized_digest` on the normalized
text) are computed from the bytes on disk at build time, so the source list
cannot drift from the files it describes. Every string-typed scalar is
emitted double-quoted (ERF-65) by erf_yaml.
"""
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from erf_yaml import emit  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent


def sha256(path: pathlib.Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    specs = json.loads((ROOT / "work" / "source-specs.json").read_text(encoding="utf-8"))
    sources = {}
    for spec in specs:
        sid = spec["id"]
        entry = {"citation_text": spec["citation_text"]}
        if spec.get("citation"):
            entry["citation"] = spec["citation"]
        received = {}
        if spec.get("url"):
            received["url"] = spec["url"]
        raw = ROOT / "corpus" / "raw" / f"{sid}.{spec.get('ext', 'html')}"
        if raw.exists():
            received["path"] = f"raw/{raw.name}"
            received["digest"] = sha256(raw)
        if spec.get("received_timestamp"):
            received["timestamp"] = spec["received_timestamp"]
        if received:
            entry["received"] = received
        entry["status"] = spec["status"]
        norm = ROOT / "corpus" / "normalized" / f"{sid}.md"
        if norm.exists():
            entry["normalized"] = f"normalized/{sid}.md"
            entry["normalized_digest"] = sha256(norm)
        if spec.get("reason"):
            entry["reason"] = spec["reason"]
        if spec.get("licence"):
            entry["licence"] = spec["licence"]
        if spec.get("licence_name"):
            entry["licence_name"] = spec["licence_name"]
        if spec.get("excerpt_date"):
            entry["excerpt"] = {"timestamp": spec["excerpt_date"],
                                "by": spec.get("excerpt_by", "agent/claude-opus-5")}
        if spec.get("extraction"):
            entry["extraction"] = spec["extraction"]
        if spec.get("normalization"):
            entry["normalization"] = spec["normalization"]
        sources[sid] = entry

    doc = {"type": "sources", "sources": sources}
    (ROOT / "corpus" / "sources.yaml").write_text(emit(doc) + "\n", encoding="utf-8")
    print(f"corpus/sources.yaml: {len(sources)} sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
