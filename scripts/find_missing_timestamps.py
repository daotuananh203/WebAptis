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

def call_gemini(prompt_text, audio_path, model="gemini-1.5-flash"):
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
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

t1_prompt = """
Listen to this audio (aptis-b2-01.mp3).
Find the exact start and end timestamps (in seconds from the beginning of the file) for Question 13 of Part 1 (where a woman talks about her vacation with Lisa / mother and daughter).
Return a JSON object with:
{"questionNumber": 13, "start": float, "end": float, "first_words": string, "last_words": string}
"""

t9_prompt = """
Listen to this audio (aptis-b2-09.mp3).
Find the exact start and end timestamps (in seconds from beginning of file) for questions 10, 11, 12, 13 of Part 1.
Return a JSON array of objects:
[
  {"questionNumber": 10, "start": float, "end": float, "first_words": string, "last_words": string},
  {"questionNumber": 11, "start": float, "end": float, "first_words": string, "last_words": string},
  {"questionNumber": 12, "start": float, "end": float, "first_words": string, "last_words": string},
  {"questionNumber": 13, "start": float, "end": float, "first_words": string, "last_words": string}
]
"""

print("Calling Gemini 1.5 Flash for Test 1 Q13 timestamps...")
t1_res = call_gemini(t1_prompt, "project/public/audio/listening/aptis-b2-01.mp3")
print("Test 1 Q13 result:")
print(t1_res)

print("\nCalling Gemini 1.5 Flash for Test 9 Q10-13 timestamps...")
t9_res = call_gemini(t9_prompt, "project/public/audio/listening/aptis-b2-09.mp3")
print("Test 9 result:")
print(t9_res)
