"""Re-download the 4 HTML pages preserving raw bytes exactly.

Writes to tools/_fetched/ first so the bytes can be diffed against the current
local copies before anything is overwritten. Pass --apply to copy into
downloaded-site/.
"""
import pathlib
import re
import sys
import urllib.request

BASE_URL = "https://feed-forge.integritas.agency"
FILES = ["index.html", "about.html", "service.html", "ready.html"]

ROOT = pathlib.Path(__file__).resolve().parent.parent
STAGE = ROOT / "tools" / "_fetched"
DEST = ROOT / "downloaded-site"


def fetch(name: str) -> bytes:
    req = urllib.request.Request(
        f"{BASE_URL}/{name}",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            # No Accept-Encoding -> server returns identity, so bytes are raw.
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        enc = (r.headers.get("Content-Encoding") or "identity").lower()
        if enc != "identity":
            raise RuntimeError(f"unexpected Content-Encoding {enc!r} for {name}")
        return r.read()  # bytes, never decoded to text


def main():
    apply = "--apply" in sys.argv
    STAGE.mkdir(parents=True, exist_ok=True)

    for name in FILES:
        data = fetch(name)
        data.decode("utf-8")  # fail loudly if the source is not valid UTF-8
        (STAGE / name).write_bytes(data)

        title = re.search(rb"<title>(.*?)</title>", data, re.S)
        title_txt = title.group(1).decode("utf-8") if title else "(none)"
        old = (DEST / name).read_bytes() if (DEST / name).exists() else b""
        print(f"{name}: {len(data)} bytes (was {len(old)}), title = {title_txt!r}")

        # asset paths must stay local-relative to /public/
        n_public = len(re.findall(rb'(?:href|src)="/public/', data))
        print(f"  /public/ asset refs: {n_public}")

        if apply:
            (DEST / name).write_bytes(data)
            print("  -> written to downloaded-site/")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
