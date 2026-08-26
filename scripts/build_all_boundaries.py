import os
import json
import glob
import re
import difflib
import zipfile
import xml.etree.ElementTree as ET

def clean(s):
    if not s:
        return ""
    s = s.replace('\u00a0', ' ').replace('\u200b', '').replace('\ufeff', '')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def get_docx_paragraphs(path):
    if not path or not os.path.exists(path):
        return []
    with zipfile.ZipFile(path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            t = ''.join(e.text for e in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text).strip()
            if t:
                paragraphs.append(t)
        return paragraphs

def parse_transcript_p1(t_lines):
    questions = {}
    curr_q = None
    curr_text = []

    for l in t_lines:
        l_clean = clean(l)
        if re.search(r'^(?:Part|PART)\s*2|^Question\s*14\b|^Speaker\s*A\b', l_clean, re.I):
            break
        m_q = re.match(r'^(?:Question|Q|Câu)?\s*(\d{1,2})[\.\:\s\)\-]*([A-Da-d]\s*[\.\:\)\-])?\s*(.*)$', l_clean, re.I)
        if m_q and int(m_q.group(1)) <= 13:
            q_num = int(m_q.group(1))
            if curr_q is not None and curr_text:
                questions[curr_q] = " ".join(curr_text).strip()
            curr_q = q_num
            curr_text = []
            rest = clean(m_q.group(3))
            if rest:
                curr_text.append(rest)
        elif curr_q is not None:
            curr_text.append(l_clean)

    if curr_q is not None and curr_text:
        questions[curr_q] = " ".join(curr_text).strip()

    return questions

def find_speech_boundaries(q_text, whisper_segs, prev_end=0.0):
    """
    Finds the start and end timestamp in whisper_segs that best matches q_text.
    q_text words are searched in whisper_segs after prev_end.
    """
    q_words = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9]+\b', q_text) if len(w) > 2]
    if not q_words:
        return prev_end + 5.0, prev_end + 35.0

    # Search window after prev_end
    candidate_segs = [s for s in whisper_segs if s['end'] >= prev_end - 2.0]
    if not candidate_segs:
        candidate_segs = whisper_segs

    best_match_indices = []
    # Find all segments that contain high overlap with q_words
    for idx, seg in enumerate(candidate_segs):
        s_words = [w.lower() for w in re.findall(r'\b[a-zA-Z0-9]+\b', seg['text']) if len(w) > 2]
        common = set(q_words).intersection(set(s_words))
        if len(common) >= 2 or (len(q_words) <= 4 and len(common) >= 1):
            best_match_indices.append(idx)

    if not best_match_indices:
        # Fallback: fuzzy match against combined window text
        return prev_end + 2.0, prev_end + 35.0

    # Group contiguous matches (including repeated playback)
    # A single question might be played twice with a short gap (< 15s)
    first_idx = best_match_indices[0]
    last_idx = best_match_indices[-1]

    # Expand to include the full phrase around first and last match
    start_time = max(0.0, candidate_segs[first_idx]['start'] - 1.5)
    end_time = candidate_segs[last_idx]['end'] + 1.5

    return round(start_time, 2), round(end_time, 2)

for i in range(1, 16):
    pad = f"{i:02d}"
    t_pat = f"APTIS/Listening/Bộ đề ôn tập/00. Bộ Đề Luyện Tập Aptis - HV/04. Transcript/Đề {i}*.docx"
    t_files = glob.glob(t_pat)
    t_lines = get_docx_paragraphs(t_files[0]) if t_files else []
    
    p1_qs = parse_transcript_p1(t_lines)
    
    with open(f"scratch_whisper_t{pad}.json", "r", encoding="utf-8") as f:
        w_segs = json.load(f)
        
    print(f"\n================ TEST {pad} ================")
    print(f"Transcript parsed: {len(p1_qs)} Part 1 questions")
    prev_e = 0.0
    for q_num in range(1, 14):
        txt = p1_qs.get(q_num, "")
        st, et = find_speech_boundaries(txt, w_segs, prev_e)
        dur = round(et - st, 2)
        print(f"  Q{q_num:02d} ({st:06.2f}s -> {et:06.2f}s, dur {dur:05.2f}s): {txt[:60]}...")
        prev_e = st + 10.0 # move forward
