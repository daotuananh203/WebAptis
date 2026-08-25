import os
import glob
import re
import zipfile
import xml.etree.ElementTree as ET

def get_docx_paragraphs(path):
    if not path or not os.path.exists(path):
        return []
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            full_text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if full_text.strip():
                paragraphs.append(full_text.strip())
        return paragraphs

def get_test_files(test_idx):
    q_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/01. Đề Luyện Tập/Đề {test_idx}*.docx"
    q_files = glob.glob(q_pattern)
    return q_files[0] if q_files else None

def extract_listening_sections(paragraphs):
    listening_p = []
    in_listening = False
    for p in paragraphs:
        t = p.strip()
        if re.search(r'^(?:Listening|LISTENING|Đề\s*\d+|Đề\s*\d+)', t, re.I):
            in_listening = True
        if in_listening and re.search(r'^(?:Reading|READING|Speaking|SPEAKING|Writing|WRITING)\b', t, re.I):
            break
        if in_listening:
            listening_p.append(p)
            
    if not listening_p:
        for p in paragraphs:
            t = p.strip()
            if re.search(r'^(?:Reading|READING|Speaking|SPEAKING|Writing|WRITING)\b', t, re.I):
                break
            listening_p.append(p)
            
    parts = {'part1': [], 'part2': [], 'part3': [], 'part4': []}
    curr_part = 'part1'
    for p in listening_p:
        t = p.strip()
        if re.search(r'^(?:Part|PART)\s*1\b', t, re.I):
            curr_part = 'part1'
        elif re.search(r'^(?:Part|PART)\s*2\b|^(?:Question|Q|Câu)?\s*14\b', t, re.I):
            curr_part = 'part2'
        elif re.search(r'^(?:Part|PART)\s*3\b|^(?:Question|Q|Câu)?\s*15\b', t, re.I):
            curr_part = 'part3'
        elif re.search(r'^(?:Part|PART)\s*4\b|^(?:Question|Q|Câu)?\s*16\b', t, re.I):
            curr_part = 'part4'
        parts[curr_part].append(p)
    return parts

for i in range(1, 17):
    q_f = get_test_files(i)
    p = get_docx_paragraphs(q_f)
    sec = extract_listening_sections(p)
    print(f"Test {i:02d}: P1={len(sec['part1'])}, P2={len(sec['part2'])}, P3={len(sec['part3'])}, P4={len(sec['part4'])}")
