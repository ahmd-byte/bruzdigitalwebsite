"""Confirm the freshly fetched bytes differ from the local copies ONLY by the
cp1252<->utf-8 mojibake, i.e. no markup or asset-path changes."""
import difflib
import pathlib
import sys

FILES = ["index.html", "about.html", "service.html", "ready.html"]
ROOT = pathlib.Path(__file__).resolve().parent.parent
STAGE = ROOT / "tools" / "_fetched"
DEST = ROOT / "downloaded-site"


def main():
    for name in FILES:
        old = (DEST / name).read_bytes()
        new = (STAGE / name).read_bytes()
        # undo the corruption: old bytes were utf-8 text re-encoded... the text
        # itself was produced by decoding utf-8 bytes as cp1252.
        recovered = old.decode("utf-8").encode("cp1252", errors="replace")
        print(f"=== {name}: recovered == fetched ? {recovered == new}")
        if recovered != new:
            a = recovered.decode("utf-8", "replace").splitlines()
            b = new.decode("utf-8", "replace").splitlines()
            for line in list(difflib.unified_diff(a, b, "recovered", "fetched", n=1))[:60]:
                print(line)
        # asset path sanity
        for token in ('href="/public/', 'src="/public/', "/cdn-cgi/"):
            print(f"    {token!r}: old={old.decode('utf-8').count(token)} new={new.decode('utf-8').count(token)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
