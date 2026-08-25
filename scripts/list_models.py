import os
import json
import urllib.request

env_path = r"d:\ỨNG DỤNG AI AGENT CHO NGHIÊN CỨU KHOA HỌC-20260513T124251Z-3-001\WebAptis\project\.env.local"
api_key = os.environ.get("GEMINI_API_KEY", "")
if not api_key and os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    for m in data.get("models", []):
        if "generateContent" in m.get("supportedGenerationMethods", []):
            print(m["name"])
