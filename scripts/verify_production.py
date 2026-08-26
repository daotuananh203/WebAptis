import urllib.request
import json

for test_idx in [1, 8, 16]:
    pad = f"{test_idx:02d}"
    test_id = f"aptis-b2-{pad}"
    url = f"https://web-aptis.vercel.app/api/tests/{test_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            data = body.get("data", body)
            listening = data.get("listening", {})
            parts = listening.get("parts", [])
            p1_tasks = parts[0].get("tasks", []) if len(parts) > 0 else []
            print(f"\n=== LIVE PRODUCTION TEST {pad} ===")
            print(f"HTTP Status: {resp.status}")
            print(f"Total Listening Parts: {len(parts)}")
            print(f"Part 1 Questions Count: {len(p1_tasks)}")
            if p1_tasks:
                print(f"  Q1 Text: {p1_tasks[0].get('questionText')}")
                print(f"  Q1 Options: {p1_tasks[0].get('options')}")
                print(f"  Q1 Audio URL: {p1_tasks[0].get('audioUrl')}")
                print(f"  Q13 Text: {p1_tasks[-1].get('questionText')}")
                print(f"  Q13 Options: {p1_tasks[-1].get('options')}")
            if len(parts) > 1:
                print(f"Part 2 Speakers: {len(parts[1].get('speakers', []))}")
                print(f"Part 3 Statements: {len(parts[2].get('statements', []))}")
                print(f"Part 4 Monologues: {len(parts[3].get('monologues', []))}")
    except Exception as e:
        print(f"Test {pad} Error: {e}")
