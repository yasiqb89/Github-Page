#!/usr/bin/env python3
"""Tiny static dev server for the Focus marketing site.

Serves ./web with `Cache-Control: no-store` so CSS/JS edits show up on a
plain reload (the default python http.server lets browsers heuristically
cache module scripts and stylesheets, which makes iterating painful).
"""
import functools
import http.server
import socketserver

import os
PORT = int(os.environ.get("PORT", "4124"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Focus dev server (no-cache) on http://localhost:{PORT}")
        httpd.serve_forever()
