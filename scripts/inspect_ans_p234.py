import os
import glob
import re
from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections, clean

def inspect_answers_p234(test_idx):
    q_f, a_f, t_f = get_test_files(test_idx)
    a_p = get_docx_paragraphs(a_f)
    a_sec = extract_listening_sections(a_p)
    
    print(f"=== TEST {test_idx:02d} ANSWER KEY SECTIONS ===")
    print("--- PART 2 (Ans) ---")
    for p in a_sec['part2']:
        marked = [r['text'] for r in p['runs'] if r['is_marked']]
        print(f"   text='{p['text']}' | marked={marked}")
        
    print("--- PART 3 (Ans) ---")
    for p in a_sec['part3']:
        marked = [r['text'] for r in p['runs'] if r['is_marked']]
        print(f"   text='{p['text']}' | marked={marked}")
        
    print("--- PART 4 (Ans) ---")
    for p in a_sec['part4']:
        marked = [r['text'] for r in p['runs'] if r['is_marked']]
        print(f"   text='{p['text']}' | marked={marked}")

for t in [1, 2, 8, 14, 16]:
    inspect_answers_p234(t)
