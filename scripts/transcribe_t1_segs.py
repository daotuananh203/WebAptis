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

def transcribe_audio(audio_path, model="models/gemini-2.5-flash"):
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={api_key}"
    b64 = base64.b64encode(audio_bytes).decode("utf-8")
    req_body = json.dumps({
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "audio/mp3", "data": b64}},
                {"text": "Transcribe the spoken English words. Return ONLY the text."}
            ]
        }]
    }).encode("utf-8")
    req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

print("=== TRANSCRIBING TEST 1 EXISTING SEGMENTS ===")
for i in range(1, 13):
    fn = f"q{i:02d}.mp3"
    fp = os.path.join("project/public/audio/listening/segments/aptis-b2-01/part-1", fn)
    if os.path.exists(fp):
        t = transcribe_audio(fp)
        print(f"Test 1 {fn}: {t}")
