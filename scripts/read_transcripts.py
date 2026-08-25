from reconstruct_listening_ground_truth import get_docx_paragraphs, get_test_files

for tid in [1, 9]:
    q_f, a_f, t_f = get_test_files(tid)
    tp = get_docx_paragraphs(t_f)
    print(f"=== TEST {tid} TRANSCRIPT ===")
    for p in tp:
        t = p['text'].strip()
        if t:
            print(f"   {t[:100]}")
