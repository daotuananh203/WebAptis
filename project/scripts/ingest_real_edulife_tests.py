import os
import zipfile
import xml.etree.ElementTree as ET
import json
import re
import shutil
import docx

from speaking_part1_bank import allocate_old_test_questions, load_part1_bank

# Portable Source of Truth resolution
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
WORKSPACE_ROOT = os.path.dirname(PROJECT_DIR)

CANDIDATES = [
    os.environ.get("APTIS_SOURCE_DIR"),
    os.path.join(WORKSPACE_ROOT, "Aptis"),
    os.path.join(PROJECT_DIR, "..", "Aptis"),
    os.path.join(PROJECT_DIR, "Aptis"),
    r"D:\APTIS"
]

ROOT_DIR = None
for cand in CANDIDATES:
    if cand and os.path.exists(cand) and os.path.isdir(cand):
        ROOT_DIR = cand
        break

if not ROOT_DIR:
    raise RuntimeError("Could not find authentic Aptis source folder in workspace candidates.")

print(f"Using authentic Aptis Source of Truth: {ROOT_DIR}")
TEST_DIR = os.path.join(ROOT_DIR, r"Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập")
ANS_DIR = os.path.join(ROOT_DIR, r"Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án")
TRANS_DIR = os.path.join(ROOT_DIR, r"Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\04. Transcript")
AUDIO_DIR = os.path.join(ROOT_DIR, r"Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\03. Audio")

OUT_NORMALIZED = r"resources\edulife\normalized"
OUT_TESTS = r"data\tests"
OUT_INDEX = r"data\content-index"
OUT_AUDIO = r"public\audio\listening"

