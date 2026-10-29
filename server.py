import http.server
import socketserver
import json
import os

# Render автоматически передает порт через переменную окружения PORT
PORT = int(os.environ.get("PORT", 10000))
DATA_FILE = "data.json"

class TelemetryHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/collect":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                new_data = json.loads(post_data.decode('utf-8'))
                
                data_list = []
                if os.path.exists(DATA_FILE):
                    try:
                        with open(DATA_FILE, "r", encoding="utf-8") as f:
                            data_list = json.load(f)
                    except json.JSONDecodeError:
                        data_list = []
                
                data_list.append(new_data)
                
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(data_list, f, ensure_ascii=False, indent=4)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/api/get-data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    try:
                        content = f.read()
                        if not content.strip():
                            content = "[]"
                    except:
                        content = "[]"
            else:
                content = "[]"
                
            self.wfile.write(content.encode('utf-8'))
        else:
            super().do_GET()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), TelemetryHandler) as httpd:
        print(f"Сервер запущен на порту {PORT}")
        httpd.serve_forever()