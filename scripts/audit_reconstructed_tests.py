import os
import json

def audit_all_tests():
    data_dir = "project/data/tests"
    errors = []
    
    total_p1_qs = 0
    total_p2_spks = 0
    total_p3_stmts = 0
    total_p4_qs = 0
    
    for t_idx in range(1, 17):
        test_id = f"aptis-b2-{t_idx:02d}"
        pub_file = os.path.join(data_dir, f"{test_id}-public.json")
        ans_file = os.path.join(data_dir, f"{test_id}-answers.json")
        
        with open(pub_file, 'r', encoding='utf-8') as f:
            pub = json.load(f)
        with open(ans_file, 'r', encoding='utf-8') as f:
            ans = json.load(f)
            
        l_sec = pub.get('listening', {})
        parts = l_sec.get('parts', [])
        if len(parts) != 4:
            errors.append(f"{test_id}: listening.parts length is {len(parts)}, expected 4")
            continue
            
        # Part 1 check
        p1 = parts[0]
        p1_tasks = p1.get('tasks', [])
        if len(p1_tasks) != 13:
            errors.append(f"{test_id}: Part 1 has {len(p1_tasks)} questions, expected 13")
        for q in p1_tasks:
            total_p1_qs += 1
            if not q.get('questionText'):
                errors.append(f"{test_id} Part 1 Q{q.get('questionNumber')}: Empty question text")
            if len(q.get('options', [])) < 2:
                errors.append(f"{test_id} Part 1 Q{q.get('questionNumber')}: Fewer than 2 options")
            ans_val = ans.get('listening', {}).get('part1', {}).get(q['id'])
            if not ans_val:
                errors.append(f"{test_id} Part 1 Q{q.get('questionNumber')}: Missing answer key for {q['id']}")
            elif ans_val not in q['options']:
                errors.append(f"{test_id} Part 1 Q{q.get('questionNumber')}: Answer '{ans_val}' not in options {q['options']}")
                
        # Part 2 check
        p2 = parts[1]
        p2_spks = p2.get('speakers', [])
        p2_opts = p2.get('statementOptions', [])
        opt_ids = {opt['id'] for opt in p2_opts}
        if len(p2_spks) != 4:
            errors.append(f"{test_id}: Part 2 has {len(p2_spks)} speakers, expected 4")
        for spk in p2_spks:
            total_p2_spks += 1
            ans_val = ans.get('listening', {}).get('part2', {}).get(spk['id'])
            if not ans_val:
                errors.append(f"{test_id} Part 2 {spk['id']}: Missing answer key")
            elif ans_val not in opt_ids:
                errors.append(f"{test_id} Part 2 {spk['id']}: Answer '{ans_val}' not in option IDs {opt_ids}")
                
        # Part 3 check
        p3 = parts[2]
        p3_stmts = p3.get('statements', [])
        if len(p3_stmts) != 4:
            errors.append(f"{test_id}: Part 3 has {len(p3_stmts)} statements, expected 4")
        for stmt in p3_stmts:
            total_p3_stmts += 1
            ans_val = ans.get('listening', {}).get('part3', {}).get(stmt['id'])
            if not ans_val:
                errors.append(f"{test_id} Part 3 {stmt['id']}: Missing answer key")
            elif ans_val not in ["Man", "Woman", "Both"]:
                errors.append(f"{test_id} Part 3 {stmt['id']}: Answer '{ans_val}' not in ['Man', 'Woman', 'Both']")
                
        # Part 4 check
        p4 = parts[3]
        p4_monos = p4.get('monologues', [])
        if len(p4_monos) != 2:
            errors.append(f"{test_id}: Part 4 has {len(p4_monos)} monologues, expected 2")
        for m in p4_monos:
            m_qs = m.get('questions', [])
            if len(m_qs) != 2:
                errors.append(f"{test_id} Monologue {m['id']}: Has {len(m_qs)} questions, expected 2")
            for q in m_qs:
                total_p4_qs += 1
                ans_val = ans.get('listening', {}).get('part4', {}).get(q['id'])
                if not ans_val:
                    errors.append(f"{test_id} Part 4 {q['id']}: Missing answer key")
                elif ans_val not in q['options']:
                    errors.append(f"{test_id} Part 4 {q['id']}: Answer '{ans_val}' not in options {q['options']}")

    print(f"Audit Summary:")
    print(f"Total Part 1 questions verified: {total_p1_qs}/208")
    print(f"Total Part 2 speakers verified: {total_p2_spks}/64")
    print(f"Total Part 3 statements verified: {total_p3_stmts}/64")
    print(f"Total Part 4 questions verified: {total_p4_qs}/64")
    print(f"Total Listening questions across all 16 tests: {total_p1_qs + total_p2_spks + total_p3_stmts + total_p4_qs}/400")
    
    if errors:
        print(f"\nFOUND {len(errors)} ERRORS:")
        for err in errors:
            print(f"  ❌ {err}")
    else:
        print("\n✅ ZERO ERRORS! All 16 listening tests pass 100% forensic contract validation!")

if __name__ == "__main__":
    audit_all_tests()
