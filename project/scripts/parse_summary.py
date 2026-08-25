import json
import re

with open(r"project\scripts\analysis_summary.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("=== 1. GOOGLE DOCS / DRIVE LINKS DETECTED IN FILES ===")
for item in data:
    analysis = item.get("text_analysis", {})
    g_docs = analysis.get("google_docs", [])
    if g_docs:
        print(f"File: {item['rel_path']}")
        for url in g_docs:
            print(f"   -> {url}")

print("\n=== 2. EDULIFE VS BRITISH COUNCIL MENTIONS ===")
for item in data:
    analysis = item.get("text_analysis", {})
    e_cnt = analysis.get("edulife_mentions", 0)
    bc_cnt = analysis.get("bc_mentions", 0)
    if e_cnt > 0 or bc_cnt > 0:
        print(f"File: {item['rel_path']} | Edulife: {e_cnt} | British Council: {bc_cnt}")

print("\n=== 3. READING & WRITING & SPEAKING SNIPPETS ===")
for item in data:
    if any(k in item['rel_path'].lower() for k in ['reading', 'writing', 'speaking']) and item.get('ext') in ['.docx', '.pptx']:
        analysis = item.get('text_analysis', {})
        print(f"\n--- {item['rel_path']} ({item['size_mb']} MB) ---")
        print(analysis.get('snippet', '')[:200])
