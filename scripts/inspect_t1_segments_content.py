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

def transcribe(audio_path):
    with open(audio_path, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = json.dumps({
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "audio/mp3", "data": b64}},
                {"text": "Transcribe the spoken audio completely word for word. Also note if there are multiple recordings or truncated sentences."}
            ]
        }]
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res["candidates"][0]["content"]["parts"][0]["text"].strip()

# Let's read Test 1 public questions
pub_path = "project/data/tests/aptis-b2-01-public.json"
with open(pub_path, "r", encoding="utf-8") as f:
    pub = json.load(f)
p1_tasks = pub["listening"]["parts"][0]["tasks"]

print("=== TRANSCRIBING CURRENT TEST 1 SEGMENTS ===")
for idx, task in enumerate(p1_tasks):
    q_num = idx + 1
    fn = f"q{q_num:02d}.mp3"
    fp = os.path.join("project/public/audio/listening/segments/aptis-b2-01/part-1", fn)
    print(f"\n--- Question {q_num}: {task['questionText']} ---")
    print(f"Options: {task['options']}")
    if os.path.exists(fp):
        sz = os.path.getsize(fp)
        try:
            txt = transcribe(fp)
            print(f"File {fn} ({sz} bytes) Transcription:\n{txt}")
        except Exception as e:
            print(f"File {fn} error: {e}")
    else:
        print(f"File {fn} DOES NOT EXIST!")
