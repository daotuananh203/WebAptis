import zipfile
import xml.etree.ElementTree as ET
import os
import re
import json

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập"
ans_folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án"
trans_folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\04. Transcript"

def get_text_lines(docx_path):
    if not os.path.exists(docx_path):
        return []
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml")
        tree = ET.fromstring(xml)
        lines = []
        for p in tree.iter():
            if p.tag.endswith('p'):
                line_texts = [e.text for e in p.iter() if e.tag.endswith('t') and e.text]
                if line_texts:
                    lines.append("".join(line_texts).strip())
        return [l for l in lines if l]

def test_parse(test_num):
    test_files = [f for f in os.listdir(folder) if f.startswith(f"Đề {test_num} ") or f.startswith(f"Đề {test_num}.") or f.startswith(f"Đề {test_num}-") or f == f"Đề {test_num}.docx" or f == f"Đề {test_num} - Aptis.docx" or f == f"Đề {test_num} - Aptis_.docx" or f"Đề {test_num}" in f]
    ans_files = [f for f in os.listdir(ans_folder) if f.startswith(f"Đề {test_num}.") or f.startswith(f"Đề {test_num} ") or f.startswith(f"Đề {test_num}_") or f == f"Đề {test_num}.docx"]
    
    t_lines = get_text_lines(os.path.join(folder, test_files[0])) if test_files else []
    a_lines = get_text_lines(os.path.join(ans_folder, ans_files[0])) if ans_files else []
    
    print(f"=== TEST {test_num:02d} ({test_files[0] if test_files else 'N/A'}) ===")
    print(f"Test lines count: {len(t_lines)}, Ans lines count: {len(a_lines)}")
    print("First 10 lines of test:")
    for l in t_lines[:10]:
        print(f"  > {l}")
    print()

for i in [1, 2, 5, 10, 15, 16]:
    test_parse(i)
