import os
import glob
import re
from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections, parse_part1_section

for i in range(1, 17):
    q_f, a_f, t_f = get_test_files(i)
    q_p = get_docx_paragraphs(q_f)
    a_p = get_docx_paragraphs(a_f)
    
    q_sec = extract_listening_sections(q_p)
    a_sec = extract_listening_sections(a_p)
    
    questions, answers = parse_part1_section(q_sec['part1'], a_sec['part1'])
    print(f"Test {i:02d}: {len(questions)} questions parsed, {len(answers)}/13 answers matched.")
    if len(questions) != 13:
        for idx, q in enumerate(questions):
            print(f"   Q{q['number']}: {q['text'][:30]} | {len(q['options'])} opts")
