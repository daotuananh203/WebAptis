from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files, extract_listening_sections

q_f, a_f, t_f = get_test_files(8)
q_p = get_docx_paragraphs(q_f)
q_sec = extract_listening_sections(q_p)
print("=== TEST 8 PART 1 RAW LINES ===")
for idx, p in enumerate(q_sec['part1'][:25]):
    print(f"  {idx:02d}: {p['text']}")
