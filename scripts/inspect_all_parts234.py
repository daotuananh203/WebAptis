import os
import glob
import re
from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections, clean

for i in range(1, 17):
    q_f, a_f, t_f = get_test_files(i)
    q_p = get_docx_paragraphs(q_f)
    a_p = get_docx_paragraphs(a_f)
    q_sec = extract_listening_sections(q_p)
    a_sec = extract_listening_sections(a_p)
    
    print(f"================ TEST {i:02d} PARTS 2, 3, 4 ================")
    print("--- PART 2 (Q) ---")
    for p in q_sec['part2']:
        print(f"   {p['text']}")
    print("--- PART 3 (Q) ---")
    for p in q_sec['part3']:
        print(f"   {p['text']}")
    print("--- PART 4 (Q) ---")
    for p in q_sec['part4']:
        print(f"   {p['text']}")
