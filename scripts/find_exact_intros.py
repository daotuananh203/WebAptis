import json

with open("scratch_whisper_t01.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

# Let's find every distinct question intro or opening phrase in Test 01:
# Q1: "Hey, I just wanted to tell you about my new car" -> starts at seg where text starts with "Hey, I just wanted to tell you about my new car"
# Q2: "Hi, Rose. It's Ahmed"
# Q3: "Hello, I need to call the tele shop"
# Q4: "Hello, I would like to buy a top"
# Q5: "Hey, Max. It's Anna"
# Q6: "Hi, James. It's Vincent"
# Q7: "Last year, I had an amazing trip"
# Q8: "I've always loved science"
# Q9: "I can't wait for the concert this weekend"
# Q10: "On our family trip last summer"
# Q11: "Hey, could you do me a favor? My sister is waiting outside"
# Q12: "Hi, it's me. I wanted to confirm where we're meeting today"
# Q13: "I just got back from an amazing vacation with Lisa"
# Part 2: "I've always been drawn to outdoor activities" (Speaker A)

intros = [
    ("Q01", "Hey, I just wanted to tell you about my new car"),
    ("Q02", "Hi, Rose. It's Ahmed"),
    ("Q03", "Hello, I need to call the tele"),
    ("Q04", "Hello, I would like to buy a top"),
    ("Q05", "Hey, Max"),
    ("Q06", "Hi, James"),
    ("Q07", "Last year, I had an amazing trip"),
    ("Q08", "I've always loved science"),
    ("Q09", "I can't wait for the concert this weekend"),
    ("Q10", "On our family trip last summer"),
    ("Q11", "Hey, could you do me a favor"),
    ("Q12", "Hi, it's me. I wanted to confirm"),
    ("Q13", "I just got back from an amazing vacation with Lisa"),
    ("P2_SpkA", "I've always been drawn to outdoor activities")
]

intro_indices = []
for q_name, phrase in intros:
    for idx, s in enumerate(segs):
        if phrase.lower() in s['text'].lower():
            # Only take the first occurrence after previous intro
            prev_idx = intro_indices[-1][1] if intro_indices else -1
            if idx > prev_idx:
                intro_indices.append((q_name, idx, s['start'], s['text']))
                break

print("=== EXACT FIRST SEGMENT PER QUESTION ===")
for q_name, idx, st, txt in intro_indices:
    print(f"{q_name} (Seg {idx:03d}, start {st:06.2f}s): {txt}")
