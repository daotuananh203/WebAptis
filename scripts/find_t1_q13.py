import os
import json
import base64
import urllib.request

env_path = r"d:\ỨNG DỤNG AI AGENT CHO NGHIÊN CỨU KHOA HỌC-20260513T124251Z-3-001\WebAptis\project\.env.local"
api_key = os.environ.get("GEMINI_API_KEY", "")
if not api_key and os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")

def call_gemini(prompt_text, audio_bytes, model="gemini-flash-latest"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    b64 = base64.b64encode(audio_bytes).decode("utf-8")
    req_body = json.dumps({
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "audio/mp3", "data": b64}},
                {"text": prompt_text}
            ]
        }]
    }).encode("utf-8")
    req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"]

# Let's read first 10 minutes (first 600s) of Test 1 to find Q13:
# Or let's see how many bytes is 10 mins: 128kbps = 16KB/s * 600s = 9.6 MB
with open("project/public/audio/listening/aptis-b2-01.mp3", "rb") as f:
    t1_chunk = f.read(10 * 1024 * 1024)

print("Searching Q13 in Test 1 chunk (first 10MB)...")
prompt1 = """
This audio contains Part 1 of an English listening test.
Question 13 is where a woman talks about her vacation with Lisa (e.g. 'Lisa and I have been friends since college...').
Find the exact start and end seconds of Question 13 in this audio snippet.
Return JSON: {"start": float, "end": float, "first_words": string, "last_words": string}
"""
res1 = call_gemini(prompt1, t1_chunk)
print("Test 1 Q13 result:")
print(res1)
