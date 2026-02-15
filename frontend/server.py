import http.server
import os

DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Serve the file if it exists, otherwise fall back to index.html
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            super().do_GET()
        else:
            self.path = "/index.html"
            super().do_GET()


if __name__ == "__main__":
    port = 5500
    server = http.server.HTTPServer(("0.0.0.0", port), SPAHandler)
    print(f"Frontend serving at http://localhost:{port}")
    server.serve_forever()
