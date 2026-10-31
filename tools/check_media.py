"""
MP4/media integrity checker.

Walks the ISO-BMFF (MP4) box structure to distinguish genuinely corrupt or
truncated files from files that are intact but failing to stream for other
reasons (e.g. a server that ignores HTTP Range requests).

Usage:
    python tools/check_media.py <dir-or-file> [...]
"""
import sys
import struct
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Boxes that must be present at the top level for a playable MP4
REQUIRED = {"ftyp", "moov", "mdat"}


def read_boxes(path):
    """Yield (type, declared_size, offset, actual_available) for top-level boxes."""
    size = path.stat().st_size
    boxes = []
    off = 0
    with path.open("rb") as f:
        while off < size:
            f.seek(off)
            header = f.read(8)
            if len(header) < 8:
                boxes.append(("<truncated header>", 0, off, size - off))
                break

            box_size = struct.unpack(">I", header[0:4])[0]
            box_type = header[4:8].decode("latin-1", errors="replace")

            header_len = 8
            if box_size == 1:
                # 64-bit extended size
                ext = f.read(8)
                if len(ext) < 8:
                    boxes.append((box_type, 0, off, size - off))
                    break
                box_size = struct.unpack(">Q", ext)[0]
                header_len = 16
            elif box_size == 0:
                # Box extends to end of file
                box_size = size - off

            available = size - off
            boxes.append((box_type, box_size, off, available))

            if box_size < header_len:
                break
            off += box_size
    return boxes, size


def check(path):
    boxes, size = read_boxes(path)
    types = {b[0] for b in boxes}
    problems = []

    if size == 0:
        problems.append("file is empty")

    if not boxes or boxes[0][0] != "ftyp":
        first = boxes[0][0] if boxes else "<none>"
        problems.append(f"first box is {first!r}, expected 'ftyp' (not a valid MP4)")

    missing = REQUIRED - types
    if missing:
        problems.append(f"missing required box(es): {', '.join(sorted(missing))}")

    # Truncation: a declared box size that runs past end of file
    for btype, declared, off, available in boxes:
        if declared > available:
            problems.append(
                f"box {btype!r} at offset {off} declares {declared} bytes "
                f"but only {available} remain (TRUNCATED)"
            )

    # moov before mdat means the file is 'faststart' (streams without full download)
    order = [b[0] for b in boxes]
    faststart = None
    if "moov" in order and "mdat" in order:
        faststart = order.index("moov") < order.index("mdat")

    return {
        "path": path,
        "size": size,
        "boxes": order,
        "problems": problems,
        "faststart": faststart,
        "ok": not problems,
    }


def main(targets):
    files = []
    for t in targets:
        p = Path(t)
        if p.is_dir():
            files.extend(sorted(p.rglob("*.mp4")))
        elif p.exists():
            files.append(p)

    if not files:
        print("No .mp4 files found.")
        return 1

    bad = 0
    print(f"{'file':<28} {'size':>10}  {'faststart':<9} verdict")
    print("-" * 78)
    for f in files:
        r = check(f)
        if not r["ok"]:
            bad += 1
        verdict = "OK" if r["ok"] else "PROBLEM"
        fs = {True: "yes", False: "no", None: "n/a"}[r["faststart"]]
        print(f"{f.name:<28} {r['size']:>10,}  {fs:<9} {verdict}")
        if not r["ok"]:
            for p in r["problems"]:
                print(f"    ! {p}")
        print(f"    boxes: {' '.join(r['boxes'])}")

    print("-" * 78)
    print(f"{len(files)} file(s) checked, {bad} with problems")
    return 0


if __name__ == "__main__":
    args = sys.argv[1:] or ["downloaded-site/public/videos"]
    sys.exit(main(args))
