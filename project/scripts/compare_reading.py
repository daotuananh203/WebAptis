import zipfile
import xml.etree.ElementTree as ET
import os

def get_text(p):
    with zipfile.ZipFile(p) as z:
        xml = z.read("word/document.xml")
        tree = ET.fromstring(xml)
        return " ".join([e.text for e in tree.iter() if e.tag.endswith('t') and e.text])

reading_docx = r"D:\APTIS\Reading\APTIS_READING COMPREHENSION.docx"
t_reading = get_text(reading_docx)

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập"
for i in range(1, 5):
    f = [f for f in os.listdir(folder) if f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i}-") or f == f"Đề {i}.docx" or f"Đề {i}" in f][0]
    t_test = get_text(os.path.join(folder, f))
    
    # Check overlap
    # Take a snippet from Reading docx Part 1
    # Check if words from Reading docx appear in t_test
    print(f"=== CHECKING ĐỀ {i} VS APTIS_READING COMPREHENSION.docx ===")
    if "Pete" in t_test and "Samantha" in t_test:
        print(f"  -> Đề {i} CONTAINS Reading Test 1 (Pete & Samantha)!")
    if "William Bell" in t_test:
        print(f"  -> Đề {i} CONTAINS Reading Test 1 Part 2 (William Bell)!")
    if "visitor's book" in t_test.lower() or "visiting our office" in t_test.lower():
        print(f"  -> Đề {i} CONTAINS Reading Part 2 office instructions!")
