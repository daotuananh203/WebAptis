import os
import json
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
            runs = []
            full_text = []
            for r in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                r_text = ''.join(t.text for t in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text)
                rPr = r.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
                is_bold = rPr is not None and rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}b') is not None
                color = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color') if rPr is not None else None
                color_val = color.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if color is not None else None
                highlight = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}highlight') if rPr is not None else None
                
                is_colored = color_val is not None and color_val.lower() not in ['000000', 'auto', '212529', '222222', '333333']
                is_highlighted = highlight is not None
                is_marked = is_bold or is_colored or is_highlighted
                
                runs.append({
                    'text': r_text,
                    'bold': is_bold,
                    'color': color_val,
                    'is_marked': is_marked
                })
                full_text.append(r_text)
            
            p_str = ''.join(full_text).strip()
            if p_str:
                paragraphs.append({
                    'text': p_str,
                    'runs': runs
                })
        return paragraphs

def clean(s):
    if not s:
        return ""
    return re.sub(r'\s+', ' ', s).strip()

def get_test_files(test_idx):
    q_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/01. Đề Luyện Tập/Đề {test_idx}*.docx"
    a_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/02. Đáp án/Đề {test_idx}*.docx"
    t_pattern = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề {test_idx}*.docx"
    
    q_files = glob.glob(q_pattern)
    a_files = glob.glob(a_pattern)
    t_files = glob.glob(t_pattern)
    
    return (q_files[0] if q_files else None,
            a_files[0] if a_files else None,
            t_files[0] if t_files else None)

def extract_listening_sections(paragraphs):
    listening_p = []
    in_listening = False
    for p in paragraphs:
        t = p['text'].strip()
        if re.search(r'^(?:Listening|LISTENING|Đề\s*\d+|Đề\s*\d+)', t, re.I):
            in_listening = True
        if in_listening and re.search(r'^(?:Reading|READING|Speaking|SPEAKING|Writing|WRITING)\b', t, re.I):
            break
        if in_listening:
            listening_p.append(p)
            
    if not listening_p:
        for p in paragraphs:
            t = p['text'].strip()
            if re.search(r'^(?:Reading|READING|Speaking|SPEAKING|Writing|WRITING)\b', t, re.I):
                break
            listening_p.append(p)
            
    parts = {'part1': [], 'part2': [], 'part3': [], 'part4': []}
    curr_part = 'part1'
    for p in listening_p:
        t = p['text'].strip()
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

def parse_part1_section(q_paragraphs, a_paragraphs):
    # Extract 13 questions from q_paragraphs and matched answers from a_paragraphs
    # In q_paragraphs:
    questions = []
    current_q = None
    
    for p in q_paragraphs:
        line = clean(p['text'])
        if not line:
            continue
        if re.search(r'^(?:Part|PART)\s*1\b|^(?:Listening|LISTENING)\b|^Đề\s*\d+', line, re.I) and not re.search(r'^(?:Question|Q|Câu|\d+[\.\:])\s*\d+', line, re.I):
            continue
            
        # Match question start
        m_q = re.match(r'^(?:Question|Q|Câu)?\s*(\d{1,2})(?:\s+of\s+\d+)?[\.\:\s]+(.*)$', line, re.I)
        m_opt = re.match(r'^([A-C])[\.\:\)\s]+(.*)$', line, re.I)
        
        if m_q and int(m_q.group(1)) <= 13:
            q_num = int(m_q.group(1))
            q_text = clean(m_q.group(2))
            current_q = {
                'number': q_num,
                'text': q_text,
                'options': []
            }
            questions.append(current_q)
        elif m_opt and current_q:
            opt_letter = m_opt.group(1).upper()
            opt_text = clean(m_opt.group(2))
            current_q['options'].append({'label': opt_letter, 'text': opt_text})
        elif current_q and len(current_q['options']) < 3:
            # Check inline options e.g. A. xxx B. yyy C. zzz
            inline = re.findall(r'([A-C])[\.\:\)]\s*([^\s][^A-C\.\:\)]*)', line)
            if inline:
                for o_let, o_txt in inline:
                    current_q['options'].append({'label': o_let.upper(), 'text': clean(o_txt)})
            else:
                if not current_q['options']:
                    if not current_q['text']:
                        current_q['text'] = line
                    else:
                        current_q['text'] += " " + line
                elif len(current_q['options']) < 3 and current_q['options'] == []:
                    # Might be plain option lines (like Test 16)
                    label = chr(ord('A') + len(current_q['options']))
                    current_q['options'].append({'label': label, 'text': line})

    # For Test 16 where options don't have letters
    if len(questions) == 13 and any(len(q['options']) == 0 for q in questions):
        # Fallback parser for Test 16
        questions = []
        for i in range(len(q_paragraphs)):
            line = clean(q_paragraphs[i]['text'])
            m_q = re.match(r'^(?:Question|Q|Câu)?\s*(\d{1,2})[\.\:\s]+(.*)$', line, re.I)
            if m_q and int(m_q.group(1)) <= 13:
                q_num = int(m_q.group(1))
                q_text = clean(m_q.group(2))
                # Next 3 lines are options
                opts = []
                for j in range(1, 4):
                    if i + j < len(q_paragraphs):
                        opt_line = clean(q_paragraphs[i+j]['text'])
                        opt_let = chr(ord('A') + j - 1)
                        # Remove leading A. / B. / C. if any
                        opt_line = re.sub(r'^[A-C][\.\:\)\s]+', '', opt_line).strip()
                        opts.append({'label': opt_let, 'text': opt_line})
                questions.append({
                    'number': q_num,
                    'text': q_text,
                    'options': opts
                })

    # Now extract answers from a_paragraphs
    # In a_paragraphs, find marked runs for each question 1..13
    answers = {}
    
    # Check answers in a_paragraphs
    for p in a_paragraphs:
        line = clean(p['text'])
        # Check if line corresponds to a question or option
        # Look for marked runs in this paragraph
        marked = [clean(r['text']) for r in p['runs'] if r['is_marked'] and clean(r['text'])]
        if marked:
            # Match question number if in same paragraph
            m_q = re.match(r'^(?:Question|Q|Câu)?\s*(\d{1,2})[\.\:\s]+', line, re.I)
            # Or match option
            for q in questions:
                q_idx = q['number']
                if q_idx in answers:
                    continue
                # Check if any option text of this q matches marked text
                for opt in q['options']:
                    for m_txt in marked:
                        if m_txt.lower() in opt['text'].lower() or opt['text'].lower() in m_txt.lower():
                            if len(m_txt) >= 2:
                                answers[q_idx] = opt['text']
                                break
                    if q_idx in answers:
                        break

    return questions, answers

print("Parser function written.")
