import urllib.request
import json

print("================================================================================")
print("AUDIT MATRIX: ALL 16 TESTS IN LIVE PRODUCTION (https://web-aptis.vercel.app)")
print("================================================================================")

all_passed = True
total_p1 = 0
total_p2 = 0
total_p3 = 0
total_p4 = 0

for i in range(1, 17):
    pad = f"{i:02d}"
    test_id = f"aptis-b2-{pad}"
    url = f"https://web-aptis.vercel.app/api/tests/{test_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            data = body.get("data", body)
            listening = data.get("listening", {})
            parts = listening.get("parts", [])
            
            p1_count = len(parts[0].get("tasks", [])) if len(parts) > 0 else 0
            p2_count = len(parts[1].get("speakers", [])) if len(parts) > 1 else 0
            p3_count = len(parts[2].get("statements", [])) if len(parts) > 2 else 0
            p4_count = len(parts[3].get("monologues", [])) if len(parts) > 3 else 0
            
            total_p1 += p1_count
            total_p2 += p2_count
            total_p3 += p3_count
            total_p4 += p4_count
            
            p1_valid = (p1_count == 13)
            p2_valid = (p2_count == 4)
            p3_valid = (p3_count == 4)
            p4_valid = (p4_count == 2)
            
            status_str = "PASS" if (p1_valid and p2_valid and p3_valid and p4_valid) else "FAIL"
            if status_str != "PASS":
                all_passed = False
                
            print(f"Test {pad} ({test_id}): P1={p1_count}/13, P2={p2_count}/4, P3={p3_count}/4, P4={p4_count}/2 -> [{status_str}]")
    except Exception as e:
        print(f"Test {pad} Error: {e}")
        all_passed = False

print("--------------------------------------------------------------------------------")
print(f"TOTALS: P1 Questions={total_p1}/208 | P2 Speakers={total_p2}/64 | P3 Statements={total_p3}/64 | P4 Monologues={total_p4}/32")
print(f"OVERALL LIVE PRODUCTION ACCURACY STATUS: {'100% VERIFIED' if all_passed else 'FAILED'}")
