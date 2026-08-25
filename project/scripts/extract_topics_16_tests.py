import zipfile
import xml.etree.ElementTree as ET
import os
import re

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập"

def get_text(p):
    with zipfile.ZipFile(p) as z:
        xml = z.read("word/document.xml")
        tree = ET.fromstring(xml)
        return " ".join([e.text for e in tree.iter() if e.tag.endswith('t') and e.text])

print("================================================================================")
print("READING & LISTENING CONTENT ANALYSIS FOR ALL 16 INTEGRATED APTIS TESTS")
print("================================================================================")

for i in range(1, 17):
    files = [f for f in os.listdir(folder) if f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i}-") or f == f"Đề {i}.docx" or f == f"Đề {i} - Aptis.docx" or f == f"Đề {i} - Aptis_.docx" or f"Đề {i}" in f]
    f = files[0]
    text = get_text(os.path.join(folder, f))
    
    # Try to find Reading Part 1 opening
    r1_match = re.search(r'(?:READING|ĐỌC)[\s\S]{1,100}?(?:Part 1|Phần 1)[\s\S]{1,300}', text, re.I)
    # Try to find Reading Part 4 heading/passage
    r4_match = re.search(r'(?:Part 4|Phần 4)[\s\S]{1,200}?(?:Read the passage|Choose a heading|heading)[\s\S]{1,300}', text, re.I)
    # Try to find Listening Part 1 opening
    l1_match = re.search(r'(?:LISTENING|NGHE)[\s\S]{1,100}?(?:Part 1|Q1|Question 1)[\s\S]{1,250}', text, re.I)
    
    print(f"=== TEST {i:02d} ({f}) ===")
    if l1_match:
        print(f"  [Listening Part 1 snippet]: {l1_match.group(0).strip()[:180]}...")
    if r1_match:
        print(f"  [Reading Part 1 snippet]:   {r1_match.group(0).strip()[:180]}...")
    elif "reading" in text.lower():
        # find where reading starts
        idx = text.lower().find("reading")
        print(f"  [Reading start snippet]:    {text[idx:idx+200].strip()}...")
    print()
