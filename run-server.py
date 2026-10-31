#!/usr/bin/env python3
"""Static file server for the FeedForge site copy.

Adds two things Python's stock SimpleHTTPRequestHandler lacks and browsers need
for <video> playback:

1. HTTP Range requests (206 Partial Content) -- media elements request byte
   ranges; without 206 support Chrome aborts the request and the video never
   reaches readyState >= 2.
2. Concurrency -- six videos stream at once, so the server must not block on a
   single connection.

Client disconnects (a browser aborting a media range is routine) are swallowed
instead of printing tracebacks.
"""
import argparse
import http.server
import os
import re
import socket
import socketserver
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

PORT = 8000
ROOT = os.path.join(HERE, "downloaded-site")

# Errors raised when the peer goes away mid-response. Normal for <video>.
DISCONNECT_ERRORS = (
    ConnectionAbortedError,
    ConnectionResetError,
    BrokenPipeError,
    socket.timeout,
    TimeoutError,
)

RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")
CHUNK = 64 * 1024


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Keep-alive matters for streaming; every response below sets Content-Length.
    protocol_version = "HTTP/1.1"

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".ttf": "font/ttf",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ico": "image/x-icon",
    }

    def __init__(self, *args, **kwargs):
        self._range_remaining = None
        super().__init__(*args, directory=ROOT, **kwargs)

    # ------------------------------------------------------------------ routing

    def do_POST(self):
        """Analytics beacons POST here; answer politely instead of a 501."""
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_head(self):
        """Serve the whole file, or a 206 slice when a Range header is present."""
        self._range_remaining = None
        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        try:
            size = os.path.getsize(path)
        except OSError:
            self.send_error(404, "File not found")
            return None

        parsed = self._parse_range(range_header, size)
        if parsed == "malformed":
            # Unsatisfiable syntax -> ignore the header and send the full body.
            return super().send_head()
        if parsed is None:
            return self._send_416(size)

        start, end = parsed

        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            f.seek(start)
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Last-Modified", self.date_time_string(os.stat(path).st_mtime))
            self.end_headers()
        except Exception:
            f.close()
            raise

        self._range_remaining = length
        return f

    @staticmethod
    def _parse_range(range_header, size):
        """Return (start, end) inclusive, None if unsatisfiable, 'malformed' if unparsable."""
        m = RANGE_RE.match(range_header.strip())
        if not m:
            return "malformed"

        start_s, end_s = m.group(1), m.group(2)
        if start_s == "":
            # Suffix form: bytes=-N  ->  last N bytes.
            if end_s == "":
                return "malformed"
            length = int(end_s)
            if length == 0:
                return None
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start_s)
            # Open-ended form: bytes=START-  ->  through end of file.
            end = int(end_s) if end_s else size - 1
            if start >= size or start > end:
                return None
            end = min(end, size - 1)

        if size == 0:
            return None
        return start, end

    def _send_416(self, size):
        self.send_response(416)
        self.send_header("Content-Range", f"bytes */{size}")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return None

    # ------------------------------------------------------------------- bodies

    def copyfile(self, source, outputfile):
        """Copy only the requested slice when serving a partial response."""
        remaining = self._range_remaining
        self._range_remaining = None
        if remaining is None:
            try:
                return super().copyfile(source, outputfile)
            except DISCONNECT_ERRORS:
                return None

        while remaining > 0:
            chunk = source.read(min(CHUNK, remaining))
            if not chunk:
                break
            try:
                outputfile.write(chunk)
            except DISCONNECT_ERRORS:
                # Browser aborted the range (seek, pause, page teardown).
                break
            remaining -= len(chunk)

    def end_headers(self):
        if not self._header_sent("accept-ranges"):
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def _header_sent(self, name):
        needle = (name.lower() + ":").encode("latin-1")
        for raw in getattr(self, "_headers_buffer", None) or ():
            if raw.lower().startswith(needle):
                return True
        return False

    # -------------------------------------------------------------------- noise

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except DISCONNECT_ERRORS:
            self.close_connection = True

    def log_message(self, fmt, *args):
        # Range requests are extremely chatty; keep the console readable.
        pass

    def log_error(self, fmt, *args):
        pass


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        exc = sys.exc_info()[1]
        if isinstance(exc, DISCONNECT_ERRORS):
            return
        super().handle_error(request, client_address)


def main():
    global ROOT, PORT

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--root",
        default=ROOT,
        help="directory to serve; relative paths resolve against this script "
             "(default: ./downloaded-site)",
    )
    parser.add_argument("--port", type=int, default=PORT, help="listen port (default: 8000)")
    args = parser.parse_args()

    ROOT = os.path.abspath(os.path.join(HERE, args.root))
    PORT = args.port

    if not os.path.isdir(ROOT):
        parser.error(f"not a directory: {ROOT}")

    pages = sorted(
        f for f in os.listdir(ROOT) if f.endswith(".html") and os.path.isfile(os.path.join(ROOT, f))
    )

    with ThreadedHTTPServer(("", PORT), RangeRequestHandler) as httpd:
        print(f"Site running at: http://localhost:{PORT}")
        print(f"Serving from: {ROOT}")
        print("Range requests: enabled (206 Partial Content) | threaded: yes")
        if pages:
            print("Pages: " + "  ".join("/" + p for p in pages))
        print("Press Ctrl+C to stop\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
