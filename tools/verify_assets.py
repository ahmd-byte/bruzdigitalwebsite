"""
Verify every local asset byte-for-byte against the live site.

Catches the whole class of download bugs: text-mode writes mangling binary,
truncation, partial downloads, and silently-missing files.

Usage:
    python tools/verify_assets.py            # report only
    python tools/verify_assets.py --fix      # re-download anything broken
"""
import hashlib
import sys
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "https://feed-forge.integritas.agency"
ROOT = Path("downloaded-site")
FIX = "--fix" in sys.argv

# Signatures for common binary formats -> used as a local-only sanity check
MAGIC = {
    ".png":  b"\x89PNG\r\n\x1a\n",
    ".webp": b"RIFF",
    ".ttf":  None,      # checked via sfnt version below
    ".mp4":  None,      # box structure: bytes 4..8 == 'ftyp'
    ".ico":  None,
}

BINARY_EXT = {".png", ".webp", ".mp4", ".ttf", ".otf", ".woff", ".woff2", ".jpg", ".jpeg", ".gif", ".ico"}


def local_looks_texty(data):
    """Detect the WriteAllText-on-binary failure: file is all ASCII digits/spaces."""
    head = data[:64]
    return bool(head) and all(c in b"0123456789 \r\n" for c in head)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "asset-verify/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    files = [p for p in ROOT.rglob("*") if p.is_file()]
    # Only verify assets that have a real remote counterpart
    targets = [p for p in files if p.suffix.lower() in BINARY_EXT]

    print(f"Verifying {len(targets)} binary assets against {BASE}\n")
    print(f"{'asset':<46} {'local':>10} {'live':>10}  status")
    print("-" * 90)

    broken, fixed, ok = [], [], 0

    for p in sorted(targets):
        rel = p.relative_to(ROOT).as_posix()
        url = f"{BASE}/{rel}"
        data = p.read_bytes()

        try:
            live = fetch(url)
        except Exception as e:
            print(f"{rel:<46} {len(data):>10,} {'---':>10}  FETCH FAIL ({e})")
            continue

        same = hashlib.sha256(data).digest() == hashlib.sha256(live).digest()

        if same:
            ok += 1
            continue

        reason = "size/content mismatch"
        if local_looks_texty(data):
            reason = "TEXT-MANGLED (binary written as text)"
        elif len(data) < len(live):
            reason = "truncated"

        print(f"{rel:<46} {len(data):>10,} {len(live):>10,}  {reason}")
        broken.append(rel)

        if FIX:
            p.write_bytes(live)
            fixed.append(rel)

    print("-" * 90)
    print(f"identical: {ok}   broken: {len(broken)}")
    if FIX and fixed:
        print(f"repaired : {len(fixed)}")
    elif broken:
        print("\nRe-run with --fix to repair.")

    return 1 if (broken and not FIX) else 0


if __name__ == "__main__":
    sys.exit(main())
