"""Show the first N bytes of files as hex + ASCII, to diagnose encoding damage."""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def peek(path, n=32):
    data = path.read_bytes()[:n]
    hexs = " ".join(f"{b:02x}" for b in data)
    ascii_ = "".join(chr(b) if 32 <= b < 127 else "." for b in data)
    print(f"{path.name:<26} {hexs}")
    print(f"{'':<26} {ascii_}")

targets = sys.argv[1:]
for t in targets:
    p = Path(t)
    if p.is_dir():
        for f in sorted(p.iterdir()):
            if f.is_file():
                peek(f)
    elif p.exists():
        peek(p)
