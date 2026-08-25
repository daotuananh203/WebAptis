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
print("SECTION BREAKDOWN FOR ALL 16 TESTS IN '01. Đề Luyện Tập'")
print("================================================================================")

for i in range(1, 17):
    files = [f for f in os.listdir(folder) if f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i}-") or f == f"Đề {i}.docx" or f == f"Đề {i} - Aptis.docx" or f == f"Đề {i} - Aptis_.docx" or f"Đề {i}" in f]
    f = files[0]
    path = os.path.join(folder, f)
    text = get_text(path)
    
    # Check parts
    has_lis_p1 = bool(re.search(r'part\s*1.*(?:q1|question 1|calling|talking|hear)', text, re.I))
    has_lis_p2 = bool(re.search(r'part\s*2.*(?:opinion|speaker|four people)', text, re.I))
    has_lis_p3 = bool(re.search(r'part\s*3.*(?:man|woman|agree|both)', text, re.I))
    has_lis_p4 = bool(re.search(r'part\s*4.*(?:monologue|lecture|talk)', text, re.I))
    
    has_read_p1 = bool(re.search(r'part\s*1.*(?:choose one word|sentence comprehension|fill the gap|dear|hi )', text, re.I))
    has_read_p2 = bool(re.search(r'part\s*2.*(?:order|cohesion|sentences below)', text, re.I))
    has_read_p3 = bool(re.search(r'part\s*3.*(?:matching|read the text|four people|person a)', text, re.I))
    has_read_p4 = bool(re.search(r'part\s*4.*(?:heading|paragraph|read the passage)', text, re.I))
    
    has_writ = bool(re.search(r'writing|write an email|short answers|club context', text, re.I))
    has_spk = bool(re.search(r'speaking|describe this picture|tell me about', text, re.I))
    
    print(f"Test {i:02d} ({f}):")
    print(f"  • Total text length: {len(text)} characters")
    print(f"  • LISTENING: P1={has_lis_p1}, P2={has_lis_p2}, P3={has_lis_p3}, P4={has_lis_p4}")
    print(f"  • READING:   P1={has_read_p1}, P2={has_read_p2}, P3={has_read_p3}, P4={has_read_p4}")
    print(f"  • WRITING:   {has_writ}")
    print(f"  • SPEAKING:  {has_spk}")
    print()
