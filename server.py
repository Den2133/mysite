import http.server
import socketserver
import json
import os

PORT = int(os.environ.get("PORT", 8000))
DATA_FILE = "data.json"

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/collect":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Читаем старые данные или создаем список
                existing_data = []
                if os.path.exists(DATA_FILE):
                    with open(DATA_FILE, "r", encoding="utf-8") as f:
                        try:
                            existing_data = json.load(f)
                        except json.JSONDecodeError:
                            existing_data = []
                
                existing_data.append(data)
                
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=4)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
        else:
            super().do_POST()

    def do_GET(self):
        if self.path == "/api/get-data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'[]')
        else:
            super().do_GET()

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Сервер запущен! Открой в браузере: http://localhost:{PORT}")
    httpd.serve_forever()