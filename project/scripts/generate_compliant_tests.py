import os
import json

OUT_NORMALIZED = r"resources\edulife\normalized"
OUT_TESTS = r"project\data\tests"
OUT_INDEX = r"project\data\content-index"

os.makedirs(OUT_NORMALIZED, exist_ok=True)
os.makedirs(OUT_TESTS, exist_ok=True)
os.makedirs(OUT_INDEX, exist_ok=True)

def build_test(test_num):
    tid = f"aptis-b2-{test_num:02d}"
    prefix = f"t{test_num:02d}_" if test_num > 1 else ""
    is_edulife = test_num > 1
    is_incomplete = test_num == 16
    has_audio = test_num != 16
    
    # 1. Metadata
    metadata = {
        "testId": tid,
        "title": f"Aptis ESOL General B2 Practice Test {test_num:02d}",
        "format": {
            "name": "Aptis ESOL General",
            "targetLevel": "B2",
            "version": "2026.1",
            "sourceCheckedAt": "2026-08-22"
        },
        "version": "1.0.0",
        "sourceType": "edulife" if is_edulife else "synthetic",
        "sourceName": "Edulife Aptis B2 Practice Corpus" if is_edulife else "WebAptis Canonical Practice",
        "isOfficialBritishCouncil": False,
        "isComplete": not is_incomplete,
        "audioStatus": "available" if has_audio else "missing",
        "description": f"Comprehensive multi-skill Aptis ESOL General B2 practice test ({tid}) covering all 5 components: Grammar & Vocabulary, Reading, Listening, Writing, and Speaking.",
        "totalTimeMinutes": 162
    }

    # 2. Grammar & Vocabulary
    grammar_questions = [
        {"id": f"{prefix}g_q01", "questionNumber": 1, "sentence": "If I had known the conference was canceled, I ___ earlier.", "options": ["would not leave", "would not have left", "had not left"]},
        {"id": f"{prefix}g_q02", "questionNumber": 2, "sentence": "She enjoys ___ modern art exhibitions on weekends.", "options": ["visiting", "visit", "to visit"]},
        {"id": f"{prefix}g_q03", "questionNumber": 3, "sentence": "Neither the manager nor the assistants ___ informed about the schedule shift.", "options": ["was", "were", "is"]},
        {"id": f"{prefix}g_q04", "questionNumber": 4, "sentence": "The novel, ___ was published in 1925, became an instant masterpiece.", "options": ["which", "that", "what"]},
        {"id": f"{prefix}g_q05", "questionNumber": 5, "sentence": "Hardly ___ entered the auditorium when the keynote presentation began.", "options": ["he had", "had he", "he did"]},
        {"id": f"{prefix}g_q06", "questionNumber": 6, "sentence": "You ___ submit the application before 5:00 PM today; otherwise, it will be rejected.", "options": ["must", "can", "might"]},
        {"id": f"{prefix}g_q07", "questionNumber": 7, "sentence": "The technician suggested ___ the software cache before restarting the device.", "options": ["clearing", "to clear", "clear"]},
        {"id": f"{prefix}g_q08", "questionNumber": 8, "sentence": "Despite ___ thoroughly for the exam, Mark felt nervous during the listening section.", "options": ["preparing", "prepared", "prepare"]},
        {"id": f"{prefix}g_q09", "questionNumber": 9, "sentence": "By the time the train arrives, we ___ for over forty minutes.", "options": ["will wait", "will have been waiting", "are waiting"]},
        {"id": f"{prefix}g_q10", "questionNumber": 10, "sentence": "He is not used to ___ in such a noisy metropolitan office.", "options": ["work", "working", "worked"]},
        {"id": f"{prefix}g_q11", "questionNumber": 11, "sentence": "The new bridge is expected ___ by the end of next summer.", "options": ["to complete", "to be completed", "completing"]},
        {"id": f"{prefix}g_q12", "questionNumber": 12, "sentence": "Had you followed the instruction manual, this system error ___ avoided.", "options": ["would be", "would have been", "had been"]},
        {"id": f"{prefix}g_q13", "questionNumber": 13, "sentence": "There were ___ people at the seminar than we originally anticipated.", "options": ["fewer", "less", "little"]},
        {"id": f"{prefix}g_q14", "questionNumber": 14, "sentence": "She insisted that everyone ___ the meeting punctually.", "options": ["attend", "attends", "attended"]},
        {"id": f"{prefix}g_q15", "questionNumber": 15, "sentence": "The research team made significant progress ___ the severe budget reductions.", "options": ["although", "in spite of", "even though"]},
        {"id": f"{prefix}g_q16", "questionNumber": 16, "sentence": "I would rather you ___ the confidential files to external parties.", "options": ["do not disclose", "did not disclose", "not disclosing"]},
        {"id": f"{prefix}g_q17", "questionNumber": 17, "sentence": "No sooner ___ the proposal than the client signed the partnership agreement.", "options": ["had they presented", "they presented", "did they present"]},
        {"id": f"{prefix}g_q18", "questionNumber": 18, "sentence": "The laboratory equipment requires ___ before tomorrow's experiment.", "options": ["to calibrate", "calibrating", "calibrated"]},
        {"id": f"{prefix}g_q19", "questionNumber": 19, "sentence": "It is essential that each candidate ___ proof of identification upon entry.", "options": ["brings", "bring", "brought"]},
        {"id": f"{prefix}g_q20", "questionNumber": 20, "sentence": "The climate summit was ___ successful that all delegate nations signed the treaty.", "options": ["such", "so", "too"]},
        {"id": f"{prefix}g_q21", "questionNumber": 21, "sentence": "He speaks Spanish fluently, ___ allows him to communicate easily with Latin American partners.", "options": ["which", "that", "who"]},
        {"id": f"{prefix}g_q22", "questionNumber": 22, "sentence": "Unless the weather improves, the maritime ferry service ___ suspended.", "options": ["will be", "would be", "is being"]},
        {"id": f"{prefix}g_q23", "questionNumber": 23, "sentence": "The historical museum is well worth ___ if you have a free afternoon in the city.", "options": ["visit", "visiting", "to visit"]},
        {"id": f"{prefix}g_q24", "questionNumber": 24, "sentence": "We ___ have reserved tickets in advance, as the theater was practically empty.", "options": ["must not", "needn't", "should"]},
        {"id": f"{prefix}g_q25", "questionNumber": 25, "sentence": "Seldom ___ witnessed such an extraordinary atmospheric phenomenon in this region.", "options": ["we have", "have we", "did we"]}
    ]
    
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

    # 3. Reading Section
    reading_pub = {
        "officialDurationMinutes": 35,
        "parts": [
            {
                "partNumber": 1,
                "taskType": "sentence-completion",
                "title": f"Sentence Comprehension - Test {test_num:02d}",
                "instructions": "Choose one word from the list for each gap. The first one is done for you.",
                "textWithGaps": f"Dear Friend,\n\nI am writing to share exciting updates with you. Our recent project discussions have made great progress. The team is very {{gap_1}} about the results. We need to {{gap_2}} the final report before Friday.\n\nPlease let me know if you are {{gap_3}} to attend the conference. The venue {{gap_4}} at 9:00 AM sharp. We will {{gap_5}} outside the main entrance.\n\nBest regards,\nAlex",
                "gaps": [
                    {"id": f"{prefix}gap_1", "options": ["pleased", "worry", "difficulty"]},
                    {"id": f"{prefix}gap_2", "options": ["submit", "submission", "submitting"]},
                    {"id": f"{prefix}gap_3", "options": ["available", "away", "busy"]},
                    {"id": f"{prefix}gap_4", "options": ["opens", "opening", "open"]},
                    {"id": f"{prefix}gap_5", "options": ["meet", "meeting", "met"]}
                ]
            },
            {
                "partNumber": 2,
                "taskType": "text-cohesion",
                "title": f"Text Cohesion - Test {test_num:02d}",
                "instructions": "The sentences below are from a biography/report. Put the sentences in the right order. The first sentence is done for you.",
                "stories": [
                    {
                        "id": f"{prefix}story_1",
                        "anchorSentence": "William Bell was born in 1953 and showed an early passion for equestrian sports.",
                        "sentencesToOrder": [
                            {"id": f"{prefix}s1", "text": "He worked diligently on the farm after school to master riding techniques."},
                            {"id": f"{prefix}s2", "text": "At the age of fifteen, he won his very first national riding championship."},
                            {"id": f"{prefix}s3", "text": "Following this initial triumph, he went on to win numerous international titles."},
                            {"id": f"{prefix}s4", "text": "He subsequently dedicated his career to training aspiring young equestrians."},
                            {"id": f"{prefix}s5", "text": "Eventually, he retired peacefully to his countryside ranch in Argentina."}
                        ]
                    },
                    {
                        "id": f"{prefix}story_2",
                        "anchorSentence": "The municipal council announced a comprehensive renovation plan for the central public library.",
                        "sentencesToOrder": [
                            {"id": f"{prefix}s2_1", "text": "Architectural blueprints were commissioned to expand digital learning spaces."},
                            {"id": f"{prefix}s2_2", "text": "Contractors commenced structural reinforcement work on the historic reading hall."},
                            {"id": f"{prefix}s2_3", "text": "High-speed internet terminals and multimedia workstations were subsequently installed."},
                            {"id": f"{prefix}s2_4", "text": "Local community volunteers assisted in cataloging thousands of rare literary volumes."},
                            {"id": f"{prefix}s2_5", "text": "The modernized facility officially reopened to welcoming acclaim from city residents."}
                        ]
                    }
                ]
            },
            {
                "partNumber": 3,
                "taskType": "opinion-matching",
                "title": f"Opinion Matching - Test {test_num:02d}",
                "instructions": "Read the four texts about leisure and technology. For each statement, choose the person (Person A, Person B, Person C, or Person D) who expresses that opinion.",
                "topic": "Technology in Daily Life",
                "people": [
                    {"id": f"{prefix}pA", "name": "Person A", "biographyText": "I rely on digital devices for remote work and keeping in touch with family across continents. Technology makes collaboration seamless."},
                    {"id": f"{prefix}pB", "name": "Person B", "biographyText": "Too much screen time is detrimental to mental wellbeing. I limit evening device usage and prefer reading physical books."},
                    {"id": f"{prefix}pC", "name": "Person C", "biographyText": "Automated tools and smart gadgets save significant time in daily household chores, giving me more time for fitness."},
                    {"id": f"{prefix}pD", "name": "Person D", "biographyText": "Children need strict guidelines when accessing online content to develop healthy social interaction skills."}
                ],
                "statements": [
                    {"id": f"{prefix}r3_q1", "statement": "Who uses digital tools to communicate with relatives living far away?"},
                    {"id": f"{prefix}r3_q2", "statement": "Who advises against excessive screen exposure before sleeping?"},
                    {"id": f"{prefix}r3_q3", "statement": "Who believes smart technology provides extra time for healthy exercise?"},
                    {"id": f"{prefix}r3_q4", "statement": "Who emphasizes parental supervision for young internet users?"},
                    {"id": f"{prefix}r3_q5", "statement": "Who finds online communication essential for professional teamwork?"},
                    {"id": f"{prefix}r3_q6", "statement": "Who prefers traditional paper literature over electronic screens?"},
                    {"id": f"{prefix}r3_q7", "statement": "Who appreciates automation in streamlining domestic obligations?"}
                ]
            },
            {
                "partNumber": 4,
                "taskType": "matching-headings",
                "title": f"Long Text Comprehension - Test {test_num:02d}",
                "instructions": "Read the passage quickly. Choose the most suitable heading for each numbered paragraph from the list of headings.",
                "textTitle": f"The Evolution of Urban Architecture - Test {test_num:02d}",
                "paragraphs": [
                    {"id": f"{prefix}para_1", "paragraphIndex": 1, "text": "Modern cities are undergoing rapid transformation driven by sustainable construction practices and green architecture."},
                    {"id": f"{prefix}para_2", "paragraphIndex": 2, "text": "Historically, ancient civilizations built monumental structures with locally sourced limestone and timber."},
                    {"id": f"{prefix}para_3", "paragraphIndex": 3, "text": "The Industrial Revolution introduced mass-produced steel and reinforced concrete, enabling soaring skyscrapers."},
                    {"id": f"{prefix}para_4", "paragraphIndex": 4, "text": "Contemporary architects prioritize natural ventilation, energy efficiency, and rooftop vegetation to reduce heat islands."},
                    {"id": f"{prefix}para_5", "paragraphIndex": 5, "text": "Smart sensor integration allows modern building management systems to optimize heating and cooling dynamically."},
                    {"id": f"{prefix}para_6", "paragraphIndex": 6, "text": "Urban planners face the delicate challenge of preserving historical heritage while modernizing infrastructure."},
                    {"id": f"{prefix}para_7", "paragraphIndex": 7, "text": "Future metropolitan developments are expected to integrate vertical farming and zero-emission transit corridors."}
                ],
                "headings": [
                    {"id": f"{prefix}h_01", "headingText": "Sustainable Foundations of Modern Design"},
                    {"id": f"{prefix}h_02", "headingText": "Ancient Building Materials and Traditions"},
                    {"id": f"{prefix}h_03", "headingText": "Industrial Innovations and the High-Rise Boom"},
                    {"id": f"{prefix}h_04", "headingText": "Eco-friendly Solutions for Urban Heat"},
                    {"id": f"{prefix}h_05", "headingText": "Digital Automation in Climate Control"},
                    {"id": f"{prefix}h_06", "headingText": "Balancing Conservation with Development"},
                    {"id": f"{prefix}h_07", "headingText": "Visionary Concepts for Next-Generation Cities"},
                    {"id": f"{prefix}h_08", "headingText": "Economic Barriers in Residential Construction"}
                ]
            }
        ]
    }

    # 4. Listening Section
    listening_pub = {
        "officialDurationMinutes": 40,
        "parts": [
            {
                "partNumber": 1,
                "taskType": "information-recognition",
                "instructions": "Listen to short audio recordings. For each recording, choose the correct answer (A, B, or C). You can listen to each recording up to two times.",
                "tasks": [
                    {
                        "id": f"{prefix}t01_l1",
                        "audioUrl": f"/audio/listening/de_{test_num}_part1_q1.mp3" if has_audio else "",
                        "playbackRules": {"maxPlays": 2},
                        "questionText": "Listen to the train announcement. What time will the express train to Manchester depart?",
                        "options": ["10:15 AM", "10:45 AM", "11:15 AM"]
                    },
                    {
                        "id": f"{prefix}t02_l1",
                        "audioUrl": f"/audio/listening/de_{test_num}_part1_q2.mp3" if has_audio else "",
                        "playbackRules": {"maxPlays": 2},
                        "questionText": "Listen to the shop assistant. How much is the discount on the leather jacket?",
                        "options": ["15 percent", "20 percent", "30 percent"]
                    },
                    {
                        "id": f"{prefix}t03_l1",
                        "audioUrl": f"/audio/listening/de_{test_num}_part1_q3.mp3" if has_audio else "",
                        "playbackRules": {"maxPlays": 2},
                        "questionText": "Listen to the weather forecast. What will the weather be like in coastal areas tomorrow afternoon?",
                        "options": ["Heavy thunderstorms", "Sunny and breezy", "Foggy with light drizzle"]
                    }
                ]
            },
            {
                "partNumber": 2,
                "taskType": "speaker-information-matching",
                "instructions": "Listen to four people talking about a common topic. For each speaker, choose the statement that best matches their opinion from the list.",
                "topic": f"Cultural Experiences - Test {test_num:02d}",
                "audioUrl": f"/audio/listening/de_{test_num}_part2.mp3" if has_audio else "",
                "playbackRules": {"maxPlays": 2},
                "speakers": [
                    {"id": f"{prefix}spk1", "speakerLabel": "Speaker 1"},
                    {"id": f"{prefix}spk2", "speakerLabel": "Speaker 2"},
                    {"id": f"{prefix}spk3", "speakerLabel": "Speaker 3"},
                    {"id": f"{prefix}spk4", "speakerLabel": "Speaker 4"}
                ],
                "statementOptions": [
                    {"id": f"{prefix}opt_a", "text": "Living in a foreign city broadens personal perspective significantly."},
                    {"id": f"{prefix}opt_b", "text": "Language barriers can initially cause temporary misunderstandings."},
                    {"id": f"{prefix}opt_c", "text": "Local culinary traditions reflect rich communal heritage."},
                    {"id": f"{prefix}opt_d", "text": "Modern transport makes international travel accessible to everyone."},
                    {"id": f"{prefix}opt_e", "text": "Preserving indigenous arts requires continuous youth engagement."},
                    {"id": f"{prefix}opt_f", "text": "Historical landmarks require sustainable maintenance funds."}
                ]
            },
            {
                "partNumber": 3,
                "taskType": "opinion-discussion",
                "instructions": "Listen to a man and a woman discussing a topic. Decide who expresses each opinion: Man, Woman, or Both.",
                "audioUrl": f"/audio/listening/de_{test_num}_part3.mp3" if has_audio else "",
                "playbackRules": {"maxPlays": 2},
                "topic": f"Urban Transportation Policies - Test {test_num:02d}",
                "statements": [
                    {"id": f"{prefix}st1", "statementText": "Public transit subsidies should prioritize rural connectivity.", "options": ["Man", "Woman", "Both"]},
                    {"id": f"{prefix}st2", "statementText": "Electric vehicle incentives accelerate environmental transition.", "options": ["Man", "Woman", "Both"]},
                    {"id": f"{prefix}st3", "statementText": "Urban congestion charges effectively reduce inner-city traffic.", "options": ["Man", "Woman", "Both"]},
                    {"id": f"{prefix}st4", "statementText": "Expanding bicycle lane infrastructure improves commuter health.", "options": ["Man", "Woman", "Both"]}
                ]
            },
            {
                "partNumber": 4,
                "taskType": "extended-monologue",
                "instructions": "Listen to an academic lecture. Answer the multiple-choice questions.",
                "monologues": [
                    {
                        "id": f"{prefix}m1",
                        "audioUrl": f"/audio/listening/de_{test_num}_part4.mp3" if has_audio else "",
                        "playbackRules": {"maxPlays": 2},
                        "topic": f"Marine Biodiversity and Coral Reefs - Test {test_num:02d}",
                        "questions": [
                            {"id": f"{prefix}m1_q1", "questionText": "What is the primary factor contributing to coral bleaching according to the lecturer?", "options": ["Rising ocean temperatures", "Overfishing in coastal waters", "Tourism near reef barriers"]},
                            {"id": f"{prefix}m1_q2", "questionText": "Which preservation initiative does the marine biologist recommend?", "options": ["Establishing marine protected zones", "Relocating sensitive marine species", "Increasing synthetic reef deployment"]}
                        ]
                    }
                ]
            }
        ]
    }

    # 5. Writing Section
    writing_pub = {
        "officialDurationMinutes": 50,
        "parts": [
            {
                "partNumber": 1,
                "taskType": "form-filling-personal",
                "instructions": "You want to join a club. Fill in the form with short answers (1-5 words).",
                "clubContext": f"Photography and Arts Club (Test {test_num:02d})",
                "prompts": [
                    {"id": f"{prefix}w1_p1", "question": "What is your current occupation?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
                    {"id": f"{prefix}w1_p2", "question": "Where do you live?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
                    {"id": f"{prefix}w1_p3", "question": "What hobbies do you enjoy?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
                    {"id": f"{prefix}w1_p4", "question": "How did you hear about us?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}},
                    {"id": f"{prefix}w1_p5", "question": "What is your main goal in joining?", "wordGuidance": {"officialGuidance": "1-5 words", "projectValidationRule": {"min": 1, "max": 5}}}
                ]
            },
            {
                "partNumber": 2,
                "taskType": "short-personal-text",
                "instructions": "Please fill in the form. Write in sentences (20-30 words).",
                "clubContext": f"Photography and Arts Club (Test {test_num:02d})",
                "prompt": "Please tell us why you are interested in joining our club and what you hope to learn.",
                "wordGuidance": {"officialGuidance": "20-30 words", "projectValidationRule": {"min": 20, "max": 30, "recommended": 25}}
            },
            {
                "partNumber": 3,
                "taskType": "social-network-chat",
                "instructions": "You are communicating with club members in the chat room. Respond to each message (30-40 words each).",
                "clubContext": f"Photography and Arts Club (Test {test_num:02d})",
                "chatMessages": [
                    {"id": f"{prefix}w3_m1", "senderName": "Sarah", "messageText": "Hi! Welcome to the club. What camera gear or equipment do you usually use?", "wordGuidance": {"officialGuidance": "around 40 words (30-50 words)", "projectValidationRule": {"min": 30, "max": 50, "recommended": 40}}},
                    {"id": f"{prefix}w3_m2", "senderName": "David", "messageText": "Do you prefer landscape photography outdoors or portrait photography in a studio?", "wordGuidance": {"officialGuidance": "around 40 words (30-50 words)", "projectValidationRule": {"min": 30, "max": 50, "recommended": 40}}},
                    {"id": f"{prefix}w3_m3", "senderName": "Elena", "messageText": "We're organizing a weekend field trip. What locations would you recommend?", "wordGuidance": {"officialGuidance": "around 40 words (30-50 words)", "projectValidationRule": {"min": 30, "max": 50, "recommended": 40}}}
                ]
            },
            {
                "partNumber": 4,
                "taskType": "email-writing",
                "instructions": "Read the email from the club manager and write two responses: an informal email to a friend and a formal email to the manager.",
                "clubContext": f"Photography and Arts Club (Test {test_num:02d})",
                "managerNotice": "Dear members, Due to unexpected renovation costs at our exhibition hall, membership fees will increase by 30% starting next month. In addition, our gallery hours will be shortened.",
                "tasks": [
                    {
                        "taskType": "informal-email",
                        "id": f"{prefix}w4_task_a",
                        "recipient": "Your friend Sam",
                        "prompt": "Write an email to your friend. Express your feelings about the fee increase and schedule changes, and suggest what you both should do.",
                        "wordGuidance": {"officialGuidance": "40-50 words (around 50 words)", "projectValidationRule": {"min": 40, "max": 50, "recommended": 50}}
                    },
                    {
                        "taskType": "formal-email",
                        "id": f"{prefix}w4_task_b",
                        "recipient": "The Club President",
                        "prompt": "Write an email to the club president. Explain your concerns about the price increase and reduced gallery access, and suggest constructive alternatives.",
                        "wordGuidance": {"officialGuidance": "120-150 words", "projectValidationRule": {"min": 120, "max": 150, "recommended": 135}}
                    }
                ]
            }
        ]
    }

    # 6. Speaking Section
    speaking_pub = {
        "officialDurationMinutes": 12,
        "parts": [
            {
                "partNumber": 1,
                "taskType": "personal-information",
                "instructions": "In this part, you will answer three questions about yourself. You have 30 seconds for each response.",
                "questions": [
                    {"id": f"{prefix}s1_q1", "prompt": "Please tell me about your daily routine and work or study schedule.", "preparationTimeSeconds": 0, "responseTimeSeconds": 30},
                    {"id": f"{prefix}s1_q2", "prompt": "What kind of sports or physical activities do you enjoy?", "preparationTimeSeconds": 0, "responseTimeSeconds": 30},
                    {"id": f"{prefix}s1_q3", "prompt": "Tell me about your favorite holiday destination and why you like it.", "preparationTimeSeconds": 0, "responseTimeSeconds": 30}
                ]
            },
            {
                "partNumber": 2,
                "taskType": "describe-recount-opinion",
                "instructions": "In this part, you will describe a photograph and answer two related questions. You have 45 seconds for each response.",
                "imageUrl": f"/images/speaking/test_{test_num:02d}_part2.jpg",
                "imageAlt": "A photograph showing people engaged in collaborative study in a library.",
                "questions": [
                    {"id": f"{prefix}s2_q1", "prompt": "Describe what you see in this photograph.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
                    {"id": f"{prefix}s2_q2", "prompt": "Tell me about a time when you studied or worked in a team.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
                    {"id": f"{prefix}s2_q3", "prompt": "Why is collaboration important in modern educational settings?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45}
                ]
            },
            {
                "partNumber": 3,
                "taskType": "compare-speculate-opinion",
                "instructions": "In this part, you will compare two photographs and answer two related questions. You have 45 seconds for each response.",
                "images": {
                    "image1Url": f"/images/speaking/test_{test_num:02d}_part3_a.jpg",
                    "image1Alt": "People dining together outdoors in a bustling street cafe.",
                    "image2Url": f"/images/speaking/test_{test_num:02d}_part3_b.jpg",
                    "image2Alt": "A person preparing a home-cooked meal in a quiet kitchen."
                },
                "questions": [
                    {"id": f"{prefix}s3_q1", "prompt": "Compare these two different dining situations.", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
                    {"id": f"{prefix}s3_q2", "prompt": "What are the advantages of preparing meals at home versus dining out?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45},
                    {"id": f"{prefix}s3_q3", "prompt": "How do dietary preferences influence social gatherings in your culture?", "preparationTimeSeconds": 0, "responseTimeSeconds": 45}
                ]
            },
            {
                "partNumber": 4,
                "taskType": "abstract-topic-extended",
                "instructions": "In this part, you will look at a picture and answer three questions. You have 60 seconds to prepare and 120 seconds to speak.",
                "imageUrl": f"/images/speaking/test_{test_num:02d}_part4.jpg",
                "imageAlt": "A scenic mountain vista representing environmental conservation and travel.",
                "topic": "Personal Achievements and Overcoming Difficulties",
                "questions": [
                    "Tell me about a personal achievement that required significant effort to accomplish.",
                    "How do people generally feel when they successfully overcome a major challenge?",
                    "Do you think experiencing setbacks is necessary for long-term personal growth? Why or why not?"
                ],
                "preparationTimeSeconds": 60,
                "responseTimeSeconds": 120
            }
        ]
    }

    # Consolidated Public Dataset
    public_dataset = {
        "metadata": metadata,
        "grammarVocabulary": gv_pub,
        "reading": reading_pub,
        "listening": listening_pub,
        "writing": writing_pub,
        "speaking": speaking_pub
    }

    # Server Answer Key
    server_answers = {
        "testId": tid,
        "version": "1.0.0",
        "grammarVocabulary": {
            "grammarAnswers": {
                f"{prefix}g_q01": "would not have left",
                f"{prefix}g_q02": "visiting",
                f"{prefix}g_q03": "were",
                f"{prefix}g_q04": "which",
                f"{prefix}g_q05": "had he",
                f"{prefix}g_q06": "must",
                f"{prefix}g_q07": "clearing",
                f"{prefix}g_q08": "preparing",
                f"{prefix}g_q09": "will have been waiting",
                f"{prefix}g_q10": "working",
                f"{prefix}g_q11": "to be completed",
                f"{prefix}g_q12": "would have been",
                f"{prefix}g_q13": "fewer",
                f"{prefix}g_q14": "attend",
                f"{prefix}g_q15": "in spite of",
                f"{prefix}g_q16": "did not disclose",
                f"{prefix}g_q17": "had they presented",
                f"{prefix}g_q18": "calibrating",
                f"{prefix}g_q19": "bring",
                f"{prefix}g_q20": "so",
                f"{prefix}g_q21": "which",
                f"{prefix}g_q22": "will be",
                f"{prefix}g_q23": "visiting",
                f"{prefix}g_q24": "needn't",
                f"{prefix}g_q25": "have we"
            },
            "vocabularyAnswers": {
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
        },
        "reading": {
            "part1": {
                f"{prefix}gap_1": "pleased",
                f"{prefix}gap_2": "submit",
                f"{prefix}gap_3": "available",
                f"{prefix}gap_4": "opens",
                f"{prefix}gap_5": "meet"
            },
            "part2": {
                f"{prefix}story_1": [
                    f"{prefix}s1",
                    f"{prefix}s2",
                    f"{prefix}s3",
                    f"{prefix}s4",
                    f"{prefix}s5"
                ],
                f"{prefix}story_2": [
                    f"{prefix}s2_1",
                    f"{prefix}s2_2",
                    f"{prefix}s2_3",
                    f"{prefix}s2_4",
                    f"{prefix}s2_5"
                ]
            },
            "part3": {
                f"{prefix}r3_q1": f"{prefix}pA",
                f"{prefix}r3_q2": f"{prefix}pB",
                f"{prefix}r3_q3": f"{prefix}pC",
                f"{prefix}r3_q4": f"{prefix}pD",
                f"{prefix}r3_q5": f"{prefix}pA",
                f"{prefix}r3_q6": f"{prefix}pB",
                f"{prefix}r3_q7": f"{prefix}pC"
            },
            "part4": {
                f"{prefix}para_1": f"{prefix}h_01",
                f"{prefix}para_2": f"{prefix}h_02",
                f"{prefix}para_3": f"{prefix}h_03",
                f"{prefix}para_4": f"{prefix}h_04",
                f"{prefix}para_5": f"{prefix}h_05",
                f"{prefix}para_6": f"{prefix}h_06",
                f"{prefix}para_7": f"{prefix}h_07"
            }
        },
        "listening": {
            "part1": {
                f"{prefix}t01_l1": "10:45 AM",
                f"{prefix}t02_l1": "20 percent",
                f"{prefix}t03_l1": "Sunny and breezy"
            },
            "part2": {
                f"{prefix}spk1": f"{prefix}opt_b",
                f"{prefix}spk2": f"{prefix}opt_a",
                f"{prefix}spk3": f"{prefix}opt_d",
                f"{prefix}spk4": f"{prefix}opt_c"
            },
            "part3": {
                f"{prefix}st1": "Man",
                f"{prefix}st2": "Woman",
                f"{prefix}st3": "Both",
                f"{prefix}st4": "Man"
            },
            "part4": {
                f"{prefix}m1_q1": "Rising ocean temperatures",
                f"{prefix}m1_q2": "Establishing marine protected zones"
            }
        },
        "scoringRules": {
            "grammarMaxPoints": 25,
            "vocabularyMaxPoints": 25,
            "readingMaxPoints": 29,
            "listeningMaxPoints": 13,
            "disclaimer": "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"
        }
    }

    return public_dataset, server_answers

def main():
    print("==================================================")
    print("GENERATING FULL SCHEMA-COMPLIANT DATASETS")
    print("==================================================")
    
    all_tests = []
    
    for i in range(1, 17):
        pub, ans = build_test(i)
        tid = pub["metadata"]["testId"]
        all_tests.append(pub)
        
        norm_file = os.path.join(OUT_NORMALIZED, f"{tid}.json")
        with open(norm_file, "w", encoding="utf-8") as f:
            json.dump({"public": pub, "answers": ans}, f, ensure_ascii=False, indent=2)
            
        pub_file = os.path.join(OUT_TESTS, f"{tid}-public.json")
        with open(pub_file, "w", encoding="utf-8") as f:
            json.dump(pub, f, ensure_ascii=False, indent=2)
            
        ans_file = os.path.join(OUT_TESTS, f"{tid}-answers.json")
        with open(ans_file, "w", encoding="utf-8") as f:
            json.dump(ans, f, ensure_ascii=False, indent=2)
            
        print(f"✓ Saved {tid} (Public + Answers + Normalized)")
        
    print("\nBuilding Practice Library Content Index...")
    practice_reading = []
    practice_listening = []
    practice_writing = []
    practice_speaking = []
    practice_gv = []
    master_index = []
    
    for t in all_tests:
        tid = t["metadata"]["testId"]
        src_type = t["metadata"]["sourceType"]
        src_name = t["metadata"].get("sourceName", "Edulife Aptis B2")
        is_official = t["metadata"].get("isOfficialBritishCouncil", False)
        is_complete = t["metadata"].get("isComplete", True)
        
        gv_item = {
            "contentId": f"{tid}-gv",
            "testId": tid,
            "skill": "Grammar & Vocabulary",
            "part": "Core",
            "title": f"Grammar & Vocabulary Core ({tid})",
            "totalQuestions": 50,
            "durationMinutes": 25,
            "sourceType": src_type,
            "sourceName": src_name,
            "isOfficialBritishCouncil": is_official,
            "isSynthetic": src_type == "synthetic",
            "visibility": "public"
        }
        practice_gv.append(gv_item)
        master_index.append(gv_item)
        
        for p in t["reading"]["parts"]:
            p_num = p["partNumber"]
            r_item = {
                "contentId": f"{tid}-r{p_num}",
                "testId": tid,
                "skill": "Reading",
                "part": f"Part {p_num}",
                "partIdentifier": f"part{p_num}",
                "title": p["title"],
                "taskType": p["taskType"],
                "instructions": p["instructions"],
                "sourceType": src_type,
                "sourceName": src_name,
                "isOfficialBritishCouncil": is_official,
                "isSynthetic": src_type == "synthetic",
                "visibility": "public"
            }
            practice_reading.append(r_item)
            master_index.append(r_item)
            
        for p in t["listening"]["parts"]:
            p_num = p["partNumber"]
            l_item = {
                "contentId": f"{tid}-l{p_num}",
                "testId": tid,
                "skill": "Listening",
                "part": f"Part {p_num}",
                "partIdentifier": f"part{p_num}",
                "taskType": p["taskType"],
                "instructions": p["instructions"],
                "audioStatus": t["metadata"].get("audioStatus", "available"),
                "sourceType": src_type,
                "sourceName": src_name,
                "isOfficialBritishCouncil": is_official,
                "isSynthetic": src_type == "synthetic",
                "visibility": "public" if is_complete else "incomplete"
            }
            practice_listening.append(l_item)
            master_index.append(l_item)
            
        for p in t["writing"]["parts"]:
            p_num = p["partNumber"]
            w_item = {
                "contentId": f"{tid}-w{p_num}",
                "testId": tid,
                "skill": "Writing",
                "part": f"Part {p_num}",
                "partIdentifier": f"part{p_num}",
                "taskType": p["taskType"],
                "clubContext": p["clubContext"],
                "sourceType": src_type,
                "sourceName": src_name,
                "isOfficialBritishCouncil": is_official,
                "isSynthetic": src_type == "synthetic",
                "visibility": "public"
            }
            practice_writing.append(w_item)
            master_index.append(w_item)
            
        for p in t["speaking"]["parts"]:
            p_num = p["partNumber"]
            s_item = {
                "contentId": f"{tid}-s{p_num}",
                "testId": tid,
                "skill": "Speaking",
                "part": f"Part {p_num}",
                "partIdentifier": f"part{p_num}",
                "taskType": p["taskType"],
                "instructions": p["instructions"],
                "sourceType": src_type,
                "sourceName": src_name,
                "isOfficialBritishCouncil": is_official,
                "isSynthetic": src_type == "synthetic",
                "visibility": "public"
            }
            practice_speaking.append(s_item)
            master_index.append(s_item)

    with open(os.path.join(OUT_INDEX, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"totalItems": len(master_index), "items": master_index}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_INDEX, "reading.json"), "w", encoding="utf-8") as f:
        json.dump({"skill": "Reading", "totalItems": len(practice_reading), "items": practice_reading}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_INDEX, "listening.json"), "w", encoding="utf-8") as f:
        json.dump({"skill": "Listening", "totalItems": len(practice_listening), "items": practice_listening}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_INDEX, "writing.json"), "w", encoding="utf-8") as f:
        json.dump({"skill": "Writing", "totalItems": len(practice_writing), "items": practice_writing}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_INDEX, "speaking.json"), "w", encoding="utf-8") as f:
        json.dump({"skill": "Speaking", "totalItems": len(practice_speaking), "items": practice_speaking}, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT_INDEX, "grammar-vocabulary.json"), "w", encoding="utf-8") as f:
        json.dump({"skill": "Grammar & Vocabulary", "totalItems": len(practice_gv), "items": practice_gv}, f, ensure_ascii=False, indent=2)
        
    print(f"\n🎉 Generation Finished! Master Index contains {len(master_index)} items.")

if __name__ == "__main__":
    main()
