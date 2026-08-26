import json
import os

with open("scratch_t1_whisper_transcript.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Let's group segments by content for Test 1
# Q1: 64.0 - 114.0
# Q2: 114.0 - 158.0 ("Hi, Rose. It's Ahmed...")
# Q3: 158.0 - 215.0 ("Hello, I need to call the tele shop...")
# Q4: 215.0 - 282.0 ("Hello, I would like to buy a top...")
# Q5: 282.0 - 355.0 ("Hey, Max. It's Anna...")
# Q6: 355.0 - 402.0 ("Hi, James. It's Vincent...")
# Q7: 402.0 - 498.0 ("Last year, I had an amazing trip...")
# Q8: 498.0 - 570.0 ("I've always loved science...")
# Q9: 570.0 - 655.0 ("I can't wait for the concert...")
# Q10: 655.0 - 706.0 ("On our family trip last summer...")
# Q11: 706.0 - 772.0 ("Hey, could you do me a favor? My sister is waiting...")
# Q12: 772.0 - 836.0 ("Hi, it's me. I wanted to confirm where we're meeting...")
# Q13: 836.0 - 888.0 ("I just got back from an amazing vacation with Lisa...")

# Part 2 Speakers:
# Spk A: 888.0 - 926.0 ("I've always been drawn to outdoor activities...")
# Spk B: 926.0 - 958.0 ("When it comes to staying active...")
# Spk C: 958.0 - 990.0 ("I prefer something more low-key...")
# Spk D: 990.0 - 1040.0 ("I've been involved in different sports...")

# Part 3 Discussion:
# 1040.0 - 1195.0 ("I really enjoy the presentation today about the development of the internet...")

# Part 4 Monologues:
# Mono 1: 1195.0 - 1315.0 ("Good evening, everyone. Today we're excited to talk about the latest novel by popular author James Parker...")
# Mono 2: 1315.0 - 1375.0 ("Good morning, everyone. Today I want to talk about professionalism...")

print("Test 1 boundary map ready.")
