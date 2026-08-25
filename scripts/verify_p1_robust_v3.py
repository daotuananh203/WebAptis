import os
import glob
import re
from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections, clean

def parse_part1_robust_v3(q_paragraphs):
    raw_lines = [clean(p['text']) for p in q_paragraphs if clean(p['text'])]
    lines = []
    for l in raw_lines:
        # Only skip if the line is purely a section header
        if re.match(r'^(?:Part|PART)\s*1[\.\:\s]*$|^(?:Listening|LISTENING)[\.\:\s]*$|^Đề\s*\d+[\.\:\s]*$|^Au?dio:', l, re.I):
            continue
        lines.append(l)
        
    questions = []
    i = 0
    while i < len(lines) and len(questions) < 13:
        l = lines[i]
        m_q = re.match(r'^(?:Question|Q|Câu|\d+\.\s*Question|\d+\.\s*Q)\s*(\d{1,2})(?:\s+of\s+\d+)?[\.\:\s]*(.*)$', l, re.I)
        if not m_q:
            m_q_num = re.match(r'^(\d{1,2})[\.\:]\s+([A-Za-z].*)$', l)
            if m_q_num and int(m_q_num.group(1)) <= 13:
                m_q = m_q_num
                
        if m_q and int(m_q.group(1)) <= 13:
            q_num = int(m_q.group(1))
            q_text = clean(m_q.group(2))
            i += 1
            if not q_text and i < len(lines):
                if not re.match(r'^[A-C][\.\:\)]\s+', lines[i], re.I):
                    q_text = lines[i]
                    i += 1
            
            opts = []
            while i < len(lines):
                opt_line = lines[i]
                is_next_q = bool(re.match(r'^(?:Question|Q|Câu|\d+\.\s*Question|\d+\.\s*Q)\s*\d+', opt_line, re.I) or 
                                 (re.match(r'^(\d{1,2})[\.\:]\s+([A-Za-z].*)$', opt_line) and int(re.match(r'^(\d{1,2})[\.\:]\s+([A-Za-z].*)$', opt_line).group(1)) <= 13))
                if is_next_q:
                    break
                    
                m_o = re.match(r'^([A-C])[\.\:\)]\s*(.*)$', opt_line, re.I)
                if m_o:
                    opts.append({'label': m_o.group(1).upper(), 'text': clean(m_o.group(2))})
                    i += 1
                elif len(opts) < 3:
                    label = chr(ord('A') + len(opts))
                    opts.append({'label': label, 'text': opt_line})
                    i += 1
                else:
                    i += 1
                    
                if len(opts) == 3:
                    break
                    
            questions.append({
                'number': q_num,
                'text': q_text,
                'options': opts
            })
        else:
            i += 1
            
    return questions

for i in range(1, 17):
    q_f, a_f, t_f = get_test_files(i)
    q_p = get_docx_paragraphs(q_f)
    q_sec = extract_listening_sections(q_p)
    questions = parse_part1_robust_v3(q_sec['part1'])
    print(f"Test {i:02d}: {len(questions)} questions parsed.")
    for q in questions:
        if len(q['options']) != 3 or not q['text']:
            print(f"   WARNING in Test {i:02d} Q{q['number']}: text='{q['text'][:35]}' opts={len(q['options'])}")
