import zipfile
import xml.etree.ElementTree as ET
import os

def check_file(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
        tree = ET.fromstring(xml)
        texts = [e.text for e in tree.iter() if e.tag.endswith('t') and e.text]
        return " ".join(texts)

f2 = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập\Đề 2 - Aptis_.docx"
f3 = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập\Đề 3 - Aptis_.docx"

t2 = check_file(f2)
t3 = check_file(f3)

print("=== ĐỀ 2 START (first 500 chars) ===")
print(t2[:500])

print("\n=== ĐỀ 3 START (first 500 chars) ===")
print(t3[:500])
