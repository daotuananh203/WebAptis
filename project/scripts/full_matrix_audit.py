import zipfile
import xml.etree.ElementTree as ET
import os
import re

folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập"
ans_folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án"
audio_folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\03. Audio"
transcript_folder = r"D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\04. Transcript"

def get_doc_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = []
            for elem in tree.iter():
                if elem.tag.endswith('t') and elem.text:
                    texts.append(elem.text)
            return " ".join(texts)
    except Exception as e:
        return ""

print("================================================================================")
print("COMPREHENSIVE AUDIT MATRIX OF 16 APTIS PRACTICE TESTS (ĐỀ 1 .. ĐỀ 16)")
print("================================================================================")

matrix = []

for i in range(1, 17):
    # 1. Test docx
    test_files = [f for f in os.listdir(folder) if f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i}-") or f == f"Đề {i}.docx" or f == f"Đề {i} - Aptis.docx" or f == f"Đề {i} - Aptis_.docx"]
    test_file = test_files[0] if test_files else None
    test_text = get_doc_text(os.path.join(folder, test_file)) if test_file else ""
    
    # 2. Answer key docx
    ans_files = [f for f in os.listdir(ans_folder) if f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}_") or f == f"Đề {i}.docx"]
    ans_file = ans_files[0] if ans_files else None
    ans_text = get_doc_text(os.path.join(ans_folder, ans_file)) if ans_file else ""
    
    # 3. Audio file
    audio_files = [f for f in os.listdir(audio_folder) if f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}_") or f == f"Đề {i}.mp3"]
    audio_file = audio_files[0] if audio_files else None
    
    # 4. Transcript docx
    trans_files = [f for f in os.listdir(transcript_folder) if f.startswith(f"Đề {i}.") or f.startswith(f"Đề {i} ") or f.startswith(f"Đề {i}_") or f == f"Đề {i}.docx"]
    trans_file = trans_files[0] if trans_files else None
    trans_text = get_doc_text(os.path.join(transcript_folder, trans_file)) if trans_file else ""
    
    # Detect sections in test_text
    has_lis = bool(re.search(r'listening', test_text, re.I))
    has_read = bool(re.search(r'reading|read the|part 1.*read', test_text, re.I))
    has_writ = bool(re.search(r'writing|write an email|write short answers', test_text, re.I))
    has_spk = bool(re.search(r'speaking|describe|in this part i.*ask', test_text, re.I))
    
    # Count reading parts in test_text
    r_p1 = bool(re.search(r'part\s*1.*choose|part\s*1.*read', test_text, re.I))
    r_p2 = bool(re.search(r'part\s*2|order|cohesion', test_text, re.I))
    r_p3 = bool(re.search(r'part\s*3|opinion|matching', test_text, re.I))
    r_p4 = bool(re.search(r'part\s*4|heading|passage', test_text, re.I))
    
    # Audio status
    audio_status = "Available" if audio_file else "MISSING"
    
    entry = {
        "testNum": i,
        "testFile": test_file,
        "ansFile": ans_file,
        "audioFile": audio_file,
        "transFile": trans_file,
        "sections": {
            "Listening": has_lis,
            "Reading": has_read,
            "Writing": has_writ,
            "Speaking": has_spk,
        },
        "readingParts": f"P1:{r_p1}, P2:{r_p2}, P3:{r_p3}, P4:{r_p4}",
        "audioStatus": audio_status,
        "hasKey": bool(ans_file),
        "hasTranscript": bool(trans_file),
    }
    matrix.append(entry)
    
    print(f"Test {i:02d}:")
    print(f"  • Test Doc: {test_file} (Lis={has_lis}, Read={has_read}, Writ={has_writ}, Spk={has_spk})")
    print(f"  • Audio: {audio_file or 'MISSING'}")
    print(f"  • Transcript: {trans_file}")
    print(f"  • Answer Key: {ans_file}")
    print()
