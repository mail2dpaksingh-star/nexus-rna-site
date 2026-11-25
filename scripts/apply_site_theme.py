#!/usr/bin/env python3
"""Apply the homepage blue-and-white theme to public NEXUS subpages.

Presentation-only HTML changes:
- one stylesheet link, loaded after existing head styles
- one body class to opt into carefully scoped CSS
- a light browser theme-color on pages already declaring the metadata

Does not rewrite or remove existing CSS, JavaScript, forms, UI modules or content.
"""
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets" / "nexus-site-theme.css"
SKIP = {"index.html", "homepage_v1.7_backup.html", "site-check.html"}
MARKER = 'data-nexus-site-theme="1"'
BODY = re.compile(r"<body\b([^>]*)>", re.I)
HEAD_END = re.compile(r"</head\s*>", re.I)
CLASS = re.compile(r'\bclass\s*=\s*(["\'])(.*?)\1', re.I | re.S)
META = re.compile(r"<meta\b[^>]*>", re.I)


def transform(path: Path, content: str) -> str:
    if MARKER in content:
        return content
    if not HEAD_END.search(content) or not BODY.search(content):
        raise RuntimeError(f"{path.relative_to(ROOT)}: missing body/head closing tag")
    relative = os.path.relpath(CSS, path.parent).replace(os.sep, "/")
    link = f'<link rel="stylesheet" href="{relative}" {MARKER}>\n'
    new = HEAD_END.sub(lambda m: link + m.group(0), content, count=1)

    def body_replacement(match: re.Match[str]) -> str:
        attrs = match.group(1)
        if CLASS.search(attrs):
            attrs = CLASS.sub(lambda m: f'class={m.group(1)}{m.group(2)} nexus-site-theme{m.group(1)}', attrs, count=1)
        else:
            attrs += ' class="nexus-site-theme"'
        return "<body" + attrs + ">"

    new = BODY.sub(body_replacement, new, count=1)

    def recolor_metadata(match: re.Match[str]) -> str:
        tag = match.group(0)
        if not re.search(r'\bname\s*=\s*(["\'])theme-color\1', tag, re.I):
            return tag
        return re.sub(r'\bcontent\s*=\s*(["\'])[^"\']+\1', 'content="#ffffff"', tag, count=1, flags=re.I)

    return META.sub(recolor_metadata, new)


def verify(path: Path, content: str) -> None:
    relative = os.path.relpath(CSS, path.parent).replace(os.sep, "/")
    if content.count(MARKER) != 1 or f'href="{relative}"' not in content:
        raise RuntimeError(f"{path.relative_to(ROOT)}: theme link missing or duplicated")
    body = BODY.search(content)
    if not body or "nexus-site-theme" not in body.group(0):
        raise RuntimeError(f"{path.relative_to(ROOT)}: theme body marker missing")
    if not HEAD_END.search(content):
        raise RuntimeError(f"{path.relative_to(ROOT)}: </head> missing")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Validate without editing")
    args = parser.parse_args()

    if not CSS.is_file():
        raise RuntimeError("Shared theme stylesheet is missing")
    candidates = [p for p in ROOT.rglob("*.html") if
                  p.relative_to(ROOT).as_posix() not in SKIP and
                  ".git" not in p.parts]
    if len(candidates) < 40:
        raise RuntimeError(f"Unexpectedly few website pages: {len(candidates)}")

    count = 0
    for path in sorted(candidates):
        before = path.read_text(encoding="utf-8")
        if args.check:
            verify(path, before)
        else:
            after = transform(path, before)
            verify(path, after)
            if after != before:
                path.write_text(after, encoding="utf-8")
                count += 1

    print(f"{'Verified' if args.check else 'Harmonized'} {len(candidates)} public subpages; {count} files modified.")
    # Excluded: the original homepage (already the visual reference), an archived
    # backup snapshot and a diagnostics page. No underlying scientific logic touched.


if __name__ == "__main__":
    main()