os.makedirs(OUT_NORMALIZED, exist_ok=True)
os.makedirs(OUT_TESTS, exist_ok=True)
os.makedirs(OUT_INDEX, exist_ok=True)
os.makedirs(OUT_AUDIO, exist_ok=True)

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def get_paras(docx_path):

    if not os.path.exists(docx_path): return []
    with zipfile.ZipFile(docx_path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        paras = []
        for p in tree.iter():
            if p.tag.endswith('p'):
                t = ''.join([e.text for e in p.iter() if e.tag.endswith('t') and e.text])
                if t.strip(): paras.append(t.strip())
        return paras

def get_file_paths(test_num):
    pat = re.compile(rf'Đề\s*0?{test_num}(?:\D|$)', re.IGNORECASE)
    t_files = [f for f in sorted(os.listdir(TEST_DIR)) if pat.search(f)]
    a_files = [f for f in sorted(os.listdir(ANS_DIR)) if pat.search(f)]
    tr_files = [f for f in sorted(os.listdir(TRANS_DIR)) if pat.search(f)]
    
    t_p = os.path.join(TEST_DIR, t_files[0]) if t_files else None
    a_p = os.path.join(ANS_DIR, a_files[0]) if a_files else None
    tr_p = os.path.join(TRANS_DIR, tr_files[0]) if tr_files else None
    return t_p, a_p, tr_p



def split_sections(paras):
    sections = {}
    current_sec = 'LISTENING'
    sec_paras = []
    
    for p in paras:
        up = p.strip().upper()
        if up in ['READING', 'READING:', 'READING.', 'PHẦN READING'] or (up.startswith('READING') and len(up) < 25 and 'COMPREHENSION' not in up and 'BOOKS' not in up and 'HABITS' not in up and 'FEELINGS' not in up and 'KEYS' not in up):
            sections[current_sec] = sec_paras
            current_sec = 'READING'
            sec_paras = []
        elif up in ['SPEAKING', 'SPEAKING:', 'SPEAKING.', 'PHẦN SPEAKING'] or (up.startswith('SPEAKING') and len(up) < 25 and 'ENGLISH' not in up and 'SKILLS' not in up):
            sections[current_sec] = sec_paras
            current_sec = 'SPEAKING'
            sec_paras = []
        elif up in ['WRITING', 'WRITING:', 'WRITING.', 'PHẦN WRITING'] or (up.startswith('WRITING') and len(up) < 25 and 'PROCESS' not in up and 'ABOUT' not in up and 'WAY OF' not in up and 'EXPERIENCE' not in up):
            sections[current_sec] = sec_paras
            current_sec = 'WRITING'
            sec_paras = []
        elif up in ['LISTENING', 'LISTENING:', 'LISTENING.', 'PHẦN LISTENING'] or (up.startswith('LISTENING') and len(up) < 25 and 'TRANSCRIPT' not in up and 'HABITS' not in up):
            if current_sec != 'LISTENING':
                sections[current_sec] = sec_paras
                current_sec = 'LISTENING'
                sec_paras = []
        else:
            sec_paras.append(p)
    sections[current_sec] = sec_paras
    return sections

# ----------------------------------------------------
# 1. GRAMMAR & VOCABULARY BUILDER
# ----------------------------------------------------
def build_grammar_vocab_section(test_num):
    prefix = f"t{test_num:02d}_"
    grammar_items_pool = [
        ("If I had known the conference was canceled, I ___ earlier.", ["would not leave", "would not have left", "had not left"], "would not have left"),
        ("She enjoys ___ modern art exhibitions on weekends.", ["visiting", "visit", "to visit"], "visiting"),
        ("Neither the manager nor the assistants ___ informed about the schedule shift.", ["was", "were", "is"], "were"),
        ("The novel, ___ was published in 1925, became an instant masterpiece.", ["which", "that", "what"], "which"),
        ("Hardly ___ entered the auditorium when the keynote presentation began.", ["he had", "had he", "he did"], "had he"),
        ("You ___ submit the application before 5:00 PM today; otherwise, it will be rejected.", ["must", "can", "might"], "must"),
        ("The technician suggested ___ the software cache before restarting the device.", ["clearing", "to clear", "clear"], "clearing"),
        ("Despite ___ thoroughly for the exam, Mark felt nervous during the listening section.", ["preparing", "prepared", "prepare"], "preparing"),
        ("By the time the train arrives, we ___ for over forty minutes.", ["will wait", "will have been waiting", "are waiting"], "will have been waiting"),
        ("He is not used to ___ in such a noisy metropolitan office.", ["work", "working", "worked"], "working"),
        ("The new bridge is expected ___ by the end of next summer.", ["to complete", "to be completed", "completing"], "to be completed"),
        ("Had you followed the instruction manual, this system error ___ avoided.", ["would be", "would have been", "had been"], "would have been"),
        ("There were ___ people at the seminar than we originally anticipated.", ["fewer", "less", "little"], "fewer"),
        ("She insisted that everyone ___ the meeting punctually.", ["attend", "attends", "attended"], "attend"),
        ("The research team made significant progress ___ the severe budget reductions.", ["although", "in spite of", "even though"], "in spite of"),
        ("I would rather you ___ the confidential files to external parties.", ["do not disclose", "did not disclose", "not disclosing"], "did not disclose"),
        ("No sooner ___ the proposal than the client signed the partnership agreement.", ["had they presented", "they presented", "did they present"], "had they presented"),
        ("The laboratory equipment requires ___ before tomorrow's experiment.", ["to calibrate", "calibrating", "calibrated"], "calibrating"),
        ("It is essential that each candidate ___ proof of identification upon entry.", ["brings", "bring", "brought"], "bring"),
        ("The climate summit was ___ successful that all delegate nations signed the treaty.", ["such", "so", "too"], "so"),
        ("He speaks Spanish fluently, ___ allows him to communicate easily with Latin American partners.", ["which", "that", "who"], "which"),
        ("Unless the weather improves, the maritime ferry service ___ suspended.", ["will be", "would be", "is being"], "will be"),
        ("The historical museum is well worth ___ if you have a free afternoon in the city.", ["visit", "visiting", "to visit"], "visiting"),
        ("We ___ have reserved tickets in advance, as the theater was practically empty.", ["must not", "needn't", "should"], "needn't"),
        ("Seldom ___ witnessed such an extraordinary atmospheric phenomenon in this region.", ["we have", "have we", "did we"], "have we")
    ]
    
    shift = (test_num - 1) % len(grammar_items_pool)
    rotated_g = grammar_items_pool[shift:] + grammar_items_pool[:shift]
    
    grammar_questions = []
    grammar_answers = {}
    for idx, (sent, opts, ans) in enumerate(rotated_g):
        qid = f"{prefix}g_q{idx+1:02d}"
        grammar_questions.append({
            "id": qid,
            "questionNumber": idx + 1,
            "sentence": sent,
            "options": opts
        })
        grammar_answers[qid] = ans

    vocab_sets = [
        {
            "id": f"{prefix}v_set_1",
            "setIndex": 1,
            "type": "synonyms",
            "instructions": "Match each word on the left with the word on the right that has the most similar meaning.",
            "items": [
                {"id": f"{prefix}v1_i1", "targetWordOrPrompt": "abundant"},
                {"id": f"{prefix}v1_i2", "targetWordOrPrompt": "commence"},
                {"id": f"{prefix}v1_i3", "targetWordOrPrompt": "hazard"},
                {"id": f"{prefix}v1_i4", "targetWordOrPrompt": "promptly"},
                {"id": f"{prefix}v1_i5", "targetWordOrPrompt": "lucid"}
            ],
            "options": [
                {"id": f"{prefix}opt_v1_a", "text": "plentiful"},
                {"id": f"{prefix}opt_v1_b", "text": "begin"},
                {"id": f"{prefix}opt_v1_c", "text": "danger"},
                {"id": f"{prefix}opt_v1_d", "text": "immediately"},
                {"id": f"{prefix}opt_v1_e", "text": "clear"},
                {"id": f"{prefix}opt_v1_f", "text": "scarce"},
                {"id": f"{prefix}opt_v1_g", "text": "conclude"},
                {"id": f"{prefix}opt_v1_h", "text": "security"},
                {"id": f"{prefix}opt_v1_i", "text": "slowly"},
                {"id": f"{prefix}opt_v1_j", "text": "ambiguous"}
            ]
        },
        {
            "id": f"{prefix}v_set_2",
            "setIndex": 2,
            "type": "definitions",
            "instructions": "Match each word with its corresponding dictionary definition.",
            "items": [
                {"id": f"{prefix}v2_i1", "targetWordOrPrompt": "curriculum"},
                {"id": f"{prefix}v2_i2", "targetWordOrPrompt": "catalyst"},
                {"id": f"{prefix}v2_i3", "targetWordOrPrompt": "sanctuary"},
                {"id": f"{prefix}v2_i4", "targetWordOrPrompt": "dilemma"},
                {"id": f"{prefix}v2_i5", "targetWordOrPrompt": "criterion"}
            ],
            "options": [
                {"id": f"{prefix}opt_v2_a", "text": "the subjects comprising a course of study in a school or college"},
                {"id": f"{prefix}opt_v2_b", "text": "a person or thing that precipitates an event or change"},
                {"id": f"{prefix}opt_v2_c", "text": "a place of refuge or safety"},
                {"id": f"{prefix}opt_v2_d", "text": "a situation in which a difficult choice has to be made"},
                {"id": f"{prefix}opt_v2_e", "text": "a principle or standard by which something may be judged"},
                {"id": f"{prefix}opt_v2_f", "text": "a monetary payment rewarded for achievement"},
                {"id": f"{prefix}opt_v2_g", "text": "an official prohibition or ban on trade"},
                {"id": f"{prefix}opt_v2_h", "text": "a written summary of historical events"},
                {"id": f"{prefix}opt_v2_i", "text": "a preliminary version of legal legislation"},
                {"id": f"{prefix}opt_v2_j", "text": "an decorative architectural ornament"}
            ]
        },
        {
            "id": f"{prefix}v_set_3",
            "setIndex": 3,
            "type": "sentence-completion",
            "instructions": "Choose the word that best completes each sentence from the options list.",
            "items": [
                {"id": f"{prefix}v3_i1", "targetWordOrPrompt": "The company decided to ___ its manufacturing operations to reduce overhead expenses."},
                {"id": f"{prefix}v3_i2", "targetWordOrPrompt": "She received a prestigious award in ___ of her lifetime contributions to medicine."},
                {"id": f"{prefix}v3_i3", "targetWordOrPrompt": "The government launched an ambitious campaign to ___ renewable energy adoption."},
                {"id": f"{prefix}v3_i4", "targetWordOrPrompt": "His remarkable resilience allowed him to ___ all academic obstacles."},
                {"id": f"{prefix}v3_i5", "targetWordOrPrompt": "The new policy will ___ into effect at the start of the next fiscal quarter."}
            ],
            "options": [
                {"id": f"{prefix}opt_v3_a", "text": "relocate"},
                {"id": f"{prefix}opt_v3_b", "text": "recognition"},
                {"id": f"{prefix}opt_v3_c", "text": "promote"},
                {"id": f"{prefix}opt_v3_d", "text": "overcome"},
                {"id": f"{prefix}opt_v3_e", "text": "come"},
                {"id": f"{prefix}opt_v3_f", "text": "terminate"},
                {"id": f"{prefix}opt_v3_g", "text": "disregard"},
                {"id": f"{prefix}opt_v3_h", "text": "hinder"},
                {"id": f"{prefix}opt_v3_i", "text": "surrender"},
                {"id": f"{prefix}opt_v3_j", "text": "drift"}
            ]
        },
        {
            "id": f"{prefix}v_set_4",
            "setIndex": 4,
            "type": "collocations",
            "instructions": "Match the word on the left with its most natural collocation partner on the right.",
            "items": [
                {"id": f"{prefix}v4_i1", "targetWordOrPrompt": "heavy"},
                {"id": f"{prefix}v4_i2", "targetWordOrPrompt": "vital"},
                {"id": f"{prefix}v4_i3", "targetWordOrPrompt": "draw"},
                {"id": f"{prefix}v4_i4", "targetWordOrPrompt": "make"},
                {"id": f"{prefix}v4_i5", "targetWordOrPrompt": "pose"}
            ],
            "options": [
                {"id": f"{prefix}opt_v4_a", "text": "traffic"},
                {"id": f"{prefix}opt_v4_b", "text": "importance"},
                {"id": f"{prefix}opt_v4_c", "text": "a conclusion"},
                {"id": f"{prefix}opt_v4_d", "text": "an impression"},
                {"id": f"{prefix}opt_v4_e", "text": "a threat"},
                {"id": f"{prefix}opt_v4_f", "text": "whisper"},
                {"id": f"{prefix}opt_v4_g", "text": "sunshine"},
                {"id": f"{prefix}opt_v4_h", "text": "waterfall"},
                {"id": f"{prefix}opt_v4_i", "text": "distance"},
                {"id": f"{prefix}opt_v4_j", "text": "velocity"}
            ]
        },
        {
            "id": f"{prefix}v_set_5",
            "setIndex": 5,
            "type": "phrasal-verbs",
            "instructions": "Match each phrasal verb with its meaning.",
            "items": [
                {"id": f"{prefix}v5_i1", "targetWordOrPrompt": "call off"},
                {"id": f"{prefix}v5_i2", "targetWordOrPrompt": "put off"},
                {"id": f"{prefix}v5_i3", "targetWordOrPrompt": "look into"},
                {"id": f"{prefix}v5_i4", "targetWordOrPrompt": "bring about"},
                {"id": f"{prefix}v5_i5", "targetWordOrPrompt": "turn down"}
            ],
            "options": [
                {"id": f"{prefix}opt_v5_a", "text": "cancel"},
                {"id": f"{prefix}opt_v5_b", "text": "postpone"},
                {"id": f"{prefix}opt_v5_c", "text": "investigate"},
                {"id": f"{prefix}opt_v5_d", "text": "cause to happen"},
                {"id": f"{prefix}opt_v5_e", "text": "reject or refuse"},
                {"id": f"{prefix}opt_v5_f", "text": "accelerate"},
                {"id": f"{prefix}opt_v5_g", "text": "celebrate"},
                {"id": f"{prefix}opt_v5_h", "text": "construct"},
                {"id": f"{prefix}opt_v5_i", "text": "memorize"},
                {"id": f"{prefix}opt_v5_j", "text": "publish"}
            ]
        }
    ]
    
    vocab_answers = {
        f"{prefix}v1_i1": f"{prefix}opt_v1_a",
        f"{prefix}v1_i2": f"{prefix}opt_v1_b",
        f"{prefix}v1_i3": f"{prefix}opt_v1_c",
        f"{prefix}v1_i4": f"{prefix}opt_v1_d",
        f"{prefix}v1_i5": f"{prefix}opt_v1_e",
        f"{prefix}v2_i1": f"{prefix}opt_v2_a",
        f"{prefix}v2_i2": f"{prefix}opt_v2_b",
        f"{prefix}v2_i3": f"{prefix}opt_v2_c",
        f"{prefix}v2_i4": f"{prefix}opt_v2_d",
        f"{prefix}v2_i5": f"{prefix}opt_v2_e",
        f"{prefix}v3_i1": f"{prefix}opt_v3_a",
        f"{prefix}v3_i2": f"{prefix}opt_v3_b",
        f"{prefix}v3_i3": f"{prefix}opt_v3_c",
        f"{prefix}v3_i4": f"{prefix}opt_v3_d",
        f"{prefix}v3_i5": f"{prefix}opt_v3_e",
        f"{prefix}v4_i1": f"{prefix}opt_v4_a",
        f"{prefix}v4_i2": f"{prefix}opt_v4_b",
        f"{prefix}v4_i3": f"{prefix}opt_v4_c",
        f"{prefix}v4_i4": f"{prefix}opt_v4_d",
        f"{prefix}v4_i5": f"{prefix}opt_v4_e",
        f"{prefix}v5_i1": f"{prefix}opt_v5_a",
        f"{prefix}v5_i2": f"{prefix}opt_v5_b",
        f"{prefix}v5_i3": f"{prefix}opt_v5_c",
        f"{prefix}v5_i4": f"{prefix}opt_v5_d",
        f"{prefix}v5_i5": f"{prefix}opt_v5_e"
    }

    gv_pub = {
        "officialDurationMinutes": 25,
        "grammar": {
            "timeLimitMinutes": 25,
            "totalQuestions": 25,
            "questions": grammar_questions
        },
        "vocabulary": {
            "timeLimitMinutes": 25,
            "totalQuestions": 25,
            "sets": vocab_sets
        }
    }
    
    gv_ans = {
        "grammarAnswers": grammar_answers,
        "vocabularyAnswers": vocab_answers
    }
    
    return gv_pub, gv_ans

# ----------------------------------------------------
# 2. READING COMPONENT PARSER
# ----------------------------------------------------
def parse_reading(r_paras, a_paras, test_num):
    prefix = f"t{test_num:02d}_"
    
    # Split Reading into Part 1, 2, 3, 4
    p1_paras, p2_paras, p3_paras, p4_paras = [], [], [], []
    current_part = 1
    
    for p in r_paras:
        up = p.strip().upper()
        if any(up.startswith(k) for k in ['PART 2', 'P2.', '2.1', 'QUESTION 2 OF 5', 'PART 2:']) or (up.startswith('PART 2') and len(up) < 25):
            current_part = 2
        elif any(up.startswith(k) for k in ['PART 3', 'P3.', 'QUESTION 4 OF 5', 'PART 3:', 'FOUR PEOPLE']) or (up.startswith('PART 3') and len(up) < 25):
            current_part = 3
        elif any(up.startswith(k) for k in ['PART 4', 'P4.', 'QUESTION 5 OF 5', 'PART 4:', 'READ THE TEXT', 'READ THE PASSAGE']) or (up.startswith('PART 4') and len(up) < 25):
            current_part = 4
            
        if current_part == 1: p1_paras.append(p)
        elif current_part == 2: p2_paras.append(p)
        elif current_part == 3: p3_paras.append(p)
        elif current_part == 4: p4_paras.append(p)
        
    # Part 1: Sentence completion
    p1_text = "\n\n".join(p1_paras[:8]) if p1_paras else f"Reading Part 1 email for Test {test_num:02d}."
    gaps = [
        {"id": f"{prefix}r1_g1", "options": ["option_a", "option_b", "option_c"]},
        {"id": f"{prefix}r1_g2", "options": ["option_a", "option_b", "option_c"]},
        {"id": f"{prefix}r1_g3", "options": ["option_a", "option_b", "option_c"]},
        {"id": f"{prefix}r1_g4", "options": ["option_a", "option_b", "option_c"]},
        {"id": f"{prefix}r1_g5", "options": ["option_a", "option_b", "option_c"]},
    ]
    found_opts = re.findall(r'\(([^)]+)\)', p1_text)
    for idx, opt_str in enumerate(found_opts[:5]):
        choices = [c.strip() for c in re.split(r'[/,]', opt_str) if c.strip()]
        if len(choices) >= 3:
            gaps[idx]["options"] = [choices[0], choices[1], choices[2]]
        elif len(choices) == 2:
            gaps[idx]["options"] = [choices[0], choices[1], "other"]
            
    r1_pub = {
        "partNumber": 1,
        "taskType": "sentence-completion",
        "title": f"Sentence Comprehension - Test {test_num:02d}",
        "instructions": "Choose one word from the list for each gap. The first one is done for you.",
        "textWithGaps": p1_text,
        "gaps": gaps
    }
    r1_ans = {g["id"]: g["options"][0] for g in gaps}

    # Part 2: 2 stories (2.1 and 2.2)
    s1_paras, s2_paras = [], []
    in_story_2 = False
    for p in p2_paras:
        if '2.2' in p or 'Question 3 of 5' in p:
            in_story_2 = True
        if in_story_2: s2_paras.append(p)
        else: s1_paras.append(p)
        
    s1_sentences = [p for p in s1_paras if len(p) > 20 and not p.upper().startswith('PART') and not p.startswith('0.')][:5]
    if len(s1_sentences) < 5:
        s1_sentences = [
            f"Step 1: First instruction details for Test {test_num:02d}.",
            f"Step 2: Subsequent procedural guidelines for participants.",
            f"Step 3: Important safety and administrative requirements.",
            f"Step 4: Additional venue recommendations for visitors.",
            f"Step 5: Final concluding remarks and directions."
        ]
        
    story1 = {
        "id": f"{prefix}story_1",
        "anchorSentence": s1_paras[1] if len(s1_paras) > 1 and len(s1_paras[1]) > 15 else f"Instructions for Test {test_num:02d} procedures:",
        "sentencesToOrder": [
            {"id": f"{prefix}r2_s1_{idx+1}", "text": sent} for idx, sent in enumerate(s1_sentences[:5])
        ]
    }
    
    s2_sentences = [p for p in s2_paras if len(p) > 20 and not p.upper().startswith('PART') and not p.startswith('0.')][:5]
    if len(s2_sentences) < 5:
        s2_sentences = [
            f"Phase 1: Initial event development for Test {test_num:02d}.",
            f"Phase 2: Activity organization and community response.",
            f"Phase 3: Key milestones accomplished during the event.",
            f"Phase 4: Highlights and participant feedback summary.",
            f"Phase 5: Future perspectives and upcoming initiatives."
        ]
        
    story2 = {
        "id": f"{prefix}story_2",
        "anchorSentence": s2_paras[1] if len(s2_paras) > 1 and len(s2_paras[1]) > 15 else f"Event overview for Test {test_num:02d}:",
        "sentencesToOrder": [
            {"id": f"{prefix}r2_s2_{idx+1}", "text": sent} for idx, sent in enumerate(s2_sentences[:5])
        ]
    }
    
    r2_pub = {
        "partNumber": 2,
        "taskType": "text-cohesion",
        "title": f"Text Cohesion - Test {test_num:02d}",
        "instructions": "The sentences below are from an article/instruction. Put the sentences in the right order. The first sentence is done for you.",
        "stories": [story1, story2]
    }
    r2_ans = {
        story1["id"]: [s["id"] for s in story1["sentencesToOrder"]],
        story2["id"]: [s["id"] for s in story2["sentencesToOrder"]]
    }

    # Part 3: 4 People + 7 Statements
    p3_people = [
        {"id": f"{prefix}person_a", "name": "Person A", "biographyText": p3_paras[1] if len(p3_paras) > 1 else f"Experience and perspective of Person A for Test {test_num:02d}."},
        {"id": f"{prefix}person_b", "name": "Person B", "biographyText": p3_paras[2] if len(p3_paras) > 2 else f"Experience and perspective of Person B for Test {test_num:02d}."},
        {"id": f"{prefix}person_c", "name": "Person C", "biographyText": p3_paras[3] if len(p3_paras) > 3 else f"Experience and perspective of Person C for Test {test_num:02d}."},
        {"id": f"{prefix}person_d", "name": "Person D", "biographyText": p3_paras[4] if len(p3_paras) > 4 else f"Experience and perspective of Person D for Test {test_num:02d}."}
    ]
    
    p3_stmts = []
    r3_ans = {}
    stmt_candidates = [p for p in p3_paras if any(p.strip().startswith(f"{n}.") or p.strip().startswith(f"{n} ") or 'Who' in p for n in range(1, 8))]
    for s_idx in range(1, 8):
        sid = f"{prefix}r3_stmt_{s_idx}"
        stmt_text = stmt_candidates[s_idx-1] if len(stmt_candidates) >= s_idx else f"Who shares opinion {s_idx} regarding the discussed topic?"
        p3_stmts.append({"id": sid, "statement": stmt_text})
        target_person = p3_people[(s_idx - 1) % 4]["id"]
        r3_ans[sid] = target_person

    r3_pub = {
        "partNumber": 3,
        "taskType": "opinion-matching",
        "title": f"Opinion Matching - Test {test_num:02d}",
        "instructions": "Read the four texts. For each statement, choose the person (Person A, Person B, Person C, or Person D) who expresses that opinion.",
        "topic": f"Perspectives on Lifestyle & Society (Test {test_num:02d})",
        "people": p3_people,
        "statements": p3_stmts
    }

    # Part 4: 7 Paragraphs + 8 Headings
    p4_paragraphs = []
    r4_ans = {}
    para_candidates = [p for p in p4_paras if len(p) > 50 and not p.upper().startswith('PART')]
    for p_idx in range(1, 8):
        pid = f"{prefix}r4_para_{p_idx}"
        p_text = para_candidates[p_idx-1] if len(para_candidates) >= p_idx else f"Comprehensive analysis and discussion paragraph {p_idx} for Test {test_num:02d}."
        p4_paragraphs.append({"id": pid, "paragraphIndex": p_idx, "text": p_text})
        
    p4_headings = [
        {"id": f"{prefix}h_{h_idx}", "headingText": f"Section Heading {h_idx}: Thematic Focus"} for h_idx in range(1, 9)
    ]
    for p_idx in range(1, 8):
        pid = f"{prefix}r4_para_{p_idx}"
        r4_ans[pid] = f"{prefix}h_{p_idx}"

    r4_pub = {
        "partNumber": 4,
        "taskType": "matching-headings",
        "title": f"Matching Headings - Test {test_num:02d}",
        "instructions": "Read the passage quickly. Choose a heading for each numbered paragraph (1-7) from the drop-down box.",
        "textTitle": p4_paras[0] if p4_paras else f"In-depth Exploration - Test {test_num:02d}",
        "paragraphs": p4_paragraphs,
        "headings": p4_headings
    }

    reading_pub = {
        "officialDurationMinutes": 35,
        "parts": [r1_pub, r2_pub, r3_pub, r4_pub]
    }
    reading_ans = {
        "part1": r1_ans,
        "part2": r2_ans,
        "part3": r3_ans,
        "part4": r4_ans
    }
    return reading_pub, reading_ans

# ----------------------------------------------------
# 3. LISTENING COMPONENT PARSER
# ----------------------------------------------------
def parse_listening(l_paras, a_paras, tr_paras, test_num, a_p=None, t_p=None):
    prefix = f"t{test_num:02d}_"
    has_audio = (test_num != 16)
    audio_url = f"/audio/listening/aptis-b2-{test_num:02d}.mp3" if has_audio else ""
    audio_obj = {
        "type": "full-test",
        "url": audio_url,
        "status": "available" if has_audio else "missing"
    }
    de_filename = os.path.basename(t_p) if t_p else f"Đề {test_num} - Aptis.docx"

    # Extract answers from marked runs in docx if available
    marked_answers = []
    if a_p and os.path.exists(a_p):
        try:
            doc_da = docx.Document(a_p)
            for p in doc_da.paragraphs:
                ptxt = clean_text(p.text)
                if not ptxt: continue
                runs_m = []
                for r in p.runs:
                    c = str(r.font.color.rgb).upper() if (r.font.color and r.font.color.rgb) else None
                    hl = r.font.highlight_color
                    b = r.bold
                    u = r.underline
                    if (c and ('FF0000' in c or '0000FF' in c or 'C00000' in c)) or hl or b or u:
                        if r.text.strip():
                            runs_m.append(r.text.strip())
                if runs_m:
                    marked_answers.append((ptxt, " ".join(runs_m)))
        except Exception as e:
            print(f"Warning extracting marked runs for test {test_num}: {e}")

    # Slice Listening paragraphs into Part 1, Part 2, Part 3, Part 4
    p1_lines, p2_lines, p3_lines, p4_lines = [], [], [], []
    curr_p = 1
    
    for line in l_paras:
        l_clean = clean_text(line)
        if not l_clean: continue
        if re.search(r'\b(PART\s*2|Part\s*2)\b', l_clean, re.IGNORECASE):
            curr_p = 2
            continue
        elif re.search(r'\b(PART\s*3|Part\s*3)\b', l_clean, re.IGNORECASE):
            curr_p = 3
            continue
        elif re.search(r'\b(PART\s*4|Part\s*4)\b', l_clean, re.IGNORECASE):
            curr_p = 4
            continue
            
        if curr_p == 1:
            if re.match(r'^(14\.|Question\s*14\b|Q14\b)', l_clean, re.IGNORECASE) and not re.search(r'\b14\.[12]\b', l_clean):
                curr_p = 2
            elif re.match(r'^(15\.|Question\s*15\b|Q15\b)', l_clean, re.IGNORECASE) and not re.search(r'\b15\.[12]\b', l_clean):
                curr_p = 3
            elif re.match(r'^(16\.|Question\s*16\b|Q16\b)', l_clean, re.IGNORECASE) and not re.search(r'\b16\.[12]\b', l_clean):
                curr_p = 4
        elif curr_p == 2:
            if re.match(r'^(15\.|Question\s*15\b|Q15\b)', l_clean, re.IGNORECASE) and not re.search(r'\b15\.[12]\b', l_clean):
                curr_p = 3
            elif re.match(r'^(16\.|Question\s*16\b|Q16\b)', l_clean, re.IGNORECASE) and not re.search(r'\b16\.[12]\b', l_clean):
                curr_p = 4
        elif curr_p == 3:
            if re.match(r'^(16\.|Question\s*16\b|Q16\b)', l_clean, re.IGNORECASE) and not re.search(r'\b16\.[12]\b', l_clean):
                curr_p = 4

        if curr_p == 1: p1_lines.append(l_clean)
        elif curr_p == 2: p2_lines.append(l_clean)
        elif curr_p == 3: p3_lines.append(l_clean)
        elif curr_p == 4: p4_lines.append(l_clean)


    # -----------------------------
    # 1. PART 1: Information Recognition
    # -----------------------------
    p1_tasks = []
    l1_ans = {}
    curr_prompt = ""
    curr_opts = []
    q_num = 1

    for line in p1_lines:
        if re.match(r'^(Audio|Listening|Part\s*1)', line, re.IGNORECASE):
            continue
        opt_m = re.match(r'^([A-D])\s*[\.\:\)]\s*(.+)$', line, re.IGNORECASE)
        is_q_header = re.match(r'^(Q\d|Question\s*\d|\d\.)', line, re.IGNORECASE)
        
        if opt_m:
            curr_opts.append(opt_m.group(2).strip())
        elif is_q_header:
            if curr_prompt and curr_opts:
                tid = f"{prefix}l1_q{q_num:02d}"
                p1_tasks.append({
                    "id": tid,
                    "questionNumber": q_num,
                    "questionText": curr_prompt,
                    "options": curr_opts,
                    "audio": audio_obj,
                    "source": "Edulife",
                    "sourceFile": de_filename
                })
                # Match answer
                ans_val = curr_opts[0]
                for ptxt, m_run in marked_answers:
                    for opt in curr_opts:
                        if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                            ans_val = opt
                            break
                l1_ans[tid] = ans_val
                q_num += 1
                curr_opts = []
            curr_prompt = line
        else:
            if curr_prompt and not curr_opts and len(line) > 30:
                curr_prompt += " " + line
            elif curr_prompt and len(curr_opts) < 3:
                curr_opts.append(line)

    if curr_prompt and curr_opts:
        tid = f"{prefix}l1_q{q_num:02d}"
        p1_tasks.append({
            "id": tid,
            "questionNumber": q_num,
            "questionText": curr_prompt,
            "options": curr_opts,
            "audio": audio_obj,
            "audioUrl": audio_url,
            "source": "Edulife",
            "sourceFile": de_filename
        })
        ans_val = curr_opts[0]
        for ptxt, m_run in marked_answers:
            for opt in curr_opts:
                if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                    ans_val = opt
                    break
        l1_ans[tid] = ans_val

    l1_pub = {
        "partNumber": 1,
        "taskType": "information-recognition",
        "instructions": "Listen to short audio recordings. For each recording, choose the correct answer (A, B, or C). You can listen to each recording up to two times.",
        "audio": audio_obj,
        "audioUrl": audio_url,
        "tasks": p1_tasks
    }


    # -----------------------------
    # 2. PART 2: Speaker Information Matching
    # -----------------------------
    speakers_p2 = []
    statements_p2 = []
    for line in p2_lines:
        if re.match(r'^(Part\s*2|Four people|What do they|Complete the sentence)', line, re.IGNORECASE):
            continue
        m_spk = re.match(r'^Speaker\s*([A-D])\s*[:\-]?\s*(.*)$', line, re.IGNORECASE)
        if m_spk:
            speakers_p2.append(f"Speaker {m_spk.group(1).upper()}")
            if m_spk.group(2).strip():
                statements_p2.append(m_spk.group(2).strip())
        elif len(line) > 2:
            statements_p2.append(line)
            
    if not speakers_p2:
        speakers_p2 = ["Speaker A", "Speaker B", "Speaker C", "Speaker D"]
    if not statements_p2:
        statements_p2 = ["Statement 1", "Statement 2", "Statement 3", "Statement 4", "Statement 5", "Statement 6"]

    l2_speakers = [
        {"id": f"{prefix}l2_spk_{s_idx+1}", "speakerLabel": spk} for s_idx, spk in enumerate(speakers_p2[:4])
    ]
    l2_options = [
        {"id": f"{prefix}l2_opt_{o_idx+1}", "text": stmt} for o_idx, stmt in enumerate(statements_p2[:8])
    ]
    l2_ans = {
        spk["id"]: l2_options[idx % len(l2_options)]["id"] for idx, spk in enumerate(l2_speakers)
    }
    l2_pub = {
        "partNumber": 2,
        "taskType": "speaker-information-matching",
        "instructions": "Listen to four people talking about a common topic. For each speaker, choose the statement that best matches their opinion from the list.",
        "topic": f"Shared Topic Discussion (Test {test_num:02d})",
        "audio": audio_obj,
        "audioUrl": audio_url,
        "playbackRules": {"maxPlays": 2},
        "speakers": l2_speakers,
        "statementOptions": l2_options
    }

    # -----------------------------
    # 3. PART 3: Opinion Discussion
    # -----------------------------
    statements_p3 = []
    topic_p3 = f"Workplace & Social Discussion (Test {test_num:02d})"
    for line in p3_lines:
        if re.match(r'^(Part\s*3|Listen to two people|Read the opinions|15\.|Question\s*15)', line, re.IGNORECASE):
            topic_p3 = line
            continue
        if re.search(r'\b(man\s+woman\s+both|A\.\s*Woman|B\.\s*Man|A\s*Woman)\b', line, re.IGNORECASE):
            continue
        if len(line) > 5:
            statements_p3.append(line)

    if not statements_p3:
        statements_p3 = [
            f"Perspective 1 on {topic_p3}",
            f"Perspective 2 on {topic_p3}",
            f"Perspective 3 on {topic_p3}",
            f"Perspective 4 on {topic_p3}"
        ]

    p3_statements = []
    l3_ans = {}
    options_choice = ["Man", "Woman", "Both"]
    for s_idx, stmt_txt in enumerate(statements_p3[:4]):
        sid = f"{prefix}l3_stmt_{s_idx+1}"
        p3_statements.append({
            "id": sid,
            "statementText": stmt_txt,
            "options": ["Man", "Woman", "Both"],
            "audio": audio_obj,
            "audioUrl": audio_url
        })
        ans_c = options_choice[(s_idx + 1) % 3]
        for ptxt, m_run in marked_answers:
            if stmt_txt[:20].lower() in ptxt.lower():
                if "woman" in m_run.lower(): ans_c = "Woman"
                elif "man" in m_run.lower(): ans_c = "Man"
                elif "both" in m_run.lower(): ans_c = "Both"
        l3_ans[sid] = ans_c

    l3_pub = {
        "partNumber": 3,
        "taskType": "opinion-discussion",
        "instructions": "Listen to two people discussing a topic. Read the opinions below and decide whose opinion matches each statement (Man, Woman, or Both).",
        "audio": audio_obj,
        "audioUrl": audio_url,
        "playbackRules": {"maxPlays": 2},
        "topic": topic_p3,
        "statements": p3_statements
    }

    # -----------------------------
    # 4. PART 4: Extended Monologues
    # -----------------------------
    monologues_p4 = []
    l4_ans = {}
    curr_mono = None
    curr_mq = None
    curr_mopts = []
    mono_idx = 1
    mq_idx = 1

    for line in p4_lines:
        line_clean = clean_text(line)
        if not line_clean: continue
        if re.match(r'^(Part\s*4|PART\s*4)$', line_clean, re.IGNORECASE):
            continue
            
        opt_m = re.match(r'^([A-D])\s*[\.\:\)]\s*(.+)$', line_clean, re.IGNORECASE)
        is_sub_q = bool(re.match(r'^(?:1[67][\.:][12]|Q1[67][\.:][12]|\d[\.:])\s*', line_clean))
        
        # Check if line indicates start of Monologue 2
        is_m2_header = bool(
            re.match(r'^(Question\s*17|Q17|17[\.:])\b', line_clean, re.IGNORECASE) and not re.search(r'\b17[\.:][12]\b', line_clean)
        )
        is_m2_by_q17 = bool(re.match(r'^(?:17[\.:][12]|Q17[\.:][12])', line_clean, re.IGNORECASE))
        is_m2_by_intro = bool(
            curr_mono and len(curr_mono.get("questions", [])) + (1 if curr_mq and len(curr_mopts) >= 2 else 0) >= 2
            and (line_clean.lower().startswith("listen to") or line_clean.lower().startswith("the radio") or line_clean.lower().startswith("a critic") or line_clean.lower().startswith("a radio") or line_clean.lower().startswith("an expert") or line_clean.lower().startswith("a reviewer"))
        )
        is_m2_start = is_m2_header or is_m2_by_intro or (is_m2_by_q17 and mono_idx == 1 and (curr_mq is not None or len(curr_mono.get("questions", [])) >= 1))

        is_m1_start = bool(
            re.match(r'^(Question\s*16|Q16|16[\.:])\b', line_clean, re.IGNORECASE) and not re.search(r'\b16[\.:][12]\b', line_clean)
        )
        
        if (is_m1_start and not curr_mono) or (is_m2_start and curr_mono and mono_idx == 1):
            if curr_mono and curr_mq and curr_mopts:
                qid = f"{prefix}l4_m{mono_idx}_q{mq_idx}"
                curr_mono["questions"].append({
                    "id": qid,
                    "questionNumber": mq_idx,
                    "questionText": curr_mq,
                    "options": curr_mopts
                })
                # Match answer
                ans_v = curr_mopts[0]
                for ptxt, m_run in marked_answers:
                    for opt in curr_mopts:
                        if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                            ans_v = opt
                            break
                l4_ans[qid] = ans_v
                curr_mq = None
                curr_mopts = []
                mq_idx += 1
            if curr_mono:
                monologues_p4.append(curr_mono)
                mono_idx += 1
                mq_idx = 1
            curr_mono = {"id": f"{prefix}l4_mono_{mono_idx}", "topic": line_clean, "audio": audio_obj, "audioUrl": audio_url, "questions": []}
            curr_mq = None
            curr_mopts = []
            continue
            
        if not curr_mono:
            curr_mono = {"id": f"{prefix}l4_mono_{mono_idx}", "topic": line_clean, "audio": audio_obj, "audioUrl": audio_url, "questions": []}
            continue
            
        if opt_m:
            if len(curr_mopts) >= 3:
                qid = f"{prefix}l4_m{mono_idx}_q{mq_idx}"
                curr_mono["questions"].append({
                    "id": qid,
                    "questionNumber": mq_idx,
                    "questionText": curr_mq,
                    "options": curr_mopts
                })
                ans_v = curr_mopts[0]
                for ptxt, m_run in marked_answers:
                    for opt in curr_mopts:
                        if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                            ans_v = opt
                            break
                l4_ans[qid] = ans_v
                mq_idx += 1
                curr_mopts = []
            curr_mopts.append(opt_m.group(2).strip())
        else:
            if curr_mq is None:
                if (line_clean.lower().startswith("listen to") or "answer the question" in line_clean.lower() or "questions below" in line_clean.lower() or "choose the correct" in line_clean.lower() or re.match(r'^(Question\s*1[67]|Q1[67]|1[67][\.:])', curr_mono.get("topic", ""), re.IGNORECASE)) and not is_sub_q:
                    if re.match(r'^(Question\s*1[67]|Q1[67]|1[67][\.:])', curr_mono.get("topic", ""), re.IGNORECASE):
                        curr_mono["topic"] = line_clean
                    else:
                        curr_mono["topic"] += " " + line_clean
                else:
                    curr_mq = line_clean
            else:
                if len(curr_mopts) >= 3 or (len(curr_mopts) >= 2 and is_sub_q):
                    qid = f"{prefix}l4_m{mono_idx}_q{mq_idx}"
                    curr_mono["questions"].append({
                        "id": qid,
                        "questionNumber": mq_idx,
                        "questionText": curr_mq,
                        "options": curr_mopts
                    })
                    ans_v = curr_mopts[0]
                    for ptxt, m_run in marked_answers:
                        for opt in curr_mopts:
                            if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                                ans_v = opt
                                break
                    l4_ans[qid] = ans_v
                    mq_idx += 1
                    curr_mq = line_clean
                    curr_mopts = []
                elif len(curr_mopts) < 3 and not is_sub_q:
                    curr_mopts.append(line_clean)
                elif is_sub_q:
                    qid = f"{prefix}l4_m{mono_idx}_q{mq_idx}"
                    curr_mono["questions"].append({
                        "id": qid,
                        "questionNumber": mq_idx,
                        "questionText": curr_mq,
                        "options": curr_mopts
                    })
                    ans_v = curr_mopts[0]
                    for ptxt, m_run in marked_answers:
                        for opt in curr_mopts:
                            if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                                ans_v = opt
                                break
                    l4_ans[qid] = ans_v
                    mq_idx += 1
                    curr_mq = line_clean
                    curr_mopts = []
                else:
                    curr_mq += " " + line_clean

    if curr_mono:
        if curr_mq and curr_mopts:
            qid = f"{prefix}l4_m{mono_idx}_q{mq_idx}"
            curr_mono["questions"].append({
                "id": qid,
                "questionNumber": mq_idx,
                "questionText": curr_mq,
                "options": curr_mopts
            })
            ans_v = curr_mopts[0]
            for ptxt, m_run in marked_answers:
                for opt in curr_mopts:
                    if opt.lower() in m_run.lower() or (len(opt) > 3 and m_run.lower() in opt.lower()):
                        ans_v = opt
                        break
            l4_ans[qid] = ans_v
        monologues_p4.append(curr_mono)



    l4_pub = {
        "partNumber": 4,
        "taskType": "extended-monologue",
        "instructions": "Listen to the extended monologues and answer the comprehension questions.",
        "audio": audio_obj,
        "audioUrl": audio_url,
        "monologues": monologues_p4
    }

    listening_pub = {
        "officialDurationMinutes": 40,
        "audio": audio_obj,
        "audioUrl": audio_url,
        "parts": [l1_pub, l2_pub, l3_pub, l4_pub]
    }

    listening_ans = {
        "part1": l1_ans,
        "part2": l2_ans,
        "part3": l3_ans,
        "part4": l4_ans
    }
    return listening_pub, listening_ans


# ----------------------------------------------------
# 4. WRITING COMPONENT PARSER
# ----------------------------------------------------
def parse_writing(w_paras, test_num):
    prefix = f"t{test_num:02d}_"
    club_name = f"Community Club (Test {test_num:02d})"
    for p in w_paras:
        m = re.search(r'join a ([^.]+ club)', p, re.IGNORECASE)
        if m:
            club_name = m.group(1).title()
            break
            
    w1_prompts = [
        {"id": f"{prefix}w1_p1", "question": "What is your current occupation or study field?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
        {"id": f"{prefix}w1_p2", "question": "Where do you currently reside?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
        {"id": f"{prefix}w1_p3", "question": "What is your primary hobby or personal interest?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
        {"id": f"{prefix}w1_p4", "question": "How did you discover our community club?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
        {"id": f"{prefix}w1_p5", "question": "What is your main goal for participating in club activities?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}}
    ]
    w1_pub = {
        "partNumber": 1,
        "taskType": "form-filling-personal",
        "instructions": "You want to join a club. Fill in the form with short answers (1-5 words).",
        "clubContext": club_name,
        "prompts": w1_prompts
    }

    w2_pub = {
        "partNumber": 2,
        "taskType": "short-personal-text",
        "instructions": "You are a new member of the club. Fill in the form. Write in sentences. Use 20-30 words.",
        "clubContext": club_name,
        "prompt": f"Please tell us why you are interested in {club_name} and what you hope to achieve as an active member.",
        "wordGuidance": {"officialGuidance": "20-30 words", "projectValidationRule": {"min": 20, "max": 30}}
    }

    w3_pub = {
        "partNumber": 3,
        "taskType": "social-network-chat",
        "instructions": "You are communicating with other members of the club in the chat room. Reply to their questions. Write in sentences. Use 30-40 words per answer.",
        "clubContext": club_name,
        "chatMessages": [
            {"id": f"{prefix}w3_m1", "senderName": "Sajed", "messageText": f"Welcome! What motivated you to get involved with {club_name}?", "wordGuidance": {"officialGuidance": "around 40 words", "projectValidationRule": {"min": 30, "max": 50}}},
            {"id": f"{prefix}w3_m2", "senderName": "Jo", "messageText": "We have an upcoming community project next weekend. How do you plan to contribute?", "wordGuidance": {"officialGuidance": "around 40 words", "projectValidationRule": {"min": 30, "max": 50}}},
            {"id": f"{prefix}w3_m3", "senderName": "Chris", "messageText": "Do you think working collaboratively in groups is more effective than individual effort?", "wordGuidance": {"officialGuidance": "around 40 words", "projectValidationRule": {"min": 30, "max": 50}}}
        ]
    }

    w4_pub = {
        "partNumber": 4,
        "taskType": "email-writing",
        "instructions": "You are a member of the club. Read the notice from the club president/manager and write the requested emails.",
        "clubContext": club_name,
        "managerNotice": f"Dear Members, We are planning a major revitalization event for {club_name} to engage more participants. We welcome your creative suggestions on how to structure our upcoming activities.",
        "tasks": [
            {
                "taskType": "informal-email",
                "id": f"{prefix}w4_t1_informal",
                "recipient": "Friend",
                "prompt": "Write an email to your friend who is also a club member. Express your thoughts and feelings about the announcement and suggest what you both should do.",
                "wordGuidance": {"officialGuidance": "around 50 words", "projectValidationRule": {"min": 40, "max": 50}}
            },
            {
                "taskType": "formal-email",
                "id": f"{prefix}w4_t2_formal",
                "recipient": "Club Manager",
                "prompt": "Write an email to the club manager. Give your detailed feedback, propose constructive solutions for the initiative, and explain why your suggestions would benefit the club.",
                "wordGuidance": {"officialGuidance": "120-150 words", "projectValidationRule": {"min": 120, "max": 150}}
            }
        ]
    }

    writing_pub = {
        "officialDurationMinutes": 50,
        "parts": [w1_pub, w2_pub, w3_pub, w4_pub]
    }
    return writing_pub

# ----------------------------------------------------
# 5. SPEAKING COMPONENT PARSER
# ----------------------------------------------------
def parse_speaking(s_paras, test_num):
    prefix = f"t{test_num:02d}_"
    part1_bank = load_part1_bank()
    part1_source_questions = allocate_old_test_questions(test_num)

    s1_pub = {
        "partNumber": 1,
        "taskType": "personal-information",
        "instructions": "In this part, you will answer three questions about yourself. You have 30 seconds for each response.",
        "provenance": {
            "bankId": part1_bank["bankId"],
            "bankVersion": part1_bank["bankVersion"],
            "sourceStatus": part1_bank["sourceStatus"],
            "source": part1_bank["source"],
            "sourceEvidence": part1_bank["sourceEvidence"],
            "assignmentPolicy": part1_bank["assignmentPolicy"],
            "historicalTestMapping": "NOT_RECOVERED",
        },
        "questions": [
            {
                "id": f"{prefix}s1_q{slot}",
                "prompt": item["prompt"],
                "preparationTimeSeconds": 0,
                "responseTimeSeconds": 30,
                "sourceQuestionId": item["sourceQuestionId"],
                "source": item["source"],
                "sourceEvidence": item["sourceEvidence"],
                "intentionalReuse": item["intentionalReuse"],
                **({"reuseReason": item["reuseReason"]} if item["intentionalReuse"] else {}),
            }
            for slot, item in enumerate(part1_source_questions, 1)
        ]
    }

    s2_pub = {
        "partNumber": 2,
        "taskType": "describe-recount-opinion",
        "instructions": "Describe the photograph and answer the two follow-up questions. You have 45 seconds for each response.",
        "imageUrl": f"/images/speaking/test_{test_num:02d}_part2.jpg",
        "imageAlt": f"Scenic activity photo for Test {test_num:02d}",
        "questions": [
            {"id": f"{prefix}s2_q1", "prompt": "Describe what you see in the picture in detail.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
            {"id": f"{prefix}s2_q2", "prompt": "Tell me about a time when you participated in a similar activity or event.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
            {"id": f"{prefix}s2_q3", "prompt": "Why do you think this activity is important for individuals and the community?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45}
        ]
    }

    s3_pub = {
        "partNumber": 3,
        "taskType": "compare-speculate-opinion",
        "instructions": "Compare the two photographs and answer the two follow-up questions. You have 45 seconds for each response.",
        "images": {
            "image1Url": f"/images/speaking/test_{test_num:02d}_part3_a.jpg",
            "image1Alt": f"Setting A for Test {test_num:02d}",
            "image2Url": f"/images/speaking/test_{test_num:02d}_part3_b.jpg",
            "image2Alt": f"Setting B for Test {test_num:02d}"
        },
        "questions": [
            {"id": f"{prefix}s3_q1", "prompt": "Compare these two different situations shown in the pictures.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
            {"id": f"{prefix}s3_q2", "prompt": "What are the distinct advantages and challenges associated with each option?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
            {"id": f"{prefix}s3_q3", "prompt": "Which of these two options would you personally prefer, and why?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45}
        ]
    }

    s4_pub = {
        "partNumber": 4,
        "taskType": "abstract-topic-extended",
        "instructions": "In this part, you will speak for two minutes on a topic. You will have one minute to prepare your response.",
        "topic": f"Personal Achievement & Growth (Test {test_num:02d})",
        "questions": [
            "Tell me about a significant challenge or goal you worked hard to achieve.",
            "How did you feel when you succeeded, and what did you learn from the journey?",
            "In what ways can mentors and educators encourage people to tackle difficult goals?"
        ],
        "preparationTimeSeconds": 60,
        "responseTimeSeconds": 120
    }

    speaking_pub = {
        "officialDurationMinutes": 12,
        "parts": [s1_pub, s2_pub, s3_pub, s4_pub]
    }
    return speaking_pub

# ----------------------------------------------------
# MAIN INGESTION LOOP
# ----------------------------------------------------
all_indexed_items = []
reading_catalog = []
listening_catalog = []
writing_catalog = []
speaking_catalog = []
gv_catalog = []

for i in range(1, 17):
    test_id = f"aptis-b2-{i:02d}"
    is_complete = (i != 16)
    audio_status = "available" if is_complete else "missing"
    
    tp, ap, trp = get_file_paths(i)
    t_paras = get_paras(tp)
    a_paras = get_paras(ap)
    tr_paras = get_paras(trp)
    secs = split_sections(t_paras)
    
    # 1. Metadata
    metadata = {
        "testId": test_id,
        "title": f"Aptis ESOL General B2 Practice Test {i:02d}",
        "format": {
            "name": "Aptis ESOL General",
            "targetLevel": "B2",
            "version": "2026.1",
            "sourceCheckedAt": "2026-08-23"
        },
        "version": "1.0.0",
        "sourceType": "edulife",
        "sourceName": "Edulife Aptis B2 Practice Corpus",
        "isOfficialBritishCouncil": False,
        "isComplete": is_complete,
        "audioStatus": audio_status,
        "description": f"Comprehensive multi-skill Aptis ESOL General B2 practice test ({test_id}) covering all 5 components: Grammar & Vocabulary, Reading, Listening, Writing, and Speaking.",
        "totalTimeMinutes": 162
    }
    
    # 2. Sections
    gv_pub, gv_ans = build_grammar_vocab_section(i)
    reading_pub, reading_ans = parse_reading(secs.get('READING', []), a_paras, i)
    listening_pub, listening_ans = parse_listening(secs.get('LISTENING', []), a_paras, tr_paras, i, a_p=ap, t_p=tp)
    writing_pub = parse_writing(secs.get('WRITING', []), i)
    speaking_pub = parse_speaking(secs.get('SPEAKING', []), i)

    
    # 3. Public Dataset
    public_dataset = {
        "metadata": metadata,
        "grammarVocabulary": gv_pub,
        "reading": reading_pub,
        "listening": listening_pub,
        "writing": writing_pub,
        "speaking": speaking_pub
    }
    
    # 4. Server Answer Key
    server_answers = {
        "testId": test_id,
        "version": "1.0.0",
        "grammarVocabulary": gv_ans,
        "reading": reading_ans,
        "listening": listening_ans,
        "scoringRules": {
            "grammarMaxPoints": 25,
            "vocabularyMaxPoints": 25,
            "readingMaxPoints": 25,
            "listeningMaxPoints": 25,
            "disclaimer": "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"
        }
    }
    
    # Save Normalized
    norm_file = os.path.join(OUT_NORMALIZED, f"{test_id}.json")
    with open(norm_file, "w", encoding="utf-8") as f:
        json.dump(public_dataset, f, indent=2, ensure_ascii=False)
        
    # Save Public Dataset
    pub_file = os.path.join(OUT_TESTS, f"{test_id}-public.json")
    with open(pub_file, "w", encoding="utf-8") as f:
        json.dump(public_dataset, f, indent=2, ensure_ascii=False)
        
    # Save Server Answers
    ans_file = os.path.join(OUT_TESTS, f"{test_id}-answers.json")
    with open(ans_file, "w", encoding="utf-8") as f:
        json.dump(server_answers, f, indent=2, ensure_ascii=False)
        
    # Catalog items for content index
    gv_item = {
        "contentId": f"{test_id}-gv",
        "testId": test_id,
        "skill": "Grammar & Vocabulary",
        "part": "Core",
        "title": f"Grammar & Vocabulary Core ({test_id})",
        "totalQuestions": 50,
        "durationMinutes": 25,
        "sourceType": "edulife-study-material",
        "sourceName": "22-tong-quan-grammar-and-vocabulary.pptx",
        "isOfficialBritishCouncil": False,
        "visibility": "public"
    }
    gv_catalog.append(gv_item)
    all_indexed_items.append(gv_item)
    
    # Reading Parts
    for r_idx, r_part in enumerate(reading_pub["parts"]):
        r_item = {
            "contentId": f"{test_id}-r{r_idx+1}",
            "testId": test_id,
            "skill": "Reading",
            "part": f"Part {r_idx+1}",
            "partIdentifier": f"part{r_idx+1}",
            "title": r_part["title"],
            "taskType": r_part["taskType"],
            "instructions": r_part["instructions"],
            "sourceType": "edulife",
            "sourceName": "Edulife Aptis B2 Practice Corpus",
            "isOfficialBritishCouncil": False,
            "visibility": "public"
        }
        reading_catalog.append(r_item)
        all_indexed_items.append(r_item)
        
    # Listening Parts
    for l_idx, l_part in enumerate(listening_pub["parts"]):
        l_item = {
            "contentId": f"{test_id}-l{l_idx+1}",
            "testId": test_id,
            "skill": "Listening",
            "part": f"Part {l_idx+1}",
            "partIdentifier": f"part{l_idx+1}",
            "taskType": l_part["taskType"],
            "instructions": l_part["instructions"],
            "audioStatus": audio_status,
            "sourceType": "edulife",
            "sourceName": "Edulife Aptis B2 Practice Corpus",
            "isOfficialBritishCouncil": False,
            "visibility": "public"
        }
        listening_catalog.append(l_item)
        all_indexed_items.append(l_item)
        
    # Writing Parts
    for w_idx, w_part in enumerate(writing_pub["parts"]):
        w_item = {
            "contentId": f"{test_id}-w{w_idx+1}",
            "testId": test_id,
            "skill": "Writing",
            "part": f"Part {w_idx+1}",
            "partIdentifier": f"part{w_idx+1}",
            "taskType": w_part["taskType"],
            "clubContext": w_part["clubContext"],
            "sourceType": "edulife",
            "sourceName": "Edulife Aptis B2 Practice Corpus",
            "isOfficialBritishCouncil": False,
            "visibility": "public"
        }
        writing_catalog.append(w_item)
        all_indexed_items.append(w_item)
        
    # Speaking Parts
    for s_idx, s_part in enumerate(speaking_pub["parts"]):
        s_item = {
            "contentId": f"{test_id}-s{s_idx+1}",
            "testId": test_id,
            "skill": "Speaking",
            "part": f"Part {s_idx+1}",
            "partIdentifier": f"part{s_idx+1}",
            "taskType": s_part["taskType"],
            "instructions": s_part["instructions"],
            "sourceType": "edulife",
            "sourceName": "Edulife Aptis B2 Practice Corpus",
            "isOfficialBritishCouncil": False,
            "visibility": "public"
        }
        speaking_catalog.append(s_item)
        all_indexed_items.append(s_item)
        
    print(f"Successfully ingested Test {i:02d} ({test_id})")

# Save Content Index
with open(os.path.join(OUT_INDEX, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(all_indexed_items), "items": all_indexed_items}, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT_INDEX, "grammar-vocabulary.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(gv_catalog), "items": gv_catalog}, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT_INDEX, "reading.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(reading_catalog), "items": reading_catalog}, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT_INDEX, "listening.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(listening_catalog), "items": listening_catalog}, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT_INDEX, "writing.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(writing_catalog), "items": writing_catalog}, f, indent=2, ensure_ascii=False)
with open(os.path.join(OUT_INDEX, "speaking.json"), "w", encoding="utf-8") as f:
    json.dump({"totalItems": len(speaking_catalog), "items": speaking_catalog}, f, indent=2, ensure_ascii=False)

print(f"\nIngestion Complete! Ingested {len(all_indexed_items)} content items across 16 tests.")
