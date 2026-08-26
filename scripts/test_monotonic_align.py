import json
import re

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return " ".join(text.split())

def score_segment_match(transcript_text, whisper_text):
    t_words = set(normalize_text(transcript_text).split())
    w_words = set(normalize_text(whisper_text).split())
    if not t_words or not w_words:
        return 0.0
    common = t_words.intersection(w_words)
    # Give higher weight to longer / distinct words
    score = sum(len(w) for w in common)
    return score

def align_part1_questions(q_texts, whisper_segs, max_p1_end=950.0):
    """
    Monotonically finds the best interval [s_k, e_k] for each question in q_texts (1..13).
    """
    n_qs = len(q_texts)
    # Filter whisper segments in Part 1 range
    p1_segs = [s for s in whisper_segs if s['start'] < max_p1_end]
    
    # Pre-calculate match scores between each question and each whisper segment
    n_segs = len(p1_segs)
    scores = [[score_segment_match(q_texts[q_idx], p1_segs[s_idx]['text']) for s_idx in range(n_segs)] for q_idx in range(n_qs)]

    # We want to find start_seg and end_seg for each question
    # We can greedily find the peak match region for each question in sequential order
    current_seg_idx = 0
    results = []

    for q_idx in range(n_qs):
        q_txt = q_texts[q_idx]
        best_window = None
        best_window_score = -1

        # Search window of size 1 to 15 segments starting from current_seg_idx
        # A question typically spans 1 to 10 whisper segments (up to ~75 seconds)
        for start_i in range(current_seg_idx, min(current_seg_idx + 25, n_segs)):
            window_score = 0
            for end_i in range(start_i, min(start_i + 15, n_segs)):
                dur = p1_segs[end_i]['end'] - p1_segs[start_i]['start']
                if dur > 85.0:
                    break
                # sum scores in window
                score = sum(scores[q_idx][k] for k in range(start_i, end_i + 1))
                # bonus if duration is reasonable (15s - 70s)
                if 12.0 <= dur <= 75.0:
                    score += 10.0
                if score > best_window_score:
                    best_window_score = score
                    best_window = (start_i, end_i)

        if best_window is not None:
            s_idx, e_idx = best_window
            start_time = max(0.0, p1_segs[s_idx]['start'] - 0.5)
            end_time = p1_segs[e_idx]['end'] + 0.5
            results.append({
                "question": q_idx + 1,
                "start": round(start_time, 2),
                "end": round(end_time, 2),
                "duration": round(end_time - start_time, 2),
                "start_idx": s_idx,
                "end_idx": e_idx,
                "text": " ".join(p1_segs[k]['text'] for k in range(s_idx, e_idx + 1))
            })
            current_seg_idx = e_idx + 1
        else:
            # Fallback
            st = p1_segs[current_seg_idx]['start'] if current_seg_idx < n_segs else 0.0
            et = st + 30.0
            results.append({
                "question": q_idx + 1,
                "start": round(st, 2),
                "end": round(et, 2),
                "duration": 30.0,
                "text": "FALLBACK"
            })

    return results

# Test on Test 01
with open("scratch_whisper_t01.json", "r", encoding="utf-8") as f:
    w01 = json.load(f)

from build_all_boundaries import get_docx_paragraphs, parse_transcript_p1
t_lines01 = get_docx_paragraphs("APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề 1.docx")
p1_qs01 = [parse_transcript_p1(t_lines01)[k] for k in range(1, 14)]

res01 = align_part1_questions(p1_qs01, w01)
print("=== ALIGNED TEST 01 PART 1 ===")
for r in res01:
    print(f"Q{r['question']:02d} [{r['start']:06.2f}s -> {r['end']:06.2f}s] ({r['duration']}s): {r['text'][:80]}...")
