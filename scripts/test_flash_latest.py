import os
import json
import urllib.request

env_path = r"project\.env.local"
api_key = ""
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
req = urllib.request.Request(
    url,
    data=json.dumps({"contents": [{"parts": [{"text": "Hello"}]}]}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("SUCCESS:", res["candidates"][0]["content"]["parts"][0]["text"])
except Exception as e:
    print("FAILED:", e)
