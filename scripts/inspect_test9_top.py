import glob
import re
import zipfile
import xml.etree.ElementTree as ET

def get_docx_paragraphs(path):
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            full_text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if full_text.strip():
                paragraphs.append(full_text.strip())
        return paragraphs

q_f = glob.glob("APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/01. Đề Luyện Tập/Đề 9*.docx")[0]
p = get_docx_paragraphs(q_f)
print("=== LINES 0 to 60 of TEST 9 ===")
for i in range(min(60, len(p))):
    print(f"  {i}: {p[i]}")
