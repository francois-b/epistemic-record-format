#!/usr/bin/env python3
"""Check every internal link in a built site, and that nothing fetches.

    python3 site/check-links.py site/build

Three things are checked, and each of them has been wrong at least once in
a static site of this shape:

1. Every internal href and src resolves to a file that exists, and every
   fragment resolves to an id on the page it names. A rendered corpus is
   almost entirely cross-references, so one renamed page breaks hundreds of
   links at once and nothing at build time notices.
2. No page fetches anything. The site must open from disk and host
   anywhere, which means no external stylesheet, script, font or image. A
   link to an external document is fine; a subresource is not.
3. No unsubstituted build token survives into the output.

Exits 1 on any failure, listing every one rather than the first.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

# Attributes that make the browser fetch something as part of rendering the
# page, as against attributes that merely point somewhere.
SUBRESOURCE = {"script": "src", "img": "src", "iframe": "src",
               "source": "src", "video": "src", "audio": "src",
               "embed": "src", "object": "data"}


class Refs(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []   # (url, attribute kind)
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: (v or "") for k, v in attrs}
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and "href" in a:
            self.links.append((a["href"], "link"))
        elif tag == "link" and "href" in a:
            # A stylesheet is fetched; rel=canonical and friends are not.
            rel = a.get("rel", "").lower()
            self.links.append((a["href"], "subresource" if "stylesheet" in rel or "icon" in rel else "link"))
        elif tag in SUBRESOURCE and SUBRESOURCE[tag] in a:
            self.links.append((a[SUBRESOURCE[tag]], "subresource"))


def main(argv: list[str]) -> int:
    root = Path(argv[1] if len(argv) > 1 else "site/build").resolve()
    if not root.is_dir():
        print(f"not a directory: {root}", file=sys.stderr)
        return 2

    pages = sorted(root.rglob("*.html"))
    if not pages:
        print(f"no HTML under {root}", file=sys.stderr)
        return 2

    ids: dict[Path, set[str]] = {}
    refs: dict[Path, list[tuple[str, str]]] = {}
    problems: list[str] = []
    external: set[str] = set()

    for p in pages:
        text = p.read_text(encoding="utf-8")
        for token in re.findall(r"\{\{[A-Z_]+\}\}", text):
            problems.append(f"{p.relative_to(root)}: unsubstituted build token {token}")
        r = Refs()
        r.feed(text)
        ids[p] = r.ids
        refs[p] = r.links

    for p, links in refs.items():
        here = p.relative_to(root)
        for url, kind in links:
            parts = urlsplit(url)
            if parts.scheme in ("http", "https"):
                if kind == "subresource":
                    problems.append(f"{here}: fetches an external subresource, {url}")
                else:
                    external.add(url)
                continue
            if parts.scheme in ("mailto", "data", "tel"):
                continue
            if not parts.path and parts.fragment:          # same-page anchor
                if parts.fragment not in ids[p]:
                    problems.append(f"{here}: #{parts.fragment} names no id on this page")
                continue
            target = (p.parent / unquote(parts.path)).resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                problems.append(f"{here}: {url} resolves to nothing ({target.relative_to(root) if root in target.parents else target})")
                continue
            if parts.fragment and target.suffix == ".html":
                if parts.fragment not in ids.get(target, set()):
                    problems.append(f"{here}: {url} names no id on {target.relative_to(root)}")

    total = sum(len(v) for v in refs.values())
    print(f"{len(pages)} pages, {total} references, {len(external)} distinct external links (not fetched)")
    for u in sorted(external):
        print(f"  external  {u}")
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for x in problems:
            print(f"  {x}")
        return 1
    print("every internal reference resolves; no page fetches anything external")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
