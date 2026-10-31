"""Print raw <title> and <h1> bytes/text from the local downloaded HTML files."""
import re
import pathlib
import sys

FILES = ["index.html", "about.html", "service.html", "ready.html"]
BASE = pathlib.Path(__file__).resolve().parent.parent / "downloaded-site"


def main():
    for name in FILES:
        p = BASE / name
        raw = p.read_bytes()
        title_m = re.search(rb"<title>(.*?)</title>", raw, re.S)
        h1_m = re.search(rb"<h1\b.*?>(.*?)</h1>", raw, re.S)
        print(f"=== {name} ({len(raw)} bytes) ===")
        if title_m:
            t = title_m.group(1)
            print("  title bytes :", t)
            print("  title utf8  :", t.decode("utf-8", errors="replace"))
        if h1_m:
            h = re.sub(rb"\s+", b" ", h1_m.group(1)).strip()
            print("  h1 bytes    :", h[:200])
            print("  h1 utf8     :", h[:200].decode("utf-8", errors="replace"))
        # sanity: is the whole file valid utf-8?
        try:
            raw.decode("utf-8")
            print("  valid utf-8 : yes")
        except UnicodeDecodeError as e:
            print("  valid utf-8 : NO ->", e)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
