import os
import json
import glob
import re
import zipfile
import xml.etree.ElementTree as ET

def read_docx(path):
    if not path or not os.path.exists(path):
        return []
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        texts = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            p_text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if p_text.strip():
                texts.append(p_text.strip())
        return texts

def get_test_files(test_idx):
    q_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/01. Đề Luyện Tập/Đề {test_idx}*.docx"
    a_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/02. Đáp án/Đề {test_idx}*.docx"
    t_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề {test_idx}*.docx"
    
    q_files = glob.glob(q_pattern)
    a_files = glob.glob(a_pattern)
    t_files = glob.glob(t_pattern)
    
    return q_files[0] if q_files else None, a_files[0] if a_files else None, t_files[0] if t_files else None

for test_idx in [1, 2, 3, 4, 8, 14, 15, 16]:
    q_f, a_f, t_f = get_test_files(test_idx)
    lines = read_docx(q_f)
    print(f"================ TEST {test_idx} ===============")
    for idx, l in enumerate(lines):
        if re.search(r'Part\s*[234]|PART\s*[234]|Question\s*1[4567]', l, re.I):
            print(f"  Line {idx}: {l}")
            # print next 10 lines
            for j in range(idx, min(idx + 12, len(lines))):
                print(f"    {j}: {lines[j]}")
            print("  ---")
