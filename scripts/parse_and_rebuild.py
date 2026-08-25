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

def parse_part1(lines):
    questions = []
    # Lines contain Q1. ... A. ... B. ... C. ...
    # Let's extract questions 1 to 13
    current_q = None
    
    for line in lines:
        line = clean_text(line)
        # Check if line starts with Part 2 marker
        if re.search(r'Part\s*2|PART\s*2', line, re.I):
            break
            
        # Match Q1 or Question 1 or 1.
        m_q = re.match(r'^(?:Question|Q|Câu)?\s*(\d{1,2})[\.\:\s]+(.+)$', line, re.I)
        # Match option A., B., C.
        m_opt = re.match(r'^([A-C])[\.\:\)\s]+(.+)$', line, re.I)
        
        if m_q and int(m_q.group(1)) <= 13:
            q_num = int(m_q.group(1))
            q_text = m_q.group(2).strip()
            # If q_text also contains options (e.g., A. ... B. ... C. ...)
            current_q = {
                'num': q_num,
                'text': q_text,
                'options': []
            }
            questions.append(current_q)
        elif m_opt and current_q:
            opt_letter = m_opt.group(1).upper()
            opt_text = m_opt.group(2).strip()
            current_q['options'].append((opt_letter, opt_text))
        elif current_q and len(current_q['options']) < 3:
            # Check if inline options exist e.g. A. xxx B. yyy C. zzz
            inline_opts = re.findall(r'([A-C])[\.\:\)]\s*([^\s][^A-C\.\:\)]*)', line)
            if inline_opts:
                for o_let, o_txt in inline_opts:
                    current_q['options'].append((o_let.upper(), o_txt.strip()))
            else:
                # Could be question continuation
                if not current_q['options']:
                    current_q['text'] += " " + line
                    
    return questions

for i in range(1, 17):
    q_f, a_f, t_f = get_test_files(i)
    lines = read_docx(q_f)
    p1 = parse_part1(lines)
    print(f"Test {i}: Parsed {len(p1)} Part 1 questions. Q1: {p1[0]['text'][:40] if p1 else 'None'}")
