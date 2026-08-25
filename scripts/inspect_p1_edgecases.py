from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections, clean
import re

for t_idx in [1, 3, 8, 10, 14, 16]:
    q_f, a_f, t_f = get_test_files(t_idx)
    q_p = get_docx_paragraphs(q_f)
    a_p = get_docx_paragraphs(a_f)
    q_sec = extract_listening_sections(q_p)
    a_sec = extract_listening_sections(a_p)
    
    print(f"================ TEST {t_idx} PART 1 RAW LINES ================")
    for idx, p in enumerate(q_sec['part1']):
        print(f"  {idx:02d}: {p['text']}")
