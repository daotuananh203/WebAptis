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

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def get_test_files(test_idx):
    q_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/01. Đề Luyện Tập/Đề {test_idx}*.docx"
    a_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/02. Đáp án/Đề {test_idx}*.docx"
    t_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề {test_idx}*.docx"
    
    q_files = glob.glob(q_pattern)
    a_files = glob.glob(a_pattern)
    t_files = glob.glob(t_pattern)
    
    q_file = q_files[0] if q_files else None
    a_file = a_files[0] if a_files else None
    t_file = t_files[0] if t_files else None
    
    return q_file, a_file, t_file

print("Extractor initialized.")
